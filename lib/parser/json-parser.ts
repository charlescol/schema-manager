import AbstractParser from './abstract-parser';
import * as path from 'path';
import * as fs from 'fs';

export default class JsonParser extends AbstractParser {
  allowedExtensions: string[] = ['.json'];

  protected extractDependencies(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Regex to extract all $ref
    const refRegex = /"\$ref"\s*:\s*"([^"]+)"/g;

    const dependencies = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = refRegex.exec(content)) !== null) {
      const ref = match[1]; // Le contenu de "$ref": "..."
      const filename = this.extractFilenameFromRef(ref);
      if (filename) {
        dependencies.add(`${filename.toLowerCase().split('.').pop() as string}.json`);
      }
    }
    return Array.from(dependencies);
  }

  protected extractName(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const schema = JSON.parse(content);
      if (schema['$id']) {
        return this.extractFilenameFromRef(schema['$id']);
      }
    } catch (error) {
      console.error(error);
    }
    throw Error(`Error extracting name from JSON schema file: ${filePath}`);
  }
  private extractFilenameFromRef(ref: string): string {
    const cleanedRef = ref.split('#')[0];
    const filename = path.basename(cleanedRef);
    return filename;
  }
}
