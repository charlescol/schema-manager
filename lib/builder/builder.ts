import * as fs from 'fs/promises';
import * as path from 'path';
import { VersionMap } from '../versions-extractor/types';
import ProtobufTransformer from '../transformer/protobuf-transformer';
import AbtractTransformer from '../transformer/abstract-transformer';

export default class Builder {
  constructor(protected readonly transformer: AbtractTransformer) {}
  async build(schemasPath: string, versionMap: VersionMap, buildDir = DEFAULT_BUILD_DIR): Promise<void> {
    // Remove the build directory if it already exists
    if (await fs.stat(buildDir).catch(() => false)) {
      await fs.rm(buildDir, { recursive: true, force: true });
    }
    // Recreate the build directory
    await fs.mkdir(buildDir, { recursive: true });
    for (const [folderKey, filesMap] of versionMap) {
      const folderPath = path.join(buildDir, folderKey);

      // Create the folder for the current key
      await fs.mkdir(folderPath, { recursive: true });

      for (const [fileKey, fileRelativePath] of filesMap) {
        const fileExtension = path.extname(fileRelativePath);
        const fileName = fileKey + fileExtension;
        const sourceFilePath = path.join(schemasPath, fileRelativePath);
        const destinationFilePath = path.join(folderPath, fileName);

        // Get the directory of the current file relative to the build directory
        const currentDir = path.dirname(destinationFilePath);
        const relativeDir = path.relative(buildDir, currentDir).replace(/\\/g, '/'); // Normalize path separators

        // Read the content from the source file
        const content = await fs.readFile(sourceFilePath, 'utf-8');
        const transformedContent = await this.transformer.transform(content, relativeDir);

        // Write the content to the destination file
        await fs.writeFile(destinationFilePath, transformedContent);
      }
    }
  }
}
