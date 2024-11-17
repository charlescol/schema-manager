import * as path from 'path';
import { ProtobufTransformerConfig } from './transformer.types';
import AbstractTransformer from './abstract-transformer';

export default class ProtobufTransformer extends AbstractTransformer {
  private namespaceBuilder: (filepath: string) => string;
  constructor(config: ProtobufTransformerConfig) {
    super(config);
    if (!config.namespaceBuilder) {
      this.namespaceBuilder = (filepath: string) => filepath.replace(/\//g, '.');
    }
  }
  async transform(content: string, filePath: string): Promise<string> {
    /* Update import statements to use paths relative to `filePath` */
    const importRegex = /import\s+"([^"]+)";/g;
    let transformedContent = content.replace(importRegex, (_, importPath) => {
      const importedFileName = path.basename(importPath);
      const newImportPath = path.posix.join(filePath, `${importedFileName}`);
      return `import "${newImportPath}";`;
    });

    /* Update or insert the package statement based on `filePath` */
    const packageName = this.namespaceBuilder(filePath);
    const packageRegex = /^\s*package\s+[\w\.]+;/m;
    if (packageRegex.test(transformedContent)) {
      transformedContent = transformedContent.replace(packageRegex, `package ${packageName};`);
    } else {
      transformedContent = `package ${packageName};\n${transformedContent}`;
    }

    /* Remove package prefix from field type declarations */
    const fieldTypeRegex = /^(\s*(?:repeated|optional|required)?\s*)([\w\.]+)(\s+\w+\s*=\s*\d+;)/gm;
    transformedContent = transformedContent.replace(fieldTypeRegex, (_, p1, p2, p3) => {
      const typeName = p2.split('.').pop();
      return p1 + typeName + p3;
    });

    return transformedContent;
  }
}
