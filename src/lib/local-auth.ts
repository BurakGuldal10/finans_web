import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "finansman_auth";

const tokenPayload = "finansman-local-access";

export function isLocalAuthEnabled() {
  return Boolean(process.env.LOCAL_APP_PASSWORD);
}

export function createLocalAuthToken() {
  const password = process.env.LOCAL_APP_PASSWORD;
  if (!password) {
    return "";
  }

  return createHmac("sha256", password).update(tokenPayload).digest("hex");
}

export function verifyLocalAuthToken(token?: string) {
  if (!isLocalAuthEnabled()) {
    return true;
  }

  if (!token) {
    return false;
  }

  const expected = createLocalAuthToken();
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);

  return tokenBuffer.length === expectedBuffer.length && timingSafeEqual(tokenBuffer, expectedBuffer);
}

export function verifyLocalPassword(password: string) {
  return Boolean(process.env.LOCAL_APP_PASSWORD && password === process.env.LOCAL_APP_PASSWORD);
}
