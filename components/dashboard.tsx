"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Children, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Boxes, ChartNoAxesCombined, CircleHelp,
  ClipboardList, Layers3, LogOut, Package, RefreshCw, Search, ShoppingBag, Users,
} from "lucide-react";
import {
  apiRequest, ApiError, CategoryRecord, OrderRecord, ProductRecord, UserRecord,
  clearSession,
} from "@/lib/api";
import useAuthGuard from "@/hooks/useAuthGuard";
import { showAlert, showToast } from "@/lib/alerts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DataSet = {
  users: UserRecord[];
  categories: CategoryRecord[];
  products: ProductRecord[];
  orders: OrderRecord[];
};

type Tab = "overview" | "orders" | "products" | "categories" | "users";

const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: ChartNoAxesCombined },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Layers3 },
  { id: "users", label: "Users", icon: Users },
];

const emptyData: DataSet = { users: [], categories: [], products: [], orders: [] };

function money(value: number | string) {
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dateLabel(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Dashboard() {
  const router = useRouter();
  const { session, isChecking } = useAuthGuard();
  const [data, setData] = useState<DataSet>(emptyData);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [users, categories, products, orders] = await Promise.all([
        apiRequest<UserRecord[]>("/users"),
        apiRequest<CategoryRecord[]>("/categories"),
        apiRequest<ProductRecord[]>("/products"),
        apiRequest<OrderRecord[]>("/orders"),
      ]);
      setData({ users, categories, products, orders });
      setError("");
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        clearSession();
        await showAlert("warning", "Session expired", "Please sign in again to continue.");
        router.replace("/login");
        return;
      }
      setError(requestError instanceof Error ? requestError.message : "Could not load your workspace.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isChecking) return;
    void Promise.resolve().then(loadData);
  }, [isChecking, loadData]);

  async function handleLogout() {
    if (!session) return;
    setLogoutDialogOpen(false);
    setLoggingOut(true);
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ userId: session.user.id }),
      });
      clearSession();
      void showToast("success", "Signed out");
      router.replace("/login");
    } catch (requestError) {
      void showAlert(
        "error",
        "Could not sign out",
        requestError instanceof Error ? requestError.message : "Please try again.",
      );
      setLoggingOut(false);
    }
  }

  if (isChecking) {
    return <main className="route-loading" aria-live="polite">Checking your session...</main>;
  }

  const totalRevenue = data.orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const latestOrders = [...data.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <Link href="/" className="brand sidebar-brand"><span className="brand-mark"><Boxes size={20} strokeWidth={2.5} /></span><span>Tabletop</span></Link>
        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-picker"><span className="workspace-avatar">T</span><span><strong>My workspace</strong><small>Starter plan</small></span><span className="picker-dots">···</span></div>
        <nav className="side-nav" aria-label="Dashboard navigation">
          <span className="nav-caption">MENU</span>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button type="button" className={`side-nav-link ${activeTab === id ? "active" : ""}`} key={id} onClick={() => setActiveTab(id)}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span>{id !== "overview" && <span className="nav-count">{data[id]?.length ?? 0}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon"><CircleHelp size={18} /></span><strong>Need a hand?</strong><p>We’re here to help you get things in order.</p><span className="help-arrow">Explore help <ArrowUpRight size={14} /></span></div>
          <div className="sidebar-user">
            <span className="user-avatar">{session?.user.username.slice(0, 1).toUpperCase() ?? "U"}</span>
            <span className="user-meta"><strong>{session?.user.username ?? "Your account"}</strong><small>{session?.user.role ?? "member"}</small></span>
            <button className="logout-button" onClick={() => setLogoutDialogOpen(true)} disabled={loggingOut} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{tabs.find((tab) => tab.id === activeTab)?.label}</strong></div>
          <div className="topbar-actions"><span className="connection-status"><i /> Live data</span><span className="topbar-avatar">{session?.user.username.slice(0, 1).toUpperCase() ?? "U"}</span></div>
        </header>

        <div className="dashboard-content">
          {activeTab === "overview" ? (
            <>
              <div className="dashboard-heading">
                <div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR SPACE, AT A GLANCE</span><h1>Good To See You, <span>{session?.user.username.split("@")[0] ?? "Friend"}</span></h1><p>Here’s what’s happening across your tables today.</p></div>
                <button type="button" className="button refresh-button" onClick={() => { setLoading(true); void loadData(); }} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} /> {loading ? "Updating..." : "Refresh data"}</button>
              </div>

              {error && <div className="dashboard-error" role="alert"><span>{error}</span><button type="button" onClick={() => { setLoading(true); void loadData(); }}>Try again</button></div>}
              <div className="stats-grid">
                <article className="stat-card stat-card-yellow"><div className="stat-card-top"><span>Total orders</span><span className="stat-card-icon"><ShoppingBag size={19} /></span></div><strong>{loading ? "—" : data.orders.length}</strong><small><span className="trend-mark"><ArrowUpRight size={13} /></span> connected to your database</small></article>
                <article className="stat-card stat-card-purple"><div className="stat-card-top"><span>Products</span><span className="stat-card-icon"><Package size={19} /></span></div><strong>{loading ? "—" : data.products.length}</strong><small><span className="trend-mark"><ArrowUpRight size={13} /></span> items in your catalog</small></article>
                <article className="stat-card stat-card-mint"><div className="stat-card-top"><span>Users</span><span className="stat-card-icon"><Users size={19} /></span></div><strong>{loading ? "—" : data.users.length}</strong><small><span className="trend-mark"><ArrowUpRight size={13} /></span> in your workspace</small></article>
                <article className="stat-card stat-card-pink"><div className="stat-card-top"><span>Order value</span><span className="stat-card-icon"><ChartNoAxesCombined size={19} /></span></div><strong>{loading ? "—" : money(totalRevenue)}</strong><small><span className="trend-mark"><ArrowUpRight size={13} /></span> across all orders</small></article>
              </div>

              <div className="dashboard-panels">
                <section className="panel orders-panel">
                  <div className="panel-heading"><div><span className="eyebrow">FRESH FROM THE DATABASE</span><h2>Recent orders</h2></div><button type="button" className="panel-link" onClick={() => setActiveTab("orders")}>All orders <ArrowUpRight size={15} /></button></div>
                  <OrdersTable orders={latestOrders} loading={loading} compact />
                </section>
                <section className="panel category-panel">
                  <div className="panel-heading"><div><span className="eyebrow">YOUR CATALOG</span><h2>Categories</h2></div><span className="round-panel-icon"><Layers3 size={18} /></span></div>
                  {loading ? <div className="empty-state">Loading categories...</div> : data.categories.length ? (
                    <div className="category-list">{data.categories.slice(0, 5).map((category, index) => <div className="category-row" key={category.id}><span className={`category-icon category-${index % 4}`}><Package size={16} /></span><span className="category-name"><strong>{category.name}</strong><small>{category.description || "No description"}</small></span><span className="category-count">{category.product_count} items</span></div>)}</div>
                  ) : <div className="empty-state">No categories yet.</div>}
                  <button type="button" className="panel-footer-link" onClick={() => setActiveTab("categories")}>Browse categories <ArrowDownRight size={15} /></button>
                </section>
              </div>
              <div className="dashboard-note"><span><strong>Everything in one place.</strong> Your dashboard is connected to your live database, so your latest changes show up here.</span><span className="note-table-icon"><Boxes size={22} /></span></div>
            </>
          ) : (
            <TableView tab={activeTab} data={data} loading={loading} error={error} onRetry={() => { setLoading(true); void loadData(); }} />
          )}
        </div>
        <footer className="dashboard-footer"><span>© 2026 Tabletop</span><span>Thoughtfully organized <span className="footer-heart">♥</span></span></footer>
      </section>
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="logout-dialog">
          <AlertDialogHeader className="logout-dialog-header">
            <AlertDialogTitle className="logout-dialog-title">Sign out of Tabletop?</AlertDialogTitle>
            <AlertDialogDescription className="logout-dialog-description">
              You’ll need to sign in again to access your workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="logout-dialog-footer">
            <AlertDialogCancel className="logout-dialog-cancel" disabled={loggingOut}>
              Stay signed in
            </AlertDialogCancel>
            <AlertDialogAction
              className="logout-dialog-confirm"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function OrdersTable({ orders, loading, compact = false }: { orders: OrderRecord[]; loading: boolean; compact?: boolean }) {
  if (loading) return <div className="empty-state">Loading orders...</div>;
  if (!orders.length) return <div className="empty-state">No orders to show yet.</div>;
  return (
    <div className="data-table-wrap"><table className="data-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>PRODUCT</th>{!compact && <th>DATE</th>}<th>AMOUNT</th></tr></thead><tbody>
      {orders.map((order) => <tr key={order.id}><td><span className="order-id">#{order.id.toString().padStart(4, "0")}</span></td><td><span className="table-person"><span className="table-avatar">{order.username.slice(0, 1).toUpperCase()}</span>{order.username}</span></td><td><span className="table-product">{order.product_name}</span>{!compact && <small className="table-subline">{order.category_name || "Uncategorized"} · Qty {order.quantity}</small>}</td>{!compact && <td>{dateLabel(order.created_at)}</td>}<td><strong className="table-price">{money(order.total_price)}</strong></td></tr>)}
    </tbody></table></div>
  );
}

function TableView({ tab, data, loading, error, onRetry }: { tab: Exclude<Tab, "overview">; data: DataSet; loading: boolean; error: string; onRetry: () => void }) {
  const title = tabs.find((item) => item.id === tab)?.label ?? "Data";
  const count = data[tab].length;
  return (
    <>
      <div className="dashboard-heading">
        <div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR DATABASE</span><h1>{title}</h1><p>Browse the latest information connected to your workspace.</p></div>
        <span className="record-count"><Boxes size={16} /> {loading ? "Loading" : `${count} ${count === 1 ? "record" : "records"}`}</span>
      </div>
      {error && <div className="dashboard-error" role="alert"><span>{error}</span><button type="button" onClick={onRetry}>Try again</button></div>}
      <section className="panel full-table-panel">
        <div className="panel-heading"><div><span className="eyebrow">LIVE DATA</span><h2>All {title.toLowerCase()}</h2></div><span className="search-chip"><Search size={15} /> Connected to API</span></div>
        {tab === "orders" && <OrdersTable orders={data.orders} loading={loading} />}
        {tab === "products" && <DataTable loading={loading} empty="No products found." headers={["ID", "PRODUCT", "CATEGORY", "PRICE"]}>{data.products.map((item) => <tr key={item.id}><td>#{item.id}</td><td><strong>{item.name}</strong></td><td>{item.category_name || "Uncategorized"}</td><td><strong>{money(item.price)}</strong></td></tr>)}</DataTable>}
        {tab === "categories" && <DataTable loading={loading} empty="No categories found." headers={["ID", "CATEGORY", "DESCRIPTION", "PRODUCTS"]}>{data.categories.map((item) => <tr key={item.id}><td>#{item.id}</td><td><strong>{item.name}</strong></td><td>{item.description || "—"}</td><td>{item.product_count}</td></tr>)}</DataTable>}
        {tab === "users" && <DataTable loading={loading} empty="No users found." headers={["ID", "USERNAME", "ROLE", "ORDERS"]}>{data.users.map((item) => <tr key={item.id}><td>#{item.id}</td><td><span className="table-person"><span className="table-avatar">{item.username.slice(0, 1).toUpperCase()}</span>{item.username}</span></td><td><span className="role-pill">{item.role}</span></td><td>{item.order_count ?? 0}</td></tr>)}</DataTable>}
      </section>
      <div className="table-footnote"><Activity size={16} /> This is a live view of your backend data. Refresh to check for updates.</div>
    </>
  );
}

function DataTable({ headers, children, loading, empty }: { headers: string[]; children: ReactNode; loading: boolean; empty: string }) {
  return loading ? <div className="empty-state">Loading data...</div> : (
    <div className="data-table-wrap"><table className="data-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table>
      {!Children.count(children) && <div className="empty-state">{empty}</div>}
    </div>
  );
}
