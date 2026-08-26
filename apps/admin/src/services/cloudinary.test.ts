import { afterEach, describe, expect, test, vi } from "vitest";

import {
  MAX_SOURCE_DOG_IMAGE_BYTES,
  uploadImageToCloudinary,
} from "./cloudinary";

function imageFile(): File {
  return new File(["image"], "dog.jpg", { type: "image/jpeg" });
}

describe("uploadImageToCloudinary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("preserves the error message returned by Cloudinary", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(
        { error: "Invalid image file" },
        { status: 400 },
      ));

    await expect(uploadImageToCloudinary(imageFile())).rejects.toThrow(
      "Invalid image file",
    );
  });

  test("falls back to a generic message when Cloudinary returns no detail", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({}, { status: 500 }));

    await expect(uploadImageToCloudinary(imageFile())).rejects.toThrow(
      "Erro no upload da imagem.",
    );
  });

  test("uploads through the same-origin admin API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ url: "https://res.cloudinary.com/test/image.jpg" }, { status: 201 }),
    );

    await expect(uploadImageToCloudinary(imageFile())).resolves.toBe(
      "https://res.cloudinary.com/test/image.jpg",
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/admin/media/upload");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      credentials: "same-origin",
      method: "POST",
    });
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBeInstanceOf(FormData);
  });

  test("accepts originals over 5 MB for server-side optimization", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ url: "https://res.cloudinary.com/test/optimized.jpg" }, { status: 201 }),
    );
    const original = new File(
      [new Uint8Array(6 * 1024 * 1024)],
      "large-dog.jpg",
      { type: "image/jpeg" },
    );

    await expect(uploadImageToCloudinary(original)).resolves.toContain("optimized.jpg");
  });

  test("rejects unsupported and oversized files before making a request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const unsupported = new File(["image"], "dog.gif", { type: "image/gif" });
    const oversized = new File(
      [new Uint8Array(MAX_SOURCE_DOG_IMAGE_BYTES + 1)],
      "dog.jpg",
      { type: "image/jpeg" },
    );

    await expect(uploadImageToCloudinary(unsupported)).rejects.toThrow(
      "JPEG, PNG ou WebP",
    );
    await expect(uploadImageToCloudinary(oversized)).rejects.toThrow("20 MB");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
