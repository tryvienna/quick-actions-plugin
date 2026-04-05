/**
 * Quick Actions — Renderer entry point.
 *
 * Contains ONLY the UI canvases (React components) and plugin identity.
 * No integrations, no schema, no Node.js imports.
 *
 * The main entry point (index.ts) has the full plugin definition including
 * integrations and schema resolvers that use Node built-ins.
 */

import { definePlugin } from '@tryvienna/sdk';
import { QuickActionsMenuBarIcon } from './ui/QuickActionsMenuBarIcon';
import { QuickActionsMenuBarContent } from './ui/QuickActionsMenuBarContent';
import { QuickActionsDrawer } from './ui/QuickActionsDrawer';

const PLAY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>';

export default definePlugin({
  id: 'quick_actions',
  name: 'Quick Actions',
  description: 'Run pnpm scripts from the menu bar with one click',
  icon: { svg: PLAY_SVG },

  canvases: {
    drawer: {
      component: QuickActionsDrawer,
      label: 'Quick Actions',
      icon: 'play',
    },
    'menu-bar': {
      icon: QuickActionsMenuBarIcon,
      component: QuickActionsMenuBarContent,
      label: 'Quick Actions',
      priority: 20,
    },
  },
});
