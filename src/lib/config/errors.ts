export class ConfigurationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public validationErrors?: string[]
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ConfigurationNotFoundError extends ConfigurationError {
  constructor(configPath: string) {
    super(`Configuration file not found: ${configPath}`);
    this.name = 'ConfigurationNotFoundError';
  }
}

export class ConfigurationValidationError extends ConfigurationError {
  constructor(message: string, validationErrors: string[]) {
    super(message, undefined, validationErrors);
    this.name = 'ConfigurationValidationError';
  }
}
