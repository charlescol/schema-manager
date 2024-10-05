import * as fs from 'fs';
import * as path from 'path';
import { FilesDependencies, VersionData } from './types';

/**
 * Recursively get all protobuf files from a directory
 *
 * @param dir
 * @param [files=[]]
 * @returns {*}
 */
function getProtobufFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getProtobufFiles(fullPath, files);
    } else if (entry.isFile() && fullPath.endsWith('.proto')) {
      files.push(fullPath);
    }
  });
  return files;
}

/**
 * Read a protobuf file and extract all import dependencies
 *
 * @param filePath
 * @returns {*}
 */
function extractDependencies(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const dependencies = lines
    .filter((line) => line.startsWith('import'))
    .map((line) => line.match(/"([^"]+)"/)?.[1])
    .filter((name): name is string => Boolean(name));
  return dependencies;
}

/**
 * Read a protobuf file and extract the package name and message name (first message)
 *
 * @param filePath
 * @returns {*}
 */
function extractPackage(filePath: string): string {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const packageRegex = /package\s+([\w.]+)\s*;/;
  const messageRegex = /message\s+(\w+)\s*{/;
  const packageMatch = fileContent.match(packageRegex);
  if (!packageMatch || packageMatch.length < 2) {
    throw new Error('Package declaration not found in the file');
  }
  const packageName = packageMatch[1];
  const messageMatch = fileContent.match(messageRegex);
  if (!messageMatch || messageMatch.length < 2) {
    throw new Error('Message declaration not found in the file');
  }
  const messageName = messageMatch[1];
  return `${packageName}.${messageName}`;
}

/**
 * Processes protobuf files to map dependencies and namespaces.
 *
 * This function recursively collects all `.proto` files from the given directory,
 * reads each file to extract its import dependencies and the package and message
 * names, and then creates two mappings:
 *
 * 1. **dependenciesMap**: A map that associates each `.proto` file with its resolved
 *    dependencies (other `.proto` files it imports). The dependencies are resolved based
 *    on version mappings provided in the `versionData`. If a dependency cannot be
 *    resolved or the file does not exist in the expected version, an error is thrown.
 *
 *    Example:
 *    ```
 *    "some-path/A/file.proto" => ["some-path/B/dependency.proto", "some-path/C/dependency.proto"]
 *    "some-path/B/dependency.proto"  => []
 *    "some-path/C/dependency.proto"  => []
 *    ```
 *
 * 2. **namespaceMap**: A map that associates each `.proto` file with its fully
 *    qualified package and the first message name. This can be useful for determining
 *    the structure of the `.proto` files.
 *
 *    Example:
 *    ```
 *    'some-path/A/file.proto' => 'someNamespace.models.File',
 *    'some-path/B/dependency.proto'  => 'someNamespace.models.Dependency',
 *    'some-path/C/dependency.proto'  => 'someNamespace.models.Dependency'
 *    ```
 *
 * @export
 * @param {VersionData} versionData - Contains information about file versions and their mappings.
 * @param {string} baseDirectory - The base directory where `.proto` files are located.
 * @returns {FilesDependencies} - An object containing two maps:
 *  - `dependenciesMap`: Maps each `.proto` file to its list of resolved dependencies.
 *  - `namespaceMap`: Maps each `.proto` file to its fully qualified package and message name.
 * @throws {Error} - If dependencies cannot be resolved or files are missing.
 */
export default function processProtobufFiles(versionData: VersionData, baseDirectory: string): FilesDependencies {
  const files = getProtobufFiles(baseDirectory);
  const fileSet = new Set(files.map((file) => path.relative(baseDirectory, file)));
  const dependenciesMap = new Map<string, string[]>();
  const namespaceMap = new Map<string, string>();

  files.forEach((file) => {
    const relativePath = path.relative(baseDirectory, file);
    const dependencies = extractDependencies(file);
    namespaceMap.set(relativePath, extractPackage(file));
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
