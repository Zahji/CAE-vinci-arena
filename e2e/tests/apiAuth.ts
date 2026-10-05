import { APIRequestContext } from '@playwright/test';

/**
 * Logs in via the API and returns the raw JWT (same shape as the SPA Authorization header).
 */
const loginAndGetToken = async (
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> => {
  const response = await request.post('/api/auths/login', {
    data: { email, password },
  });
  if (!response.ok()) {
    throw new Error(`Login failed ${response.status()}: ${await response.text()}`);
  }
  const body = (await response.json()) as { token: string };
  return body.token;
};

export { loginAndGetToken };
