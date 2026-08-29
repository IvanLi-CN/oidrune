import {
  Bell,
  ChevronRight,
  CircleCheck,
  CloudCog,
  ExternalLink,
  History,
  KeyRound,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useReducer, useState } from "react";
import { createRoot } from "react-dom/client";
import { type AdminConfig, adminApi, type DeliveryEvent } from "./api";
import { demoConfig, demoEvents } from "./demo";
import "./styles.css";

type Section = "Overview" | "Sources" | "Destination" | "Releases" | "Delivery";
type Notice = { tone: "success" | "error"; text: string } | null;
type Confirmation = {
  title: string;
  detail: string;
  action: () => Promise<void>;
} | null;

interface ConsoleState {
  config: AdminConfig;
  events: DeliveryEvent[];
  loading: boolean;
  notice: Notice;
}

type ConsoleAction =
  | { type: "loaded"; config: AdminConfig; events: DeliveryEvent[] }
  | { type: "notice"; notice: Notice }
  | { type: "loading"; loading: boolean }
  | { type: "config"; config: AdminConfig }
  | { type: "events"; events: DeliveryEvent[] };

const initialState: ConsoleState = {
  config: demoConfig,
  events: demoEvents,
  loading: !__OIDRUNE_DEMO__,
  notice: null,
};

function reducer(state: ConsoleState, action: ConsoleAction): ConsoleState {
  switch (action.type) {
    case "loaded":
      return {
        ...state,
        config: action.config,
        events: action.events,
        loading: false,
      };
    case "notice":
      return { ...state, notice: action.notice };
    case "loading":
      return { ...state, loading: action.loading };
    case "config":
      return { ...state, config: action.config };
    case "events":
      return { ...state, events: action.events };
  }
}

const navigation: Array<{ label: Section; icon: typeof CloudCog }> = [
  { label: "Overview", icon: CloudCog },
  { label: "Sources", icon: ShieldCheck },
  { label: "Destination", icon: Send },
  { label: "Releases", icon: KeyRound },
  { label: "Delivery", icon: History },
];

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [section, setSection] = useState<Section>("Overview");
  const [confirmation, setConfirmation] = useState<Confirmation>(null);

  const refresh = useCallback(async () => {
    if (__OIDRUNE_DEMO__) {
      return;
    }
    dispatch({ type: "loading", loading: true });
    try {
      const [config, eventResponse] = await Promise.all([
        adminApi.config(),
        adminApi.events(),
      ]);
      dispatch({ type: "loaded", config, events: eventResponse.events });
    } catch (error) {
      dispatch({ type: "loading", loading: false });
      dispatch({
        type: "notice",
        notice: { tone: "error", text: message(error) },
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runConfirmed = async () => {
    if (!confirmation) {
      return;
    }
    const action = confirmation.action;
    setConfirmation(null);
    try {
      await action();
      dispatch({
        type: "notice",
        notice: { tone: "success", text: "The requested change was queued." },
      });
    } catch (error) {
      dispatch({
        type: "notice",
        notice: { tone: "error", text: message(error) },
      });
    }
  };

  const changeConfig = (config: AdminConfig) =>
    dispatch({ type: "config", config });
  const changeEvents = (events: DeliveryEvent[]) =>
    dispatch({ type: "events", events });

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to console content
      </a>
      <aside className="sidebar" aria-label="Console navigation">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            O
          </span>
          <span>Oidrune</span>
        </div>
        <nav className="nav-list">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              className={section === label ? "nav-item selected" : "nav-item"}
              key={label}
              onClick={() => setSection(label)}
              type="button"
            >
              <Icon aria-hidden="true" size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="presence" aria-hidden="true" />
          Access protected
        </div>
      </aside>
      <main id="main-content" className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">
              Operator console <ChevronRight aria-hidden="true" size={14} />{" "}
              {section}
            </p>
            <h1>{section}</h1>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Refresh console data"
            onClick={() => void refresh()}
            disabled={state.loading}
            title="Refresh data"
          >
            <RefreshCw
              aria-hidden="true"
              size={18}
              className={state.loading ? "spin" : ""}
            />
          </button>
        </header>
        {state.notice ? (
          <div className={`notice ${state.notice.tone}`} role="status">
            <span>{state.notice.text}</span>
            <button
              aria-label="Dismiss notification"
              type="button"
              onClick={() => dispatch({ type: "notice", notice: null })}
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        ) : null}
        {section === "Overview" ? (
          <Overview state={state} onConfirm={setConfirmation} />
        ) : null}
        {section === "Sources" ? (
          <Sources
            config={state.config}
            onConfig={changeConfig}
            onConfirm={setConfirmation}
          />
        ) : null}
        {section === "Destination" ? (
          <Destination
            config={state.config}
            onConfig={changeConfig}
            onConfirm={setConfirmation}
          />
        ) : null}
        {section === "Releases" ? (
          <Releases
            config={state.config}
            onConfig={changeConfig}
            onConfirm={setConfirmation}
          />
        ) : null}
        {section === "Delivery" ? (
          <Delivery
            events={state.events}
            onEvents={changeEvents}
            onConfirm={setConfirmation}
          />
        ) : null}
      </main>
      {confirmation ? (
        <ConfirmationDialog
          title={confirmation.title}
          detail={confirmation.detail}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void runConfirmed()}
        />
      ) : null}
    </div>
  );
}

function Overview({
  state,
  onConfirm,
}: {
  state: ConsoleState;
  onConfirm: (value: Confirmation) => void;
}) {
  const delivered = state.events.filter(
    (event) => event.status === "delivered",
  ).length;
  const deadLetters = state.events.filter(
    (event) => event.status === "dead_letter",
  ).length;
  return (
    <div className="content-stack">
      <section className="readiness-band" aria-label="Gateway readiness">
        <div>
          <span className="status-dot ready" aria-hidden="true" />
          <strong>Gateway policy is active</strong>
          <p>
            OIDC admission and asynchronous delivery are independently enforced.
          </p>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() =>
            onConfirm({
              title: "Send fixed test message",
              detail:
                "A fixed-format message will be queued for the configured Telegram destination.",
              action: async () => {
                if (!__OIDRUNE_DEMO__) await adminApi.sendTest();
              },
            })
          }
        >
          <Send aria-hidden="true" size={17} />
          Send test
        </button>
      </section>
      <section className="metrics" aria-label="Delivery summary">
        <Metric
          icon={ShieldCheck}
          label="Admitted sources"
          value={String(
            state.config.ownerIds.length + state.config.repositoryIds.length,
          )}
          detail="immutable owner and repository IDs"
        />
        <Metric
          icon={CircleCheck}
          label="Delivered today"
          value={String(delivered)}
          detail="after durable queue handoff"
          tone="green"
        />
        <Metric
          icon={Bell}
          label="Needs attention"
          value={String(deadLetters)}
          detail="dead letters awaiting retry"
          tone={deadLetters ? "amber" : "green"}
        />
      </section>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <h2>Recent delivery activity</h2>
            <p>
              Normalized records only. Credentials and raw requests are never
              stored.
            </p>
          </div>
          <button
            className="text-button"
            type="button"
            onClick={() =>
              onConfirm({
                title: "Open delivery queue",
                detail:
                  "Use the Delivery navigation item to inspect and retry dead letters.",
                action: async () => undefined,
              })
            }
          >
            View queue <ExternalLink aria-hidden="true" size={15} />
          </button>
        </div>
        <EventTable events={state.events.slice(0, 5)} />
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone = "blue",
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  detail: string;
  tone?: "blue" | "green" | "amber";
}) {
  return (
    <article className="metric">
      <div className={`metric-icon ${tone}`}>
        <Icon aria-hidden="true" size={19} />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function Sources({
  config,
  onConfig,
  onConfirm,
}: {
  config: AdminConfig;
  onConfig: (value: AdminConfig) => void;
  onConfirm: (value: Confirmation) => void;
}) {
  const [ownerId, setOwnerId] = useState("");
  const [repositoryId, setRepositoryId] = useState("");
  const addOwner = () =>
    onConfirm({
      title: "Add owner allowlist entry",
      detail: `Admit all repositories owned by immutable GitHub owner ID ${ownerId}.`,
      action: async () => {
        if (!__OIDRUNE_DEMO__) await adminApi.addOwner(ownerId);
        onConfig({ ...config, ownerIds: [...config.ownerIds, ownerId] });
      },
    });
  const addRepository = () =>
    onConfirm({
      title: "Add repository allowlist entry",
      detail: `Admit immutable GitHub repository ID ${repositoryId} independently of owner membership.`,
      action: async () => {
        if (!__OIDRUNE_DEMO__) await adminApi.addRepository(repositoryId);
        onConfig({
          ...config,
          repositoryIds: [...config.repositoryIds, repositoryId],
        });
      },
    });
  return (
    <div className="content-stack">
      <section className="section-intro">
        <h2>Source admission</h2>
        <p>
          A source is admitted when its immutable owner ID or immutable
          repository ID appears below. Names are never policy keys.
        </p>
      </section>
      <SourceList
        heading="Owner allowlist"
        description="Admits every repository belonging to an approved owner."
        value={ownerId}
        onValue={setOwnerId}
        values={config.ownerIds}
        onAdd={addOwner}
        onRemove={(id) =>
          onConfirm({
            title: "Remove owner allowlist entry",
            detail: `Future runs for owner ID ${id} will require a repository-level allowlist match.`,
            action: async () => {
              if (!__OIDRUNE_DEMO__) await adminApi.removeOwner(id);
              onConfig({
                ...config,
                ownerIds: config.ownerIds.filter((value) => value !== id),
              });
            },
          })
        }
      />
      <SourceList
        heading="Repository allowlist"
        description="Admits one repository regardless of its owner membership."
        value={repositoryId}
        onValue={setRepositoryId}
        values={config.repositoryIds}
        onAdd={addRepository}
        onRemove={(id) =>
          onConfirm({
            title: "Remove repository allowlist entry",
            detail: `Repository ID ${id} will no longer be independently admitted.`,
            action: async () => {
              if (!__OIDRUNE_DEMO__) await adminApi.removeRepository(id);
              onConfig({
                ...config,
                repositoryIds: config.repositoryIds.filter(
                  (value) => value !== id,
                ),
              });
            },
          })
        }
      />
    </div>
  );
}

function SourceList({
  heading,
  description,
  value,
  onValue,
  values,
  onAdd,
  onRemove,
}: {
  heading: string;
  description: string;
  value: string;
  onValue: (value: string) => void;
  values: string[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <h2>{heading}</h2>
          <p>{description}</p>
        </div>
        <span className="count-label">{values.length} active</span>
      </div>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (/^\d+$/.test(value)) onAdd();
        }}
      >
        <label>
          <span>GitHub numeric ID</span>
          <input
            value={value}
            onChange={(event) => onValue(event.target.value)}
            inputMode="numeric"
            pattern="[0-9]+"
            placeholder="e.g. 583231"
            required
          />
        </label>
        <button className="primary-button" type="submit">
          <Plus aria-hidden="true" size={17} />
          Add
        </button>
      </form>
      <ul className="policy-list">
        {values.map((id) => (
          <li key={id}>
            <code>{id}</code>
            <button
              className="row-action destructive"
              type="button"
              onClick={() => onRemove(id)}
              aria-label={`Remove ${id}`}
              title="Remove allowlist entry"
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Destination({
  config,
  onConfig,
  onConfirm,
}: {
  config: AdminConfig;
  onConfig: (value: AdminConfig) => void;
  onConfirm: (value: Confirmation) => void;
}) {
  const [chatId, setChatId] = useState("");
  const [displayName, setDisplayName] = useState(
    config.destination?.displayName ?? "",
  );
  return (
    <div className="content-stack">
      <section className="section-intro">
        <h2>Single Telegram destination</h2>
        <p>
          Every accepted event uses this operator-controlled destination.
          Callers cannot select or override it.
        </p>
      </section>
      <section className="section-block">
        <div className="destination-summary">
          <div className="metric-icon blue">
            <Send aria-hidden="true" size={19} />
          </div>
          <div>
            <p>Current destination</p>
            <h2>{config.destination?.displayName ?? "Not configured"}</h2>
            <code>
              {config.destination?.maskedChatId ?? "No chat ID stored"}
            </code>
          </div>
        </div>
        <form
          className="settings-form"
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm({
              title: "Update Telegram destination",
              detail:
                "Future events will use the new single destination after confirmation. Existing dead letters retain their stored destination.",
              action: async () => {
                if (!__OIDRUNE_DEMO__)
                  await adminApi.setDestination(chatId, displayName);
                onConfig({
                  ...config,
                  destination: {
                    displayName,
                    maskedChatId: mask(chatId),
                    updatedAt: new Date().toISOString(),
                  },
                });
              },
            });
          }}
        >
          <label>
            <span>Destination label</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Release operations"
              required
            />
          </label>
          <label>
            <span>Telegram chat ID</span>
            <input
              value={chatId}
              onChange={(event) => setChatId(event.target.value)}
              placeholder="-1001234567890"
              required
            />
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              <Settings2 aria-hidden="true" size={17} />
              Confirm update
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Releases({
  config,
  onConfig,
  onConfirm,
}: {
  config: AdminConfig;
  onConfig: (value: AdminConfig) => void;
  onConfirm: (value: Confirmation) => void;
}) {
  const [sha, setSha] = useState("");
  return (
    <div className="content-stack">
      <section className="section-intro">
        <h2>Trusted workflow releases</h2>
        <p>
          Only a full immutable SHA for Oidrune&apos;s reusable workflow can
          submit events.
        </p>
      </section>
      <section className="section-block">
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (/^[a-f0-9]{40}$/.test(sha))
              onConfirm({
                title: "Trust workflow release",
                detail:
                  "This full SHA will be eligible to submit notifications once its workflow ref also matches.",
                action: async () => {
                  if (!__OIDRUNE_DEMO__) await adminApi.trustRelease(sha);
                  onConfig({
                    ...config,
                    trustedWorkflowShas: [sha, ...config.trustedWorkflowShas],
                  });
                },
              });
          }}
        >
          <label>
            <span>Full commit SHA</span>
            <input
              value={sha}
              onChange={(event) => setSha(event.target.value)}
              placeholder="40 lowercase hexadecimal characters"
              pattern="[a-f0-9]{40}"
              required
            />
          </label>
          <button className="primary-button" type="submit">
            <Plus aria-hidden="true" size={17} />
            Trust release
          </button>
        </form>
        <ul className="release-list">
          {config.trustedWorkflowShas.map((releaseSha) => (
            <li key={releaseSha}>
              <div>
                <code>{releaseSha}</code>
                <span>Reusable notify workflow</span>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  onConfirm({
                    title: "Revoke trusted release",
                    detail:
                      "New handoffs using this SHA will be denied. Existing accepted events are unchanged.",
                    action: async () => {
                      if (!__OIDRUNE_DEMO__)
                        await adminApi.revokeRelease(releaseSha);
                      onConfig({
                        ...config,
                        trustedWorkflowShas: config.trustedWorkflowShas.filter(
                          (value) => value !== releaseSha,
                        ),
                      });
                    },
                  })
                }
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Delivery({
  events,
  onEvents,
  onConfirm,
}: {
  events: DeliveryEvent[];
  onEvents: (value: DeliveryEvent[]) => void;
  onConfirm: (value: Confirmation) => void;
}) {
  return (
    <div className="content-stack">
      <section className="section-intro">
        <h2>Delivery audit</h2>
        <p>
          Retries reuse the stored normalized event and original destination.
          Replacement text is never accepted.
        </p>
      </section>
      <section className="section-block">
        <EventTable
          events={events}
          onRetry={(event) =>
            onConfirm({
              title: "Retry dead letter",
              detail: `Re-enqueue ${event.id} using its stored normalized content and destination.`,
              action: async () => {
                if (!__OIDRUNE_DEMO__) await adminApi.retry(event.id);
                onEvents(
                  events.map((item) =>
                    item.id === event.id
                      ? { ...item, status: "accepted" }
                      : item,
                  ),
                );
              },
            })
          }
        />
      </section>
    </div>
  );
}

function EventTable({
  events,
  onRetry,
}: {
  events: DeliveryEvent[];
  onRetry?: (event: DeliveryEvent) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>Outcome</th>
            <th>Status</th>
            <th>Accepted</th>
            {onRetry ? (
              <th>
                <span className="sr-only">Action</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>
                <strong>{event.repository}</strong>
                <span>{event.event_name}</span>
              </td>
              <td>
                <span className={`outcome ${event.outcome}`}>
                  {event.outcome}
                </span>
              </td>
              <td>
                <Status status={event.status} />
              </td>
              <td>{formatDate(event.received_at)}</td>
              {onRetry ? (
                <td>
                  {event.status === "dead_letter" ? (
                    <button
                      className="row-action"
                      type="button"
                      onClick={() => onRetry(event)}
                      aria-label={`Retry ${event.id}`}
                      title="Retry dead letter"
                    >
                      <RefreshCw aria-hidden="true" size={16} />
                    </button>
                  ) : null}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Status({ status }: { status: DeliveryEvent["status"] }) {
  return <span className={`status ${status}`}>{status.replace("_", " ")}</span>;
}

function ConfirmationDialog({
  title,
  detail,
  onCancel,
  onConfirm,
}: {
  title: string;
  detail: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
      >
        <div className="dialog-icon">
          <Bell aria-hidden="true" size={20} />
        </div>
        <h2 id="confirmation-title">{title}</h2>
        <p>{detail}</p>
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </section>
    </div>
  );
}

function mask(value: string): string {
  return value.length <= 4
    ? "*".repeat(value.length)
    : `${"*".repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
}
function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
function message(error: unknown): string {
  return error instanceof Error ? error.message : "The console request failed.";
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
