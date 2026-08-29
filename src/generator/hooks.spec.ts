import {describe, expect, it} from "vitest";
import {Api} from "@automatons/parser";
import {emitHooks, emitContext} from "./hooks";

const api = {
  title: "PetsApi",
  filename: "petsApi",
  servers: [],
  imports: [],
  paths: [
    {name: "listPets", method: "get", path: "/pets", servers: []},
    {name: "createPet", method: "post", path: "/pets", servers: []},
  ],
} as unknown as Api;

describe("emitHooks", () => {
  it("emits a useQuery hook for GET operations", () => {
    const out = emitHooks(api);
    expect(out).toContain("export const useListPets");
    expect(out).toContain("useQuery({");
    expect(out).toContain('listPetsQueryKey(args)');
    expect(out).toContain('Parameters<PetsApi["listPets"]>');
  });

  it("emits a useQuery hook for Xquik searchTweets", () => {
    const xquikApi = {
      title: "XquikApi",
      filename: "xquikApi",
      servers: [],
      imports: [],
      paths: [
        {
          name: "searchTweets",
          method: "get",
          path: "/api/v1/x/tweets/search",
          servers: [],
        },
      ],
    } as unknown as Api;

    const out = emitHooks(xquikApi);
    expect(out).toContain("export const useSearchTweets");
    expect(out).toContain('searchTweetsQueryKey(args)');
    expect(out).toContain('Parameters<XquikApi["searchTweets"]>');
    expect(out).toContain("useQuery({");
  });

  it("emits a useMutation hook for non-GET operations", () => {
    const out = emitHooks(api);
    expect(out).toContain("export const useCreatePet");
    expect(out).toContain("useMutation({");
    expect(out).toContain("mutationFn:");
  });
});

describe("emitContext", () => {
  it("constructs every api client from one Config", () => {
    const out = emitContext([api]);
    expect(out).toContain("export const ApiProvider");
    expect(out).toContain("petsApi: new PetsApi(props.config)");
    expect(out).toContain("export const useApiClients");
  });
});
