export interface AdminConfig {
  destination: {
    displayName: string;
    maskedChatId: string;
    updatedAt: string;
  } | null;
  ownerIds: string[];
  repositoryIds: string[];
  trustedWorkflowShas: string[];
}

export interface DeliveryEvent {
  id: string;
  repository: string;
  outcome: string;
  event_name: string;
  status: "accepted" | "delivered" | "retrying" | "dead_letter";
  received_at: string;
  delivered_at: string | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(body?.message ?? "The console request failed.");
  }
  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>);
}

export const adminApi = {
  config: () => request<AdminConfig>("/api/admin/config"),
  events: () => request<{ events: DeliveryEvent[] }>("/api/admin/events"),
  setDestination: (chatId: string, displayName: string) =>
    request<void>("/api/admin/destination", {
      method: "PUT",
      body: JSON.stringify({ chatId, displayName, confirmation: true }),
    }),
  addOwner: (id: string) =>
    request<void>("/api/admin/sources/owners", {
      method: "POST",
      body: JSON.stringify({ id, confirmation: true }),
    }),
  removeOwner: (id: string) =>
    request<void>("/api/admin/sources/owners", {
      method: "DELETE",
      body: JSON.stringify({ id, confirmation: true }),
    }),
  addRepository: (id: string) =>
    request<void>("/api/admin/sources/repositories", {
      method: "POST",
      body: JSON.stringify({ id, confirmation: true }),
    }),
  removeRepository: (id: string) =>
    request<void>("/api/admin/sources/repositories", {
      method: "DELETE",
      body: JSON.stringify({ id, confirmation: true }),
    }),
  trustRelease: (sha: string) =>
    request<void>("/api/admin/workflow-releases", {
      method: "POST",
      body: JSON.stringify({ sha, confirmation: true }),
    }),
  revokeRelease: (sha: string) =>
    request<void>("/api/admin/workflow-releases", {
      method: "DELETE",
      body: JSON.stringify({ sha, confirmation: true }),
    }),
  retry: (eventId: string) =>
    request<void>(`/api/admin/events/${eventId}/retry`, {
      method: "POST",
      body: JSON.stringify({ confirmation: true }),
    }),
  sendTest: () =>
    request<void>("/api/admin/test-message", {
      method: "POST",
      body: JSON.stringify({ confirmation: true }),
    }),
};
