"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Commande = {
  id: string;
  annonce_id: string;
  vendeur_id: string;
  acheteur_id: string;
  acheteur_nom: string;
  statut: "en_attente" | "confirmee" | "refusee" | "terminee" | "annulee";
  created_at: string;
  annonces?: {
    titre: string;
    prix_vente: number;
    photos: string[];
    ville: string;
    vendeur_nom: string;
    telephone: string;
  };
};

function Icon({ path, size = 18, color = "currentColor" }: { path: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const STATUTS = {
  en_attente: { label: "En attente", bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  confirmee: { label: "Confirmée", bg: "#F0FDF4", color: "#15803d", border: "#86EFAC" },
  refusee: { label: "Refusée", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  terminee: { label: "Terminée", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  annulee: { label: "Annulée", bg: "#F9FAFB", color: "#6B7280", border: "#E5E7EB" },
};

const NAV = [
  { label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { label: "Mes commandes", icon: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18" },
  { label: "Messages", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { label: "Parametres", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" },
];

export default function DashboardAcheteur() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [annulation, setAnnulation] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }

      const role = session.user.user_metadata?.role;
      if (role === "vendeur") { router.replace("/dashboard/vendeur"); return; }

      setUser(session.user);

      const { data } = await supabase
        .from("commandes")
        .select("*, annonces(titre, prix_vente, photos, ville, vendeur_nom, telephone)")
        .eq("acheteur_id", session.user.id)
        .order("created_at", { ascending: false });

      if (data) setCommandes(data);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) router.replace("/auth");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function annulerCommande(id: string) {
    const ok = window.confirm("Annuler cette commande ?");
    if (!ok) return;
    setAnnulation(id);
    const { error } = await supabase
      .from("commandes")
      .update({ statut: "annulee" })
      .eq("id", id);
    if (!error) setCommandes(prev => prev.map(c => c.id === id ? { ...c, statut: "annulee" } : c));
    setAnnulation(null);
  }

  const commandesFiltrees = useMemo(() => {
    if (!recherche.trim()) return commandes;
    const q = recherche.toLowerCase();
    return commandes.filter(c =>
      c.annonces?.titre?.toLowerCase().includes(q) ||
      c.annonces?.vendeur_nom?.toLowerCase().includes(q) ||
      c.annonces?.ville?.toLowerCase().includes(q)
    );
  }, [commandes, recherche]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <p style={{ color: "#9ca3af" }}>Chargement...</p>
    </div>
  );

  const nom = user?.user_metadata?.name || user?.email?.split("@")[0] || "Acheteur";
  const prenom = nom.split(" ")[0];
  const initiales = nom.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const stats = {
    total: commandes.length,
    enAttente: commandes.filter(c => c.statut === "en_attente").length,
    confirmees: commandes.filter(c => c.statut === "confirmee").length,
    depense: commandes.filter(c => c.statut === "confirmee" || c.statut === "terminee")
      .reduce((s, c) => s + (c.annonces?.prix_vente || 0), 0),
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; cursor: pointer; transition: all 0.15s; font-size: 14px; font-weight: 500; color: #6b7280; }
        .nav-item:hover { background: #f3f4f6; color: #111827; }
        .nav-item.active { background: #f0fdf4; color: #15803d; font-weight: 700; }
        .stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; }
        .topbar-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; }
        .topbar-btn:hover { border-color: #15803d; background: #f0fdf4; }
        .cmd-card { background: #fff; border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 18px 20px; transition: all 0.2s; }
        .cmd-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .btn-primary { background: #15803d; color: #fff; border: none; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .btn-secondary { background: #fff; color: #374151; border: 1.5px solid #e5e7eb; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .btn-danger { background: #fff; color: #DC2626; border: 1.5px solid #FECACA; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .btn-danger:hover { background: #FEF2F2; }
      `}</style>

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
          {NAV.map(item => (
            <div key={item.label}
              className={`nav-item${activeNav === item.label ? " active" : ""}`}
              onClick={() => setActiveNav(item.label)}
            >
              <Icon path={item.icon} size={17} color={activeNav === item.label ? "#15803d" : "#6b7280"} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.label === "Mes commandes" && stats.enAttente > 0 && (
                <span style={{ background: "#d97706", color: "#fff", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>
                  {stats.enAttente}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* Bloc vendre */}
        <div style={{ margin: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "16px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Envie de vendre aussi ?</p>
          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, marginBottom: 12 }}>Créez une annonce en quelques minutes.</p>
          <button onClick={() => router.push("/vendre")} style={{ width: "100%", background: "#15803d", color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Publier une annonce
          </button>
        </div>

        <div style={{ padding: "12px 20px 20px", borderTop: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Besoin d'aide ?</p>
          <a href="mailto:support@studentmarket.gh" style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>Contacter le support</a>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: 230, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* TOPBAR */}
        <header style={{ height: 60, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 28px", gap: 16, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ flex: 1, maxWidth: 480, display: "flex", alignItems: "center", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "0 14px", gap: 8 }}>
            <Icon path="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" size={15} color="#9ca3af" />
            <input
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher un produit..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "#111827", padding: "9px 0", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => router.push("/annonces")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "#fff", border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              <Icon path="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" size={14} color="#fff" />
              Explorer la marketplace
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                {initiales}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{prenom}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Acheteur vérifié</span>
                  <Icon path="M20 6L9 17l-5-5" size={11} color="#15803d" />
                </div>
              </div>
            </div>
            <button className="topbar-btn" onClick={async () => { await supabase.auth.signOut(); router.replace("/auth"); }}>
              <Icon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" size={16} color="#6b7280" />
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px" }}>

          {/* ── DASHBOARD ── */}
          {activeNav === "Dashboard" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>
                  Bienvenue, {prenom}
                </h1>
                <p style={{ fontSize: 14, color: "#9ca3af" }}>Voici un résumé de vos commandes.</p>
              </div>

              {/* STATS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Commandes totales", value: String(stats.total), sub: `${stats.enAttente} en attente`, icon: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18", color: "#15803d", bg: "#f0fdf4" },
                  { label: "En attente", value: String(stats.enAttente), sub: "de confirmation vendeur", icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2", color: "#d97706", bg: "#fffbeb" },
                  { label: "Confirmées", value: String(stats.confirmees), sub: "prêtes à récupérer", icon: "M20 6L9 17l-5-5", color: "#7c3aed", bg: "#faf5ff" },
                  { label: "Total dépensé", value: `${stats.depense.toLocaleString()} GHS`, sub: "commandes confirmées", icon: "M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M1 10h22", color: "#0e7490", bg: "#ecfeff" },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon path={s.icon} size={20} color={s.color} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, marginBottom: 4 }}>{s.label}</p>
                      <p style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 2, letterSpacing: "-0.5px" }}>{s.value}</p>
                      <p style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* COMMANDES RÉCENTES */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #e5e7eb" }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Mes commandes récentes</h2>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>{commandes.length} commande{commandes.length > 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={() => setActiveNav("Mes commandes")} style={{ fontSize: 13, color: "#15803d", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    Voir toutes →
                  </button>
                </div>

                {commandes.length === 0 ? (
                  <div style={{ padding: "48px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Aucune commande pour le moment</p>
                    <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>Parcourez la marketplace pour trouver votre bonheur.</p>
                    <button onClick={() => router.push("/annonces")} className="btn-primary">Explorer les annonces</button>
                  </div>
                ) : (
                  commandes.slice(0, 3).map(c => {
                    const s = STATUTS[c.statut] || STATUTS.en_attente;
                    const photo = c.annonces?.photos?.[0];
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid #f3f4f6" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f0fdf4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon path="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8" size={20} color="#86efac" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{c.annonces?.titre || "Annonce"}</p>
                          <p style={{ fontSize: 12, color: "#9ca3af" }}>{new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "#15803d" }}>{(c.annonces?.prix_vente || 0).toLocaleString()} GHS</p>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 8, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── MES COMMANDES ── */}
          {activeNav === "Mes commandes" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 4 }}>Mes commandes</h1>
                  <p style={{ fontSize: 14, color: "#9ca3af" }}>{commandes.length} commande{commandes.length > 1 ? "s" : ""} au total</p>
                </div>
                <button onClick={() => router.push("/annonces")} className="btn-primary">
                  Explorer les annonces
                </button>
              </div>

              {commandesFiltrees.length === 0 ? (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "60px 24px", textAlign: "center" }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Aucune commande</p>
                  <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>Parcourez la marketplace pour commander un appareil.</p>
                  <button onClick={() => router.push("/annonces")} className="btn-primary">Explorer les annonces</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {commandesFiltrees.map(c => {
                    const s = STATUTS[c.statut] || STATUTS.en_attente;
                    const photo = c.annonces?.photos?.[0];
                    return (
                      <div key={c.id} className="cmd-card" style={{ borderColor: c.statut === "confirmee" ? "#86EFAC" : c.statut === "en_attente" ? "#FED7AA" : "#e5e7eb" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 56, height: 56, borderRadius: 12, background: "#f0fdf4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon path="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8" size={24} color="#86efac" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 3 }}>{c.annonces?.titre || "Annonce supprimée"}</p>
                            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
                              Vendeur : <strong>{c.annonces?.vendeur_nom || "—"}</strong> · {c.annonces?.ville || "—"}
                            </p>
                            <p style={{ fontSize: 11, color: "#9ca3af" }}>
                              {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ fontSize: 18, fontWeight: 900, color: "#15803d", marginBottom: 6 }}>
                              {(c.annonces?.prix_vente || 0).toLocaleString()} GHS
                            </p>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 8, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                              {s.label}
                            </span>
                          </div>
                        </div>

                        {/* Actions selon statut */}
                        {(c.statut === "en_attente" || c.statut === "confirmee") && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f6", display: "flex", gap: 10 }}>
                            {c.statut === "confirmee" && c.annonces?.telephone && (
                              <a
                                href={"https://wa.me/" + (c.annonces?.telephone || "").replace(/^0/, "233") + "?text=" + encodeURIComponent("Bonjour, ma commande pour " + (c.annonces?.titre || "") + " a ete confirmee. Quand pouvons-nous nous retrouver ?")}
                                target="_blank"
                                rel="noreferrer"
                                style={{ flex: 1, background: "#15803d", color: "#fff", textAlign: "center", fontWeight: 700, padding: "10px", borderRadius: 9, fontSize: 13, textDecoration: "none", display: "block" }}
                              >
                                Contacter le vendeur via WhatsApp
                              </a>
                            )}
                            {c.statut === "en_attente" && (
                              <button
                                onClick={() => annulerCommande(c.id)}
                                disabled={annulation === c.id}
                                className="btn-danger"
                                style={{ opacity: annulation === c.id ? 0.6 : 1 }}
                              >
                                {annulation === c.id ? "Annulation..." : "Annuler la commande"}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Message si confirmée */}
                        {c.statut === "confirmee" && (
                          <div style={{ marginTop: 10, background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", border: "1px solid #bbf7d0" }}>
                            <p style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>
                              Commande confirmée par le vendeur — Contactez-le pour organiser la remise.
                            </p>
                          </div>
                        )}

                        {/* Message si refusée */}
                        {c.statut === "refusee" && (
                          <div style={{ marginTop: 10, background: "#FEF2F2", borderRadius: 10, padding: "10px 14px", border: "1px solid #FECACA" }}>
                            <p style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>
                              Commande refusée par le vendeur. Vous pouvez chercher d'autres annonces similaires.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── MESSAGES ── */}
          {activeNav === "Messages" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 4 }}>Messages</h1>
                <p style={{ fontSize: 14, color: "#9ca3af" }}>Vos conversations avec les vendeurs.</p>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "60px 24px", textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Messagerie bientôt disponible</p>
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
                  Une fois votre commande confirmée, vous pourrez échanger directement avec le vendeur via WhatsApp depuis l'onglet "Mes commandes".
                </p>
                <button onClick={() => setActiveNav("Mes commandes")} className="btn-primary">
                  Voir mes commandes
                </button>
              </div>
            </div>
          )}

          {/* ── PARAMÈTRES ── */}
          {activeNav === "Parametres" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 4 }}>Paramètres</h1>
                <p style={{ fontSize: 14, color: "#9ca3af" }}>Gérez votre compte.</p>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px", maxWidth: 500 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Rôle actuel</h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
                  Vous êtes en mode <strong style={{ color: "#15803d" }}>Acheteur</strong>. Vous pouvez passer en mode Vendeur pour publier des annonces.
                </p>
                <button
                  onClick={async () => {
                    const ok = window.confirm("Passer en mode Vendeur ?");
                    if (!ok) return;
                    await supabase.auth.updateUser({ data: { role: "vendeur" } });
                    router.replace("/dashboard/vendeur");
                  }}
                  className="btn-secondary"
                >
                  Passer en mode Vendeur
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}