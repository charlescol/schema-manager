import * as path from 'path';
import * as fs from 'fs';
import topologicalSort from '../utils/topological-sort';
import VersionsExtractor from '../versions-extractor/version-extractor';
import { ManagerConfig } from './types';
import Builder from '../builder/builder';
import projectConfig from '../config/config';
import AbtractTransformer from '../transformer/abstract-transformer';
import AbstractParser from '../parser/abstract-parser';
import { DependencyResolutionMode } from '../versions-extractor/types';
import { UnsupportedConfigTypeError } from '../common/errors';
import { DEFAULT_BUILD_DIR, DEFAULT_SUBJECTS_DIR } from '../common/const';

/**
 * The Manager class initializes components based on ManagerConfig and provides methods
 * to build schemas and register subjects asynchronously.
 */
export default class Manager {
  protected readonly versionDataExtractor: VersionsExtractor;
  protected readonly transformer: AbtractTransformer;
  protected readonly parser: AbstractParser;

  /**
   * The Manager class initializes components based on ManagerConfig and provides methods
   * to build schemas and register subjects asynchronously.
   * @param {ManagerConfig} config - The `config` parameter is an object of type `ManagerConfig`
   */
  constructor(protected readonly config: ManagerConfig) {
    if (!projectConfig.schemaTypeConfig[config.configType]) {
      throw new UnsupportedConfigTypeError(config.configType);
    }
    if (projectConfig.schemaTypeConfig[config.configType].forceExplicitResolution) {
      config.dependencyResolutionMode = DependencyResolutionMode.EXPLICIT;
    }
    this.transformer = new projectConfig.schemaTypeConfig[config.configType].transformer({
      namespaceBuilder: config.namespaceBuilder,
    });
    this.versionDataExtractor = new VersionsExtractor(config.dependencyResolutionMode);
    this.parser = new projectConfig.schemaTypeConfig[config.configType].parser(config);
  }

  /**
   * The function asynchronously builds a schema using extracted version data and logs a completion
   * message.
   * @param {string} baseDirectory - The `baseDirectory` parameter in the `build` method is a string that
   * represents the base directory where the build process will take place. It is the starting point or
   * root directory for the build operation.
   * @param buildDir - The `buildDir` parameter in the `build` method is a string that specifies the
   * directory where the build output will be stored. If no value is provided for `buildDir`, it defaults
   * to `DEFAULT_BUILD_DIR`.
   */
  public async build(baseDirectory: string, buildDir = DEFAULT_BUILD_DIR): Promise<void> {
    const versionsResolution = await this.versionDataExtractor.extract(baseDirectory);
    await new Builder(this.transformer).build(baseDirectory, versionsResolution.versionMap, buildDir);
    console.log(`Schema build completed successfully`);
  }

  /**
   * The `register` function asynchronously registers schemas, builds references, and saves subjects to a
   * file in TypeScript.
   * @param subjectBuilder - The `subjectBuilder` parameter is a function that takes a `fullVersionPath`
   * string as input and returns a string.
   * @param buildDir - The `buildDir` parameter in the `register` method is the directory path where the
   * files to be processed are located. It is set to `DEFAULT_BUILD_DIR` if not provided explicitly.
   * @param subjectsDir - The `subjectsDir` parameter in the `register` method is the directory where the
   * list of registered subjects will be saved to a file. This file will contain one subject per line.
   */
  public async register(
    subjectBuilder: (fullVersionPath: string) => string,
    buildDir = DEFAULT_BUILD_DIR,
    subjectsDir = DEFAULT_SUBJECTS_DIR,
  ): Promise<void> {
    const dependenciesResult = await this.parser.parse(buildDir);
    const order = topologicalSort(dependenciesResult.dependenciesMap);
    const subjects = new Map<string, string>();

    for (const filepath of order) {
      const fullPath = path.join(buildDir, filepath);
      const fileContent = fs.readFileSync(fullPath, 'utf-8');

      const references = this.config.schemaRegistry.buildReferences(
        dependenciesResult.dependenciesMap.get(filepath)!,
        dependenciesResult.dependenciesNameMap,
        subjects,
      );
      const formattedSubject = subjectBuilder(filepath);
      subjects.set(filepath, formattedSubject);
      await this.config.schemaRegistry.registerSchema(
        formattedSubject,
        fileContent,
        references,
        this.parser.getSchemaType(filepath),
      );
      console.log(`Registered schema for ${formattedSubject}`);
    }

    // Save the subjects to a file, one subject per line
    const subjectsArray = Array.from(subjects.values());
    fs.writeFileSync(subjectsDir, subjectsArray.join('\n'), 'utf-8');
  }
}
