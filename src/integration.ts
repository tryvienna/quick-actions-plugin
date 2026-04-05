/**
 * Quick Actions integration — provides GraphQL schema for script discovery and execution.
 */

import { defineIntegration } from '@tryvienna/sdk';
import { registerQuickActionsSchema } from './schema';

const PLAY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface QuickActionsClient {}

export const quickActionsIntegration = defineIntegration<QuickActionsClient>({
  id: 'quick_actions',
  name: 'Quick Actions',
  description: 'Discover and run pnpm scripts from project directories',
  icon: { svg: PLAY_SVG },

  createClient: async () => ({}),

  schema: registerQuickActionsSchema,
});
