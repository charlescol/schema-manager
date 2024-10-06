import { Reference } from '../utils/types';
import { RegistryConfig } from './types';
/**
 * Abstract class for schema registry operations.
 *
 * This class provides a foundation for different types of schema registries.
 */
export default abstract class AbstractRegistry {
  constructor(protected readonly config: RegistryConfig) {}

  public abstract registerSchema(subject: string, protobufSchema: string, references: Reference[]): Promise<object>;
}
