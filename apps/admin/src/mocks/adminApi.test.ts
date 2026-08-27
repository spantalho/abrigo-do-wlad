import { beforeEach, describe, expect, test } from "vitest";

import { handleMockAdminRequest, resetMockAdminState } from "./adminApi";

function request(path: string, init?: RequestInit): Request {
  return new Request(`http://localhost${path}`, init);
}

describe("mock admin API", () => {
  beforeEach(() => resetMockAdminState());

  test("provides a local developer session", async () => {
    const response = await handleMockAdminRequest(request("/api/session"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      email: "desenvolvedor@localhost.test",
      role: "developer",
    });
  });

  test("keeps dog mutations in memory and updates dashboard metrics", async () => {
    const createResponse = await handleMockAdminRequest(request("/api/admin/dogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: "Nina",
        idade: "2 anos",
        cateIdade: "adulto",
        sexo: "Fêmea",
        temperamento: "Dócil",
        tags: ["Dócil"],
        status: "Vacinado e Castrado",
        fotos: [],
        cor: "caramelo",
      }),
    }));
    const created = await createResponse.json() as { id: number };

    expect(createResponse.status).toBe(201);
    const dogResponse = await handleMockAdminRequest(request(`/api/admin/dogs/${created.id}`));
    await expect(dogResponse.json()).resolves.toMatchObject({ id: created.id, nome: "Nina" });

    const dashboardResponse = await handleMockAdminRequest(request("/api/admin/dashboard"));
    const dashboard = await dashboardResponse.json() as { metrics: { dogs: number } };
    expect(dashboard.metrics.dogs).toBe(4);
  });

  test("updates an adoption status without external storage", async () => {
    const updateResponse = await handleMockAdminRequest(request(
      "/api/admin/adoptions/adoption-livia/status",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      },
    ));

    expect(updateResponse.status).toBe(200);
    const listResponse = await handleMockAdminRequest(request("/api/admin/adoptions"));
    const adoptions = await listResponse.json() as Array<{ id: string; status: string }>;
    expect(adoptions.find((item) => item.id === "adoption-livia")?.status).toBe("approved");
  });

  test("supports notification creation and deletion", async () => {
    const saveResponse = await handleMockAdminRequest(request("/api/admin/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Manutenção simulada", type: "urgent", expiration: "1h" }),
    }));
    const saved = await saveResponse.json() as { message: string; expiresAt: string | null };

    expect(saved.message).toBe("Manutenção simulada");
    expect(saved.expiresAt).not.toBeNull();

    const deleteResponse = await handleMockAdminRequest(request("/api/admin/notifications", {
      method: "DELETE",
    }));
    expect(deleteResponse.status).toBe(204);

    const getResponse = await handleMockAdminRequest(request("/api/admin/notifications"));
    await expect(getResponse.json()).resolves.toBeNull();
  });
});
