import { defineConfig } from 'vite';
import { demoConfig } from '../shared/demoConfig';
import { mockApi } from '../shared/mockApi';
import { backOfficeRoutes } from './mock/routes';

export default defineConfig(demoConfig(5302, [mockApi(backOfficeRoutes)]));
