import { createHash, randomBytes } from "node:crypto";

export const RUNSIGNUP_AUTHORIZE_URL =
  "https://runsignup.com/Profile/OAuth2/RequestGrant";
export const RUNSIGNUP_TOKEN_URL =
  "https://api.runsignup.com/rest/v2/auth/auth-code-redemption.json";
export const RUNSIGNUP_REFRESH_URL =
  "https://api.runsignup.com/rest/v2/auth/refresh-token.json";
export const RUNSIGNUP_REGISTERED_RACES_URL =
  "https://api.runsignup.com/rest/user/registered-races?format=json";

export const OAUTH_STATE_COOKIE = "finish_line_rsu_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "finish_line_rsu_code_verifier";

export type RunSignupTokens = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  expires_at: number;
};

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generateState() {
  return base64UrlEncode(randomBytes(24));
}

export function generateCodeVerifier() {
  return base64UrlEncode(randomBytes(64));
}

export function generateCodeChallenge(verifier: string) {
  return base64UrlEncode(createHash("sha256").update(verifier).digest());
}

export function getRequiredEnv() {
  return {
    clientId: process.env.RUNSIGNUP_CLIENT_ID ?? "",
    clientSecretB64: process.env.RUNSIGNUP_CLIENT_SECRET_B64 ?? "",
    redirectUri: process.env.RUNSIGNUP_REDIRECT_URI ?? "",
  };
}

export function getMissingEnvVars() {
  const env = getRequiredEnv();
  return Object.entries({
    RUNSIGNUP_CLIENT_ID: env.clientId,
    RUNSIGNUP_CLIENT_SECRET_B64: env.clientSecretB64,
    RUNSIGNUP_REDIRECT_URI: env.redirectUri,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

export function buildAuthorizationUrl(state: string, codeChallenge: string) {
  const { clientId, redirectUri } = getRequiredEnv();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "rsu_api_read",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${RUNSIGNUP_AUTHORIZE_URL}?${params.toString()}`;
}

type TokenExchangeInput = {
  code: string;
  codeVerifier: string;
};

export async function exchangeCodeForTokens({
  code,
  codeVerifier,
}: TokenExchangeInput): Promise<RunSignupTokens> {
  const { clientId, clientSecretB64, redirectUri } = getRequiredEnv();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecretB64,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(RUNSIGNUP_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const text = await response.text();
  const payload = parseJsonSafely(text);

  if (!response.ok) {
    throw new Error(
      `Token exchange failed (${response.status}): ${stringifyPayload(payload, text)}`,
    );
  }

  return normalizeTokenPayload(payload);
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<RunSignupTokens> {
  const { clientId, clientSecretB64 } = getRequiredEnv();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecretB64,
  });

  const response = await fetch(RUNSIGNUP_REFRESH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const text = await response.text();
  const payload = parseJsonSafely(text);

  if (!response.ok) {
    throw new Error(
      `Token refresh failed (${response.status}): ${stringifyPayload(payload, text)}`,
    );
  }

  return normalizeTokenPayload(payload);
}

export async function fetchCurrentUser(accessToken: string): Promise<{
  user_id: number;
  first_name: string;
  last_name: string;
}> {
  const response = await fetch("https://api.runsignup.com/rest/user?format=json", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();
  const payload = parseJsonSafely(text) as { user?: { user_id?: number; first_name?: string; last_name?: string } };

  if (!response.ok) {
    throw new Error(`Fetch current user failed (${response.status}): ${stringifyPayload(payload, text)}`);
  }

  const user = payload?.user;
  if (!user?.user_id || !user?.first_name || !user?.last_name) {
    throw new Error(`Unexpected user payload shape: ${stringifyPayload(payload, text)}`);
  }

  return {
    user_id: user.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
  };
}

export async function fetchRegisteredRaces(accessToken: string) {
  const response = await fetch(RUNSIGNUP_REGISTERED_RACES_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();
  const payload = parseJsonSafely(text);

  if (!response.ok) {
    throw new Error(
      `Registered races request failed (${response.status}): ${stringifyPayload(payload, text)}`,
    );
  }

  return payload;
}

export async function fetchRaceDetails(raceId: string) {
  const response = await fetch(
    `https://api.runsignup.com/rest/race/${raceId}?format=json`,
    {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const text = await response.text();
  const payload = parseJsonSafely(text);

  if (!response.ok) {
    throw new Error(
      `Race details request failed (${response.status}): ${stringifyPayload(payload, text)}`,
    );
  }

  return payload;
}

export async function fetchEventResults(
  raceId: string,
  eventId: string,
  filters?: Record<string, string | number | undefined | null>,
) {
  const params = new URLSearchParams({
    event_id: eventId,
    format: "json",
  });

  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const response = await fetch(
    `https://api.runsignup.com/rest/race/${raceId}/results/get-results?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const text = await response.text();
  const payload = parseJsonSafely(text);

  if (!response.ok) {
    throw new Error(
      `Event results request failed (${response.status}): ${stringifyPayload(payload, text)}`,
    );
  }

  return payload;
}

export function isTokenExpired(tokens: RunSignupTokens) {
  return Date.now() >= tokens.expires_at - 60_000;
}

function normalizeTokenPayload(payload: unknown): RunSignupTokens {
  const tokenPayload = (payload ?? {}) as Partial<RunSignupTokens>;

  if (
    typeof tokenPayload.access_token !== "string" ||
    typeof tokenPayload.token_type !== "string" ||
    typeof tokenPayload.expires_in !== "number"
  ) {
    throw new Error(
      `Unexpected token payload shape: ${stringifyPayload(payload, String(payload))}`,
    );
  }

  return {
    access_token: tokenPayload.access_token,
    refresh_token: tokenPayload.refresh_token,
    token_type: tokenPayload.token_type,
    expires_in: tokenPayload.expires_in,
    scope: deriveScope(tokenPayload.access_token, tokenPayload.scope),
    expires_at: Date.now() + tokenPayload.expires_in * 1000,
  };
}

function deriveScope(accessToken: string, explicitScope: string | undefined) {
  if (explicitScope && explicitScope.trim()) {
    return explicitScope.trim();
  }

  try {
    const [, payloadPart] = accessToken.split(".");

    if (!payloadPart) {
      return undefined;
    }

    const json = Buffer.from(payloadPart, "base64url").toString("utf8");
    const payload = JSON.parse(json) as { scopes?: unknown };

    if (Array.isArray(payload.scopes)) {
      const scopes = payload.scopes.filter(
        (scope): scope is string => typeof scope === "string" && scope.trim().length > 0,
      );

      return scopes.length > 0 ? scopes.join(" ") : undefined;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function parseJsonSafely(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function stringifyPayload(payload: unknown, fallback: string) {
  if (typeof payload === "string") {
    return payload;
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return fallback;
  }
}
