import * as path from 'path';
import * as fs from 'fs';
import topologicalSort from '../utils/topological-sort';
import VersionsExtractor from '../versions-extractor/version-extractor';
import { ManagerConfig } from './types';
import Builder from '../builder/builder';
import projectConfig from '../config/config';
import AbtractTransformer from '../transformer/abstract-transformer';
import AbstractParser from '../parser/abstract-parser';
import { VersionData } from '../versions-extractor/types';

export default class Manager {
  protected readonly versionDataExtractor: VersionsExtractor;
  protected readonly transformer: AbtractTransformer;
  protected readonly parser: AbstractParser;

  constructor(protected readonly config: ManagerConfig) {
    this.versionDataExtractor = new VersionsExtractor(config.dependencyResolutionMode);
    if (!projectConfig.schemaTypeConfig[config.configType]) {
      throw new Error(`Unsupported config type: ${config.configType}`);
    }
    this.transformer = projectConfig.schemaTypeConfig[config.configType].transformer;
    this.parser = projectConfig.schemaTypeConfig[config.configType].parser;
  }

  public async build(baseDirectory: string, buildDir: string = './build'): Promise<void> {
    const startTime = Date.now();

    const versionsResolution = await this.versionDataExtractor.extract(baseDirectory);
    new Builder(this.transformer).build(baseDirectory, versionsResolution.versionMap, buildDir);

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const seconds = Math.floor(durationMs / 1000);
    const milliseconds = durationMs % 1000;
    console.log(`Build completed in ${seconds}.${milliseconds.toString().padStart(3, '0')} s`);
  }

  public async register(
    subjectBuilder: (fullVersionPath: string) => string,
    buildDir: string = './build',
  ): Promise<void> {
    const dependenciesResult = this.parser.parse(buildDir);
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
  }
}
