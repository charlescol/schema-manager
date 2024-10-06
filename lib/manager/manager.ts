import * as path from 'path';
import * as fs from 'fs';
import AbstractParser from '@src/parser/abstract-parser';
import AbstractRegistry from '@src/registry/abstract-registry';
import { NamespaceMap, Reference } from '@src/utils/types';
import VersionsDataExtractor from '@src/versions-data-extractor/version-data-extractor';
import topologicalSort from '@src/utils/topological-sort';

export default class Manager {
  protected readonly versionDataExtractor: VersionsDataExtractor;

  constructor(protected readonly schemaRegistry: AbstractRegistry, protected readonly parser: AbstractParser) {
    this.versionDataExtractor = new VersionsDataExtractor();
  }
  /**
   * Loads all Protobuf schemas from the specified directory, processes them, and registers them
   * with the schema registry in topologically sorted order.
   *
   * This method:
   * 1. Extracts version data from the directory (`versions.json` files).
   * 2. Processes `.proto` files and their dependencies.
   * 3. Sorts them topologically to ensure that all dependencies are registered in the correct order.
   * 4. Registers each `.proto` file with the schema registry
   *
   * @param {string} baseDirectory - The root directory containing the `.proto` files and `versions.json` files.
   * @param {(versions: string[], filepath: string) => string} subjectBuilder - A function to build the subject name for each schema. Takes the file's versions and filepath as arguments.
   * @returns {Promise<void>} - A promise that resolves when all schemas have been registered.
   * @throws {Error} - If any dependencies cannot be resolved or if schema registration fails.
   */
  public async loadAll(
    baseDirectory: string,
    subjectBuilder: (versions: string[], filepath: string) => string,
  ): Promise<void> {
    const versionsResolution = await this.versionDataExtractor.extract(baseDirectory);
    const dependenciesResult = this.parser.parse(versionsResolution, baseDirectory);
    const order = topologicalSort(dependenciesResult.dependenciesMap);

    const subjects = new Map<string, string>();

    for (const filepath of order) {
      const protoPath = path.join(baseDirectory, filepath);
      const protoContent = fs.readFileSync(protoPath, 'utf-8');

      const references = this.buildReferences(
        filepath,
        dependenciesResult.dependenciesMap,
        dependenciesResult.namespaceMap,
        subjects,
      );
      const formattedSubject = subjectBuilder(
        versionsResolution.fileMap.get(filepath)!.map((version) => version.version),
        filepath,
      );
      subjects.set(filepath, formattedSubject);
      await this.schemaRegistry.registerSchema(formattedSubject, protoContent, references);
      console.log(`Registered proto schema for ${formattedSubject}`);
    }
  }

  private buildReferences(
    filepath: string,
    dependenciesMap: Map<string, string[]>,
    namespaceMap: NamespaceMap,
    subjects: Map<string, string>,
  ): Reference[] {
    const dependencies = dependenciesMap.get(filepath);
    if (!dependencies) throw new Error(`Subject ${filepath} is not registered`);
    const references = [];
    for (const dependency of dependencies) {
      const name = namespaceMap.get(dependency);
      if (!name) throw new Error(`Subject ${dependency} is not registered`);
      references.push({
        name,
        subject: subjects.get(dependency)!,
        version: -1,
      });
    }
    return references;
  }
}
