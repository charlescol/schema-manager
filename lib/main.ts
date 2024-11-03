import * as path from 'path';
import * as minimist from 'minimist';
import ConfluentRegistry from '../dist/registry/confluent-registry';
import Manager from '../dist/manager/manager';
import ProtobufParser from '../dist/parser/protobuf-parser';
import AvroParser from '../dist/parser/avro-parser';
import SchemaType from '../dist/types';

(async () => {
  const SCHEMA_REGISTRY_URL = 'http://localhost:8081';
  const SCHEMA_DIR = path.resolve(__dirname, '../examples');

  const args = minimist(process.argv.slice(2));
  const preset: string = args.preset || 'protobuf'; // Default to "protobuf" preset

  const registry = new ConfluentRegistry({
    schemaRegistryUrl: SCHEMA_REGISTRY_URL,
    // Below part is optional, used to override queries to the schema registry
    body: {
      compatibilityGroup: 'application.major.version',
    },
    queryParams: {
      normalize: true,
    },
    headers: {
      Accept: 'application/vnd.schemaregistry.v1+json',
    },
  });

  switch (preset.toUpperCase()) {
    case SchemaType.AVRO:
      await new Manager({
        schemaRegistry: registry,
        parser: new AvroParser(),
      }).loadAll(`${SCHEMA_DIR}/avro`, subjectBuilder);

      break;
    default:
      await new Manager({
        schemaRegistry: registry,
        parser: new ProtobufParser(),
      }).loadAll(`${SCHEMA_DIR}/protobuf`, subjectBuilder);
      break;
  }
})();

function subjectBuilder(fullVersionPath: string, filepath: string): string {
  // Extract topic and version
  const [topic, version] = fullVersionPath.split('/');
  // Extract the filename without extension
  const filename = filepath.split('/').pop()?.split('.')[0] || '';
  // Return the constructed subject
  return `${topic}.${filename}.${version}`;
}
