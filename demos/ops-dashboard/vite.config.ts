import { defineConfig } from 'vite';
import { demoConfig } from '../shared/demoConfig';
import { mockApi } from '../shared/mockApi';
import { telemetryStream } from './mock/telemetry';
import { trafficRoutes } from './mock/traffic';

export default defineConfig(demoConfig(5301, [mockApi(trafficRoutes, [telemetryStream])]));
