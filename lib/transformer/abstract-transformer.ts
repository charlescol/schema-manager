import { TransformerConfig, TransformParameters } from './transformer.types';

export default abstract class AbstractTransformer {
  constructor(protected readonly config: TransformerConfig = {}) {}
  abstract transform(content: string, param: TransformParameters): Promise<string>;
}
