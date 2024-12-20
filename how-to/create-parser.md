# How to Create a Parser

Before reading this section, it's recommended to read the [Overview](overview.md) section to understand the components of the Schema Manager.

This guide will walk you through the process of creating a parser for schema files by extending an abstract base class (AbstractParser). The goal of this parser is to read schema files, extract dependencies, and identify unique namespaces or identifiers within the files. This approach allows consistent and structured handling of various file types such as .proto, .json, .xml, etc.

## Goals of the Parser

- **Extract Dependencies:** Identify and extract any external resources, files, or schemas that the current file depends on.
- **Extract Namespace or Identifier:** Extract a unique identifier for the file's schema, used as the reference name in the schema registry.

## Step-by-Step Guide to Creating a Parser

The first step is to create a new parser class that extends the AbstractParser class. This class will implement the logic for extracting dependencies and namespaces from files of a specific type.

```typescript
export default class ProtobufParser extends AbstractParser
```

### Define Allowed Extensions

Specify the extensions that your parser supports. In this example, the parser supports '.proto' files:

```typescript
protected allowedExtensions = ['.proto'];
```

### Extract Dependencies

This method should define how to extract dependencies from the file. A dependency name should not include the extension and must only consist of the file name
(without the file path). The result is case-insensitive.

```typescript
protected extractDependencies(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const dependencies = lines
    .filter((line) => line.startsWith('import'))
    .map((line) => line.match(/"([^"]+)"/)?.[1])
    .filter((name): name is string => Boolean(name))
    .map((name) => {
      return path.basename(name); // Extract the filename including extension
    });
  return dependencies;
}
```

The above function extracts dependencies from the file by searching for import statements in the file and extracting the file paths. For instance, in a Protobuf file, the import statement might look like `import "path/to/file.proto";`. The function then removes the path and returns the remaining part, which is `file.proto`.

### Extract Name

This function derives a unique identifier for the file's schema, used as the reference name in the schema registry (eg. field `name` in Confluent Schema Registry). For instance, in Protobuf, the name corresponds to the string specified in the `import` statement, while in Avro, it is the fully qualified name, including the namespace. Each name must be unique for the schema registry to manage file versions accurately.

```typescript
protected extractName(filePath: string): string {
  return path.basename(filePath);
}
```

### Full class

Below is the full implementation for the ProtobufParser:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import AbstractParser from './abstract-parser';

export default class ProtobufParser extends AbstractParser {
  protected allowedExtensions = ['.proto'];

  protected extractDependencies(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const dependencies = lines
      .filter((line) => line.startsWith('import'))
      .map((line) => line.match(/"([^"]+)"/)?.[1])
      .filter((name): name is string => Boolean(name))
      .map((name) => {
        return path.basename(name); // Extract the filename including extension
      });
    return dependencies;
  }

  protected extractName(filePath: string): string {
    return path.basename(filePath);
  }
}
```
