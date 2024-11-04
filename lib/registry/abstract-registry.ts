import { DependenciesNameMap } from '../parser/types';
import SchemaType from '../types';

import { RegistryConfig } from './types';

export default abstract class AbstractRegistry<TRef> {
  constructor(protected readonly config: RegistryConfig) {}

  /**
   * Registers a schema with the schema registry.
   *
   * This method publishes a schema (e.g., Protobuf format) to the schema registry.
   * The schema is identified by a unique `subject`, and any dependencies (references) are provided via `references`.
   * The exact behavior of this method depends on the implementation in a specific registry.
   *
   * @param subject The unique identifier for the schema in the registry
   * @param schema The content of the schema as a string
   * @param references An array of references to other schemas that this schema depends on, typically containing the name, subject, and version of each referenced schema
   * @param schemaType The format of the schema being registered (e.g., 'PROTOBUF', 'AVRO').
   * @returns {*} Result of the schema registration (typically a response from the schema registry service)
   */
  public abstract registerSchema(
    subject: string,
    schema: string,
    references: TRef[],
    schemaType: SchemaType,
  ): Promise<object>;

  /**
   * Constructs an array of references for a schema based on its dependencies.
   *
   * This method builds an array of references to other schemas that the current schema depends on. The references
   * are typically constructed by looking up the schema's dependencies in `dependenciesMap`, retrieving their
   * namespaces from `namespaceMap`, and associating them with their corresponding subjects in the `subjects` map.
   *
   * @param dependencies Dependencies list for the current schema file
   * @param namespaceMap A map that associates each schema file with its namespace or identifier
   * @param subjects A map that contains the subject for each schema file
   * @returns {*} An array of references to other schemas that the current schema depends on
   */
  public abstract buildReferences(
    dependencies: string[],
    dependenciesNameMap: DependenciesNameMap,
    subjects: Map<string, string>,
  ): TRef[];
}
