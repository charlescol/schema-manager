import axios from 'axios';
import * as qs from 'qs';
import SchemaType from '../types';
import AbstractRegistry from './abstract-registry';
import { ConfluentRegistryReference } from './types';
import { DependenciesMap, NamespaceMap } from '../parser/types';

export default class ConfluentRegistry extends AbstractRegistry<ConfluentRegistryReference> {
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
      console.error(`Failed to register proto schema for subject ${subject}`, error);
      throw error;
    }
  }

  public buildReferences(
    filepath: string,
    dependenciesMap: DependenciesMap,
    namespaceMap: NamespaceMap,
    subjects: Map<string, string>,
  ): ConfluentRegistryReference[] {
    const dependencies = dependenciesMap.get(filepath);
    if (!dependencies) throw new Error(`Subject ${filepath} is not registered`);
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
}
