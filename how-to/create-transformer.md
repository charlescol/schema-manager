# How to Create a Transformer

Before reading this section, it's recommended to read the [Overview](overview.md) section to understand the components of the Schema Manager.

This guide will walk you through the process of creating a transformer for schema files by extending an abstract base class (AbstractTransformer). The goal of this transformer is to apply transformation on the schema file during the build process.

## Goals of the Transformer

1. **Data Resolution:** Schema manager uses versions.json file to manage dependencies and avoid code redundancy. Consequently, a given schema can be imported in multiple versions and topics. Therefore some information needs to be dynamically resolved during the build process, such as the namespace or the import path. This is where transformers come in handy.
2. **Content Injection:** Some configuration can be injected into the schema during the build process. For example, in Protobuf and Java, options can be added to the schema to control future code generation.

## Step-by-Step Guide to Creating a Transformer

The first step is to create a new transformer class that extends the AbstractTransformer class. This class will implement the logic for transforming the schema file based on the configuration provided.

```typescript
export default class ProtobufTransformer extends AbstractTransformer
```

### Implement the constructor

The constructor method is used to initialize the transformer with the configuration. In this example, the namespaceBuilder function is used to generate the namespace name based on the file path. The transformer can be configured with additional parameters as needed.

```typescript
constructor(config: ProtobufTransformerConfig) {
    super(config);
    this.namespaceBuilder = config.namespaceBuilder || ((filepath: string) => filepath.replace(/\//g, '.'));
}
```

where `ProtobufTransformerConfig` is defined as follows:

```typescript
export type ProtobufTransformerConfig = TransformerConfig & {
  namespaceBuilder?: (filepath: string) => string;
};
```

### Implement the transform Method

The transform method is responsible for transforming the schema file based on the configuration provided. This method takes two parameters: the content of the schema file and the parameters object containing the file path and the names of its dependencies (extension included). It's worth noting that at this stage, we are within the build directory and the dependencies are all within the same folder of the file.

```typescript
async transform(content: string, param: TransformParameters): Promise<string> {
    /* Update import statements to use paths relative to `filePath` */
    const importRegex = /import\s+"([^"]+)";/g;
    let transformedContent = content.replace(importRegex, (match, importPath) => {
        const importedFileName = path.basename(importPath);
        if (param.keys.includes(importedFileName.split('.')[0].toLowerCase())) {
        const newImportPath = path.posix.join(param.filePath, `${importedFileName}`);
        return `import "${newImportPath}";`;
        }
        return match;
    });

    /* Update or insert the package statement based on `filePath` */
    const packageName = this.namespaceBuilder(param.filePath);
    const packageRegex = /^\s*package\s+[\w\.]+;/m;
    if (packageRegex.test(transformedContent)) {
        transformedContent = transformedContent.replace(packageRegex, `package ${packageName};`);
    } else {
        transformedContent = `package ${packageName};\n${transformedContent}`;
    }

    return transformedContent;
}
```

The above code snippet demonstrates how to update import statements and package statements based on the file path and the names of the dependencies. The namespaceBuilder function is used to generate the namespace name based on the file path.

The first part updates the import statements to use paths relative to the file path, for example, if the file path is `topic1/v1/entity.proto`, the import statement `import "data.proto";` will be updated to `import "topic1/v1/data.proto";` (because the file `data.proto` is located in the same folder as the current file). This part contains a conditional statement that checks if the imported file name is included in the list of keys because protobuf files can import external files (e.g., `import "google/protobuf/timestamp.proto";`).

The second part updates or inserts the package statement based on the file path. For example, if the file path is `topic1/v1/entity.proto`, the package statement will be updated to `package topic1.v1;` (if using the default namespaceBuilder function).

### Full class

Below is the full implementation for the ProtobufTransformer:

```typescript
import * as path from 'path';
import { ProtobufTransformerConfig, TransformParameters } from './transformer.types';
import AbstractTransformer from './abstract-transformer';

export default class ProtobufTransformer extends AbstractTransformer {
  private namespaceBuilder: (filepath: string) => string;
  constructor(config: ProtobufTransformerConfig) {
    super(config);
    this.namespaceBuilder = config.namespaceBuilder || ((filepath: string) => filepath.replace(/\//g, '.'));
  }
  async transform(content: string, param: TransformParameters): Promise<string> {
    /* Update import statements to use paths relative to `filePath` */
    const importRegex = /import\s+"([^"]+)";/g;
    let transformedContent = content.replace(importRegex, (match, importPath) => {
      const importedFileName = path.basename(importPath);
      if (param.keys.includes(importedFileName.split('.')[0].toLowerCase())) {
        const newImportPath = path.posix.join(param.filePath, `${importedFileName}`);
        return `import "${newImportPath}";`;
      }
      return match;
    });

    /* Update or insert the package statement based on `filePath` */
    const packageName = this.namespaceBuilder(param.filePath);
    const packageRegex = /^\s*package\s+[\w\.]+;/m;
    if (packageRegex.test(transformedContent)) {
      transformedContent = transformedContent.replace(packageRegex, `package ${packageName};`);
    } else {
      transformedContent = `package ${packageName};\n${transformedContent}`;
    }

    return transformedContent;
  }
}
```
