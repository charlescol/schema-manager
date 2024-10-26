# Schema Manager

## Automating Schema Versioning and Dependency Management

### Introduction

In modern microservices architectures, separating concerns is critical for scalability and maintainability. Managing schema files (e.g., Avro, Protobuf, JSON) across services can become complex and error-prone, especially when each microservice is responsible for publishing schemas to a schema registry (e.g., Confluent Schema Registry).

Schema Manager solves this by centralizing schema management and delegation. Instead of allowing microservices to handle schema publication directly, Schema Manager automates the versioning, dependency resolution, and registration of schemas in a centralized repository. This approach keeps microservices lightweight, while Schema Manager handles all the complexity of schema registration and lifecycle management.

This is important to note that Schema Manager is not intended to replace the schema Registry. Instead, it acts as a management layer that centralizes schemas in a single repository and automates their publication to the target registry.

By enforcing this separation of concerns, Schema Manager simplifies schema management across services, making the system more scalable, consistent, and reliable.

An example of integration for Schema Manager in managing all the schemas in a Kafka-oriented application involving multiple microservices can be found in the [Example of Integration with Schema Manager](#example-of-integration-with-schema-manager) section.

### Quick Start

You can install Schema Manager using NPM:

```bash
npm install @charlescol/schema-manager
```

After installation, organize your schema files in versioned directories and create a versions.json file to map versions. Then run Schema Manager to automatically register your schemas with the schema registry.

### Key Features

- **Centralized Schema Management:** Maintain all schema files (e.g., .proto, .avsc) in one repository, with versioning handled through a structured approach.
- **Automated Registration:** Automatically register schema file in the schema registry in the correct order based on their dependencies.
- **Version Control:** Use `versions.json` files to manage schema versions and ensure consistency across services.
- **Dependency Resolution:** Schema Manager parses the schema files to detect import and package statements, building a dependency graph. It automatically resolves dependencies using topological sorting to ensure schemas are registered in the correct order, with dependent schemas processed first.
- **Configurable for Confluent Schema Registry:** Seamless integration with Confluent Schema Registry, easily extendable to other registries.
- **Error Handling and Logging:** It includes error handling for unresolved imports, cyclic dependencies, and failed schema registrations. It logs detailed error messages to help you quickly identify and fix issues.

## Available Parsers

| **Parser**   | **Class Name**   | **Supported Formats** | **Description**                                                                             |
| ------------ | ---------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| **Avro**     | `AvroParser`     | `.avro`, `.avsc`      | Parses Avro schema files, supports extracting dependencies from `.avro` and `.avsc` files.  |
| **Protobuf** | `ProtobufParser` | `.proto`              | Parses Protobuf schema files, identifies package names and imports to resolve dependencies. |

Please refer to the [Parser Documentation](how-to/create-parser.md) for more details on how to create a parser.

## Available Registries

| **Registry**                  | **Class Name**      | **Supported Registries** |
| ----------------------------- | ------------------- | ------------------------ |
| **Confluent Schema Registry** | `ConfluentRegistry` | Confluent Kafka          |

Please refer to the [Registry Documentation](how-to/create-registry.md) for more details on how to create a registry.

## Scenario Example

Consider a system managing a set of Protobuf schemas for an event-driven architecture. Each schema has multiple versions and dependencies.

**Note:** Multiple examples, including those mentioned here with different schema types (Protobuf, Avro, etc.), are located within the repository at `./examples`. These examples showcase various use cases and help demonstrate how Schema Manager resolves dependencies and registers schemas for different schema formats. You can explore these to better understand how to set up your own schema management workflow.

In this example, we have two topics, topic1 and topic2, as well as a common namespace. Each topic contains multiple versions of schema files, with version mapping handled through versions.json files. Schema Manager supports both standard version numbers (e.g., v1, v2) and custom version strings (e.g., v1.0, alpha, beta). This allows flexibility in version naming, while Schema Manager handles versioning and dependency resolution across topics and versions

**Note:** A single versions.json could have been used to manage all the topics in a centralized way. Additionally, Schema Manager supports multiple versions.json files within the same directory.

**Note2:** The schema name must be unique across a given version of a topic (this include all the dependencies referenced in the versions.json file for the version).

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
1. **Step 2**: `data.proto` from `topic1/v2`, which depends on `entity.proto`
1. **Step 3**: `data.proto` in `topic1/v1` is registered first because `model.proto` depends on it.
1. **Step 5**: Once `data.proto` in `topic1/v1` is registered, `model.proto` from `topic1/v1` can be registered.
1. **Step 6**: Finally, `model.proto` from `topic1/v2`, which depends on `data.proto` from `v2`, is registered (a new subject is generated for each version).

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
- `common/v1/entity.proto` → `common.entity.v1`

## Future Plans and Roadmap

We plan to extend Schema Manager to support:

- Support for **other schema registries** beyond Confluent Schema Registry.
- Addition of bigger set of supported formats, alongside the existing parsers.
- A command-line interface (CLI) to manage schemas and visualize dependencies more easily.

## Example of Integration with Schema Manager

A common use case for Schema Manager is managing all the schemas in a Kafka-oriented application involving multiple microservices.

By using a **centralized schema registry**, you eliminate the need for each microservice to manage schemas independently or duplicate schema code across the services. Instead, each microservice only retrieves the schemas it needs from the centralized registry.

The centralized schema repository is stored in a dedicated repository, which includes an NPM integration to include the Schema Manager. A small script (like the one provided in the [Scenario Example](#usage-example) section) is used to automatically register and update the schemas. Whenever a change is detected in the `versions.json` file within the schema directory, this can trigger a new build and schema registration, typically through a CI/CD pipeline.

### Workflow Example:

1. **Centralized Schema Management**: The schema repository is versioned and stored in a central repository. Any changes to the schemas (tracked in `versions.json`) will trigger a new schema build and registration in Confluent Schema Registry.
2. **Microservice Schema Consumption**: Each microservice maintains a reference to the schemas it uses. For example, a `schemas.json` file located at the root of each microservice contains a list of schema subjects used by that service.
3. **Schema Retrieval and Code Generation**: The `schemas.json` file is used to retrieve the latest version of each schema from the Confluent Schema Registry. The schema code is then generated and can be used for development purpose.
4. **Serialization**: Tools like `kafka-protobuf-serializer` (for Java) or `@kafkajs/confluent-schema-registry` (for JavaScript) can be used to ensure that the data is serialized using the latest version of the schema, as retrieved from the registry regardless of the entity generated in the previous step.

### Benefits:

- **Simplified Schema Management**: All schemas are managed in one place, avoiding duplication and inconsistencies across services.
- **Automation and Consistency**: CI/CD integration ensures that schema updates are automatically built and registered.
- **Versioning and Compatibility**: Each microservice always has access to the latest version of the schemas, while schema changes can be version-controlled and managed centrally.

## Contributing

Contributions are welcome! If you have any suggestions or improvements, please open an issue or submit a pull request.
To contribute to this project, please refer to the [Contributing Guide](CONTRIBUTING.md) and the [how-to](how-to/overview.md) directory.

## License

This project is licensed under the MIT License – see the LICENSE file for more details.
