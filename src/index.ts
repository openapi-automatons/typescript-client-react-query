import {Automaton} from "@automatons/tools";
import {generate} from "./generator";

const generatorTypescriptReactQueryClient: Automaton = (openapi, settings) =>
  generate(openapi, settings);

export default generatorTypescriptReactQueryClient;
