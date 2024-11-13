import { ConfigType } from '../config/config.types';
import AbstractRegistry from '../registry/abstract-registry';
import { DependencyResolutionMode } from '../versions-extractor/types';

export type ManagerConfig = {
  schemaRegistry: AbstractRegistry<unknown>; // The schema registry to use for registering schemas
  configType: ConfigType; // The config to use for the schema files
  dependencyResolutionMode?: DependencyResolutionMode; // The dependency resolution mode to use
};
