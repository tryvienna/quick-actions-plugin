/**
 * Script discovery — recursively finds package.json scripts in directories.
 *
 * Runs in the main process via GraphQL schema resolvers.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

/** Directories to always skip when walking recursively. */
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.turbo', '.cache', '.output',
]);

/**
 * Use `git check-ignore` to test whether a path is gitignored.
 * Returns true if ignored, false otherwise (including when not in a git repo).
 */
function isGitIgnored(rootDir: string, absPath: string): boolean {
  try {
    execFileSync('git', ['check-ignore', '-q', absPath], {
      cwd: rootDir,
      timeout: 2000,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

export interface DiscoveredPackage {
  directory: string;
  label: string;
  scripts: string[];
}

/**
 * Recursively find all directories containing a package.json with scripts.
 * Skips node_modules, .git, common build dirs, and gitignored paths.
 */
function walk(
  rootDir: string,
  currentDir: string,
  maxDepth: number,
  depth = 0,
): DiscoveredPackage[] {
  const results: DiscoveredPackage[] = [];

  try {
    const pkgPath = join(currentDir, 'package.json');
    const content = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content) as { scripts?: Record<string, string> };
    const scripts = pkg.scripts ? Object.keys(pkg.scripts) : [];
    if (scripts.length > 0) {
      const rel = relative(rootDir, currentDir);
      const label = rel === '' ? basename(rootDir) : rel;
      results.push({ directory: currentDir, label, scripts });
    }
  } catch {
    // No package.json or invalid — continue walking
  }

  if (depth >= maxDepth) return results;

  try {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (SKIP_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;

      const subDir = join(currentDir, entry.name);
      if (isGitIgnored(rootDir, subDir)) continue;

      results.push(...walk(rootDir, subDir, maxDepth, depth + 1));
    }
  } catch {
    // Permission error or similar — skip
  }

  return results;
}

/**
 * Discover package.json scripts from a list of root directories.
 * Each directory is walked recursively up to 4 levels deep.
 */
export function discoverScripts(directories: string[]): DiscoveredPackage[] {
  const results: DiscoveredPackage[] = [];
  for (const dir of directories) {
    try {
      if (!existsSync(dir)) continue;
      results.push(...walk(dir, dir, 4));
    } catch {
      // Skip directories that can't be read
    }
  }
  return results;
}
