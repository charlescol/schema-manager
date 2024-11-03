# How to Create a Schema Registry

This documentation provides an overview of the AbstractRegistry class and its usage for managing schema registrations in a schema registry service. The AbstractRegistry class is intended to be extended to create specific implementations for different schema registry services (e.g., Confluent Schema Registry). It helps handle the process of registering schemas, managing schema dependencies, and handling schema references.

## Overview of AbstractRegistry

The AbstractRegistry is an abstract class that defines methods for:

- **Registering a Schema:** Publishing a schema (e.g., Protobuf, Avro) to a schema registry, identified by a unique subject and with support for schema dependencies.
- **Building References:** Constructing references based on a schema’s dependencies and namespaces.

## Step-by-Step Guide to Creating a Registry

First, create a new registry class that extends the AbstractRegistry class. In this class, you will implement the methods registerSchema and buildReferences.

```typescript
export default class ConfluentRegistry extends AbstractRegistry<ConfluentRegistryReference>
```

When you define the class ConfluentRegistry as a subclass of AbstractRegistry using the generic type ConfluentRegistryReference, you are specifying that all references handled by this registry will conform to the structure defined by ConfluentRegistryReference. This ensures that the references processed by this class will contain all the required properties.

Based on the [Confluent documentation](https://docs.confluent.io/platform/current/schema-registry/fundamentals/serdes-develop/index.html#referenced-schemas), the reference object should contain the following properties:

```typescript
export type ConfluentRegistryReference = {
  name: string;
  subject: string;
  version: number;
};
```

### Implement the registerSchema Method

The registerSchema method must be implemented to handle the process of registering a schema to the schema registry. This typically involves making an HTTP request to the schema registry’s API. In the example below, we use axios to send the schema to the Confluent Schema Registry:

```typescript
async registerSchema(
subject: string,
schema: string,
references: ConfluentRegistryReference[],
schemaType: SchemaType,
): Promise<object> {
    try {
        const queryString = qs.stringify(this.config.queryParams, { addQueryPrefix: true });
        const url = `${this.config.schemaRegistryUrl}/subjects/${subject}/versions${queryString}`;

        const response = await axios.post(
        url,
        {
            schemaType,
            schema,
            references,
            ...this.config.body,
        },
        {
            headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
            },
        },
        );
        return response.data;
    } catch (error) {
        console.error(`Failed to register schema for subject ${subject}`, error);
        throw error;
    }
}
```

### Implement the buildReferences Method

The buildReferences method creates an array of references for the schema based on its dependencies. It looks up the dependencies and retrieves their namespaces from namespaceMap, then maps them to their corresponding subjects.

```typescript
  public buildReferences(
    dependencies: string[],
    namespaceMap: NamespaceMap,
    subjects: Map<string, string>,
  ): ConfluentRegistryReference[] {
    const references = [];
    for (const dependency of dependencies) {
      const name = namespaceMap.get(dependency);
      if (!name) throw new Error(`Subject ${dependency} is not registered`);
      references.push({
        name,
        subject: subjects.get(dependency)!,
        version: -1,
      });
    }
    return references;
  }
```

### Using the Registry

Once your custom registry class is implemented, you can use it to register schemas and build references for those schemas. Here’s an example of how you would use the ConfluentRegistry class:

```typescript
const registry = new ConfluentRegistry({
  schemaRegistryUrl: SCHEMA_REGISTRY_URL,
  // Below part is optional, used to override queries to the schema registry
  body: {
    compatibilityGroup: 'application.major.version',
  },
  queryParams: {
    normalize: true,
  },
  headers: {
    Accept: 'application/vnd.schemaregistry.v1+json',
  },
});
await new Manager(registry, new MyParser()).loadAll(...);
```
