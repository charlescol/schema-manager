# Schema Manager Overview

The Schema Manager is a tool designed to handle the registration of schemas within a schema registry service. It employs an **Orchestrator Pattern**, where the **Manager** class acts as the conductor, ensuring that schema dependencies are resolved, and schemas are registered in the correct sequence.

This document outlines the key components and flow of the schema registration process, as well as instructions for extending the system to support various schema types and registries.

---

## **Diagram**

Here’s a high-level flow of the schema build and registration process:

![Schema Manager Diagram](assets/overview-diagram.png)

The above diagram contains two stages: the **Build Stage** and the **Registration Stage**. These two methods are exposed by the manager class.

---

## **Flow of the Registration Process**

The registration process consists of four main steps, each handled by specific components of the Schema Manager:

1. **Versions Extractor**

   - **Responsibility**: Extracts version data from the `versions.json` files in a given directory.
   - **Note**: This component is **not designed to be extended**, as the process should remain consistent across all schema registries and schema types.

2. **Builder**

   - **Responsibility**: Create a build directory with the final version of the schemas used to register the schemas in the schema registry. It can also be used to generate code for the schemas.
   - **Note**: This component is **not designed to be extended**, as the process should remain consistent across all schema registries and schema types.

3. **Transformer**

   - **Responsibility**: Called by the builder for each file. It uses the version data and schema content to transform the schemas into the final version.Since a schema can be used in multiple versions and topics, some information needs to be dynamically resolved during the build process (eg namespace or the import path in protobuf).
   - **Extendable**: The transformer is designed to be customizable, allowing developers to implement support for different schema types.

   See: [How to Create a Transformer](create-transformer.md) for more details.

4. **Parser**

   - **Responsibility**: Reads schema files, extracts dependencies, and name.
   - **Extendable**: The parser is designed to be customizable, allowing developers to implement support for different schema types.

   See: [How to Create a Parser](create-parser.md) for more details.

5. **Sorting**

   - **Responsibility**: Builds a dependency graph and resolves dependencies using topological sorting to ensure schemas are registered in the correct order.
   - **Note**: This component is **not designed to be extended**, as the sorting process is universally applicable and doesn't require customization.

6. **Schemas Registry**

   - **Responsibility**: Handles the actual process of registering the schemas within the schema registry.
   - **Extendable**: Like the parser, the registry component is designed for extension, allowing developers to implement support for various schema registry services.

   See: [How to Create a Registry](create-registry.md) for more details.

---

## **Extensibility**

The **Parser**, **Transformer**, and **Schemas Registry** components are designed to be extended.

- To extend the transformer, follow the guide: [create-transformer.md](create-transformer.md)
- To extend the parser, follow the guide: [create-parser.md](create-parser.md)
- To extend the registry, follow the guide: [create-registry.md](create-registry.md)

---

## **Detailed Input Output\***

Consider a restricted but similar example as the one specified in the [Scenario Example](../README.md#scenario-example) section in the README.

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

### Versions Extraction Output

The versions extraction will return the following object:

```typescript
versionMap: Map(4) {
  'topic1/v1' => Map(2) {
    'data' => 'topic1/v1/data.proto',
    'model' => 'topic1/v1/model.proto'
  },
  'topic1/v2' => Map(3) {
    'data' => 'topic1/v2/data.proto',
    'model' => 'topic1/v1/model.proto',
    'entity' => 'common/v1/entity.proto'
  },
}
```

### Builder Output

The builder will return the following folder structure:

```bash
example-schemas/
  ├── topic1/
  │   ├── v1/
  │   │   ├── data.proto         # Schema for v1 data of topic1
  │   │   └── model.proto        # Schema for v1 model (depends on topic1/v1/data.proto)
  │   ├── v2/
  │   │   ├── data.proto         # Schema for v2 data (depends on ./v2/v1/entity.proto)
  │   │   ├── model.proto        # Schema for v1 model (depends on topic1/v1/data.proto)
  │   │   └── entity.proto       # Schema for v2 entity of topic1
```

### Parser Output

```typescript
dependenciesMap: Map(8) {
  'topic1/v1/data.proto' => [],
  'topic1/v1/model.proto' => [ 'topic1/v1/data.proto' ],
  'topic1/v2/data.proto' => [ 'topic1/v2/entity.proto' ],
  'topic1/v2/entity.proto' => [],
  'topic1/v2/model.proto' => [ 'topic1/v2/data.proto' ]
},
dependenciesNameMap: Map(8) {
  'topic1/v1/data.proto' => 'data.proto',
  'topic1/v1/model.proto' => 'model.proto',
  'topic1/v2/data.proto' => 'data.proto',
  'topic1/v2/entity.proto' => 'entity.proto',
  'topic1/v2/model.proto' => 'model.proto'
}
```

### Topological Sorting Output

The topological sorting will return the following array:

```typescript
[
  'topic1/v1/data.proto',
  'topic1/v2/entity.proto',
  'topic1/v1/model.proto',
  'topic1/v2/data.proto',
  'topic1/v2/model.proto',
];
```
