export class ReplayGuard implements DurableObject {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (
      request.method !== "POST" ||
      (url.pathname !== "/reserve" && url.pathname !== "/release")
    ) {
      return new Response("Not found", { status: 404 });
    }
    const payload = await request.json<{ expiresAt?: number }>();
    const expiresAt = payload.expiresAt;
    if (typeof expiresAt !== "number" || expiresAt <= Date.now() / 1000) {
      return new Response("Invalid expiry", { status: 400 });
    }
    if (url.pathname === "/release") {
      await this.state.storage.delete("reservation");
      return new Response(null, { status: 204 });
    }
    const reserved = await this.state.storage.transaction(
      async (transaction) => {
        const existing = await transaction.get<number>("reservation");
        if (existing) {
          return false;
        }
        await transaction.put("reservation", expiresAt);
        await transaction.setAlarm(expiresAt * 1_000);
        return true;
      },
    );
    if (!reserved) {
      return new Response("Replay", { status: 409 });
    }
    return new Response(null, { status: 201 });
  }

  async alarm(): Promise<void> {
    await this.state.storage.delete("reservation");
  }
}

export async function reserveReplay(
  namespace: DurableObjectNamespace,
  jti: string,
  exp: number,
): Promise<void> {
  const id = namespace.idFromName(jti);
  const response = await namespace.get(id).fetch("https://replay/reserve", {
    method: "POST",
    body: JSON.stringify({ expiresAt: exp }),
    headers: { "content-type": "application/json" },
  });
  if (response.status === 409) {
    throw new Error("replay");
  }
  if (!response.ok) {
    throw new Error("replay guard unavailable");
  }
}

export async function releaseReplay(
  namespace: DurableObjectNamespace,
  jti: string,
  exp: number,
): Promise<void> {
  const id = namespace.idFromName(jti);
  await namespace.get(id).fetch("https://replay/release", {
    method: "POST",
    body: JSON.stringify({ expiresAt: exp }),
    headers: { "content-type": "application/json" },
  });
}
