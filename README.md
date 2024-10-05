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

- **Centralized Schema Management:** Maintain all schema files (e.g., Protobuf) in one repository, with versioning handled through a structured approach.
- **Automated Registration:** Automatically register schema file in the schema registry in the correct order based on their dependencies.
- **Version Control:** Use `versions.json` files to manage schema versions and ensure consistency across services.
- **Dependency Resolution:** Schema Manager parses .proto files to detect import and package statements, building a dependency graph. It automatically resolves dependencies using topological sorting to ensure schemas are registered in the correct order, with dependent schemas processed first.
- **Configurable for Confluent Schema Registry:** Seamless integration with Confluent Schema Registry, easily extendable to other registries.
- **Error Handling and Logging:** It includes error handling for unresolved imports, cyclic dependencies, and failed schema registrations. It logs detailed error messages to help you quickly identify and fix issues.

## Limitations

- Currently only supports **Confluent Schema Registry**, but the tool is designed to be easily extendable to other registries.
- Only supports **Protobuf** schema format at this time. Support for **Avro** and **JSON Schema** is desired.

## Scenario Example

Consider a system managing a set of schemas for an event-driven architecture. Each schema has multiple versions and dependencies.

**File Structure:**

```bash
example-schemas/
├── v1/
│   ├── data.proto
│   └── model.proto (depends on data.proto)
├── v2/
│   └── data.proto (depends on model.proto from v1)
└── versions.json
```

**versions.json:**

```json
{
  "v1": {
    "data.proto": "v1/data.proto",
    "model.proto": "v1/model.proto"
  },
  "v2": {
    "data.proto": "v2/data.proto",
    "model.proto": "v1/model.proto"
  }
}
```

1. `data.proto` from v1 is registered first.
2. `model.proto` from v1 is registered next, depending on the v1 `data.proto`.
3. Finally, `data.proto` from v2 is registered, depending on the v1 `model.proto`.

### How It Works

1. **Organize Your Schemas:**

   - Place your Protobuf files in versioned directories (e.g., v1, v2) and map them in `versions.json`.

2. **Run Schema Manager:**

   - Schema Manager parses .proto files to detect import and package statements. Dependencies are resolved using topological sorting to ensure schemas are registered in the correct order.

3. **Automated Registration:**
   - Once dependencies are resolved, Schema Manager registers the schemas with the schema registry in the correct order.

### Usage Example

```typescript
import ProtoSchemaRegistry from '@scharlescol/schema-manager';

// Configuration for Schema Manager
const schemaRegistry = new ProtoSchemaRegistry({
  schemaRegistryUrl: 'http://localhost:8081',
});

const baseDirectory = './example-schemas';

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
schemaRegistry.loadAll(baseDirectory, subjectBuilder);
```

The `subjectBuilder` function is responsible for generating the subject name for each schema that is registered in the schema registry. The subject is a unique identifier used by the registry to track schema versions and manage updates. The function takes two parameters:

- **versions: `string[]`:** An array containing all the version names where the file is included (e.g., `['v1', 'v2']`).
- **filepath: `string`:** This is the relative file path of the schema file (e.g., `example-schemas/v1/model.proto`).

**Example Subject Names:**

The function above generates the following subject names:

- `v1/data.proto` → `data.v1`
- `v1/model.proto` → `model.v1`
- `v2/data.proto` → `data.v2`

## Second Example: Two Topics

In this example, we have two topics: topic1 and topic2, each containing multiple versions of schema files. The version mapping is maintained using versions.json files, and custom version names (e.g., test2) are supported by Schema Manager. This example demonstrates how Schema Manager resolves versioning and dependencies across topics and versions.

**Note:** A single versions.json could have been used to manage all the topics in a centralized way. Additionally, Schema Manager supports multiple versions.json files within the same directory, even allowing topics to share files or versions across them.

**File Structure:**

```bash
example-schemas/
  ├── topic1/
  │   ├── v1/
  │   │   ├── data.proto         # Schema for v1 data of topic1
  │   │   └── model.proto        # Schema for v1 model (depends on topic1/v1/data.proto)
  │   ├── v2/
  │   │   └── data.proto         # Schema for v2 data (depends on topic1/v1/model.proto)
  │   └── versions.json          # Version mapping for topic1 (v1 and v2)
  ├── topic2/
  │   ├── v1/
  │   │   └── data2.proto        # Schema for v1 data of topic2
  │   ├── v2/
  │   │   └── data.proto         # Schema for test2 version of data
  │   └── versions.json          # Version mapping for topic2 (v1 and test2)
```

**versions.json for topic1:**

```json
{
  "v1": {
    "data.proto": "v1/data.proto",
    "model.proto": "v1/model.proto"
  },
  "v2": {
    "data.proto": "v2/data.proto",
    "model.proto": "v1/model.proto"
  }
}
```

**versions.json for topic2:**

```json
{
  "v1": {
    "data2.proto": "v1/data2.proto"
  },
  "test2": {
    "data.proto": "v2/data.proto"
  }
}
```

### Schema Registration Order:

1. **Step 1**: `data.proto` in `topic1/v1` is registered first because `model.proto` depends on it.
2. **Step 2**: `data2.proto` in `topic2/v1` is independent and is registered next.
3. **Step 3**: Once `data.proto` in `topic1/v1` is registered, `model.proto` from `topic1/v1` can be registered.
4. **Step 4**: `data.proto` in `topic2/v2/test2` is independent and is registered next.
5. **Step 5**: Finally, `data.proto` from `topic1/v2`, which depends on `model.proto` from `v1`, is registered.

### Subject Naming with subjectBuilder

The schema manager uses the subjectBuilder function to create subject names for the schema registry. Since we have a version like test2, we need a more robust function to resolve the subject for each schema file, including non-numeric version names.

```typescript
const subjectBuilder = (versions: string[], filepath: string): string => {
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
};
```

**Example Subject Names:**

- `topic1/v1/data.proto` → `topic1.data.v1`
- `topic1/v1/model.proto` → `topic1.model.v1`
- `topic1/v2/data.proto` → `topic1.data.v2`
- `topic2/v1/data2.proto` → `topic2.data2.v1`
- `topic2/v2/data.proto` (test2 version) → `topic2.data.v2`

## Future Plans and Roadmap

We plan to extend Schema Manager to support:

- Support for **other schema registries** beyond Confluent Schema Registry.
- Addition of **Avro** and **JSON Schema** formats, alongside Protobuf.
- A command-line interface (CLI) to manage schemas and visualize dependencies more easily.

## License

This project is licensed under the MIT License – see the LICENSE file for more details.
