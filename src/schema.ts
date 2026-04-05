/**
 * Quick Actions GraphQL schema registration.
 *
 * Registers queries and mutations for script discovery and execution.
 * Called via the integration's `schema` callback during plugin loading.
 * Resolvers run in the main process.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { discoverScripts } from './scripts';
import { runScriptInTerminal } from './terminal';

// ─────────────────────────────────────────────────────────────────────────────
// Schema registration
// ─────────────────────────────────────────────────────────────────────────────

export function registerQuickActionsSchema(rawBuilder: unknown): void {
  const builder = rawBuilder as any;

  // ── Types ──────────────────────────────────────────────────────────────────

  // @ts-expect-error — builder type args not available across .d.ts boundary
  const ScriptPackageRef = builder.objectRef<{
    directory: string;
    label: string;
    scripts: string[];
  }>('QuickActionScriptPackage');

  builder.objectType(ScriptPackageRef, {
    description: 'A package.json directory with its available scripts',
    fields: (t) => ({
      directory: t.exposeString('directory'),
      label: t.exposeString('label'),
      scripts: t.stringList({ resolve: (parent) => parent.scripts }),
    }),
  });

  // @ts-expect-error — builder type args not available across .d.ts boundary
  const RunResultRef = builder.objectRef<{
    success: boolean;
    error: string | null;
  }>('QuickActionRunResult');

  builder.objectType(RunResultRef, {
    description: 'Result of running a quick action script',
    fields: (t) => ({
      success: t.exposeBoolean('success'),
      error: t.string({ nullable: true, resolve: (parent) => parent.error }),
    }),
  });

  // ── Queries ────────────────────────────────────────────────────────────────

  builder.queryFields((t) => ({
    quickActionScripts: t.field({
      type: [ScriptPackageRef],
      description: 'Discover package.json scripts from given directories (recursive)',
      args: {
        directories: t.arg.stringList({ required: true }),
      },
      resolve: (_root, args) => {
        return discoverScripts(args.directories);
      },
    }),
  }));

  // ── Mutations ──────────────────────────────────────────────────────────────

  builder.mutationFields((t) => ({
    runQuickAction: t.field({
      type: RunResultRef,
      description: 'Run a pnpm script in a new terminal window',
      args: {
        script: t.arg.string({ required: true }),
        cwd: t.arg.string({ required: true }),
      },
      resolve: (_root, args) => {
        return runScriptInTerminal(args.script, args.cwd);
      },
    }),
  }));
}
