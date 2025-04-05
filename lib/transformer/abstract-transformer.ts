import { TransformerConfig, TransformParameters } from './transformer.types';

export default abstract class AbstractTransformer {
  constructor(protected readonly config: TransformerConfig = {}) {}
  /**
   * The transform method is responsible for transforming the schema file based on the configuration provided.
   *
   * @param   {string}                       content  The content of the schema file
   * @param   {TransformParameters<string>}  param    Object containing the file path and the names of its dependencies (extension included)
   * @return  {Promise<string>}                       The transformed content of the schema file
   */
  abstract transform(content: string, param: TransformParameters): Promise<string>;
}
