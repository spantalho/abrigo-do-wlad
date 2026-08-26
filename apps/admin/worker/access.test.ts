import assert from "node:assert/strict";
import { test } from "vitest";

import {
  AccessAuthenticationError,
  authenticateAccessRequest,
  type AccessDependencies,
  type AccessEnv,
} from "./access";

const env: AccessEnv = {
  ADMIN_DEVELOPER_EMAILS: "developer-one@example.test,developer-two@example.test",
  ADMIN_ADMINISTRATOR_EMAILS: "administrator@example.test",
  CF_ACCESS_AUD: "test-audience",
  CF_ACCESS_TEAM_DOMAIN: "abrigo.cloudflareaccess.com",
};

function request(assertion?: string): Request {
  return new Request("https://admin.example.test/api/session", {
    headers: assertion ? { "Cf-Access-Jwt-Assertion": assertion } : {},
  });
}

test("Access identity maps both developer emails to developer", async () => {
  for (const email of [
    "developer-one@example.test",
    "developer-two@example.test",
  ]) {
    const dependencies: AccessDependencies = {
      async verifyJwt(token) {
        assert.equal(token, "signed-token");
        return { email: email.toUpperCase(), sub: `subject:${email}` };
      },
    };

    const identity = await authenticateAccessRequest(
      request("signed-token"),
      env,
      dependencies,
    );

    assert.equal(identity.email, email);
    assert.equal(identity.role, "developer");
  }
});

test("Access identity maps the shelter account to administrator", async () => {
  const dependencies: AccessDependencies = {
    async verifyJwt() {
      return { email: "administrator@example.test", sub: "shelter-subject" };
    },
  };

  const identity = await authenticateAccessRequest(
    request("signed-token"),
    env,
    dependencies,
  );

  assert.equal(identity.role, "administrator");
});

test("Access authentication rejects missing, invalid and unlisted identities", async () => {
  const unlistedIdentity: AccessDependencies = {
    async verifyJwt() {
      return { email: "unknown@example.com", sub: "unknown-subject" };
    },
  };
  const invalidToken: AccessDependencies = {
    async verifyJwt() {
      throw new Error("invalid signature");
    },
  };

  await assert.rejects(
    () => authenticateAccessRequest(request(), env),
    AccessAuthenticationError,
  );
  await assert.rejects(
    () => authenticateAccessRequest(request("invalid"), env, invalidToken),
    /assertion is invalid/,
  );
  await assert.rejects(
    () =>
      authenticateAccessRequest(
        request("signed-token"),
        env,
        unlistedIdentity,
      ),
    /identity is not authorized/,
  );
});

test("Access authorization fails closed when role bindings are absent", async () => {
  const dependencies: AccessDependencies = {
    async verifyJwt() {
      return { email: "developer-one@example.test", sub: "developer-subject" };
    },
  };

  await assert.rejects(
    () =>
      authenticateAccessRequest(
        request("signed-token"),
        { ...env, ADMIN_DEVELOPER_EMAILS: "" },
        dependencies,
      ),
    /ADMIN_DEVELOPER_EMAILS is not configured/,
  );
});
