import { createRemoteJWKSet, jwtVerify } from "jose";
import type { GitHubClaims, OperatorIdentity } from "../domain/types";
import { GITHUB_OIDC_ISSUER, OIDRUNE_AUDIENCE } from "../shared/constants";
import type { Env } from "../worker/bindings";
import { HttpProblem } from "../worker/errors";

const githubJwks = createRemoteJWKSet(
  new URL("https://token.actions.githubusercontent.com/.well-known/jwks"),
);
const accessJwks = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function verifyGitHubOidc(
  token: string,
  env: Env,
): Promise<GitHubClaims> {
  try {
    const verified = await jwtVerify(token, githubJwks, {
      issuer: GITHUB_OIDC_ISSUER,
      audience: env.OIDC_AUDIENCE ?? OIDRUNE_AUDIENCE,
    });
    return {
      jti: requiredClaim(verified.payload, "jti"),
      exp: requiredNumberClaim(verified.payload, "exp"),
      repository_owner_id: requiredClaim(
        verified.payload,
        "repository_owner_id",
      ),
      repository_id: requiredClaim(verified.payload, "repository_id"),
      repository: requiredClaim(verified.payload, "repository"),
      runner_environment: requiredClaim(verified.payload, "runner_environment"),
      event_name: requiredClaim(verified.payload, "event_name"),
      job_workflow_ref: requiredClaim(verified.payload, "job_workflow_ref"),
      job_workflow_sha: requiredClaim(verified.payload, "job_workflow_sha"),
      run_id: optionalClaim(verified.payload, "run_id"),
    };
  } catch (error) {
    if (error instanceof HttpProblem) {
      throw error;
    }
    throw new HttpProblem(
      401,
      "invalid_oidc_token",
      "The GitHub OIDC token is invalid or expired.",
    );
  }
}

export async function verifyAccessIdentity(
  request: Request,
  env: Env,
): Promise<OperatorIdentity> {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || !env.ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN) {
    throw new HttpProblem(
      401,
      "access_identity_required",
      "Cloudflare Access identity is required.",
    );
  }
  const base = normalizeAccessDomain(env.ACCESS_TEAM_DOMAIN);
  const jwks =
    accessJwks.get(base) ??
    createRemoteJWKSet(new URL(`${base}/cdn-cgi/access/certs`));
  accessJwks.set(base, jwks);
  try {
    const verified = await jwtVerify(token, jwks, { audience: env.ACCESS_AUD });
    return {
      subject: requiredClaim(verified.payload, "sub"),
      email: optionalClaim(verified.payload, "email") ?? null,
    };
  } catch (error) {
    if (error instanceof HttpProblem) {
      throw error;
    }
    throw new HttpProblem(
      401,
      "invalid_access_identity",
      "Cloudflare Access identity is invalid or expired.",
    );
  }
}

function requiredClaim(payload: Record<string, unknown>, name: string): string {
  const value = payload[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpProblem(
      401,
      "invalid_oidc_claims",
      `Required claim ${name} is absent.`,
    );
  }
  return value;
}

function optionalClaim(
  payload: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = payload[name];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function requiredNumberClaim(
  payload: Record<string, unknown>,
  name: string,
): number {
  const value = payload[name];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpProblem(
      401,
      "invalid_oidc_claims",
      `Required claim ${name} is absent.`,
    );
  }
  return value;
}

function normalizeAccessDomain(domain: string): string {
  return domain.startsWith("https://")
    ? domain.replace(/\/$/, "")
    : `https://${domain.replace(/\/$/, "")}`;
}
