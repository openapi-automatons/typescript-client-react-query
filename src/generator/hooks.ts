import {Api} from "@automatons/parser";
import {ImportSpecifierStructure, OptionalKind, VariableDeclarationKind} from "ts-morph";
import {render} from "./render";

/** GET/HEAD become `useQuery`; everything else becomes `useMutation`. */
const isQuery = (method: string): boolean => method === "get" || method === "head";

/** camelCase operation name -> PascalCase hook suffix. */
const pascalCase = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1);

/**
 * Emit hooks/<api>.ts: per-operation react-query hooks plus query-key factories.
 * Argument and data types are derived from the generated client method via
 * `Parameters<>` / `ReturnType<>`, so there is no second source of truth.
 */
export const emitHooks = (api: Api): string =>
  render((sf) => {
    const hasQuery = api.paths.some((path) => isQuery(path.method));
    const hasMutation = api.paths.some((path) => !isQuery(path.method));

    const reactQueryImports: OptionalKind<ImportSpecifierStructure>[] = [];
    if (hasQuery) reactQueryImports.push({name: "useQuery"}, {name: "UseQueryOptions", isTypeOnly: true});
    if (hasMutation) reactQueryImports.push({name: "useMutation"}, {name: "UseMutationOptions", isTypeOnly: true});
    sf.addImportDeclaration({namedImports: reactQueryImports, moduleSpecifier: "@tanstack/react-query"});

    sf.addImportDeclaration({isTypeOnly: true, namedImports: [api.title], moduleSpecifier: "../apis"});
    sf.addImportDeclaration({namedImports: ["useApiClients"], moduleSpecifier: "./context"});

    api.paths.forEach((path) => {
      const suffix = pascalCase(path.name);
      const argsType = `${suffix}Args`;
      const dataType = `${suffix}Data`;

      sf.addTypeAlias({name: argsType, type: `Parameters<${api.title}["${path.name}"]>`});
      sf.addTypeAlias({name: dataType, type: `Awaited<ReturnType<${api.title}["${path.name}"]>>`});

      if (isQuery(path.method)) {
        sf.addVariableStatement({
          isExported: true,
          declarationKind: VariableDeclarationKind.Const,
          declarations: [
            {
              name: `${path.name}QueryKey`,
              initializer: `(args: ${argsType}) => ["${api.filename}", "${path.name}", ...args]`,
            },
          ],
        });
        sf.addVariableStatement({
          isExported: true,
          declarationKind: VariableDeclarationKind.Const,
          declarations: [
            {
              name: `use${suffix}`,
              initializer: `(args: ${argsType}, options?: Omit<UseQueryOptions<${dataType}>, "queryKey" | "queryFn">) => {
  const { ${api.filename} } = useApiClients();
  return useQuery({ queryKey: ${path.name}QueryKey(args), queryFn: () => ${api.filename}.${path.name}(...args), ...options });
}`,
            },
          ],
        });
      } else {
        sf.addVariableStatement({
          isExported: true,
          declarationKind: VariableDeclarationKind.Const,
          declarations: [
            {
              name: `use${suffix}`,
              initializer: `(options?: Omit<UseMutationOptions<${dataType}, Error, ${argsType}>, "mutationFn">) => {
  const { ${api.filename} } = useApiClients();
  return useMutation({ mutationFn: (args: ${argsType}) => ${api.filename}.${path.name}(...args), ...options });
}`,
            },
          ],
        });
      }
    });
  });

/**
 * Emit hooks/context.ts: the ApiProvider React context that builds every api client from one Config.
 */
export const emitContext = (apis: Api[]): string =>
  render((sf) => {
    sf.addImportDeclaration({
      namedImports: [
        {name: "createContext"},
        {name: "createElement"},
        {name: "useContext"},
        {name: "useMemo"},
        {name: "ReactNode", isTypeOnly: true},
      ],
      moduleSpecifier: "react",
    });
    sf.addImportDeclaration({namedImports: apis.map((api) => api.title), moduleSpecifier: "../apis"});
    sf.addImportDeclaration({isTypeOnly: true, namedImports: ["Config"], moduleSpecifier: "../config"});

    sf.addTypeAlias({
      isExported: true,
      name: "ApiClients",
      type: `{\n${apis.map((api) => `${api.filename}: ${api.title};`).join("\n")}\n}`,
    });

    sf.addStatements(["const ApiContext = createContext<ApiClients | null>(null);"]);

    sf.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: "ApiProvider",
          initializer: `(props: { config?: Config; children: ReactNode }) => {
  const clients = useMemo<ApiClients>(() => ({ ${apis
    .map((api) => `${api.filename}: new ${api.title}(props.config)`)
    .join(", ")} }), [props.config]);
  return createElement(ApiContext.Provider, { value: clients }, props.children);
}`,
        },
      ],
    });

    sf.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: "useApiClients",
          initializer: `(): ApiClients => {
  const clients = useContext(ApiContext);
  if (!clients) {
    throw new Error("useApiClients must be used within an <ApiProvider>.");
  }
  return clients;
}`,
        },
      ],
    });
  });

/**
 * Emit hooks/index.ts re-exporting the context and every api's hooks.
 */
export const emitHooksIndex = (apis: Api[]): string =>
  render((sf) => {
    sf.addExportDeclaration({moduleSpecifier: "./context"});
    apis.forEach((api) => sf.addExportDeclaration({moduleSpecifier: `./${api.filename}`}));
  });

/**
 * Emit the top-level index.ts re-exporting the client plus the hooks layer.
 */
export const emitIndex = (hasModels: boolean, hasApis: boolean): string =>
  render((sf) => {
    if (hasModels) sf.addExportDeclaration({moduleSpecifier: "./models"});
    if (hasApis) sf.addExportDeclaration({moduleSpecifier: "./apis"});
    sf.addExportDeclaration({moduleSpecifier: "./config"});
    if (hasApis) sf.addExportDeclaration({moduleSpecifier: "./hooks"});
  });
