export interface AdapterConfig {
  projectRoot: string;
  serverPackage: string;
}

export interface SetupResult {
  ide: string;
  filesCreated: string[];
  nextSteps: string[];
}

export interface BaseAdapter {
  readonly ideName: string;
  readonly detectionPaths: string[];
  setup(config: AdapterConfig): Promise<SetupResult>;
  detect(cwd: string): Promise<boolean>;
}
