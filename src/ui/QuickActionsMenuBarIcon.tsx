/**
 * QuickActionsMenuBarIcon — Play icon in the menu bar.
 *
 * Shows a simple play icon. The host renders this inside a 32px ghost button.
 */

import type { MenuBarIconProps } from '@tryvienna/sdk';

export function QuickActionsMenuBarIcon(_props: MenuBarIconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}
