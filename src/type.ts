import type { Worker } from 'jest-worker';
import type { MinifyOptions } from 'terser';

export interface Options extends MinifyOptions {
  nameCache?: Record<string, any>;
  maxWorkers?: number;
}

export interface WorkerContext {
  code: string;
  options: Options;
}

export type WorkerCallback = (err: Error | null, output?: WorkerOutput) => void;

export interface WorkerContextSerialized {
  code: string;
  options: string;
}

export interface WorkerOutput {
  code: string;
  nameCache?: Options['nameCache'];
  sourceMap?: Record<string, any>;
}

export type TerserWorker = Worker & {
  runWorker: (code: string, optionsString: string) => Promise<WorkerOutput>;
};
