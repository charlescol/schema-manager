import axios from 'axios';
import { SchemaType } from '../types';
import { Reference } from '../utils/types';
import AbstractRegistry from './abstract-registry';

export default class ConfluentRegistry extends AbstractRegistry {
  async registerSchema(subject: string, protobufSchema: string, references: Reference[]): Promise<object> {
    try {
      const response = await axios.post(
        `${this.config.schemaRegistryUrl}/subjects/${subject}/versions`,
        {
          schemaType: SchemaType.PROTOBUF,
          schema: protobufSchema,
          references,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to register proto schema for subject ${subject}`, error);
      throw error;
    }
  }
}
