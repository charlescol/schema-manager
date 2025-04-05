import AvroParser from '../parser/avro-parser';
import ProtobufParser from '../parser/protobuf-parser';
import AvroTransformer from '../transformer/avro-transformer';
import ProtobufTransformer from '../transformer/protobuf-transformer';
import JsonParser from '../parser/json-parser';
import JsonTransformer from '../transformer/json-transformer';
import { ConfigType, SchemaTypeConfig } from './config.types';

const projectConfig = {
  schemaTypeConfig: {
    [ConfigType.AVRO]: {
      transformer: AvroTransformer,
      parser: AvroParser,
    },
    [ConfigType.PROTOBUF]: {
      transformer: ProtobufTransformer,
      parser: ProtobufParser,
    },
    [ConfigType.JSON]: {
      transformer: JsonTransformer,
      parser: JsonParser,
    },
  } as Record<ConfigType, SchemaTypeConfig>,
};
export default projectConfig;
