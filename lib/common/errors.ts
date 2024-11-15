export class ExplicitResolutionError extends Error {
  constructor(duplicateValues: string[]) {
    const message = `Dependency resolution mode is set to EXPLICIT, but there are duplicate values found: [${duplicateValues.join(
      ', ',
    )}].\nEnsure the versions.json file does not reference the same file multiple times.\n`;
    super(message);
    this.name = 'ExplicitResolutionError';
  }
}
export class UnsupportedConfigTypeError extends Error {
  constructor(configType: string) {
    super(`Unsupported config type: ${configType}`);
    this.name = 'UnsupportedConfigTypeError';
  }
}
