/**
 * QuickActionsDrawer — Settings drawer for configuring quick actions.
 *
 * Auto-discovers package.json scripts from project directories.
 * Users check scripts to add them as quick actions, with per-action
 * configuration for run context (worktree vs default branch).
 * Scripts are grouped by package directory in collapsible sections.
 */

import { useState, useMemo, useCallback } from 'react';
import type { PluginDrawerCanvasProps } from '@tryvienna/sdk';
import { usePluginQuery } from '@tryvienna/sdk/react';
import {
  useQuickActionsSettings,
  makeActionId,
} from './useQuickActionsSettings';
import {
  GET_QUICK_ACTION_SCRIPTS,
  GET_PROJECT_DIRS,
  type GetQuickActionScriptsData,
  type GetQuickActionScriptsVars,
  type GetProjectDirsData,
  type GetProjectDirsVars,
} from '../client/operations';

/** Hard-coded project ID — for now we use the first project. */
function useProjectId(): string | null {
  // The plugin doesn't have direct access to the app's active project state.
  // We read it from localStorage where the app stores it.
  try {
    const raw = localStorage.getItem('vienna:activeProjectId');
    if (!raw) return null;
    return JSON.parse(raw) as string;
  } catch {
    return null;
  }
}

export function QuickActionsDrawer(_props: PluginDrawerCanvasProps) {
  const projectId = useProjectId();
  const { actions, toggleAction, updateAction } = useQuickActionsSettings();
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const enabledSet = useMemo(() => new Set(actions.map((a) => a.id)), [actions]);

  // Fetch project directories
  const { data: dirsData } = usePluginQuery<GetProjectDirsData, GetProjectDirsVars>(
    GET_PROJECT_DIRS,
    { variables: { projectId: projectId! }, skip: !projectId },
  );

  const directories = useMemo(
    () => (dirsData?.projectDirectories ?? []).map((d) => d.path),
    [dirsData],
  );

  // Discover scripts from project directories
  const { data: scriptsData, loading } = usePluginQuery<
    GetQuickActionScriptsData,
    GetQuickActionScriptsVars
  >(GET_QUICK_ACTION_SCRIPTS, {
    variables: { directories },
    skip: directories.length === 0,
  });

  const packages = scriptsData?.quickActionScripts ?? [];

  // Filter by search
  const filteredPackages = useMemo(() => {
    if (!search.trim()) return packages;
    const q = search.toLowerCase();
    return packages
      .map((pkg) => ({
        ...pkg,
        scripts: pkg.scripts.filter(
          (s) => s.toLowerCase().includes(q) || pkg.label.toLowerCase().includes(q),
        ),
      }))
      .filter((pkg) => pkg.scripts.length > 0);
  }, [packages, search]);

  const toggleCollapse = useCallback((dir: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(dir)) next.delete(dir);
      else next.add(dir);
      return next;
    });
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Quick Actions</h2>
      </div>

      {/* Search */}
      <div className="border-b px-4 py-2">
        <div className="relative">
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search scripts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 h-8 text-sm rounded-md border border-input bg-transparent px-3 py-1 transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {search && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch('')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Script list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Discovering scripts...
            </p>
          ) : packages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No package.json scripts found in project directories
            </p>
          ) : filteredPackages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No scripts match &ldquo;{search}&rdquo;
            </p>
          ) : (
            filteredPackages.map((pkg) => {
              const isCollapsed = collapsed.has(pkg.directory);
              const enabledCount = pkg.scripts.filter((s) =>
                enabledSet.has(makeActionId(pkg.directory, s)),
              ).length;

              return (
                <div key={pkg.directory}>
                  {/* Directory header — collapsible trigger */}
                  <button
                    type="button"
                    className="flex w-full items-center gap-1.5 py-1.5 cursor-pointer group"
                    onClick={() => toggleCollapse(pkg.directory)}
                  >
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`size-3.5 text-muted-foreground transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-blue-400">
                      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                    </svg>
                    <span className="text-xs font-medium text-muted-foreground flex-1 text-left">
                      {pkg.label}
                    </span>
                    {enabledCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20 tabular-nums">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        {enabledCount} active
                      </span>
                    )}
                  </button>

                  {/* Scripts */}
                  {!isCollapsed && (
                    <div className="space-y-1 pt-1 pb-2">
                      {pkg.scripts.map((script) => {
                        const actionId = makeActionId(pkg.directory, script);
                        const isEnabled = enabledSet.has(actionId);
                        const action = isEnabled ? actions.find((a) => a.id === actionId) : undefined;

                        return (
                          <div key={actionId} className="rounded-md border">
                            <label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors">
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={() => toggleAction(script, pkg.directory, pkg.label)}
                                className="size-4 rounded border-input"
                              />
                              <code className="text-sm flex-1">{script}</code>
                            </label>

                            {isEnabled && action && (
                              <div className="flex items-center gap-2 px-3 py-2 border-t bg-muted/30">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-muted-foreground shrink-0">
                                  <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" /><path d="M12 12v3" />
                                </svg>
                                <select
                                  value={action.runContext}
                                  onChange={(e) =>
                                    updateAction(actionId, {
                                      runContext: e.target.value as 'active-worktree' | 'default-branch',
                                    })
                                  }
                                  className="flex-1 h-7 text-xs rounded-md border border-input bg-transparent px-2"
                                >
                                  <option value="active-worktree">Active worktree</option>
                                  <option value="default-branch">Default branch</option>
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
