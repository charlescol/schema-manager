import AbstractParser from '../parser/abstract-parser';
import AbtractTransformer from '../transformer/abstract-transformer';

export type SchemaTypeConfig = {
  transformer: AbtractTransformer; // The schema registry to use for registering schemas
  parser: AbstractParser; // The parser to use for parsing schema files
  forceExplicitResolution?: boolean; // Whether to force explicit resolution of conflicts
};
export enum ConfigType {
  AVRO = 'AVRO',
  PROTOBUF = 'PROTOBUF',
}
