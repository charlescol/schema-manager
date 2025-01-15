import { DEFAULT_BUILD_DIR } from '../common/const';
import { ConfigType } from '../config/config.types';
import AbstractRegistry from '../registry/abstract-registry';
import { DependencyResolutionMode } from '../versions-extractor/types';

/**
 * The ManagerConfig type defines configuration options for managing schemas, including schema
 * registry, config type, dependency resolution mode, and namespace builder function.
 */
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
