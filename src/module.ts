/* eslint-disable no-console */
import { fileURLToPath, pathToFileURL } from 'url';

import type { NormalizedOutputOptions, RenderedChunk } from 'rollup';
import { hasOwnProperty, isObject, merge } from 'smob';

import { Worker } from 'jest-worker';
import serializeJavascript from 'serialize-javascript';

import type { Options, TerserWorker, WorkerOutput } from './type';
import { transform } from './worker';

export default function terser(input: Options = {}) {
  const { maxWorkers, ...options } = input;
  const useWorker = maxWorkers === undefined || maxWorkers > 0;
  let worker: TerserWorker | null | undefined;
  let numOfChunks = 0;

  const currentScriptURL =
    typeof __filename !== 'undefined' ? pathToFileURL(__filename) : import.meta.url;

  return {
    name: 'terser',

    async renderChunk(code: string, chunk: RenderedChunk, outputOptions: NormalizedOutputOptions) {
      if (!worker && useWorker) {
        worker = new Worker(fileURLToPath(currentScriptURL), {
          numWorkers: maxWorkers
        }) as TerserWorker;

        const stdout = worker.getStdout();
        const stderr = worker.getStderr();

        stdout.on('data', (data) => {
          console.log(`[Terser Worker stdout]: ${data}`);
        });

        stderr.on('data', (data) => {
          console.error(`[Terser Worker stderr]: ${data}`);
        });

        numOfChunks = 0;
      }
      numOfChunks += 1;

      const defaultOptions: Options = {
        sourceMap: outputOptions.sourcemap === true || typeof outputOptions.sourcemap === 'string'
      };

      if (outputOptions.format === 'es') {
        defaultOptions.module = true;
      }

      if (outputOptions.format === 'cjs') {
        defaultOptions.toplevel = true;
      }

      try {
        let output: WorkerOutput;
        const mergedOptions = merge({}, options || {}, defaultOptions);
        if (useWorker && worker) {
          output = await worker.runWorker(code, serializeJavascript(mergedOptions));
        } else {
          output = await transform(code, mergedOptions);
        }

        const {
          code: result,
          nameCache,
          sourceMap
        } = output;

        if (options.nameCache && nameCache) {
          let vars: Record<string, any> = {
            props: {}
          };

          if (hasOwnProperty(options.nameCache, 'vars') && isObject(options.nameCache.vars)) {
            vars = merge({}, options.nameCache.vars || {}, vars);
          }

          if (hasOwnProperty(nameCache, 'vars') && isObject(nameCache.vars)) {
            vars = merge({}, nameCache.vars, vars);
          }

          // eslint-disable-next-line no-param-reassign
          options.nameCache.vars = vars;

          let props: Record<string, any> = {};

          if (hasOwnProperty(options.nameCache, 'props') && isObject(options.nameCache.props)) {
            // eslint-disable-next-line prefer-destructuring
            props = options.nameCache.props;
          }

          if (hasOwnProperty(nameCache, 'props') && isObject(nameCache.props)) {
            props = merge({}, nameCache.props, props);
          }

          // eslint-disable-next-line no-param-reassign
          options.nameCache.props = props;
        }

        if ((!!defaultOptions.sourceMap || !!options.sourceMap) && isObject(sourceMap)) {
          return {
            code: result,
            map: sourceMap
          };
        }
        return result;
      } catch (e) {
        return Promise.reject(e);
      } finally {
        numOfChunks -= 1;
        if (numOfChunks === 0 && worker) {
          const { forceExited } = await worker.end();
          if (forceExited) {
            console.error('Workers failed to exit gracefully');
          }
          worker = null;
        }
      }
    }
  };
}
