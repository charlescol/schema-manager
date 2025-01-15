import AbstractParser from '../parser/abstract-parser';
import AbstractTransformer from '../transformer/abstract-transformer';

/**
 * Define configuration options for processing and parsing
 * schemas, including transformer and parser classes, and an optional flag for explicit resolution of
 * schema versions.
 */
export type SchemaTypeConfig = {
  /**
   * The transformer class to use for processing schemas.
   * Reference to the constructor of a class extending AbstractTransformer.
   */
  transformer: new (...args: any[]) => AbstractTransformer;
  /**
   * The parser class to use for parsing schema files.
   * Reference to the constructor of a class extending AbstractParser.
   */
  parser: new (...args: any[]) => AbstractParser;
  /**
   * Optional flag to force explicit resolution for schema versions.
   */
  forceExplicitResolution?: boolean;
};

/**
 * Reference all available configurations
 */
export enum ConfigType {
  /**
   * Default configuration for AVRO schemas
   */
  AVRO = 'AVRO',
  /**
   * Default configuration for PROTOBUF schemas
   */
  PROTOBUF = 'PROTOBUF',
}
