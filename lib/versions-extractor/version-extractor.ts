import * as fs from 'fs';
import * as path from 'path';
import { DependencyResolutionMode, VersionData, VersionMap } from './types';
import { ExplicitResolutionError } from '../common/errors';

export default class VersionsExtractor {
  constructor(dependencyResolutionMode: DependencyResolutionMode = DependencyResolutionMode.IMPLICIT) {
    this.dependencyResolutionMode = dependencyResolutionMode;
  }
  /**
   * The dependency resolution mode to use. If EXPLICIT, this forces each file to be referenced in a unique version.
   */
  private readonly dependencyResolutionMode: DependencyResolutionMode;
  /**
   * The base directory to scan for versions.json files.
   */
  private baseDirectory: string;
  /**
   * Extracts version data from the specified base directory.
   *
   * This function traverses the provided base directory to locate `versions.json` files
   * and processes their contents to generate a mapping of version directories and schema files.
   * It creates a `versionMap` associating each version directory with a map of schema file names
   * to their corresponding file paths.
   *
   * @param {string} baseDirectory - The base directory where `versions.json` files are located.
   * @returns {Promise<VersionData>} - An object containing:
   *   - `versionMap`: Maps version directories to schema file mappings.
   * @throws {ExplicitResolutionError} - If duplicates are found in `EXPLICIT` dependency resolution mode.
   * @throws {Error} - For issues related to reading or processing files.
   */
  public async extract(baseDirectory: string): Promise<VersionData> {
    this.baseDirectory = baseDirectory;
    const versionMap: VersionMap = new Map();
    await this.processDirectory(baseDirectory, versionMap);
    if (this.dependencyResolutionMode === DependencyResolutionMode.EXPLICIT) {
      const duplicateValues = this.findDuplicateValues(versionMap);
      if (duplicateValues.length > 0) {
        throw new ExplicitResolutionError(duplicateValues);
      }
    }
    return { versionMap };
  }
  /**
   * Recursively scans a directory for `versions.json` files and processes them.
   *
   * @private
   * @param {string} currentPath - The current directory being scanned.
   * @param {VersionMap} versionMap - A map that associates version directories with schema files and their paths.
   * @returns {Promise<void>} - Resolves when the directory and its subdirectories have been processed.
   * @throws {ExplicitResolutionError} - If the explicit resolution mode detects unresolved conflicts.
   */
  private async processDirectory(currentPath: string, versionMap: VersionMap): Promise<void> {
    const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await this.processDirectory(absolutePath, versionMap);
      } else if (entry.isFile() && entry.name === 'versions.json') {
        await this.processFile(absolutePath, versionMap);
      }
    }
  }
  /**
   * Processes a `versions.json` file, extracting version information and populating the `versionMap`.
   *
   * @private
   * @param {string} filePath - The full path to the `versions.json` file being processed.
   * @param {VersionMap} versionMap - A map that tracks version directories and their associated schema files.
   * @returns {Promise<void>} - Resolves after the file has been processed and the `versionMap` is updated.
   */
  private async processFile(filePath: string, versionMap: VersionMap): Promise<void> {
    const data: VersionData = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
    const directoryPath = path.dirname(filePath);
    const relativeDirectoryPath = path.relative(this.baseDirectory, directoryPath);
    for (const [version, files] of Object.entries(data)) {
      const fullVersionPath = path.join(relativeDirectoryPath, version);
      versionMap.set(fullVersionPath, new Map());
      for (const [file, relativePath] of Object.entries(files)) {
        const fullPath = path.join(directoryPath, relativePath);
        const relativeFullPath = path.relative(this.baseDirectory, fullPath);
        versionMap.get(fullVersionPath)!.set(file.toLowerCase(), relativeFullPath);
      }
    }
  }
  /**
   * Identifies duplicate string values across all submaps in a VersionMap.
   *
   * @param {VersionMap} masterMap - A map where keys represent version directories, and values are submaps of schema file paths.
   * @returns {string[]} - An array of duplicate values that appear in more than one submap.
   */
  private findDuplicateValues(masterMap: VersionMap): string[] {
    const valueOccurrences = new Map<string, number>();
    masterMap.forEach((subMap) => {
      subMap.forEach((value) => {
        valueOccurrences.set(value, (valueOccurrences.get(value) || 0) + 1);
      });
    });
    const duplicateValues: string[] = [];
    valueOccurrences.forEach((count, value) => {
      if (count > 1) {
        duplicateValues.push(value);
      }
    });
    return duplicateValues;
  }
}
