import AvroParser from '../parser/avro-parser';
import ProtobufParser from '../parser/protobuf-parser';
import ProtobufTransformer from '../transformer/protobuf-transformer';
import { ConfigType, SchemaTypeConfig } from './config.types';

const projectConfig = {
  schemaTypeConfig: {
    [ConfigType.AVRO]: {
      transformer: new ProtobufTransformer(),
      parser: new AvroParser(),
      forceExplicitResolution: true,
    },
    [ConfigType.PROTOBUF]: {
      transformer: new ProtobufTransformer(),
      parser: new ProtobufParser(),
    },
  } as Record<ConfigType, SchemaTypeConfig>,
};
export default projectConfig;
