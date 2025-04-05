import AbstractParser from './abstract-parser';
import * as path from 'path';
import * as fs from 'fs';
import SchemaType from '../types';

export default class JsonParser extends AbstractParser {
  allowedExtensions: string[] = ['.json'];

  protected extractDependencies(filePath: string): string[] {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const schema = JSON.parse(content);
      return this.findReferences(schema);
    } catch (error) {
      console.error(`Error parsing JSON schema file: ${filePath}`);
      return [];
    }
  }

  protected extractName(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const schema = JSON.parse(content);

      // Try to get name from $id field first
      if (schema.$id) {
        const url = new URL(schema.$id);
        return url.hash ? url.hash.substring(1) : path.basename(url.pathname);
      }

      // Fall back to title if available
      if (schema.title) {
        return schema.title;
      }

      // Last resort: use filename
      return path.basename(filePath, '.json');
    } catch (error) {
      console.error(`Error extracting name from JSON schema file: ${filePath}`);
      return path.basename(filePath, '.json');
    }
  }

  private findReferences(obj: any): string[] {
    const refs = new Set<string>();

    const traverse = (value: any) => {
      if (!value || typeof value !== 'object') return;

      if (Array.isArray(value)) {
        value.forEach(traverse);
        return;
      }

      for (const [key, val] of Object.entries(value)) {
        if (key === '$ref' && typeof val === 'string') {
          // Handle both local and external references
          const ref = val.startsWith('#') ? '' : val;
          if (ref) {
            try {
              const url = new URL(ref);
              const filename = path.basename(url.pathname);
              if (filename) refs.add(filename);
            } catch {
              // If not a URL, treat as a local file reference
              const filename = path.basename(ref);
              if (filename) refs.add(filename);
            }
          }
        } else {
          traverse(val);
        }
      }
    };

    traverse(obj);
    return Array.from(refs);
  }
}
