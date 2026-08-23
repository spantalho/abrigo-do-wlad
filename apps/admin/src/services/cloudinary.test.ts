import { afterEach, describe, expect, test, vi } from "vitest";

import { uploadImageToCloudinary } from "./cloudinary";

const signedUpload = {
  apiKey: "test-key",
  cloudName: "test-cloud",
  folder: "abrigo-do-wlad/dogs",
  signature: "test-signature",
  timestamp: 1_765_000_000,
};

function imageFile(): File {
  return new File(["image"], "dog.jpg", { type: "image/jpeg" });
}

describe("uploadImageToCloudinary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("preserves the error message returned by Cloudinary", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(signedUpload))
      .mockResolvedValueOnce(Response.json(
        { error: { message: "Invalid image file" } },
        { status: 400 },
      ));

    await expect(uploadImageToCloudinary(imageFile())).rejects.toThrow(
      "Invalid image file",
    );
  });

  test("falls back to a generic message when Cloudinary returns no detail", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(signedUpload))
      .mockResolvedValueOnce(Response.json({}, { status: 500 }));

    await expect(uploadImageToCloudinary(imageFile())).rejects.toThrow(
      "Erro no upload da imagem.",
    );
  });
});
