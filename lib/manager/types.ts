import { ConfigType } from '../config/config.types';
import AbstractRegistry from '../registry/abstract-registry';
import { DependencyResolutionMode } from '../versions-extractor/types';

export type ManagerConfig = {
  /**
   * The schema registry to use for registering schemas
   */
  schemaRegistry: AbstractRegistry<unknown>;
  /**
   * The config to use for the schema files
   */
  configType: ConfigType;
  /**
   * The dependency resolution mode to use
   */
  dependencyResolutionMode?: DependencyResolutionMode;
  /**
   * The function to use for generating the namespace
   */
  namespaceBuilder?: (filepath: string) => string;
};
