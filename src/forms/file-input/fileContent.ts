export function isKnownEncoding(label: string): boolean {
    try {
        new TextDecoder(label);
        return true;
    } catch {
        return false;
    }
}

function matchesAccept(file: File, accept: string): boolean {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return accept
        .split(',')
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token !== '')
        .some((token) => {
            if (token.startsWith('.')) {
                return name.endsWith(token);
            }
            if (token.endsWith('/*')) {
                return type.startsWith(token.slice(0, -1));
            }
            return type === token;
        });
}

function readBytes(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error ?? new Error('read failed'));
        reader.readAsArrayBuffer(file);
    });
}

export function refusalFor(file: File, accept: string | null, maxSize: string | null): string | null {
    if (accept && !matchesAccept(file, accept)) {
        return `${file.name} is not an accepted type`;
    }
    if (maxSize !== null && file.size > Number(maxSize)) {
        return `${file.name} is larger than ${maxSize} bytes`;
    }
    return null;
}

export async function readContent(
    file: File,
    readAs: string | null,
    encoding: string | null
): Promise<string | ArrayBuffer> {
    const bytes = await readBytes(file);
    return readAs === 'bytes' ? bytes : new TextDecoder(encoding ?? 'utf-8').decode(bytes);
}

export function formValueOf(files: File[], name: string): File | FormData | null {
    if (files.length === 0) {
        return null;
    }
    if (files.length === 1) {
        return files[0];
    }
    const data = new FormData();
    for (const file of files) {
        data.append(name, file);
    }
    return data;
}
