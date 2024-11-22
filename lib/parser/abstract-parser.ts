import * as path from 'path';
import * as fs from 'fs';
import { DependenciesMap, DependenciesNameMap, FilesDependencies } from './types';
import { VersionData } from '../versions-extractor/types';
import SchemaType from '../types';
import { getFiles, listFilesInDirectory } from '../utils/files';

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

  protected abstract readonly allowedExtensions: string[];
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
   * This method returns the schema type for a given file path. If the schema type is not supported, it returns `SchemaType.UNKNOWN`.
   *
   * @param {string} filepath - The path to the file being processed.
   * @returns {SchemaType} - The schema type associated with the given file.
   */
  public getSchemaType(filepath: string): SchemaType {
    const fileExtension = path.extname(filepath).toLowerCase();
    return AbstractParser.extensionToSchemaType[fileExtension] || SchemaType.UNKNOWN;
  }

  public async parse(baseDirectory: string): Promise<FilesDependencies> {
    const files = getFiles(baseDirectory, [], this.allowedExtensions);
    const dependenciesMap: DependenciesMap = new Map<string, string[]>();
    const dependenciesNameMap: DependenciesNameMap = new Map<string, string>();
    const folderFiles = new Map<string, string[]>();
    for (const file of files) {
      try {
        const relativePath = path.relative(baseDirectory, file);
        if (!folderFiles.has(relativePath))
          folderFiles.set(relativePath, await listFilesInDirectory(path.dirname(file)));

        let dependencies = this.extractDependencies(file);
        const currentFolderFiles = folderFiles.get(relativePath);
        dependencies = dependencies
          .filter((dep) => currentFolderFiles!.includes(dep))
          .map((dep) => {
            const directoryPath = path.dirname(relativePath);
            return path.join(directoryPath.toLowerCase(), dep.toLowerCase());
          });
        dependenciesNameMap.set(relativePath, this.extractName(file));
        dependenciesMap.set(relativePath, dependencies);
      } catch (error) {
        console.error(`Error parsing file: ${file}`);
        throw error;
      }
    }
    return { dependenciesMap, dependenciesNameMap };
  }
}
