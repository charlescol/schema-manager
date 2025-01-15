## Centralize Your Schema Files in One Git Repository

![npm version](https://img.shields.io/npm/v/@charlescol/schema-manager)
![Build Status](https://github.com/charlescol/schema-manager/actions/workflows/npm-publish.yml/badge.svg)
![npm downloads](https://img.shields.io/npm/dm/@charlescol/schema-manager)
![License](https://img.shields.io/github/license/charlescol/schema-manager)

### Why Schema Manager?

- Centralize schema files (Avro, Protobuf, JSON) in a single **Git repository**.
- Integrate schema deployment to the **Schema Registry** and automate model generation and distribution in a centralized **CI/CD pipeline**.
- Automate schema transformations.
- Resolve schema dependencies in JSON configurations to eliminate redundancy and improve maintainability.

**Sample Repo Demo**: [Try the example here in just a few minutes.](https://github.com/charlescol/schema-manager-example)  
**Guide**: [Scenario Example](#scenario-example)

---

### Introduction

In modern microservices architectures, separating concerns is essential for achieving scalability and maintainability. Managing schema files (e.g., Avro, Protobuf, JSON) across multiple services can quickly become complex and error-prone, especially when each microservice maintains its own schemas and handles their publication to a schema registry (e.g., Confluent Schema Registry).

**Schema Manager** addresses these challenges by centralizing schema management and delegation. It maintains schema files in a centralized Git repository and handles deployment to the target Schema Registry (typically through a CI/CD pipeline).

By enforcing this separation of concerns, Schema Manager simplifies schema management across services and ensures **a clear separation of responsibilities**, allowing microservices to remain lightweight and focused.

For a more comprehensive explanation of how Schema Manager integrates into modern Kafka-oriented applications involving multiple microservices and languages, refer to the [Example of Integration with Schema Manager](#example-of-integration-with-schema-manager) section. This section covers schema publication, as well as the generation and distribution of models across services.

---

### Quick Start

The Schema Manager is distributed via NPM:

```bash
npm install @charlescol/schema-manager
```

The minimal requirement is to initiate an npm project within your repository and install the package. The schema manager capabilities can be used programmatically in a JavaScript script file (example [here](#full-code)).

**Sample Repo Demo**: [Try the example here in just a few minutes.](https://github.com/charlescol/schema-manager-example)

---

## Supported Schema Formats

| **Config**   | **Supported Formats** | **Description**                                                                            |
| ------------ | --------------------- | ------------------------------------------------------------------------------------------ |
| **Avro**     | `.avro`, `.avsc`      | Parses Avro schema files, supports extracting dependencies from `.avro` and `.avsc` files. |
| **Protobuf** | `.proto`              | Parses Protobuf schema files, supports extracting dependencies from `.proto` files.        |

Please refer to the [Parser Documentation](how-to/create-parser.md) for more details on how to create a parser.

---

## Available Registries

| **Registry**                  | **Class Name**      | **Supported Registries** |
| ----------------------------- | ------------------- | ------------------------ |
| **Confluent Schema Registry** | `ConfluentRegistry` | Confluent Kafka          |

Please refer to the [Registry Documentation](how-to/create-registry.md) for more details on how to create a registry.

---

### How It Works

1. **Organize Your Schemas:**

   - Place your files in versioned directories (e.g., `v1`, `v2`) and map them in `versions.json`. Refer to the [versions file structure](#versions-file-structure) for details on how to structure the `versions.json` file.

2. **Build Schemas:**

   - Schema Manager produces a `build` directory with all the schemas grouped into folders. Each folder contains the transformed schema with the appropriate namespaces and dependencies.

3. **Automated Registration:**

   - Schema Manager processes the `build` folder to register the schemas in the target Schema Registry in the correct order based on dependencies.

## Scenario Example

Consider a system managing a set of Protobuf schemas for an event-driven architecture. Each schema has multiple versions and dependencies.

If you don’t already have a project set up, you can create one with the following commands:

```bash
mkdir schema-manager-example
cd schema-manager-example
npm init -y && npm install @charlescol/schema-manager
```

In this example, we have two topics named "topic1" and "topic2," as well as a common folder used for shared schemas.

The topics can contain multiple major versions of schema files. A JSON file named `versions.json` is used to manage them for each topic.

In our case, let's say that our schemas for `topic1` contain two major versions due to breaking changes in a file called `data.proto`:

### File Structure

```bash
example-schemas/
  ├── topic1/
  │   ├── v1/
  │   │   ├── data.proto         # Schema for v1 data of topic1
  │   │   └── model.proto        # Schema for v1 model (depends on topic1/v1/data.proto)
  │   ├── v2/
  │   │   └── data.proto         # Schema for v2 data (depends on ./common/v1/entity.proto)
  │   └── versions.json          # Version mapping for topic1 (v1 and v2)
  ├── topic2/
  │   ├── v1/
  │   │   └── data2.proto        # Schema for v1 data2 of topic2 (depends on ./common/v1/entity.proto)
  │   └── versions.json          # Version mapping for topic2 (v1)
  ├── common/
  │   ├── v1/
  │   │   └── entity.proto       # Schema for shared entity
```

In the above structure, the folder `topic1/v2` contains only one file, even though there are three schemas in v2 (`model.proto` → `data.proto` → `entity.proto`).

This is because `versions.json` is used to resolve dependencies. If a file is the same across different versions, it doesn't need to be duplicated. The Schema Manager handles this implicit import mechanism to avoid schema duplication.

### `versions.json` for `topic1`

```json
{
  "v1": {
    "data": "v1/data.proto",
    "model": "v1/model.proto"
  },
  "v2": {
    "data": "v2/data.proto",
    "model": "v1/model.proto",
    "entity": "../common/v1/entity.proto"
  }
}
```

### `versions.json` for `topic2`

```json
{
  "v1": {
    "data2": "v1/data2.proto",
    "entity": "../common/v1/entity.proto"
  }
}
```

Adding a `versions.json` in the `common` directory is unnecessary because it is not meant to be registered independently.

### Additional Remarks

- Schema Manager supports any string for version names (e.g., `v1`, `v1.0`, `alpha`).
- The schema name must be unique across a given version of a topic.
- Alternatively, a single `versions.json` file could be used to manage all the topics centrally.

**Note:** Multiple examples, including those mentioned here with different schema types (Protobuf, Avro, etc.), can be found in the repository at `./examples`. Explore these to better understand schema management workflows.

---

### Example Schema Content

Here is an example on how the model.proto should be structured. For more details on how to structure tour schema files by type, refer to the [Schema Content](#schema-content) section.

#### `topic1/v1/model.proto`

```protobuf
// Information regarding the package, namespace, and import path will be completed automatically during the build process
syntax = "proto3";

// Don't need to create a package.

// Don't need to import the full path, only the filename is enough.
import "data.proto";

message Model {
  Data data = 1; // Don't need to reference the namespace, only the message name is enough.
  string description = 2;
  repeated string tags = 3;
}
```

---

### Building Schemas

The code below will generate a `build` directory with all the schemas grouped into folders, one per topic and version.

```typescript
import { ConfigType, ConfluentRegistry, Manager } from '@charlescol/schema-manager';
import * as path from 'path';

(async () => {
  const SCHEMA_REGISTRY_URL = process.env.SCHEMA_REGISTRY_URL || 'http://localhost:8081';
  const SCHEMA_DIR = path.resolve(__dirname, '../schemas');

  // Create the schema registry
  const registry = new ConfluentRegistry({
    schemaRegistryUrl: SCHEMA_REGISTRY_URL,
  });

  // Create the manager
  const manager = new Manager({
    schemaRegistry: registry,
    configType: ConfigType.PROTOBUF, // Specify the config type
  });
  await manager.build(SCHEMA_DIR); // Build the schemas
})();
```

**Build Directory Structure:**

```bash
build/
  ├── topic1/
  │   ├── v1/
  │   │   ├── data.proto
  │   │   └── model.proto # Depends on data.proto
  │   ├── v2/
  │   │   └── data.proto # Depends on entity.proto
  │   │   └── model.proto # Depends on data.proto
  │   │   └── entity.proto
  ├── topic2/
  │   ├── v1/
  │   │   └── data2.proto # Depends on entity.proto
  │   │   └── entity.proto
```

Each generated file is now ready to be registered in the schema registry.

#### Generated `topic1/v1/model.proto`

```protobuf
syntax = "proto3";

package topic1.v1; // Resolved automatically

import "topic1/v1/data.proto"; // Resolved automatically

message Model {
  topic1.v1.Data data = 1; // Resolved automatically
  string description = 2;
  repeated string tags = 3;
}
```

By default, the namespace is generated by replacing `/` with `.` in the path. This can be customized by providing a custom namespace builder function to the manager.

---

### Publish to the Registry

Once the schemas are built, they can be deployed in the registry.

```typescript
function subjectBuilder(filepath: string): string {
  const [topic, version, filename] = filepath.split('/'); // Extract topic and version
  const filenameWithoutExt = filename?.split('.')[0] || ''; // Extract the filename without extension
  return `${topic}.${filenameWithoutExt}.${version}`; // Return the constructed subject
}

await manager.register(subjectBuilder); // Register the schemas
```

The `subjectBuilder` function generates the subject name for each schema registered in the schema registry. The subject is a unique identifier used by the registry to track a schema. The above implementation is a custom strategy but you can also follow a `TopicNameStrategy` or a `RecordNameStrategy` to generate the subject name.

The `register` function builds a dependency graph based on schema dependencies and registers them in the correct order using a topological sorting algorithm.

#### Example of Subject Names Generated by `subjectBuilder`

- `topic1/v1/data.proto` → `topic1.data.v1`
- `topic1/v1/model.proto` → `topic1.model.v1`
- `topic1/v2/data.proto` → `topic1.data.v2`

**After the registration process, a `subjects.txt` file is generated in the root directory to keep track of the subjects registered in the schema registry.** This file can be used to generate constants during code generation process.

#### Example of Optimal Registration Order (Based on Dependencies)

1. `topic1/v1/data.proto`
2. `topic1/v2/entity.proto`
3. `topic2/v1/entity.proto`
4. `topic1/v2/data.proto`
5. `topic2/v2/data2.proto`
6. `topic1/v1/model.proto`
7. `topic1/v2/model.proto`

---

### Full Code

Below is the complete code example for the steps above.

#### `publish-schemas.ts`

```typescript
import { ConfigType, ConfluentRegistry, Manager } from '@charlescol/schema-manager';
import * as path from 'path';

(async () => {
  const SCHEMA_REGISTRY_URL = process.env.SCHEMA_REGISTRY_URL || 'http://localhost:8081';
  const SCHEMA_DIR = path.resolve(__dirname, '../schemas');

  const registry = new ConfluentRegistry({
    // Create the schema registry
    schemaRegistryUrl: SCHEMA_REGISTRY_URL,
  });

  const manager = new Manager({
    // Create the manager
    schemaRegistry: registry,
    configType: ConfigType.PROTOBUF,
  });
  await manager.build(SCHEMA_DIR); // Build the schemas
  await manager.register(subjectBuilder); // register the schemas
})();

// Function to provide, used to build the subject for each schema file.
function subjectBuilder(filepath: string): string {
  const [topic, version, filename] = filepath.split('/');
  const filenameWithoutExt = filename?.split('.')[0] || '';
  return `${topic}.${filenameWithoutExt}.${version}`; // Return the constructed subject
}
```

If the file above is saved as `publish-schemas.ts`, you can run it with the following command to compile and execute it:

```bash
tsc && node dist/publish-schemas.js
```

---

## Schema Content

Many details are dynamically resolved during the build process using the `versions.json` file. This setup avoids code redundancy and enables dynamic schema transformations.

### Protobuf

- **Package Handling**: The package is automatically included during the build process and does not need to be specified in the schema.
- **Imports**: Import statements should reference only the file name without the full path (e.g., `import "entity.proto";` ✅, not `import "common/v1/entity.proto";` ❌).
- **External Imports**: External imports (e.g., `google/protobuf/timestamp.proto`) remain unchanged.
- **Object Names**: Internal object references do not need to include the package name (e.g., `Entity` ✅, not `common.v1.Entity` ❌).

```protobuf
// topic1/v1/data.proto
syntax = "proto3";

// No need to create a package.

import "entity.proto"; // Use only the file name
import "google/protobuf/timestamp.proto"; // External imports are unchanged

message Data {
string additional_info = 1;
google.protobuf.Timestamp created_at = 2; // External imports are unchanged
repeated Entity entities = 3; // Internal object names exclude the package name
}
```

**Note:** While the builder will work even if the above conventions are not followed, adhering to them is recommended to reduce unnecessary verbosity and avoid ambiguity.

---

### Avro

- **Namespace Handling**: Namespaces are automatically included during the build process and do not need to be specified in the schema.
- **Object Names**: Internal object references do not need to include the namespace name (e.g., `Entity` ✅, not `common.v1.Entity` ❌).

```json
{
  "type": "record",
  "name": "Model",
  "fields": [
    {
      "name": "description",
      "type": "string"
    },
    {
      "name": "entities",
      "type": {
        "type": "array",
        "items": "Entity"
      }
    }
  ]
}
```

**Note:** While the builder will work even if the above conventions are not followed, adhering to them is recommended to reduce unnecessary verbosity and avoid ambiguity.

---

## Future Plans and Roadmap

We aim to extend Schema Manager with the following features:

- **Support for Additional Schema Registries**: Expanding beyond Confluent Schema Registry to support other platforms.
- **Expanded Format Support**: Adding parsers for more schema types beyond Protobuf, Avro, and JSON.
- **Complex Transformations**: Enabling advanced schema transformations, such as adding options in Protobuf files to control future code generation.

---

## Example of Integration with Schema Manager

A typical use case for Schema Manager is managing schemas in a Kafka-oriented application with multiple microservices. By centralizing schemas in a single repository, you can automate schema management tasks through a CI/CD pipeline.

### Pipeline Tasks

1. **Build Schemas**: Generate schema files from source.
2. **Register Schemas**: Deploy schemas to the schema registry.
3. **Code Generation**: Generate code for schemas in target programming languages.
4. **Package Distribution**: Distribute generated code as packages (e.g., Maven, NPM, PyPI).

### Workflow Example

1. **Centralized Schema Management**: Store all schemas in a version-controlled Git repository. Updates to `versions.json` trigger builds and registrations in the Schema Registry.
2. **Microservice Integration**: Each microservice uses versioned and packaged models generated by the central repository. These models ensure consistency across services.
3. **Serialization**: Use tools like `kafka-protobuf-serializer` (Java) or `@kafkajs/confluent-schema-registry` (JavaScript) to serialize data with the latest schema version retrieved from the registry.

---

### Benefits

- **Simplified Management**: Centralized schemas reduce duplication and inconsistencies.
- **Automation**: CI/CD integration ensures schema updates are handled automatically.
- **Compatibility**: Versioned models guarantee consistency across services.

---

## Contributing

We welcome contributions! If you have suggestions or improvements, please open an issue or submit a pull request.

Refer to the [Contributing Guide](CONTRIBUTING.md) and [How-To Documentation](how-to/overview.md) for details on contributing.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
