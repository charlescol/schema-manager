import AvroParser from '../parser/avro-parser';
import ProtobufParser from '../parser/protobuf-parser';
import ProtobufTransformer from '../transformer/protobuf-transformer';
import { ConfigType } from './config.types';

const projectConfig = {
  schemaTypeConfig: {
    [ConfigType.AVRO]: {
      transformer: new ProtobufTransformer(),
      parser: new AvroParser(),
    },
    [ConfigType.PROTOBUF]: {
      transformer: new ProtobufTransformer(),
      parser: new ProtobufParser(),
    },
  },
};
export default projectConfig;
