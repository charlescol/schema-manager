import * as path from 'path';
import ProtoSchemaRegistry from './proto-schema-registry';
import * as minimist from 'minimist';
import AbstractSchemaRegistry from './schema-registry';

// Ensuring 'registry' is assigned before use
(async () => {
  const SCHEMA_REGISTRY_URL = 'http://localhost:8081';
  const SCHEMA_DIR = path.resolve(__dirname, '../examples');

  const args = minimist(process.argv.slice(2));
  const preset: string = args.preset || 'protobuf'; // Default to "protobuf" preset

  let registry: AbstractSchemaRegistry;
  let baseDirectory: string;

  switch (preset) {
    default:
      registry = new ProtoSchemaRegistry({
        schemaRegistryUrl: SCHEMA_REGISTRY_URL,
      });
      baseDirectory = `${SCHEMA_DIR}/protobuf`;
      break;
  }

  await registry!.loadAll(baseDirectory!, (versions: string[], filepath: string): string => {
    // Extract the numbers from version names, keeping the original version for custom names
    const processedVersion = versions.map((version) => {
      const numericPart = version.replace(/\D/g, ''); // Extract numeric part of the version
      return numericPart || version; // If no numeric part, keep original (e.g., 'test2')
    });

    const minVersion = processedVersion.sort()[0]; // Select the minimum version, respecting numeric order
    return (
      filepath
        .replace(/\/v\d+/, '') // Remove the version directory (e.g., /v1)
        .replace(/\.proto$/, '') // Remove the .proto file extension
        .replace(/[/\\]/g, '.') + `.v${minVersion}` // Convert path separators to dots and append the minimum version
    );
  });
})();
