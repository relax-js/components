import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';

/** What a mock endpoint gets from the request. */
export interface MockRequest {
    params: Record<string, string>;
    query: URLSearchParams;
    body: unknown;
}

/** What a mock endpoint answers; a body is sent as JSON. */
export interface MockReply {
    status: number;
    body?: unknown;
}

export interface MockRoute {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    /** Path with `:name` segments, such as `/api/orders/:id`. */
    path: string;
    handle: (request: MockRequest) => MockReply;
}

/** An endpoint that keeps the response open, such as a Server-Sent Events stream. */
export interface MockStream {
    path: string;
    open: (response: ServerResponse, request: IncomingMessage) => void;
}

/** Writes one Server-Sent Event. */
export function sendEvent(response: ServerResponse, name: string, data: unknown): void {
    response.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** Starts a Server-Sent Events response; the caller writes events with `sendEvent`. */
export function openEventStream(response: ServerResponse): void {
    response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });
}

function matchPath(pattern: string, path: string): Record<string, string> | undefined {
    const wanted = pattern.split('/').filter(Boolean);
    const actual = path.split('/').filter(Boolean);
    if (wanted.length !== actual.length) {
        return undefined;
    }
    const params: Record<string, string> = {};
    for (let i = 0; i < wanted.length; i++) {
        if (wanted[i].startsWith(':')) {
            params[wanted[i].slice(1)] = decodeURIComponent(actual[i]);
        } else if (wanted[i] !== actual[i]) {
            return undefined;
        }
    }
    return params;
}

async function readBody(request: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
        chunks.push(chunk as Buffer);
    }
    const text = Buffer.concat(chunks).toString('utf8');
    return text === '' ? undefined : JSON.parse(text);
}

/**
 * Serves a demo's backend from the Vite dev and preview servers, so a demo needs no server of
 * its own. Data lives in memory and resets when the server restarts.
 */
export function mockApi(routes: MockRoute[], streams: MockStream[] = []): Plugin {
    const middleware: Connect.NextHandleFunction = (request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost');
        const stream = streams.find((candidate) => candidate.path === url.pathname);
        if (stream) {
            stream.open(response, request);
            return;
        }
        for (const route of routes) {
            const params = route.method === request.method ? matchPath(route.path, url.pathname) : undefined;
            if (!params) {
                continue;
            }
            readBody(request)
                .then((body) => {
                    const reply = route.handle({ params, query: url.searchParams, body });
                    response.statusCode = reply.status;
                    if (reply.body === undefined) {
                        response.end();
                        return;
                    }
                    response.setHeader('Content-Type', 'application/json');
                    response.end(JSON.stringify(reply.body));
                })
                .catch((error: unknown) => {
                    console.error(`mock ${request.method} ${url.pathname} failed`, error);
                    response.statusCode = 500;
                    response.end();
                });
            return;
        }
        next();
    };

    return {
        name: 'demo-mock-api',
        configureServer: (server) => {
            server.middlewares.use(middleware);
        },
        configurePreviewServer: (server) => {
            server.middlewares.use(middleware);
        },
    };
}
