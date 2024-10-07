import * as path from 'path';
import * as fs from 'fs';
import { DependenciesMap, FilesDependencies, NamespaceMap } from './types';
import { VersionData } from '../versions-extractor/types';

export default abstract class AbstractParser {
  /**
   * An array of file extensions that should be processed by this parser.
   *
   * Specify the file types the parser is designed to handle.
   * For example, a subclass handling `.proto` files might set this to `['.proto']`.
   * Other parsers might handle `.json`, `.xml`, or any other file types by setting appropriate extensions.
   */
  protected abstract extensions: string[];
  /**
   * Extracts dependencies from a given file.
   *
   * Extract dependencies from a file. Dependencies
   * could be imported files, referenced resources, or any other files that the current file relies on.
   *
   * @param {string} filePath - The path to the file from which to extract dependencies.
   * @returns {string[]} - An array of dependencies (file paths) that the file relies on.
   */
  protected abstract extractDependencies(filePath: string): string[];
  /**
   * Extracts a unique namespace or identifier from a given file.
   *
   * Extract a namespace or other relevant identifier
   * from the file. The namespace could be a package name, a root element tag, or some other identifier that
   * gives context to the file's contents.
   *
   * @param {string} filePath - The path to the file from which to extract the namespace or identifier.
   * @returns {string} - The fully qualified namespace or identifier.
   */
  protected abstract extractNamespace(filePath: string): string;
  /**
   * Recursively collects files from a given directory that match the specified extensions.
   *
   * @param {string} dir - The directory to start searching for files.
   * @param {string[]} files - An array to accumulate files (used for recursion).
   * @returns {string[]} - A list of file paths matching the specified extensions.
   */
  protected getFiles(dir: string, files: string[] = []): string[] {
    console.log(dir);
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.getFiles(fullPath, files);
      } else if (entry.isFile()) {
        if (this.extensions.some((ext) => fullPath.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    });
    return files;
  }
  /**
   * Processes files to map dependencies and namespaces/identifiers.
   *
   * This function recursively collects all files with matching extensions from the given directory,
   * reads each file to extract its dependencies and the namespace or identifier (such as a package,
   * root element, or other relevant identifier), and then creates two mappings:
   *
   * 1. **dependenciesMap**: A map that associates each file with its resolved dependencies (other files it references).
   *    The dependencies are resolved based on version mappings provided in the `versionData`. If a dependency cannot be
   *    resolved or the file does not exist in the expected version, an error is thrown.
   *
   *    Example:
   *    ```
   *    "some-path/A/file.proto" => ["some-path/B/dependency.proto", "some-path/C/dependency.proto"]
   *    "some-path/B/dependency.proto"  => []
   *    "some-path/C/dependency.proto"  => []
   *    ```
   *
   * 2. **namespaceMap**: A map that associates each file with its fully qualified namespace or identifier. This is useful for
   *    determining the structure of files, such as packages, XML root tags, or other identifiers unique to the file type.
   *
   *    Example:
   *    ```
   *    'some-path/A/file.proto' => 'someNamespace.models.File',
   *    'some-path/B/dependency.proto'  => 'someNamespace.models.Dependency',
   *    'some-path/C/dependency.proto'  => 'someNamespace.models.Dependency'
   *    ```
   *
   * @param {VersionData} versionData - Contains information about file versions and their mappings.
   * @param {string} baseDirectory - The base directory where files are located.
   * @returns {FilesDependencies} - An object containing two maps:
   *  - `dependenciesMap`: Maps each file to its list of resolved dependencies.
   *  - `namespaceMap`: Maps each file to its fully qualified namespace or identifier.
   * @throws {Error} - If dependencies cannot be resolved or files are missing.
   */
  public parse(versionData: VersionData, baseDirectory: string): FilesDependencies {
    const files = this.getFiles(baseDirectory);
    const fileSet = new Set(files.map((file) => path.relative(baseDirectory, file)));
    const dependenciesMap: DependenciesMap = new Map<string, string[]>();
    const namespaceMap: NamespaceMap = new Map<string, string>();

    files.forEach((file) => {
      const relativePath = path.relative(baseDirectory, file);
      const dependencies = this.extractDependencies(file);
      namespaceMap.set(relativePath, this.extractNamespace(file));
      const fileVersions = versionData.fileMap.get(relativePath) ?? [];

      const fullDependencies = new Set<string>();
      dependencies.forEach((dep) => {
        fileVersions.forEach((versionInfo) => {
          const versionMappings = versionData.versionMap.get(versionInfo.full);
          if (versionMappings) {
            const resolvedPath = versionMappings.get(dep);
            if (resolvedPath) {
              if (fileSet.has(resolvedPath)) {
                fullDependencies.add(resolvedPath);
              } else {
                throw new Error(`Dependency ${resolvedPath} is not a valid file in version ${versionInfo.full}`);
              }
            } else {
              throw new Error(`Dependency ${dep} not found in version ${versionInfo.version}`);
            }
          }
        });
      });

      // Convert the Set back to an Array to comply with the expected output format
      dependenciesMap.set(relativePath, Array.from(fullDependencies));
    });

    return { dependenciesMap, namespaceMap };
  }
}
