// import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import extractVersionsData from './utils/extract-versions-data';

import processProtobufFiles from './utils/parse-protobuf-dependencies';
import topologicalSort from './utils/topological-sort';

import { NamespaceMap, Reference } from './utils/types';
import axios from 'axios';
import AbstractSchemaRegistry from './schema-registry';
import { SchemaType } from './types';

/**
 * Class for managing and registering Protobuf schemas with a schema registry.
 *
 * This class is responsible for loading,
 * processing, and registering `.proto` files with a schema registry. It supports
 * registering schemas with their respective dependencies (other `.proto` files),
 * and handles registering them in a topologically sorted order to ensure that all
 * dependencies are resolved correctly.
 */
export default class ProtoSchemaRegistry extends AbstractSchemaRegistry {
  private async registerProtoSchema(subject: string, protobufSchema: string, references: Reference[]): Promise<object> {
    try {
      const response = await axios.post(
        `${this.config.schemaRegistryUrl}/subjects/${subject}/versions`,
        {
          schemaType: SchemaType.PROTOBUF,
          schema: protobufSchema,
          references,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to register proto schema for subject ${subject}`, error);
      throw error;
    }
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
    const versionsResolution = await extractVersionsData(baseDirectory);
    const dependenciesResult = processProtobufFiles(versionsResolution, baseDirectory);
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
      await this.registerProtoSchema(formattedSubject, protoContent, references);
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
