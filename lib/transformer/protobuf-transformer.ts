import * as path from 'path';
import AbtractTransformer from './abstract-transformer';

export default class ProtobufTransformer extends AbtractTransformer {
  async transform(content: string, filePath: string): Promise<string> {
    const importRegex = /import\s+"([^"]+)";/g;
    const transformedContent = content.replace(importRegex, (_, importPath) => {
      // Extract the filename without the path
      const importedFileName = path.basename(importPath);
      // Build the new import path
      const newImportPath = path.posix.join(filePath, `${importedFileName}`);

      return `import "${newImportPath}";`;
    });

    return transformedContent;
  }
}
