import AbstractParser from '../parser/abstract-parser';
import AbstractRegistry from '../registry/abstract-registry';
import { DependencyResolutionMode } from '../versions-extractor/types';

export type ManagerConfig = {
  schemaRegistry: AbstractRegistry<unknown>; // The schema registry to use for registering schemas
  parser: AbstractParser; // The parser to use for parsing schema files
  dependencyResolutionMode?: DependencyResolutionMode; // The dependency resolution mode to use
};
