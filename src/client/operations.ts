/**
 * Quick Actions GraphQL operations — queries and mutations for the UI.
 *
 * Uses graphql parse() directly (graphql-tag doesn't work with esbuild plugin bundling).
 */

import { parse } from 'graphql';

// ─────────────────────────────────────────────────────────────────────────────
// Script Discovery
// ─────────────────────────────────────────────────────────────────────────────

export interface QuickActionScriptPackage {
  directory: string;
  label: string;
  scripts: string[];
}

export const GET_QUICK_ACTION_SCRIPTS = parse(`
  query GetQuickActionScripts($directories: [String!]!) {
    quickActionScripts(directories: $directories) {
      directory
      label
      scripts
    }
  }
`);

export type GetQuickActionScriptsData = {
  quickActionScripts: QuickActionScriptPackage[];
};

export type GetQuickActionScriptsVars = {
  directories: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Run Script
// ─────────────────────────────────────────────────────────────────────────────

export const RUN_QUICK_ACTION = parse(`
  mutation RunQuickAction($script: String!, $cwd: String!) {
    runQuickAction(script: $script, cwd: $cwd) {
      success
      error
    }
  }
`);

export type RunQuickActionData = {
  runQuickAction: { success: boolean; error: string | null };
};

export type RunQuickActionVars = {
  script: string;
  cwd: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Project Directories (existing schema query)
// ─────────────────────────────────────────────────────────────────────────────

export const GET_PROJECT_DIRS = parse(`
  query GetProjectDirsForQuickActions($projectId: ID!) {
    projectDirectories(projectId: $projectId) {
      path
      label
    }
  }
`);

export type GetProjectDirsData = {
  projectDirectories: Array<{ path: string; label: string | null }>;
};

export type GetProjectDirsVars = {
  projectId: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Workstream Directories with branch info (provides effectivePath for worktrees)
// ─────────────────────────────────────────────────────────────────────────────

export const GET_WORKSTREAM_DIRS = parse(`
  query GetWorkstreamDirsForQuickActions($workstreamId: ID!) {
    directoriesWithBranchInfo(workstreamId: $workstreamId) {
      path
      effectivePath
    }
  }
`);

export type GetWorkstreamDirsData = {
  directoriesWithBranchInfo: Array<{ path: string; effectivePath: string }>;
};

export type GetWorkstreamDirsVars = {
  workstreamId: string;
};
