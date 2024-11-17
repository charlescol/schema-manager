import AbstractParser from '../parser/abstract-parser';
import AbstractTransformer from '../transformer/abstract-transformer';

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
export enum ConfigType {
  AVRO = 'AVRO',
  PROTOBUF = 'PROTOBUF',
}
