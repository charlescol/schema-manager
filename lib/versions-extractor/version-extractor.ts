import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { FileMap, VersionData, VersionMap } from './types';

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

export default class VersionsExtractor {
  private baseDirectory: string;
  /**
   * Extracts version data from the provided base directory.
   *
   * This function recursively scans the given base directory to find all `versions.json`
   * files, which contain version mappings for schema files. It reads and processes each
   * `versions.json` file to create two mappings:
   *
   * 1. **versionMap**: A map that associates each version directory with a mapping of schema files
   *    to their resolved file paths. This helps in determining which file corresponds to a version
   *    and where it is located.
   *
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
   * 2. **fileMap**: A map that associates each schema file with an array of version objects.
   *    Each version object includes the version identifier and the full version path.
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
  public async extract(baseDirectory: string): Promise<VersionData> {
    this.baseDirectory = baseDirectory;
    const fileMap: FileMap = new Map();
    const versionMap: VersionMap = new Map();

    await this.processDirectory(baseDirectory, versionMap, fileMap);

    return { fileMap, versionMap };
  }

  /**
   * Recursively scans the directory for `versions.json` files.
   *
   * @private
   * @param {string} currentPath - The current directory being processed.
   * @param {VersionMap} versionMap - A map that tracks version directories and their corresponding `.proto` files.
   * @param {FileMap} fileMap - A map that tracks `.proto` files and the versions they are associated with.
   * @returns {Promise<void>}
   */
  private async processDirectory(currentPath: string, versionMap: VersionMap, fileMap: FileMap): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await this.processDirectory(absolutePath, versionMap, fileMap);
      } else if (entry.isFile() && entry.name === 'versions.json') {
        await this.processFile(absolutePath, versionMap, fileMap);
      }
    }
  }

  /**
   * Reads and processes a `versions.json` file, updating the `versionMap` and `fileMap` accordingly.
   *
   * @private
   * @param {string} filePath - Full path to the `versions.json` file.
   * @param {VersionMap} versionMap - A map that tracks version directories and their corresponding `.proto` files.
   * @param {FileMap} fileMap - A map that tracks `.proto` files and the versions they are associated with.
   * @returns {Promise<void>}
   */
  private async processFile(filePath: string, versionMap: VersionMap, fileMap: FileMap): Promise<void> {
    const data: VersionData = JSON.parse(await readFile(filePath, 'utf8'));
    const directoryPath = path.dirname(filePath);
    const relativeDirectoryPath = path.relative(this.baseDirectory, directoryPath);
    for (const [version, files] of Object.entries(data)) {
      const fullVersionPath = path.join(relativeDirectoryPath, version);
      versionMap.set(fullVersionPath, new Map());
      for (const [file, relativePath] of Object.entries(files)) {
        const fullPath = path.join(directoryPath, relativePath);
        const relativeFullPath = path.relative(this.baseDirectory, fullPath);
        if (!fileMap.has(relativeFullPath)) {
          fileMap.set(relativeFullPath, []);
        }
        fileMap.get(relativeFullPath)!.push({ version, full: fullVersionPath });
        versionMap.get(fullVersionPath)!.set(file, relativeFullPath);
      }
    }
  }
}
