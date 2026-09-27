"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

function Icon({ name, size = 18, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const s: React.CSSProperties = { width: size, height: size };
  const p = { fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, React.ReactElement> = {
    grid: <svg viewBox="0 0 24 24" style={s} {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    box: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    shopping: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
    message: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    wallet: <svg viewBox="0 0 24 24" style={s} {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    star: <svg viewBox="0 0 24 24" style={s} {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    settings: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    bell: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    plus: <svg viewBox="0 0 24 24" style={s} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check: <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    close: <svg viewBox="0 0 24 24" style={s} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    logout: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    shield: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  };
  return icons[name] || <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="12" cy="12" r="10"/></svg>;
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: "grid", href: "/dashboard/vendeur" },
  { label: "Mes Produits", icon: "box", href: "/dashboard/vendeur/produits" },
  { label: "Commandes", icon: "shopping", href: "/dashboard/vendeur/commandes" },
  { label: "Messages", icon: "message", badge: 0, href: "/dashboard/messages" },
  { label: "Wallet", icon: "wallet", href: "/dashboard/vendeur/wallet" },
  { label: "Avis Clients", icon: "star", href: "/dashboard/vendeur/avis" },
  { label: "Parametres", icon: "settings", href: "/dashboard/vendeur/parametres" },
];

export default function VendeurDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [commandesEnAttente, setCommandesEnAttente] = useState(0);
  const [messagesNonLus, setMessagesNonLus] = useState(0);

  async function rafraichirCompteurs(uid: string) {
    const { count: cmdCount } = await supabase
      .from("commandes")
      .select("*", { count: "exact", head: true })
      .eq("vendeur_id", uid)
      .eq("statut", "en_attente");
    setCommandesEnAttente(cmdCount || 0);

    const { count: msgCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("destinataire_id", uid)
      .eq("lu", false);
    setMessagesNonLus(msgCount || 0);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }
      setUser(session.user);
      await rafraichirCompteurs(session.user.id);
      setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) router.replace("/auth");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const channelCommandes = supabase
      .channel(`layout-commandes:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "commandes", filter: `vendeur_id=eq.${user.id}` }, () => rafraichirCompteurs(user.id))
      .subscribe();

    const channelMessages = supabase
      .channel(`layout-messages:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `destinataire_id=eq.${user.id}` }, () => rafraichirCompteurs(user.id))
      .subscribe();

    return () => {
      supabase.removeChannel(channelCommandes);
      supabase.removeChannel(channelMessages);
    };
  }, [user]);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "Inter, sans-serif" }}>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Chargement...</p>
      </div>
    );
  }

  const nom = user?.user_metadata?.name || user?.email?.split("@")[0] || "Vendeur";
  const prenom = nom.split(" ")[0];
  const initiales = nom.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const trustScore = 96;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      <style>{`
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; cursor: pointer; transition: all 0.15s; font-size: 14px; font-weight: 500; color: #6b7280; }
        .nav-item:hover { background: #f3f4f6; color: #111827; }
        .nav-item.active { background: #f0fdf4; color: #15803d; font-weight: 700; }
        .topbar-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; }
        .topbar-btn:hover { border-color: #15803d; background: #f0fdf4; }

        .hamburger-btn { display: none; }
        .sidebar-overlay { display: none; }

        @media (max-width: 900px) {
          .sidebar { transform: translateX(-100%); transition: transform 0.25s ease; box-shadow: none; }
          .sidebar.sidebar-open { transform: translateX(0); box-shadow: 12px 0 32px rgba(0,0,0,0.12); }
          .content-wrap { margin-left: 0 !important; }
          .hamburger-btn { display: flex !important; }
          .sidebar-overlay.open { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 90; }
          .publish-btn-label { display: none !important; }
          .profile-text { display: none !important; }
          .page-main { padding: 16px !important; }
          .topbar-inner { padding: 0 12px !important; }
        }
      `}</style>

      <div className={`sidebar-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar${sidebarOpen ? " sidebar-open" : ""}`} style={{ width: 230, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100, overflowY: "auto" }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 34, height: 34, background: "#15803d", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: 16 }}>
              <span style={{ color: "#15803d" }}>Student</span><span style={{ color: "#111827" }}>Market</span>
            </span>
          </a>
          <button onClick={() => setSidebarOpen(false)} className="topbar-btn" style={{ display: sidebarOpen ? "flex" : "none" }} aria-label="Fermer le menu">
            <Icon name="close" size={15} color="#111827" />
          </button>
        </div>

        <nav style={{ flex: 1, padding: "12px" }}>
          {NAV_ITEMS.map(item => {
            const estActif = pathname === item.href;
            const badgeValue = item.label === "Commandes" ? commandesEnAttente : item.label === "Messages" ? messagesNonLus : 0;
            return (
              <a key={item.label} href={item.href}
                className={`nav-item${estActif ? " active" : ""}`}
                onClick={() => setSidebarOpen(false)}
                style={{ justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name={item.icon} size={17} color={estActif ? "#15803d" : "#6b7280"} />
                  <span>{item.label}</span>
                </div>
                {badgeValue > 0 && (
                  <span style={{ background: "#dc2626", color: "#fff", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>
                    {badgeValue}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        <div style={{ margin: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="shield" size={16} color="#15803d" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>Trust Score</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#111827", marginBottom: 2 }}>{trustScore}<span style={{ fontSize: 14, color: "#9ca3af", fontWeight: 500 }}>/100</span></div>
          <p style={{ fontSize: 12, color: "#15803d", fontWeight: 700, marginBottom: 8 }}>Excellent</p>
          <div style={{ height: 6, background: "#dcfce7", borderRadius: 3 }}>
            <div style={{ height: "100%", width: `${trustScore}%`, background: "#15803d", borderRadius: 3 }} />
          </div>
        </div>

        <div style={{ padding: "12px 20px 20px", borderTop: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Besoin d'aide ?</p>
          <button style={{ background: "transparent", border: "none", color: "#15803d", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
            Contacter le support
          </button>
        </div>
      </aside>

      <div className="content-wrap" style={{ marginLeft: 230, flex: 1, display: "flex", flexDirection: "column" }}>
        <header className="topbar-inner" style={{ height: 60, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 28px", gap: 16, position: "sticky", top: 0, zIndex: 50 }}>
          <button className="hamburger-btn topbar-btn" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "#fff", border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              onClick={() => router.push("/vendre")}>
              <Icon name="plus" size={15} color="#fff" />
              <span className="publish-btn-label">Publier une annonce</span>
            </button>
            <div className="topbar-btn"><Icon name="bell" size={17} color="#6b7280" /></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 10, cursor: "pointer", background: "#fff" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#15803d", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initiales}
              </div>
              <div className="profile-text">
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{prenom}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Vendeur verifie</span>
                  <Icon name="check" size={11} color="#15803d" />
                </div>
              </div>
            </div>
            <button className="topbar-btn" onClick={async () => { await supabase.auth.signOut(); router.replace("/auth"); }}>
              <Icon name="logout" size={16} color="#6b7280" />
            </button>
          </div>
        </header>

        <main className="page-main" style={{ flex: 1, padding: "28px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}