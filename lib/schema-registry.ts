import { SchemaRegistryConfig } from './utils/types';
/**
 * Abstract class for schema registry operations.
 *
 * This class provides a foundation for different types of schema registries.
 */
export default abstract class AbstractSchemaRegistry {
  constructor(protected readonly config: SchemaRegistryConfig) {}
  public abstract loadAll(
    baseDirectory: string,
    subjectBuilder: (versions: string[], filepath: string) => string,
  ): Promise<void>;
}
