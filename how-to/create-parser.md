# How to Create a Parser

This guide will walk you through the process of creating a parser for schema files by extending an abstract base class (AbstractParser). The goal of this parser is to read schema files, extract dependencies, and identify unique namespaces or identifiers within the files. This approach allows consistent and structured handling of various file types such as .proto, .json, .xml, etc.

## Goals of the Parser

- **Extract Dependencies:** Identify and extract any external resources, files, or schemas that the current file depends on.
- **Extract Namespace or Identifier:** Extract a unique identifier or namespace that gives context to the file’s contents.
- **Map File Dependencies and Namespaces:** Generate two mappings:
  • **Dependencies Map:** A mapping of each file to its list of resolved dependencies.
  • **Dependencies Name Map:** A mapping of each file to its fully qualified name, used as the reference name in the schema registry.

## Step-by-Step Guide to Creating a Parser

The first step is to create a new parser class that extends the AbstractParser class. This class will implement the logic for extracting dependencies and namespaces from files of a specific type.

```typescript
export default class ProtobufParser extends AbstractParser
```

### Define File Extensions

Define the file extensions that your parser will handle. For example, the Protobuf parser processes .proto files:

```typescript
protected extensions = ['.proto'];
```

### Define Schema Types

Specify the schema types that your parser supports. In this example, the parser supports Protobuf schemas:

```typescript
protected schemaTypes = [SchemaType.PROTOBUF];
```

### Extract Dependencies

This method should define how to extract dependencies from the file. It's worth noting that the result is case insensitive, meaning that the dependencies returned are compared to the names in the versions.json without considering letter casing differences. For Protobuf files, dependencies are found using import statements:

```typescript
protected extractDependencies(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const dependencies = lines
    .filter((line) => line.startsWith('import'))
    .map((line) => line.match(/"([^"]+)"/)?.[1]) // Extract the file path from the import statement
    .filter((name): name is string => Boolean(name))
    .map((name) => {
      const fileNameWithExtension = path.basename(name);
      return fileNameWithExtension.replace(/\.\w+$/, ''); // Remove the extension
    });
  return dependencies;
}
```

### Extract Name

This function derives a unique identifier for the file's schema, used as the reference name in the schema registry. For instance, in Protobuf, the name corresponds to the string specified in the `import` statement, while in Avro, it is the fully qualified name, including the namespace. Each name must be unique for the schema registry to manage file versions accurately.

```typescript
  protected extractName(filePath: string): string {
    return path.basename(filePath);
  }
```

**In Protobuf files, the import statement should reference only the file name and not the full file path.** This is because dependency resolution is managed within the versions.json file, which allows the schema manager to dynamically assign the correct versioned dependencies for each import.

The schema manager supports an implicit import mechanism, enabling the same file to be imported in multiple versions without conflict. This flexibility allows each version of a schema to maintain its own set of dependencies, even if those dependencies differ across versions.

For instance, if a file is used in multiple schema versions with different dependencies in each, the import must not rely on a static dependency path. Instead, each version will resolve dependencies according to its specific versions.json configuration.

### Using the Parser

You can now use the parser in your application as shown below:

```typescript
await new Manager({
        schemaRegistry: registry,
        parser: new ProtobufParser(),
      }).loadAll(...);
```

### Handling Multiple Schema Types

By default, the first schema type in the schemaTypes array is passed to the registry when working with files. However, if your parser supports multiple schema types (e.g., both Protobuf and Avro), you can override the getSchemaType method to implement custom logic based on the file type.

Here’s an example of how to override getSchemaType to differentiate between Protobuf and Avro:

```typescript
public override getSchemaType(filepath: string): SchemaType {
  if (filepath.endsWith('.avro')) {
    return SchemaType.AVRO;
  } else if (filepath.endsWith('.proto')) {
    return SchemaType.PROTOBUF;
  } else if (!this.schemaTypes.length) {
    throw new Error('No schema type specified, need to specify at least one schema type');
  }
  return this.schemaTypes[0]; // Default to the first schema type if no match is found
}
```
