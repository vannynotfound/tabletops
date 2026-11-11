import Link from "next/link";
import { ArrowDownRight, ArrowRight, Boxes } from "lucide-react";
import PublicRouteGuard from "@/components/public-route-guard";

export default function Home() {
  return (
    <PublicRouteGuard>
    <main className="landing-page">
      <header className="site-nav">
        <Link className="brand" href="/">
          <span className="brand-mark"><Boxes size={20} strokeWidth={2.5} /></span>
          <span>Tabletop</span>
        </Link>
        <div className="nav-actions">
          <Link className="nav-link" href="/login">Log in</Link>
          <Link className="button button-small" href="/register">Get started <ArrowRight size={16} /></Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> your data, all together</span>
          <h1>Meet Your<br /><span>New Favorite</span><br />Dashboard.</h1>
          <p>A cheerful little home for your users, products, categories, and orders. Sign in and see your database come to life.</p>
          <div className="hero-actions">
            <Link className="button" href="/register">Create your account <ArrowRight size={18} /></Link>
            <Link className="text-link" href="/login">I already have an account <ArrowDownRight size={16} /></Link>
          </div>
          <div className="hero-footnote"><span className="footnote-line" /> four tables, one tidy place</div>
        </div>

        <div className="preview-wrap" aria-label="Dashboard preview">
          <div className="preview-card">
            <div className="preview-topbar">
              <span className="preview-dots"><i /><i /><i /></span>
              <span className="preview-label">your workspace</span>
              <span className="preview-avatar">V</span>
            </div>
            <div className="preview-content">
              <div className="preview-greeting"><div><small>MONDAY, OCTOBER 26</small><h2>Good morning!</h2></div><span className="wave"><i /></span></div>
              <div className="preview-stats">
                <div className="preview-stat"><span className="stat-icon peach">↗</span><small>total orders</small><strong>128</strong><span className="stat-trend">this month</span></div>
                <div className="preview-stat"><span className="stat-icon lilac">▦</span><small>products</small><strong>24</strong><span className="stat-trend">in your catalog</span></div>
                <div className="preview-stat"><span className="stat-icon mint">◉</span><small>customers</small><strong>86</strong><span className="stat-trend">and counting</span></div>
              </div>
              <div className="preview-order-head"><strong>Recent orders</strong><span>see all ↗</span></div>
              <div className="preview-order"><span className="order-bubble pink">JD</span><span className="order-name">Jamie D.</span><span className="order-item">Daily planner</span><strong>$24.00</strong></div>
              <div className="preview-order"><span className="order-bubble blue">AK</span><span className="order-name">Alex K.</span><span className="order-item">Canvas tote</span><strong>$32.00</strong></div>
            </div>
          </div>
          <div className="floating-note">looking good!</div>
        </div>
      </section>

      <footer className="landing-footer">
        <span>Made for the little details.</span>
        <span className="footer-dot" />
        <span>Powered by your database</span>
      </footer>
    </main>
    </PublicRouteGuard>
  );
}
