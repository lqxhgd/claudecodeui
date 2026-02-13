/**
 * File Tree Service
 *
 * Extracted from server/index.js to reduce file size.
 * Recursively reads a directory and returns a tree structure with metadata.
 */

import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

/**
 * Convert a Unix permission octet (0-7) to rwx string.
 *
 * @param {number} perm - Octet value (0-7)
 * @returns {string} e.g. "rwx", "r--"
 */
function permToRwx(perm) {
  const r = perm & 4 ? 'r' : '-';
  const w = perm & 2 ? 'w' : '-';
  const x = perm & 1 ? 'x' : '-';
  return r + w + x;
}

/**
 * Recursively read a directory and return a flat/nested tree of items.
 *
 * Each item has:
 *   - name, path, type ("file" | "directory")
 *   - size, modified, permissions, permissionsRwx
 *   - children (for directories, when depth allows)
 *
 * Heavy directories (node_modules, dist, build, .git, .svn, .hg) are skipped.
 *
 * @param {string}  dirPath      - Absolute directory path to scan
 * @param {number}  [maxDepth=3] - Maximum recursion depth
 * @param {number}  [currentDepth=0] - Current recursion depth (internal)
 * @param {boolean} [showHidden=true] - Whether to include hidden entries (unused filter kept for API compat)
 * @returns {Promise<Array<object>>} Sorted array of file/directory items
 */
export async function getFileTree(dirPath, maxDepth = 3, currentDepth = 0, showHidden = true) {
  const items = [];

  try {
    const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip heavy build directories and VCS directories
      if (entry.name === 'node_modules' ||
          entry.name === 'dist' ||
          entry.name === 'build' ||
          entry.name === '.git' ||
          entry.name === '.svn' ||
          entry.name === '.hg') continue;

      const itemPath = path.join(dirPath, entry.name);
      const item = {
        name: entry.name,
        path: itemPath,
        type: entry.isDirectory() ? 'directory' : 'file'
      };

      // Get file stats for additional metadata
      try {
        const stats = await fsPromises.stat(itemPath);
        item.size = stats.size;
        item.modified = stats.mtime.toISOString();

        // Convert permissions to rwx format
        const mode = stats.mode;
        const ownerPerm = (mode >> 6) & 7;
        const groupPerm = (mode >> 3) & 7;
        const otherPerm = mode & 7;
        item.permissions = ownerPerm.toString() + groupPerm.toString() + otherPerm.toString();
        item.permissionsRwx = permToRwx(ownerPerm) + permToRwx(groupPerm) + permToRwx(otherPerm);
      } catch (statError) {
        // If stat fails, provide default values
        item.size = 0;
        item.modified = null;
        item.permissions = '000';
        item.permissionsRwx = '---------';
      }

      if (entry.isDirectory() && currentDepth < maxDepth) {
        // Recursively get subdirectories but limit depth
        try {
          // Check if we can access the directory before trying to read it
          await fsPromises.access(item.path, fs.constants.R_OK);
          item.children = await getFileTree(item.path, maxDepth, currentDepth + 1, showHidden);
        } catch (e) {
          // Silently skip directories we can't access (permission denied, etc.)
          item.children = [];
        }
      }

      items.push(item);
    }
  } catch (error) {
    // Only log non-permission errors to avoid spam
    if (error.code !== 'EACCES' && error.code !== 'EPERM') {
      console.error('Error reading directory:', error);
    }
  }

  return items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}
