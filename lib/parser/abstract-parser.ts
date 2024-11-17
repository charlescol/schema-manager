import * as path from 'path';
import * as fs from 'fs';
import { DependenciesMap, DependenciesNameMap, FilesDependencies } from './types';
import { VersionData } from '../versions-extractor/types';
import SchemaType from '../types';

export default abstract class AbstractParser {
  /**
   * A map of file extensions to their corresponding schema types. You can extend this map to support additional file types.
   * This is case-insensitive, meaning that the file extension should be lowercase.
   * @static
   */
  protected static readonly extensionToSchemaType: { [key: string]: SchemaType } = {
    '.avsc': SchemaType.AVRO,
    '.avro': SchemaType.AVRO,
    '.proto': SchemaType.PROTOBUF,
    '.json': SchemaType.JSON,
    '.xml': SchemaType.XML,
    '.thrift': SchemaType.THRIFT,
    '.msgpack': SchemaType.MESSAGEPACK,
    '.mpk': SchemaType.MESSAGEPACK,
    '.fbs': SchemaType.FLATBUFFERS,
    '.yaml': SchemaType.YAML,
    '.yml': SchemaType.YAML,
    '.cbor': SchemaType.CBOR,
  };
  /**
   * An array of schema types that are supported by the parser.
   * This is used in the `getSchemaType` method to determine the appropriate schema for a given file.
   */
  protected abstract readonly schemaTypes: string[];
  /**
   * Extracts dependencies names from a given file.
   *
   * Dependencies could be imported files, referenced resources, or any other files that the current file relies on.
   * A dependency name should not include the extension and must only consist of the file name
   * (without the file path). The result is case-insensitive.
   *
   * @param {string} filePath - The path to the file from which to extract dependencies.
   * @returns {string[]} - An array of dependency names (without extensions or paths), that the file relies on.
   */
  protected abstract extractDependencies(filePath: string): string[];
  /**
   * Extracts a unique name to be used as a reference in the schema registry.
   *
   * This function derives a unique identifier for the file's schema, used as the reference name in the schema registry.
   * For instance, in Protobuf, the name corresponds to the string specified in the `import` statement, while in Avro, it is the fully
   * qualified name, including the namespace. Each name must be unique for the schema registry to manage file versions accurately (see
   * README for details on versioning and implicit resolution). Note that each Protobuf `import` statement should reference only the
   * file name, not the full file path.
   *
   * @param {string} filePath - The file path from which to derive the unique name or namespace identifier.
   * @returns {string} - A fully qualified, unique namespace or identifier for the schema.
   */
  protected abstract extractName(filePath: string): string;
  /**
   * Recursively collects files from a given directory that match the specified extensions.
   *
   * @param {string} dir - The directory to start searching for files.
   * @param {string[]} files - An array to accumulate files (used for recursion).
   * @returns {string[]} - A list of file paths matching the specified extensions.
   */
  protected getFiles(dir: string, files: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.getFiles(fullPath, files);
      } else if (entry.isFile()) {
        const schemaType = this.getSchemaType(fullPath);
        if (schemaType !== SchemaType.UNKNOWN && this.schemaTypes.includes(schemaType)) {
          files.push(fullPath);
        }
      }
    });
    return files;
  }
  /**
   * This method returns the schema type for a given file path. If the schema type is not supported, it returns `SchemaType.UNKNOWN`.
   *
   * @param {string} filepath - The path to the file being processed.
   * @returns {SchemaType} - The schema type associated with the given file.
   */
  public getSchemaType(filepath: string): SchemaType {
    const fileExtension = path.extname(filepath).toLowerCase();
    return AbstractParser.extensionToSchemaType[fileExtension] || SchemaType.UNKNOWN;
  }
  /**
   * Processes files to map dependencies and namespaces/identifiers.
   *
   * This function recursively collects all files with matching extensions from the given directory,
   * reads each file to extract its dependencies and the namespace or identifier (such as a package,
   * root element, or other relevant identifier), and then creates three mappings:
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
   *
   * @param {VersionData} versionData - Contains information about file versions and their mappings.
   * @param {string} baseDirectory - The base directory where files are located.
   * @returns {FilesDependencies} - An object containing three maps:
   *  - `dependenciesMap`: Maps each file to its list of resolved dependencies.
   *  - `namespaceMap`: Maps each file to its fully qualified namespace or identifier.
   *  - `dependenciesPartionnedMap`: Maps each file to a map of versions and their specific dependencies.
   * @throws {Error} - If dependencies cannot be resolved or files are missing.
   */
  public parse(baseDirectory: string): FilesDependencies {
    const files = this.getFiles(baseDirectory);
    const dependenciesMap: DependenciesMap = new Map<string, string[]>();
    const dependenciesNameMap: DependenciesNameMap = new Map<string, string>();
    files.forEach((file) => {
      const relativePath = path.relative(baseDirectory, file);
      let dependencies = this.extractDependencies(file);
      dependencies = dependencies.map((dep) => {
        const directoryPath = path.dirname(relativePath);
        return path.join(directoryPath.toLowerCase(), dep.toLowerCase());
      });
      dependenciesNameMap.set(relativePath, this.extractName(file));
      dependenciesMap.set(relativePath, dependencies);
    });

    return { dependenciesMap, dependenciesNameMap };
  }
}
