import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";

import {
  DogFeedVersionError,
  getDogFeedPage,
} from "./dogService";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("getDogFeedPage sends pagination, filters and feed version to the API", async () => {
  const fetchMock = vi.fn<typeof fetch>(async () => Response.json({
    dogs: [],
    totalItems: 0,
    currentPage: 2,
    totalPages: 0,
    itemsPerPage: 6,
    version: "2026-08-24",
  }));
  vi.stubGlobal("fetch", fetchMock);

  const page = await getDogFeedPage(
    { cateIdade: "adulto", cor: "caramelo", tags: "docil" },
    2,
    6,
    "2026-08-24",
  );

  assert.equal(page.version, "2026-08-24");
  const requestUrl = String(fetchMock.mock.calls[0]?.[0]);
  assert.match(requestUrl, /^\/api\/dogs\?/);
  const params = new URL(requestUrl, "https://abrigo.test").searchParams;
  assert.equal(params.get("page"), "2");
  assert.equal(params.get("limit"), "6");
  assert.equal(params.get("cateIdade"), "adulto");
  assert.equal(params.get("cor"), "caramelo");
  assert.equal(params.get("tag"), "docil");
  assert.equal(params.get("version"), "2026-08-24");
});

test("getDogFeedPage identifies an expired feed version", async () => {
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => new Response(null, {
    status: 409,
  })));

  await assert.rejects(
    () => getDogFeedPage({}, 2, 6, "2026-08-20"),
    DogFeedVersionError,
  );
});
