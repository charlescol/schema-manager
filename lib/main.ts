import * as path from 'path';
import * as minimist from 'minimist';
import ConfluentRegistry from '../dist/registry/confluent-registry';
import Manager from '../dist/manager/manager';
import SchemaType from '../dist/types';
import { ConfigType } from '../dist/config/config.types';

/*
 * This file is used for running examples in a development environment only;
 * it is not distributed with the package.
 *
 * Purpose:
 * - The provided objects are imported from the `dist` folder. To apply changes,
 *   ensure that you run the build command after making modifications.
 *
 * Configuration:
 * - The following environment variables are used:
 *   - `SCHEMA_REGISTRY_URL`: Configures the `ConfluentRegistry` instance.
 *   - `SCHEMA_DIR`: Specifies the directory where schemas are located.
 *
 * Running:
 * - Use the following commands to run this file with specific presets:
 *   - `yarn run run:protobuf` for the Protobuf preset
 *   - `yarn run run:avro` for the Avro preset
 */

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

  let manager: Manager;

  switch (preset.toUpperCase()) {
    case SchemaType.AVRO: {
      manager = new Manager({
        schemaRegistry: registry,
        configType: ConfigType.AVRO,
      });
      await manager.build(`${SCHEMA_DIR}/avro`);
      break;
    }
    default: {
      manager = new Manager({
        schemaRegistry: registry,
        configType: ConfigType.PROTOBUF,
      });
      await manager.build(`${SCHEMA_DIR}/schemas`);
    }
  }
  await manager.register(subjectBuilder);
})();

function subjectBuilder(filepath: string): string {
  // Extract topic and version
  const [topic, version, filename] = filepath.split('/');
  // Extract the filename without extension
  const filenameWithoutExt = filename?.split('.')[0] || '';
  // Return the constructed subject
  return `${topic}.${filenameWithoutExt}.${version}`;
}
