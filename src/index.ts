/**
 * @vienna/plugin-quick-actions — Run pnpm scripts from the menu bar.
 *
 * Shows a play icon in the menu bar. Clicking opens a popover with
 * configured quick actions grouped by package. Clicking an action
 * opens a terminal window running the script.
 *
 * Settings drawer allows discovering and enabling scripts from
 * project directories with per-action worktree/default branch config.
 */

import { definePlugin } from '@tryvienna/sdk';
import { quickActionsIntegration } from './integration';
import { QuickActionsMenuBarIcon } from './ui/QuickActionsMenuBarIcon';
import { QuickActionsMenuBarContent } from './ui/QuickActionsMenuBarContent';
import { QuickActionsDrawer } from './ui/QuickActionsDrawer';

const PLAY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>';

export const quickActionsPlugin = definePlugin({
  id: 'quick_actions',
  name: 'Quick Actions',
  description: 'Run pnpm scripts from the menu bar with one click',
  icon: { svg: PLAY_SVG },

  integrations: [quickActionsIntegration],
  entities: [],

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
