import { ACCEPTED_EVENTS, TRUSTED_WORKFLOW_PATH } from "../shared/constants";
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
  const pathMarker = `/${TRUSTED_WORKFLOW_PATH}@`;
  const markerIndex = claims.job_workflow_ref.lastIndexOf(pathMarker);
  if (markerIndex <= 0) {
    return false;
  }

  const repository = claims.job_workflow_ref.slice(0, markerIndex);
  const workflowSha = claims.job_workflow_ref.slice(
    markerIndex + pathMarker.length,
  );
  const repositoryParts = repository.split("/");

  return (
    repositoryParts.length === 2 &&
    repositoryParts.every((part) => part.length > 0) &&
    /^[a-f0-9]{40}$/.test(workflowSha) &&
    workflowSha === claims.job_workflow_sha
  );
}

export function satisfiesRuntimePolicy(
  claims: Pick<GitHubClaims, "runner_environment" | "event_name">,
): boolean {
  return (
    claims.runner_environment === "github-hosted" &&
    ACCEPTED_EVENTS.has(claims.event_name)
  );
}
