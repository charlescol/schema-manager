import { TransformerConfig } from './transformer.types';

export default abstract class AbstractTransformer {
  constructor(protected readonly config: TransformerConfig = {}) {}
  abstract transform(content: string, filePath: string): Promise<string>;
}
