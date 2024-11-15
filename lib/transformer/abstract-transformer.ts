export default abstract class AbtractTransformer {
  abstract transform(content: string, filePath: string): Promise<string>;
}
