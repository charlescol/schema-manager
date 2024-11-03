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

## Manager Parameters

Below the parameters that can be passed to the `Manager` constructor.

| Parameter                  | Type                       | Description                                                                                                                            | Required |
| -------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `schemaRegistry`           | `AbstractRegistry`         | The schema registry to use for registering schemas.                                                                                    | Yes      |
| `parser`                   | `AbstractParser`           | The parser to use for parsing schema files.                                                                                            | Yes      |
| `dependencyResolutionMode` | `DependencyResolutionMode` | The dependency resolution mode to use. Defaults to `IMPLICIT`. Set to `EXPLICIT` to enforce each file's inclusion in only one version. | No       |

## Registry Parameters

Below the parameters that can be passed to the `AbstractRegistry` constructor.

| Parameter           | Type                      | Description                                         | Required |
| ------------------- | ------------------------- | --------------------------------------------------- | -------- |
| `schemaRegistryUrl` | `string`                  | The URL of the schema registry.                     | Yes      |
| `headers`           | `Record<string, unknown>` | Additional headers to include in requests.          | No       |
| `body`              | `Record<string, unknown>` | Additional body parameters to include in requests.  | No       |
| `queryParams`       | `Record<string, unknown>` | Additional query parameters to include in requests. | No       |

### How It Works

1. **Organize Your Schemas:**

   - Place your files in versioned directories (e.g., v1, v2) and map them in `versions.json`.

2. **Run Schema Manager:**

   - Schema Manager parses .proto files to detect import and package statements. Dependencies are resolved using topological sorting to ensure schemas are registered in the correct order.

3. **Automated Registration:**
   - Once dependencies are resolved, Schema Manager registers the schemas with the schema registry in the correct order.

## Scenario Example

Consider a system managing a set of Protobuf schemas for an event-driven architecture. Each schema has multiple versions and dependencies.

**Note:** Multiple examples, including those mentioned here with different schema types (Protobuf, Avro, etc.), are located within the repository at `./examples`. These examples showcase various use cases and help demonstrate how Schema Manager resolves dependencies and registers schemas for different schema formats. You can explore these to better understand how to set up your own schema management workflow.

In this example, we have one topic "topic1" as well as a common namespace. Our topic contains multiple versions of schema files, with version mapping handled through versions.json files.

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
  │   ├── v1/
  │   │   └── data2.proto        # Schema for v1 data2 of topic2 (depends on ./common/v1/entity.proto)
  │   └── versions.json          # Version mapping for topic1 (v1 and v2)
  ├── common/
  │   ├── v1/
  │   │   └── entity.proto       # Schema for test entity
```

It is important to note that the schema manager handles implicit file import. This means that two different schemas will be published for model.proto (topic1/v1 and topic1/v2) and two different schemas will be published for entity.proto (topic1/v1 and topic2/v1) although they are the same file.

**Note:** You can force the file to be published only once by using the EXPLICIT mode, in this example this would raise an error because the model.proto and entity.proto files are imported twice.

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
  "v1": {
    "entity": "../common/v1/entity.proto"
  }
}
```

Schema Manager supports both standard version numbers (e.g., v1, v2) and custom version strings (e.g., v1.0, alpha, beta). This allows flexibility in version naming, while Schema Manager handles versioning and dependency resolution across topics and versions

**Note:** A single versions.json could have been used to manage all the topics in a centralized way. Additionally, Schema Manager supports multiple versions.json files within the same directory.

**Note2:** The schema name must be unique across a given version of a topic (this include all the dependencies referenced in the versions.json file for the version).

### Schema Registration Order:

1. **Step 1**: `entity.proto` in `topic1/v2` is registered because `data.proto` depends on it.
1. **Step 1**: `entity.proto` in `topic2/v1` is registered because `data2.proto` depends on it.
1. **Step 3**: `data.proto` in `topic1/v1` is registered because `model.proto` depends on it.
1. **Step 2**: `data.proto` from `topic1/v2`, is registered because `model.proto` depends on it.
1. **Step 5**: Once `data.proto` in `topic1/v1` is registered, `model.proto` from `topic1/v1` can be registered.
1. **Step 6**: Finally, `model.proto` from `topic1/v2`, which depends on `data.proto` from `v2`

### Usage Example

```typescript
import { ConfluentRegistry, Manager, ProtobufParser } from '@charlescol/schema-manager';
import * as path from 'path';

const baseDirectory = path.resolve(__dirname, '../schemas'); // Path to the directory containing your schemas

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
    'Content-Type': 'application/vnd.schemaregistry.v1+json', // Default value is application/json
  },
});

// create a manager and load all schemas
await new Manager({
  schemaRegistry: registry,
  parser: new ProtobufParser(),
}).loadAll(baseDirectory, subjectBuilder);

// Function to provide, used to build the subject for each schema file.
// This is an example implementation, you can customize it based on your own versioning and naming rules.
function subjectBuilder(fullVersionPath: string, filepath: string): string {
  // Extract topic and version
  const [topic, version] = fullVersionPath.split('/');
  // Extract the filename without extension
  const filename = filepath.split('/').pop()?.split('.')[0] || '';
  // Return the constructed subject
  return `${topic}.${filename}.${version}`;
}
```

The `subjectBuilder` function is responsible for generating the subject name for each schema that is registered in the schema registry. The subject is a unique identifier used by the registry to track schema versions and manage updates. The function takes two parameters:

- **version: `string`:** The path to the version directory with the version name {pathToVersion}/{versionName} (e.g., `topic1/v1`).
- **filepath: `string`:** This is the relative file path of the schema file (e.g., `example-schemas/v1/model.proto`).

The function above generates the following subject names for the topic1:

- `topic1/v1/data.proto` → `topic1.data.v1`
- `topic1/v1/model.proto` → `topic1.model.v1`
- `topic1/v2/data.proto` → `topic1.data.v2`
- `topic1/v2/model.proto` → `topic1.model.v2`
- `topic1/v2/entity.proto` → `topic1.entity.v2`

If the file above is saved as `publish-schemas.ts`, you can run it with the following command to compile and execute it:

```bash
tsc && node dist/publish-schemas.js
```

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
