import { isObject } from 'smob';

import { minify } from 'terser';

import type { WorkerOutput } from './type';

// eslint-disable-next-line no-eval
const eval2 = eval;

export async function transform(code: string, options: any): Promise<WorkerOutput> {
  const result = await minify(code, options);
  const output: WorkerOutput = {
    code: result.code || code,
    nameCache: options.nameCache
  };

  if (typeof result.map === 'string') {
    output.sourceMap = JSON.parse(result.map);
  }

  if (isObject(result.map)) {
    output.sourceMap = result.map;
  }

  return output;
}

export async function runWorker(code: string, optionsString: string): Promise<WorkerOutput> {
  const options = eval2(`(${optionsString})`);
  return transform(code, options);
}
