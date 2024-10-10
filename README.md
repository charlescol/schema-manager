# Schema Manager

## Automating Schema Versioning and Dependency Management for Protobuf Files

### Introduction

In modern microservices architectures, separating concerns is critical for scalability and maintainability. Managing schema files (e.g., Protobuf) across services can become complex and error-prone, especially when each microservice is responsible for publishing schemas to a schema registry (e.g., Confluent Schema Registry).

Schema Manager solves this by centralizing schema management and delegation. Instead of allowing microservices to handle schema publication directly, Schema Manager automates the versioning, dependency resolution, and registration of schemas in a centralized repository. This approach keeps microservices lightweight, while Schema Manager handles all the complexity of schema registration and lifecycle management.

By enforcing this separation of concerns, Schema Manager simplifies schema management across services, making the system more scalable, consistent, and reliable.

### Quick Start

You can install Schema Manager using NPM:

```bash
npm install @charlescol/schema-manager
```

After installation, organize your .proto schema files in versioned directories and create a versions.json file to map versions. Then run Schema Manager to automatically register your schemas with the schema registry.

### Key Features

- **Centralized Schema Management:** Maintain all schema files (e.g., .proto, .avsc) in one repository, with versioning handled through a structured approach.
- **Automated Registration:** Automatically register schema file in the schema registry in the correct order based on their dependencies.
- **Version Control:** Use `versions.json` files to manage schema versions and ensure consistency across services.
- **Dependency Resolution:** Schema Manager parses the schema files to detect import and package statements, building a dependency graph. It automatically resolves dependencies using topological sorting to ensure schemas are registered in the correct order, with dependent schemas processed first.
- **Configurable for Confluent Schema Registry:** Seamless integration with Confluent Schema Registry, easily extendable to other registries.
- **Error Handling and Logging:** It includes error handling for unresolved imports, cyclic dependencies, and failed schema registrations. It logs detailed error messages to help you quickly identify and fix issues.

## Limitations

- Currently only supports **Confluent Schema Registry**, but the tool is designed to be easily extendable to other registries.
- Supports **Protobuf** and **Avro** schema format at this time. The tool is designed to be easily extendable and **JSON Schema** support is planned for future releases.

## Scenario Example

Consider a system managing a set of schemas for an event-driven architecture. Each schema has multiple versions and dependencies.

**Note:** Multiple examples, including those mentioned here with different schema types (Protobuf, Avro, etc.), are located within the repository at `./examples`. These examples showcase various use cases and help demonstrate how Schema Manager resolves dependencies and registers schemas for different schema formats. You can explore these to better understand how to set up your own schema management workflow.

In this first example, we have two topics: topic1 and topic2, and a common namespace. Each can contain multiple versions of schema files. The version mapping is maintained using versions.json files, and custom version names (e.g., v1.0) are supported by Schema Manager. This example demonstrates how Schema Manager resolves versioning and dependencies across topics and versions.

**Note:** A single versions.json could have been used to manage all the topics in a centralized way. Additionally, Schema Manager supports multiple versions.json files within the same directory.

**File Structure:**

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
  │   ├── v1.0/
  │   │   └── data2.proto        # Schema for v1.0 data of topic2
  │   └── versions.json          # Version mapping for topic2 (v1.0)
  ├── common/
  │   ├── v1/
  │   │   └── entity.proto       # Schema for test entity
  │   └── versions.json          # Version mapping for common (v1)
```

**versions.json for topic1:**

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

**versions.json for topic2:**

```json
{
  "v1.0": {
    "data2": "v1/data2.proto"
  }
}
```

**versions.json for common:**

```json
{
  "v1": {
    "entity": "v1/entity.proto"
  }
}
```

### Schema Registration Order:

1. **Step 1**: `entity.proto` in `common/v1` is registered first because `model.proto` depends on it.
1. **Step 2**: `data.proto` from `topic1/v2`, which depends on `entity.proto` from `v1`, is registered.
1. **Step 3**: `data.proto` in `topic1/v1` is registered first because `model.proto` depends on it.
1. **Step 4**: `data2.proto` in `topic2/v1` is independent and is registered next.
1. **Step 5**: Once `data.proto` in `topic1/v1` is registered, `model.proto` from `topic1/v1` can be registered.
1. **Step 6**: Finally, `model.proto` from `topic1/v2`, which depends on `data.proto` from `v2`, is registered.

### How It Works

1. **Organize Your Schemas:**

   - Place your Protobuf files in versioned directories (e.g., v1, v2) and map them in `versions.json`.

2. **Run Schema Manager:**

   - Schema Manager parses .proto files to detect import and package statements. Dependencies are resolved using topological sorting to ensure schemas are registered in the correct order.

3. **Automated Registration:**
   - Once dependencies are resolved, Schema Manager registers the schemas with the schema registry in the correct order.

### Usage Example

```typescript
import { ConfluentRegistry, Manager, ProtobufParser } from '@charlescol/schema-manager';
import * as path from 'path';

const registry = new ConfluentRegistry({
  schemaRegistryUrl: 'http://localhost:8081',
});
const baseDirectory = path.resolve(__dirname, '../schemas');

const manager = new Manager(registry, new ProtobufParser());

// Function to provide, used to build the subject for each schema file.
// This is an example implementation, you can customize it based on your own versioning and naming rules.
const subjectBuilder = (versions: string[], filepath: string): string => {
  const minVersion = versions.sort()[0]; // Select the minimum version
  return (
    filepath
      .replace(/\/v\d+/, '') // Remove the version directory (e.g., /v1)
      .replace(/\.proto$/, '') // Remove the .proto file extension
      .replace(/[/\\]/g, '.') + `.v${minVersion}` // Convert path separators to dots and append the minimum version
  );
};
// Load and register all schemas
await manager.loadAll(baseDirectory, subjectBuilder);
```

The `subjectBuilder` function is responsible for generating the subject name for each schema that is registered in the schema registry. The subject is a unique identifier used by the registry to track schema versions and manage updates. The function takes two parameters:

- **versions: `string[]`:** An array containing all the version names where the file is included (e.g., `['v1', 'v2']`).
- **filepath: `string`:** This is the relative file path of the schema file (e.g., `example-schemas/v1/model.proto`).

**Example Subject Names:**

The function above generates the following subject names:

- `topic1/v1/data.proto` → `topic1.data.v1`
- `topic1/v1/model.proto` → `topic1.model.v1`
- `topic1/v2/data.proto` → `topic1.data.v2`
- `topic1/v2/model.proto` → `topic1.model.v2`
- `topic2/v1.0/data2.proto` → `topic2.data2.v1.0`
- `common/v1/entity.proto` → `common.entity.v1`

## Future Plans and Roadmap

We plan to extend Schema Manager to support:

- Support for **other schema registries** beyond Confluent Schema Registry.
- Addition of **JSON Schema** format, alongside Protobuf and Avro.
- A command-line interface (CLI) to manage schemas and visualize dependencies more easily.

## License

This project is licensed under the MIT License – see the LICENSE file for more details.
