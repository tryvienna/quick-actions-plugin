/**
 * useQuickActionsSettings — Persistent settings for configured quick actions.
 *
 * Settings are stored in localStorage, scoped to the plugin.
 * Uses CustomEvent for cross-component synchronization.
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

const STORAGE_KEY = 'vienna-plugin:quick-actions:settings';
const CHANGE_EVENT = 'vienna-plugin:quick-actions:settings-changed';

function loadActions(): QuickAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveActions(actions: QuickAction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
    // eslint-disable-next-line no-restricted-properties
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // localStorage unavailable — ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function makeActionId(directory: string, script: string): string {
  return `${directory}::${script}`;
}

export function useQuickActionsSettings() {
  const [actions, setActionsState] = useState(loadActions);

  useEffect(() => {
    const handler = () => setActionsState(loadActions());
    // eslint-disable-next-line no-restricted-properties
    window.addEventListener(CHANGE_EVENT, handler);
    // eslint-disable-next-line no-restricted-properties
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  const setActions = useCallback((next: QuickAction[]) => {
    setActionsState(next);
    saveActions(next);
  }, []);

  const toggleAction = useCallback(
    (script: string, directory: string, directoryLabel: string) => {
      const id = makeActionId(directory, script);
      setActionsState((prev) => {
        const exists = prev.find((a) => a.id === id);
        const next = exists
          ? prev.filter((a) => a.id !== id)
          : [...prev, { id, script, directory, directoryLabel, runContext: 'active-worktree' as const }];
        saveActions(next);
        return next;
      });
    },
    [],
  );

  const updateAction = useCallback(
    (actionId: string, updates: Partial<Pick<QuickAction, 'runContext'>>) => {
      setActionsState((prev) => {
        const next = prev.map((a) => (a.id === actionId ? { ...a, ...updates } : a));
        saveActions(next);
        return next;
      });
    },
    [],
  );

  return { actions, setActions, toggleAction, updateAction };
}
