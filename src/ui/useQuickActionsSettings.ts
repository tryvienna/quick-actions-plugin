/**
 * useQuickActionsSettings — Persistent settings for configured quick actions.
 *
 * Settings are scoped per project (storage key includes the active project ID).
 * Stored in localStorage; cross-component sync via CustomEvent.
 */

import { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface QuickAction {
  id: string;
  script: string;
  directory: string;
  directoryLabel: string;
  runContext: 'active-worktree' | 'default-branch';
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────────────────────

const LEGACY_STORAGE_KEY = 'vienna-plugin:quick-actions:settings';
const STORAGE_KEY_PREFIX = 'vienna-plugin:quick-actions:settings:';
const CHANGE_EVENT_PREFIX = 'vienna-plugin:quick-actions:settings-changed:';
const ACTIVE_PROJECT_KEY = 'vienna:activeProjectId';

// One-time cleanup: drop the pre-project-scoping global key. Old un-scoped
// actions don't belong to any specific project so we can't safely auto-migrate.
try {
  if (localStorage.getItem(LEGACY_STORAGE_KEY) !== null) {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
} catch {
  // localStorage unavailable — ignore
}

function storageKeyFor(projectId: string): string {
  return STORAGE_KEY_PREFIX + projectId;
}

function changeEventFor(projectId: string): string {
  return CHANGE_EVENT_PREFIX + projectId;
}

function loadActions(projectId: string | null): QuickAction[] {
  if (!projectId) return [];
  try {
    const raw = localStorage.getItem(storageKeyFor(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveActions(projectId: string, actions: QuickAction[]): void {
  try {
    localStorage.setItem(storageKeyFor(projectId), JSON.stringify(actions));
    // eslint-disable-next-line no-restricted-properties
    window.dispatchEvent(new CustomEvent(changeEventFor(projectId)));
  } catch {
    // localStorage unavailable — ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Active project hook
// ─────────────────────────────────────────────────────────────────────────────

/** Reads the app's active project ID from the shared localStorage slot. */
export function useActiveProjectId(): string | null {
  const read = (): string | null => {
    try {
      const raw = localStorage.getItem(ACTIVE_PROJECT_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as string;
    } catch {
      return null;
    }
  };

  const [projectId, setProjectId] = useState<string | null>(read);

  useEffect(() => {
    const handler = () => setProjectId(read());
    // eslint-disable-next-line no-restricted-properties
    window.addEventListener('storage', handler);
    // eslint-disable-next-line no-restricted-properties
    return () => window.removeEventListener('storage', handler);
  }, []);

  return projectId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function makeActionId(directory: string, script: string): string {
  return `${directory}::${script}`;
}

export function useQuickActionsSettings(projectId: string | null) {
  const [actions, setActionsState] = useState<QuickAction[]>(() => loadActions(projectId));

  // Re-read when project changes
  useEffect(() => {
    setActionsState(loadActions(projectId));
  }, [projectId]);

  // Cross-component sync (scoped to the current project)
  useEffect(() => {
    if (!projectId) return;
    const eventName = changeEventFor(projectId);
    const handler = () => setActionsState(loadActions(projectId));
    // eslint-disable-next-line no-restricted-properties
    window.addEventListener(eventName, handler);
    // eslint-disable-next-line no-restricted-properties
    return () => window.removeEventListener(eventName, handler);
  }, [projectId]);

  const toggleAction = useCallback(
    (script: string, directory: string, directoryLabel: string) => {
      if (!projectId) return;
      const id = makeActionId(directory, script);
      setActionsState((prev) => {
        const exists = prev.find((a) => a.id === id);
        const next = exists
          ? prev.filter((a) => a.id !== id)
          : [...prev, { id, script, directory, directoryLabel, runContext: 'active-worktree' as const }];
        saveActions(projectId, next);
        return next;
      });
    },
    [projectId],
  );

  const updateAction = useCallback(
    (actionId: string, updates: Partial<Pick<QuickAction, 'runContext'>>) => {
      if (!projectId) return;
      setActionsState((prev) => {
        const next = prev.map((a) => (a.id === actionId ? { ...a, ...updates } : a));
        saveActions(projectId, next);
        return next;
      });
    },
    [projectId],
  );

  const resetActions = useCallback(() => {
    if (!projectId) return;
    setActionsState([]);
    saveActions(projectId, []);
  }, [projectId]);

  return { actions, toggleAction, updateAction, resetActions };
}
