import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { VersionData } from './types';

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

/**
 * Extracts version data from the provided base directory.
 *
 * This function recursively scans the given base directory to find all `versions.json`
 * files, which contain version mappings for `.proto` files. It reads and processes each
 * `versions.json` file to create two mappings:
 *
 * 1. **fileMap**: A map that associates each `.proto` file with an array of version objects.
 *    Each version object includes the version identifier and the full version path.
 *
 *    Example:
 *    ```
 *    Map(3) {
 *      'some-path/test/a' => Map(2) {
 *        'file.proto' => 'some-path/test/A/file.proto',
 *        'dependency.proto' => 'some-path/test/B/dependency.proto'
 *      },
 *      'some-path/test/b' => Map(2) {
 *        'file.proto' => 'some-path/test/A/file.proto',
 *        'dependency.proto' => 'some-path/test/C/dependency.proto'
 *      }
 *    }
 *    ```
 *
 * 2. **versionMap**: A map that associates each version directory with a mapping of `.proto` files
 *    to their resolved file paths. This helps in determining which file corresponds to a version
 *    and where it is located.
 *
 *    Example:
 *    ```
 *    Map(3) {
 *      'some-path/test/A/file.proto' => [
 *        { version: 'a', full: 'some-path/test/a' },
 *        { version: 'b', full: 'some-path/test/b' }
 *      ],
 *      'some-path/test/B/dependency.proto' => [
 *        { version: 'a', full: 'some-path/test/a' }
 *      ]
 *    }
 *    ```
 *
 * @export
 * @param {string} baseDirectory - The base directory where `versions.json` files are located.
 * @returns {Promise<VersionData>} - An object containing two maps:
 *  - `fileMap`: Maps `.proto` files to arrays of version objects.
 *  - `versionMap`: Maps version directories to `.proto` file mappings.
 * @throws {Error} - If there is an issue reading or processing files.
 */
export default async function extractVersionsData(baseDirectory: string): Promise<VersionData> {
  const fileMap: Map<string, Array<{ version: string; full: string }>> = new Map();
  const versionMap: Map<string, Map<string, string>> = new Map();

  async function processDirectory(currentPath: string) {
    const entries = await readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await processDirectory(absolutePath);
      } else if (entry.isFile() && entry.name === 'versions.json') {
        await processFile(absolutePath);
      }
    }
  }

  async function processFile(filePath: string) {
    const data: VersionData = JSON.parse(await readFile(filePath, 'utf8'));
    const directoryPath = path.dirname(filePath);
    const relativeDirectoryPath = path.relative(baseDirectory, directoryPath);
    for (const [version, files] of Object.entries(data)) {
      const fullVersionPath = path.join(relativeDirectoryPath, version);
      versionMap.set(fullVersionPath, new Map());
      for (const [file, relativePath] of Object.entries(files)) {
        const fullPath = path.join(directoryPath, relativePath);
        const relativeFullPath = path.relative(baseDirectory, fullPath);
        if (!fileMap.has(relativeFullPath)) {
          fileMap.set(relativeFullPath, []);
        }
        fileMap.get(relativeFullPath)!.push({ version, full: fullVersionPath });
        versionMap.get(fullVersionPath)!.set(file, relativeFullPath);
      }
    }
  }

  await processDirectory(baseDirectory);

  return { fileMap, versionMap };
}
