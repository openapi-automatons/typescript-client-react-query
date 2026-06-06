# @automatons/typescript-client-react-query
[![CI/CD](https://github.com/openapi-automatons/typescript-client-react-query/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/openapi-automatons/typescript-client-react-query/actions/workflows/ci-cd.yml)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm downloads](https://img.shields.io/npm/dw/@automatons/typescript-client-react-query)](https://www.npmjs.com/package/@automatons/typescript-client-react-query)

## What is @automatons/typescript-client-react-query
This is a generator that emits [TanStack Query](https://tanstack.com/query) (react-query) hooks
on top of a typed `fetch` client.
Only use openapi-automatons.

This package is **ESM-only** and requires **Node.js >= 22**.

It reuses [`@automatons/typescript-client-fetch`](https://github.com/openapi-automatons/typescript-client-fetch)
to emit the underlying client (`apis/`, `models/`, `config.ts`, `utils/`) into the same output directory,
then layers a `hooks/` directory containing:

- an `<ApiProvider>` + `useApiClients()` React context that constructs the api clients from a single `Config`,
- `useXxx` hooks (`useQuery` for `GET`/`HEAD`, `useMutation` for everything else),
- `xxxQueryKey(args)` query-key factories.

Hook arguments and data types are derived from the generated client via `Parameters<>` / `ReturnType<>`,
so there is no second source of truth to keep in sync.

`react` and `@tanstack/react-query` (and `object-to-formdata`, used by the fetch client's form bodies)
are peer dependencies.

## Generated hooks
```tsx
import { ApiProvider, useShowPetById, useCreatePet } from "./hooks";

const App = () => (
  <ApiProvider config={{ security: { bearerAuth: () => getToken() } }}>
    <Pet />
  </ApiProvider>
);

const Pet = () => {
  const { data } = useShowPetById(["1"]); // data: FetchResponse<Pet>
  const { mutate } = useCreatePet();
  // mutate([{ name: "Rex", status: "available" }])
  return null;
};
```

## How can I use @automatons/typescript-client-react-query?
This library is designed to be used by [openapi-automatons](https://github.com/openapi-automatons/openapi-automatons).
Please read the [readme](https://github.com/openapi-automatons/openapi-automatons/blob/main/README.md) of [openapi-automatons](https://github.com/openapi-automatons/openapi-automatons) for how to use it.
