"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Annonce = {
  id: string;
  titre: string;
  categorie: string;
  ville: string;
  etat?: string;
  prix_vente?: number;
  prix_achat?: number;
  score_prix?: string;
  created_at?: string;
  vues?: number;
  favoris?: number;
  statut?: string;
  photos?: string[];
  description?: string;
};

function Icon({ name, size = 18, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const s = { width: size, height: size };
  const p = { fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, React.JSX.Element> = {
    grid: <svg viewBox="0 0 24 24" style={s} {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    box: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    shopping: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
    message: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    chart: <svg viewBox="0 0 24 24" style={s} {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    tag: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    wallet: <svg viewBox="0 0 24 24" style={s} {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    star: <svg viewBox="0 0 24 24" style={s} {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    settings: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    search: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    plus: <svg viewBox="0 0 24 24" style={s} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    eye: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    share: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    filter: <svg viewBox="0 0 24 24" style={s} {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    arrow: <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    logout: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    shield: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    bell: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    check: <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="20 6 9 17 4 12"/></svg>,
  };
  return icons[name] || <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="12" cy="12" r="10"/></svg>;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard/vendeur", icon: "grid" },
  { label: "Mes Produits", href: "/dashboard/vendeur/produits", icon: "box" },
  { label: "Commandes", href: "/dashboard/vendeur/commandes", icon: "shopping", badge: 12 },
  { label: "Messages", href: "/dashboard/vendeur/messages", icon: "message", badge: 5 },
  { label: "Analytics", href: "/dashboard/vendeur/analytics", icon: "chart" },
  { label: "Promotions", href: "/dashboard/vendeur/promotions", icon: "tag" },
  { label: "Wallet", href: "/dashboard/vendeur/wallet", icon: "wallet" },
  { label: "Avis Clients", href: "/dashboard/vendeur/avis", icon: "star" },
  { label: "Parametres", href: "/dashboard/vendeur/parametres", icon: "settings" },
];

const FILTRES = ["Tous", "Actif", "En attente", "Vendu", "Expire"];
const CATEGORIES = ["Toutes", "Smartphone", "Laptop", "Casque / Ecouteurs", "Tablette", "Console de jeu", "Autre"];

export default function MesProduits() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [filtreCategorie, setFiltreCategorie] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }
      setUser(session.user);
      const { data } = await supabase
        .from("annonces")
        .select("*")
        .eq("vendeur_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) setAnnonces(data);
      setLoading(false);
    });
  }, [router]);

  async function supprimerAnnonce(id: string) {
    const { error } = await supabase.from("annonces").delete().eq("id", id);
    if (!error) setAnnonces(prev => prev.filter(a => a.id !== id));
    setDeleteId(null);
  }

  const annoncesFiltrees = annonces.filter(a => {
    const matchStatut = filtreStatut === "Tous" || (a.statut || "actif").toLowerCase() === filtreStatut.toLowerCase();
    const matchCat = filtreCategorie === "Toutes" || a.categorie === filtreCategorie;
    const matchSearch = a.titre?.toLowerCase().includes(search.toLowerCase());
    return matchStatut && matchCat && matchSearch;
  });

  const nom = user?.user_metadata?.name || user?.email?.split("@")[0] || "Vendeur";
  const prenom = nom.split(" ")[0];
  const initiales = nom.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const trustScore = 96;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "Inter, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#15803d", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Chargement...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; cursor: pointer; transition: all 0.15s; font-size: 14px; font-weight: 500; color: #6b7280; }
        .nav-item:hover { background: #f3f4f6; color: #111827; }
        .nav-item.active { background: #f0fdf4; color: #15803d; font-weight: 700; }
        .filtre-btn { padding: 7px 14px; border-radius: 8px; border: 1.5px solid #e5e7eb; background: #fff; font-size: 13px; font-weight: 600; color: #6b7280; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .filtre-btn:hover { border-color: #15803d; color: #15803d; }
        .filtre-btn.active { background: #15803d; color: #fff; border-color: #15803d; }
        .product-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; transition: all 0.2s; }
        .product-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
        .icon-btn:hover { border-color: #15803d; background: #f0fdf4; }
        .icon-btn.danger:hover { border-color: #dc2626; background: #fef2f2; }
        .badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; display: inline-block; }
        .badge-bon { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .badge-eleve { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .badge-actif { background: #f0fdf4; color: #15803d; }
        .badge-vendu { background: #eff6ff; color: #1d4ed8; }
        .badge-expire { background: #fef2f2; color: #dc2626; }
        .topbar-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; transition: all 0.15s; }
        .topbar-btn:hover { border-color: #15803d; background: #f0fdf4; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 500; display: flex; align-items: center; justify-content: center; }
      `}</style>

      {/* MODAL SUPPRESSION */}
      {deleteId && (
        <div className="overlay" onClick={() => setDeleteId(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px", maxWidth: 400, width: "90%", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", border: "2px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Icon name="trash" size={24} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Supprimer cette annonce ?</h3>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }}>Cette action est irreversible. L annonce sera definitivement supprimee.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#374151" }}>
                Annuler
              </button>
              <button onClick={() => supprimerAnnonce(deleteId)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside style={{ width: 230, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100, overflowY: "auto" }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 34, height: 34, background: "#15803d", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: 16 }}>
              <span style={{ color: "#15803d" }}>Student</span><span style={{ color: "#111827" }}>Market</span>
            </span>
          </a>
        </div>
        <nav style={{ flex: 1, padding: "12px" }}>
          {NAV_ITEMS.map(item => (
            <a key={item.label} href={item.href} className={`nav-item${item.label === "Mes Produits" ? " active" : ""}`}>
              <Icon name={item.icon} size={17} color={item.label === "Mes Produits" ? "#15803d" : "#6b7280"} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ background: "#e5e7eb", color: "#374151", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>
                  {item.badge}
                </span>
              )}
            </a>
          ))}
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
          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Besoin d aide ?</p>
          <button style={{ background: "transparent", border: "none", color: "#15803d", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>Contacter le support</button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: 230, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* TOPBAR */}
        <header style={{ height: 60, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 28px", gap: 16, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ flex: 1, maxWidth: 480, display: "flex", alignItems: "center", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "0 14px", gap: 8 }}>
            <Icon name="search" size={15} color="#9ca3af" />
            <input
              placeholder="Rechercher un produit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "#111827", padding: "9px 0", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "#fff", border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              onClick={() => router.push("/vendre")}>
              <Icon name="plus" size={15} color="#fff" />
              Publier une annonce
            </button>
            <div className="topbar-btn">
              <Icon name="bell" size={17} color="#6b7280" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 10, cursor: "pointer", background: "#fff" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                {initiales}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{prenom}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Vendeur verifie</span>
                  <Icon name="check" size={11} color="#15803d" />
                </div>
              </div>
            </div>
            <button className="topbar-btn" onClick={async () => { await supabase.auth.signOut(); router.replace("/auth"); }} title="Se deconnecter">
              <Icon name="logout" size={16} color="#6b7280" />
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px" }}>

          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 4, letterSpacing: "-0.5px" }}>Mes Produits</h1>
              <p style={{ fontSize: 14, color: "#9ca3af" }}>{annonces.length} annonce{annonces.length > 1 ? "s" : ""} publiee{annonces.length > 1 ? "s" : ""} au total</p>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 8, background: "#15803d", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              onClick={() => router.push("/vendre")}>
              <Icon name="plus" size={16} color="#fff" />
              Nouvelle annonce
            </button>
          </div>

          {/* STATS RAPIDES */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total annonces", value: annonces.length, color: "#15803d", bg: "#f0fdf4" },
              { label: "Actives", value: annonces.filter(a => (a.statut || "actif") === "actif").length, color: "#15803d", bg: "#f0fdf4" },
              { label: "Total vues", value: annonces.reduce((s, a) => s + (a.vues || 0), 0), color: "#0e7490", bg: "#ecfeff" },
              { label: "Total favoris", value: annonces.reduce((s, a) => s + (a.favoris || 0), 0), color: "#7c3aed", bg: "#faf5ff" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6, fontWeight: 500 }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: s.color, letterSpacing: "-1px" }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* FILTRES */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
              <Icon name="filter" size={14} color="#9ca3af" />
              <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>Statut :</span>
            </div>
            {FILTRES.map(f => (
              <button key={f} className={`filtre-btn${filtreStatut === f ? " active" : ""}`} onClick={() => setFiltreStatut(f)}>{f}</button>
            ))}
            <div style={{ width: 1, height: 24, background: "#e5e7eb", margin: "0 8px" }} />
            <select value={filtreCategorie} onChange={e => setFiltreCategorie(e.target.value)}
              style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* GRILLE PRODUITS */}
          {annoncesFiltrees.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 24px", background: "#fff", borderRadius: 16, border: "1px dashed #d1d5db" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Icon name="box" size={24} color="#15803d" />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Aucun produit trouve</p>
              <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>
                {annonces.length === 0 ? "Vous n avez pas encore publie d annonce." : "Aucune annonce ne correspond a vos filtres."}
              </p>
              {annonces.length === 0 && (
                <button onClick={() => router.push("/vendre")} style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Publier ma premiere annonce
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {annoncesFiltrees.map(a => {
                const photoUrl = Array.isArray(a.photos) && a.photos.length > 0 ? a.photos[0] : null;
                const statut = a.statut || "actif";
                return (
                  <div key={a.id} className="product-card">
                    {/* Image */}
                    <div style={{ height: 180, background: photoUrl ? "transparent" : "linear-gradient(135deg, #f0fdf4, #dcfce7)", position: "relative", overflow: "hidden" }}>
                      {photoUrl ? (
                        <img src={photoUrl} alt={a.titre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="box" size={40} color="#86efac" />
                        </div>
                      )}
                      {/* Badge statut */}
                      <div style={{ position: "absolute", top: 10, left: 10 }}>
                        <span className={`badge badge-${statut}`} style={{ fontSize: 11, padding: "3px 10px" }}>
                          {statut.charAt(0).toUpperCase() + statut.slice(1)}
                        </span>
                      </div>
                      {/* Badge score */}
                      {a.score_prix && (
                        <div style={{ position: "absolute", top: 10, right: 10 }}>
                          <span className={`badge badge-${a.score_prix}`}>
                            {a.score_prix === "bon" ? "Prix coherent" : "Prix eleve"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div style={{ padding: "16px" }}>
                      <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{a.categorie} · {a.ville}</p>
                      <p style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 10, lineHeight: 1.3 }}>{a.titre}</p>

                      {/* Prix */}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: "#15803d" }}>{(a.prix_vente || 0).toLocaleString()} GHS</span>
                        {a.prix_achat && (
                          <span style={{ fontSize: 13, color: "#9ca3af", textDecoration: "line-through" }}>{a.prix_achat.toLocaleString()} GHS</span>
                        )}
                      </div>

                      {/* Stats */}
                      <div style={{ display: "flex", gap: 16, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #f3f4f6" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Icon name="eye" size={13} color="#9ca3af" />
                          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{a.vues || 0} vues</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Icon name="star" size={13} color="#9ca3af" />
                          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{a.favoris || 0} favoris</span>
                        </div>
                        {a.created_at && (
                          <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: "auto" }}>
                            {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="icon-btn" title="Modifier" onClick={() => router.push(`/vendre?edit=${a.id}`)}>
                          <Icon name="edit" size={14} color="#6b7280" />
                        </button>
                        <button className="icon-btn" title="Voir l annonce" onClick={() => router.push(`/annonces?id=${a.id}`)}>
                          <Icon name="eye" size={14} color="#6b7280" />
                        </button>
                        <button className="icon-btn" title="Partager">
                          <Icon name="share" size={14} color="#6b7280" />
                        </button>
                        <button className="icon-btn danger" title="Supprimer" onClick={() => setDeleteId(a.id)} style={{ marginLeft: "auto" }}>
                          <Icon name="trash" size={14} color="#dc2626" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
