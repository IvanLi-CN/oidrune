import type { AdminConfig, DeliveryEvent } from "./api";

export const demoConfig: AdminConfig = {
  destination: {
    displayName: "Release operations",
    maskedChatId: "********4421",
    updatedAt: "2026-08-29T06:15:00.000Z",
  },
  ownerIds: ["583231", "14153625"],
  repositoryIds: ["834921762"],
  trustedWorkflowShas: ["e4a3b53479023e3299b4af2767e3cdb1a87d0d52"],
};

export const demoEvents: DeliveryEvent[] = [
  {
    id: "evt_01J4A1R9JYGRW6F3SQPA",
    repository: "IvanLi-CN/oidrune",
    outcome: "success",
    event_name: "push",
    status: "delivered",
    received_at: "2026-08-29T06:14:22.000Z",
    delivered_at: "2026-08-29T06:14:24.000Z",
  },
  {
    id: "evt_01J4A0PCD3BFAQV5ZJHR",
    repository: "acme/payments",
    outcome: "failure",
    event_name: "workflow_dispatch",
    status: "dead_letter",
    received_at: "2026-08-29T05:31:14.000Z",
    delivered_at: null,
  },
  {
    id: "evt_01J49YZCXAV14T70R9T9",
    repository: "acme/docs",
    outcome: "success",
    event_name: "schedule",
    status: "accepted",
    received_at: "2026-08-29T05:03:55.000Z",
    delivered_at: null,
  },
];
