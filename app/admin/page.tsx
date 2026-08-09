"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ORDER_STATUSES, type OrderStatus } from "../lib/pricing";

/**
 * Shop back office. Everything here is behind the admin session cookie; the
 * route handlers re-check it on every request, so this component is only a
 * convenience layer and never the security boundary.
 */

type OrderItem = {
  id: number;
  productName: string;
  colour: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type Order = {
  id: number;
  reference: string;
  fullName: string;
  telephone: string;
  city: string;
  address: string;
  deliveryMethod: string;
  subtotal: number;
  deliveryFee: number;
  discountCode: string | null;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  note: string;
  createdAt: string;
  items: OrderItem[];
};

type InventoryRow = {
  id: number;
  productId: string;
  productName: string;
  colour: string;
  size: string;
  stock: number;
};

type Discount = {
  code: string;
  kind: string;
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  usedCount: number;
  active: number;
};

type Tab = "orders" | "stock" | "discounts";

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: init?.body
      ? { "content-type": "application/json", ...(init?.headers ?? {}) }
      : init?.headers,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status}).`);
  }
  return data;
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    api("/api/admin/session")
      .then((data) => {
        setSignedIn(Boolean(data?.signedIn));
        setConfigured(Boolean(data?.configured));
      })
      .catch(() => setSignedIn(false))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <AdminFrame><p className="admin-muted">Checking session…</p></AdminFrame>;
  }

  if (!signedIn) {
    return (
      <AdminFrame>
        <SignIn configured={configured} onSignedIn={() => setSignedIn(true)} />
      </AdminFrame>
    );
  }

  return <Dashboard onSignedOut={() => setSignedIn(false)} />;
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-wordmark">
          <span>SLOGAN</span>
          <span>TEE</span>
        </div>
        <p>Back office</p>
      </header>
      <div className="admin-body">{children}</div>
    </main>
  );
}

function SignIn({
  configured,
  onSignedIn,
}: {
  configured: boolean;
  onSignedIn: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/session", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      onSignedIn();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="admin-card">
        <h2>Admin password not set</h2>
        <p className="admin-muted">
          Add <code>ADMIN_PASSWORD</code> to <code>.dev.vars</code> for local
          development, or set it as a Worker secret in production, then reload
          this page.
        </p>
      </div>
    );
  }

  return (
    <form className="admin-card admin-signin" onSubmit={submit}>
      <h2>Sign in</h2>
      <label>
        <span>Admin password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function Dashboard({ onSignedOut }: { onSignedOut: () => void }) {
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [revenue, setRevenue] = useState(0);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Bumped to re-run the loader after an action that changes what a tab shows.
  const [revision, setRevision] = useState(0);

  const applyOrders = useCallback((data: {
    orders: Order[];
    counts: Record<string, number>;
    revenue: number;
  }) => {
    setOrders(data.orders);
    setCounts(data.counts);
    setRevenue(data.revenue);
  }, []);

  const ordersPath = statusFilter
    ? `/api/admin/orders?status=${statusFilter}`
    : "/api/admin/orders";

  // `cancelled` guards against a slow response for one tab landing after the
  // user has already switched to another.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (tab === "orders") {
          const data = await api(ordersPath);
          if (!cancelled) applyOrders(data);
        } else if (tab === "stock") {
          const data = await api("/api/admin/inventory");
          if (!cancelled) setInventory(data.inventory);
        } else if (tab === "discounts") {
          const data = await api("/api/admin/discounts");
          if (!cancelled) setDiscounts(data.discounts);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : "Could not load data.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, ordersPath, revision, applyOrders]);

  const reload = useCallback(() => setRevision((n) => n + 1), []);

  async function run(action: () => Promise<void>, message?: string) {
    setError("");
    setNotice("");
    try {
      await action();
      if (message) setNotice(message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    }
  }

  return (
    <AdminFrame>
      <div className="admin-toolbar">
        <nav className="admin-tabs">
          {(["orders", "stock", "discounts"] as Tab[]).map((value) => (
            <button
              type="button"
              key={value}
              className={tab === value ? "selected" : ""}
              onClick={() => {
                // A message about the previous tab's action is noise here.
                setNotice("");
                setError("");
                setTab(value);
              }}
            >
              {value}
            </button>
          ))}
        </nav>
        <div className="admin-toolbar-actions">
          <button
            type="button"
            onClick={() =>
              run(async () => {
                const result = await api("/api/admin/setup", {
                  method: "POST",
                  body: JSON.stringify({}),
                });
                reload();
                setNotice(
                  `Migrations: ${result.migrations.applied.length} applied. Inventory rows created: ${result.stock.created}.`,
                );
              })
            }
          >
            Run setup
          </button>
          <button
            type="button"
            onClick={() =>
              run(async () => {
                await api("/api/admin/session", { method: "DELETE" });
                onSignedOut();
              })
            }
          >
            Sign out
          </button>
        </div>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-notice" role="status">{notice}</p>}

      {tab === "orders" && (
        <Orders
          orders={orders}
          counts={counts}
          revenue={revenue}
          statusFilter={statusFilter}
          onFilter={setStatusFilter}
          onStatus={(orderId, status) =>
            run(async () => {
              await api("/api/admin/orders", {
                method: "PATCH",
                body: JSON.stringify({ orderId, status }),
              });
              reload();
            }, "Order updated.")
          }
        />
      )}

      {tab === "stock" && (
        <Stock
          rows={inventory}
          onSave={(row, stock) =>
            run(async () => {
              const data = await api("/api/admin/inventory", {
                method: "PATCH",
                body: JSON.stringify({
                  productId: row.productId,
                  colour: row.colour,
                  size: row.size,
                  stock,
                }),
              });
              setInventory(data.inventory);
            }, "Stock updated.")
          }
        />
      )}

      {tab === "discounts" && (
        <Discounts
          discounts={discounts}
          onSave={(body) =>
            run(async () => {
              const data = await api("/api/admin/discounts", {
                method: "POST",
                body: JSON.stringify(body),
              });
              setDiscounts(data.discounts);
            }, "Discount saved.")
          }
          onDelete={(code) =>
            run(async () => {
              const data = await api("/api/admin/discounts", {
                method: "DELETE",
                body: JSON.stringify({ code }),
              });
              setDiscounts(data.discounts);
            }, "Discount deleted.")
          }
        />
      )}
    </AdminFrame>
  );
}

function Orders({
  orders,
  counts,
  revenue,
  statusFilter,
  onFilter,
  onStatus,
}: {
  orders: Order[];
  counts: Record<string, number>;
  revenue: number;
  statusFilter: string;
  onFilter: (status: string) => void;
  onStatus: (orderId: number, status: OrderStatus) => void;
}) {
  const totalOrders = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <>
      <div className="admin-stats">
        <div><span>Orders</span><strong>{totalOrders}</strong></div>
        <div><span>New</span><strong>{counts.new ?? 0}</strong></div>
        <div><span>Delivered</span><strong>{counts.delivered ?? 0}</strong></div>
        <div><span>Confirmed revenue</span><strong>{revenue} MAD</strong></div>
      </div>

      <div className="admin-filters">
        <button
          type="button"
          className={statusFilter === "" ? "selected" : ""}
          onClick={() => onFilter("")}
        >
          All
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            type="button"
            key={status}
            className={statusFilter === status ? "selected" : ""}
            onClick={() => onFilter(status)}
          >
            {status} ({counts[status] ?? 0})
          </button>
        ))}
      </div>

      {!orders.length ? (
        <p className="admin-muted">No orders yet.</p>
      ) : (
        <div className="admin-orders">
          {orders.map((order) => (
            <article className="admin-order" key={order.id}>
              <div className="admin-order-head">
                <div>
                  <h3>{order.reference}</h3>
                  <p className="admin-muted">{order.createdAt} UTC</p>
                </div>
                <span className={`admin-badge status-${order.status}`}>
                  {order.status}
                </span>
              </div>

              <div className="admin-order-grid">
                <div>
                  <span>Customer</span>
                  <p>{order.fullName}</p>
                  <p>
                    <a href={`tel:${order.telephone.replace(/\s/g, "")}`}>
                      {order.telephone}
                    </a>
                  </p>
                </div>
                <div>
                  <span>Deliver to</span>
                  <p>{order.city}</p>
                  <p>{order.address}</p>
                  <p className="admin-muted">
                    {order.deliveryMethod === "agadir"
                      ? "Agadir local delivery"
                      : "Nationwide courier"}
                  </p>
                </div>
                <div>
                  <span>Items</span>
                  {order.items.map((item) => (
                    <p key={item.id}>
                      {item.quantity} × {item.productName} — {item.colour}, {item.size}
                      {" "}({item.lineTotal} MAD)
                    </p>
                  ))}
                </div>
                <div>
                  <span>Total</span>
                  <p>Subtotal {order.subtotal} MAD</p>
                  {order.discountCode && (
                    <p>
                      {order.discountCode} −{order.discountAmount} MAD
                    </p>
                  )}
                  <p>
                    Delivery{" "}
                    {order.deliveryFee === 0 ? "FREE" : `${order.deliveryFee} MAD`}
                  </p>
                  <p className="admin-total">{order.total} MAD to collect</p>
                </div>
              </div>

              <div className="admin-order-actions">
                {ORDER_STATUSES.map((status) => (
                  <button
                    type="button"
                    key={status}
                    disabled={order.status === status}
                    onClick={() => onStatus(order.id, status)}
                  >
                    {status}
                  </button>
                ))}
                <a
                  className="admin-whatsapp"
                  href={`https://wa.me/${order.telephone.replace(/[^\d]/g, "").replace(/^0/, "212")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function Stock({
  rows,
  onSave,
}: {
  rows: InventoryRow[];
  onSave: (row: InventoryRow, stock: number) => void;
}) {
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  if (!rows.length) {
    return (
      <p className="admin-muted">
        No inventory rows yet. Use “Run setup” to create one per variant.
      </p>
    );
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Colour</th>
          <th>Size</th>
          <th>Stock</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const draft = drafts[row.id] ?? String(row.stock);
          const dirty = draft !== String(row.stock);
          return (
            <tr key={row.id} className={row.stock === 0 ? "out-of-stock" : ""}>
              <td>{row.productName}</td>
              <td>{row.colour}</td>
              <td>{row.size}</td>
              <td>
                <input
                  type="number"
                  min={0}
                  value={draft}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [row.id]: event.target.value,
                    }))
                  }
                />
              </td>
              <td>
                <button
                  type="button"
                  disabled={!dirty}
                  onClick={() => onSave(row, Number(draft))}
                >
                  Save
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Discounts({
  discounts,
  onSave,
  onDelete,
}: {
  discounts: Discount[];
  onSave: (body: Record<string, unknown>) => void;
  onDelete: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  const [kind, setKind] = useState("percent");
  const [value, setValue] = useState("10");
  const [minSubtotal, setMinSubtotal] = useState("0");
  const [maxUses, setMaxUses] = useState("");

  return (
    <>
      <form
        className="admin-card admin-discount-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            code,
            kind,
            value: Number(value),
            minSubtotal: Number(minSubtotal),
            maxUses: maxUses ? Number(maxUses) : null,
          });
          setCode("");
        }}
      >
        <h2>Create or update a code</h2>
        <div className="admin-field-row">
          <label>
            <span>Code</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="OUTLOUD10"
              required
            />
          </label>
          <label>
            <span>Type</span>
            <select value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="percent">Percent off</option>
              <option value="fixed">MAD off</option>
            </select>
          </label>
          <label>
            <span>Value</span>
            <input
              type="number"
              min={1}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Min subtotal</span>
            <input
              type="number"
              min={0}
              value={minSubtotal}
              onChange={(event) => setMinSubtotal(event.target.value)}
            />
          </label>
          <label>
            <span>Max uses</span>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
              placeholder="unlimited"
            />
          </label>
        </div>
        <button type="submit">Save code</button>
      </form>

      {!discounts.length ? (
        <p className="admin-muted">No discount codes yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Min subtotal</th>
              <th>Used</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {discounts.map((discount) => (
              <tr key={discount.code}>
                <td>{discount.code}</td>
                <td>
                  {discount.kind === "percent"
                    ? `${discount.value}%`
                    : `${discount.value} MAD`}
                </td>
                <td>{discount.minSubtotal} MAD</td>
                <td>
                  {discount.usedCount}
                  {discount.maxUses ? ` / ${discount.maxUses}` : ""}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() =>
                      onSave({
                        code: discount.code,
                        kind: discount.kind,
                        value: discount.value,
                        minSubtotal: discount.minSubtotal,
                        maxUses: discount.maxUses,
                        active: discount.active ? false : true,
                      })
                    }
                  >
                    {discount.active ? "Active" : "Paused"}
                  </button>
                </td>
                <td>
                  <button type="button" onClick={() => onDelete(discount.code)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
