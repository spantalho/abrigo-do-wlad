import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

async function loadApi(mode: string, mockFlag: string) {
  vi.stubEnv("MODE", mode);
  vi.stubEnv("ADMIN_MOCK_MODE", mockFlag);
  return import("./api");
}

describe("admin API authentication boundary", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  test("uses the in-browser developer identity only when both mock gates are enabled", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const { ADMIN_MOCK_MODE, adminFetch } = await loadApi("mock", "true");
    const request = new Request("http://localhost/api/session");

    const response = await adminFetch(request);

    expect(ADMIN_MOCK_MODE).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      email: "desenvolvedor@localhost.test",
      role: "developer",
    });
  });

  test.each([
    { mode: "production", mockFlag: "true", label: "production mode" },
    { mode: "mock", mockFlag: "", label: "disabled mock flag" },
  ])("delegates to the authenticated backend with $label", async ({ mode, mockFlag }) => {
    const backendResponse = Response.json({ authenticated: true });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(backendResponse);
    const { ADMIN_MOCK_MODE, adminFetch } = await loadApi(mode, mockFlag);
    const request = new Request("http://localhost/api/session");

    await expect(adminFetch(request)).resolves.toBe(backendResponse);
    expect(ADMIN_MOCK_MODE).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(request, {});
  });
});
