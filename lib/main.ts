import * as path from 'path';
import * as minimist from 'minimist';
import ConfluentRegistry from './registry/confluent-registry';
import AbstractRegistry from './registry/abstract-registry';
import Manager from './manager/manager';
import ProtobufParser from './parser/protobuf-parser';

(async () => {
  let manager: Manager;
  let baseDirectory: string;

  const SCHEMA_REGISTRY_URL = 'http://localhost:8081';
  const SCHEMA_DIR = path.resolve(__dirname, '../examples');

  const args = minimist(process.argv.slice(2));
  const preset: string = args.preset || 'protobuf'; // Default to "protobuf" preset

  const registry = new ConfluentRegistry({
    schemaRegistryUrl: SCHEMA_REGISTRY_URL,
  });

  switch (preset) {
    default:
      manager = new Manager(registry, new ProtobufParser());
      baseDirectory = `${SCHEMA_DIR}/protobuf`;
      break;
  }

  await manager!.loadAll(baseDirectory!, (versions: string[], filepath: string): string => {
    // Extract the numbers from version names, keeping the original version for custom names
    const processedVersion = versions.map((version) => {
      const numericPart = version.replace(/\D/g, '');
      return numericPart || version;
    });

    const minVersion = processedVersion.sort()[0]; // Select the minimum version
    return (
      filepath
        .replace(/\/v\d+/, '') // Remove the version directory (e.g., /v1)
        .replace(/\.proto$/, '') // Remove the .proto file extension
        .replace(/[/\\]/g, '.') + `.v${minVersion}` // Convert path separators to dots and append the minimum version
    );
  });
})();
