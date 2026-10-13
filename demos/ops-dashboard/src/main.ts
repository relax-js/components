// Services first: components inject them when they are constructed.
import './telemetry/TelemetryService';

import { configureFormatting } from '@relax.js/components';
import '@relax.js/components/theme.css';
import '../../shared/demo.css';
import './styles.css';

import './shell/ConnectionStatus';
import './overview/OverviewPage';
import './traffic/TrafficPage';

import { loadNamespace, setLocale } from '@relax.js/core/i18n';
import { defineRoutes, startRouting } from '@relax.js/core/routing';

async function bootstrap(): Promise<void> {
    configureFormatting({ locale: 'en-GB', currency: 'EUR' });
    await setLocale('en');
    await loadNamespace('r-components');

    document.querySelector('r-side-menu')!.items = [
        { name: 'overview', title: 'Overview', href: '/' },
        { name: 'traffic', title: 'Traffic', href: '/traffic' },
    ];

    defineRoutes([
        { name: 'overview', path: '/', componentTagName: 'overview-page' },
        { name: 'traffic', path: '/traffic', componentTagName: 'traffic-page' },
    ]);
    startRouting();
}

void bootstrap();
