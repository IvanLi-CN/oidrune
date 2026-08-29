import {
  ACCEPTED_EVENTS,
  TRUSTED_WORKFLOW_PATH,
  TRUSTED_WORKFLOW_REPOSITORY,
} from "../shared/constants";
import type { GitHubClaims } from "./types";

export interface SourcePolicy {
  ownerIds: ReadonlySet<string>;
  repositoryIds: ReadonlySet<string>;
}

export function admitsSource(
  policy: SourcePolicy,
  claims: Pick<GitHubClaims, "repository_owner_id" | "repository_id">,
): boolean {
  return (
    policy.ownerIds.has(claims.repository_owner_id) ||
    policy.repositoryIds.has(claims.repository_id)
  );
}

export function hasTrustedWorkflowReference(
  claims: Pick<GitHubClaims, "job_workflow_ref" | "job_workflow_sha">,
): boolean {
  const expectedReference = `${TRUSTED_WORKFLOW_REPOSITORY}/${TRUSTED_WORKFLOW_PATH}@${claims.job_workflow_sha}`;
  return claims.job_workflow_ref === expectedReference;
}

export function satisfiesRuntimePolicy(
  claims: Pick<GitHubClaims, "runner_environment" | "event_name">,
): boolean {
  return (
    claims.runner_environment === "github-hosted" &&
    ACCEPTED_EVENTS.has(claims.event_name)
  );
}
