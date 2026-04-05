/**
 * QuickActionsMenuBarContent — Popover content showing configured quick actions.
 *
 * Groups actions by directory label. Clicking an action runs the script
 * in a new terminal window. Settings gear opens the drawer for configuration.
 */

import { useCallback, useMemo } from 'react';
import type { MenuBarCanvasProps } from '@tryvienna/sdk';
import { usePluginMutation, usePluginQuery, useActiveWorkstreamId } from '@tryvienna/sdk/react';
import {
  useQuickActionsSettings,
  type QuickAction,
} from './useQuickActionsSettings';
import {
  RUN_QUICK_ACTION,
  GET_WORKSTREAM_DIRS,
  type RunQuickActionData,
  type RunQuickActionVars,
  type GetWorkstreamDirsData,
  type GetWorkstreamDirsVars,
} from '../client/operations';

export function QuickActionsMenuBarContent({ onClose, openPluginDrawer, logger }: MenuBarCanvasProps) {
  const { actions } = useQuickActionsSettings();
  const [runAction] = usePluginMutation<RunQuickActionData, RunQuickActionVars>(RUN_QUICK_ACTION);
  const activeWorkstreamId = useActiveWorkstreamId();

  // Fetch worktree directory mappings for the active workstream
  const { data: worktreeDirsData } = usePluginQuery<GetWorkstreamDirsData, GetWorkstreamDirsVars>(
    GET_WORKSTREAM_DIRS,
    { variables: { workstreamId: activeWorkstreamId! }, skip: !activeWorkstreamId },
  );

  // Build a list of path → effectivePath mappings for prefix-based resolution.
  // action.directory is a subdirectory (e.g. /repo/apps/desktop) while workstream
  // directories are project roots (e.g. /repo), so we need prefix matching.
  const worktreeDirs = useMemo(
    () => (worktreeDirsData?.directoriesWithBranchInfo ?? [])
      .filter((d) => d.path !== d.effectivePath)
      .sort((a, b) => b.path.length - a.path.length), // longest prefix first
    [worktreeDirsData],
  );

  // Group actions by directory label
  const groupedActions = useMemo(() => {
    const groups = new Map<string, QuickAction[]>();
    for (const action of actions) {
      const key = action.directoryLabel;
      const group = groups.get(key) ?? [];
      group.push(action);
      groups.set(key, group);
    }
    return groups;
  }, [actions]);

  const handleRun = useCallback(
    async (action: QuickAction) => {
      // Resolve cwd: replace the project root prefix with the worktree effectivePath.
      // e.g. /repo/apps/desktop → /repo/.worktrees/branch/apps/desktop
      let cwd = action.directory;
      if (action.runContext === 'active-worktree') {
        for (const dir of worktreeDirs) {
          if (action.directory.startsWith(dir.path)) {
            cwd = dir.effectivePath + action.directory.slice(dir.path.length);
            break;
          }
        }
      }
      onClose();

      logger.info('Running quick action', { script: action.script, cwd });

      try {
        const { data } = await runAction({ variables: { script: action.script, cwd } });
        if (!data?.runQuickAction.success) {
          logger.error('Quick action failed', { error: data?.runQuickAction.error });
        }
      } catch (err) {
        logger.error('Quick action error', { error: err instanceof Error ? err.message : String(err) });
      }
    },
    [onClose, runAction, logger, worktreeDirs],
  );

  if (actions.length === 0) {
    return (
      <div className="p-4 text-center" style={{ minWidth: 240 }}>
        <p className="text-sm text-muted-foreground mb-3">
          No quick actions configured
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            onClose();
            openPluginDrawer({ view: 'settings' });
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Configure Actions
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ minWidth: 240 }}>
      <div className="max-h-72 overflow-y-auto">
        {Array.from(groupedActions.entries()).map(([label, group], groupIdx) => (
          <div key={label}>
            {groupIdx > 0 && <div className="border-t border-border" />}
            {/* Group header */}
            <div className="flex items-center gap-1.5 px-3 py-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </svg>
              <span className="text-[11px] font-medium text-muted-foreground truncate">
                {label}
              </span>
            </div>
            {/* Actions */}
            {group.map((action) => (
              <button
                key={action.id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors"
                onClick={() => handleRun(action)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
                <span className="flex-1 min-w-0 font-medium truncate">
                  {action.script}
                </span>
                {action.runContext === 'active-worktree' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground">
                    <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" /><path d="M12 12v3" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors"
          onClick={() => {
            onClose();
            openPluginDrawer({ view: 'settings' });
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Configure Actions
        </button>
      </div>
    </div>
  );
}
