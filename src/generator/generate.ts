import {AutomatonSettings, Openapi} from "@automatons/tools";
import {parser} from "@automatons/parser";
import fetchClient from "@automatons/typescript-client-fetch";
import {write} from "./render";
import {emitContext, emitHooks, emitHooksIndex, emitIndex} from "./hooks";

export const generate = async (openapi: Openapi, settings: AutomatonSettings): Promise<void> => {
  const {outDir} = settings;

  // 1. Emit the underlying fetch client (apis/, models/, config.ts, utils/, index.ts).
  await fetchClient(openapi, settings);

  // 2. Layer react-query hooks on top, reusing the just-generated client's types.
  const {models, apis} = await parser(openapi, settings);
  const tasks: Promise<void>[] = [];

  if (apis.length) {
    tasks.push(write(outDir, "hooks/index.ts", emitHooksIndex(apis)));
    tasks.push(write(outDir, "hooks/context.ts", emitContext(apis)));
    apis.forEach((api) => tasks.push(write(outDir, `hooks/${api.filename}.ts`, emitHooks(api))));
  }

  // 3. Overwrite the top-level index so it also re-exports the hooks layer.
  tasks.push(write(outDir, "index.ts", emitIndex(models.length > 0, apis.length > 0)));

  await Promise.all(tasks);
};
