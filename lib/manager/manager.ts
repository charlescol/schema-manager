import * as path from 'path';
import * as fs from 'fs';
import AbstractParser from '../parser/abstract-parser';
import AbstractRegistry from '../registry/abstract-registry';
import topologicalSort from '../utils/topological-sort';
import VersionsExtractor from '../versions-extractor/version-extractor';
import { DependencyResolutionMode } from '../versions-extractor/types';
import { ManagerConfig } from './types';

export default class Manager {
  protected readonly versionDataExtractor: VersionsExtractor;

  constructor(protected readonly config: ManagerConfig) {
    this.versionDataExtractor = new VersionsExtractor(config.dependencyResolutionMode);
  }
  /**
   * Loads all schemas from the specified directory, processes them, and registers them
   * with the schema registry in topologically sorted order.
   *
   * This method:
   * 1. Extracts version data from the directory (`versions.json` files).
   * 2. Processes files and their dependencies.
   * 3. Sorts them topologically to ensure that all dependencies are registered in the correct order.
   * 4. Registers each file with the schema registry
   *
   * @param {string} baseDirectory - The root directory containing the files and `versions.json` files.
   * @param {(versions: string[], filepath: string) => string} subjectBuilder - A function to build the subject name for each schema. Takes the file's versions and filepath as arguments.
   * @returns {Promise<void>} - A promise that resolves when all schemas have been registered.
   * @throws {Error} - If any dependencies cannot be resolved or if schema registration fails.
   */
  public async loadAll(
    baseDirectory: string,
    subjectBuilder: (fullVersionPath: string, filepath: string) => string,
  ): Promise<void> {
    const versionsResolution = await this.versionDataExtractor.extract(baseDirectory);
    const dependenciesResult = this.config.parser.parse(versionsResolution, baseDirectory);
    const order = topologicalSort(dependenciesResult.dependenciesMap);
    const subjects = new Map<string, string>();

    for (const filepath of order) {
      const fullPath = path.join(baseDirectory, filepath);
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      const partionnedDependencies = dependenciesResult.dependenciesPartionnedMap.get(filepath)!;

      for (const fullVersion of partionnedDependencies.keys()) {
        const references = this.config.schemaRegistry.buildReferences(
          filepath,
          partionnedDependencies.get(fullVersion)!,
          dependenciesResult.namespaceMap,
          subjects,
        );
        const formattedSubject = subjectBuilder(fullVersion, filepath);
        subjects.set(filepath, formattedSubject);
        await this.config.schemaRegistry.registerSchema(
          formattedSubject,
          fileContent,
          references,
          this.config.parser.getSchemaType(filepath),
        );
        console.log(`Registered schema for ${formattedSubject}`);
      }
    }
  }
}
