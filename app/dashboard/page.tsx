"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ── TYPES ────────────────────────────────────────────────────────
type Annonce = {
  id: string;
  titre: string;
  categorie: string;
  ville: string;
  etat?: string;
  duree_utilisation?: number;
  prix_vente?: number;
  prix_achat?: number;
  score_prix?: string;
  vues?: number;
  favoris?: number;
  photos?: string[];
  statut?: string;
  created_at?: string;
};

type Commande = {
  id: string;
  statut: string;
  acheteur_nom?: string;
  created_at: string;
  annonces: {
    titre: string;
    photos?: string[];
    prix_vente?: number;
  } | null;
};

const NAV_ITEMS = [
  { label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { label: "Mes Produits", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
  { label: "Commandes", icon: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0" },
  { label: "Messages", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { label: "Analytics", icon: "M18 20V10 M12 20V4 M6 20v-6" },
  { label: "Promotions", icon: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01" },
  { label: "Wallet", icon: "M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M1 10h22" },
  { label: "Avis Clients", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { label: "Parametres", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" },
];

// ── ICÔNE SVG SIMPLE ─────────────────────────────────────────────
function NavIcon({ path, size = 18, color = "#6b7280" }: { path: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function formatPrix(prix?: number) {
  if (!prix) return "0";
  return new Intl.NumberFormat("fr-FR").format(prix);
}

// ── COMPOSANT PRINCIPAL ──────────────────────────────────────────
export default function DashboardVendeur() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [chargementAnnonces, setChargementAnnonces] = useState(true);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [chargementCommandes, setChargementCommandes] = useState(true);
  const [majEnCours, setMajEnCours] = useState<string | null>(null);

  // ── Auth + redirection selon le role ────────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (!session) { router.replace("/auth"); return; }

      const role = session.user.user_metadata?.role;
      if (role === "acheteur") { router.replace("/dashboard/acheteur"); return; }

      setUser(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) router.replace("/auth");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // ── Chargement des VRAIES annonces du vendeur connecte ──────
  useEffect(() => {
    if (!user) return;

    async function chargerAnnonces() {
      setChargementAnnonces(true);
      const { data, error } = await supabase
        .from("annonces")
        .select("*")
        .eq("vendeur_id", user!.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setAnnonces(data as Annonce[]);
      }
      setChargementAnnonces(false);
    }

    chargerAnnonces();
  }, [user]);

  // ── Chargement des commandes recues par ce vendeur ──────────
  useEffect(() => {
    if (!user) return;

    async function chargerCommandes() {
      setChargementCommandes(true);
      const { data, error } = await supabase
        .from("commandes")
        .select("*, annonces(titre, photos, prix_vente)")
        .eq("vendeur_id", user!.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCommandes(data as unknown as Commande[]);
      }
      setChargementCommandes(false);
    }

    chargerCommandes();
  }, [user]);

  async function mettreAJourStatut(commandeId: string, nouveauStatut: "confirmee" | "refusee") {
    setMajEnCours(commandeId);
    const { error } = await supabase
      .from("commandes")
      .update({ statut: nouveauStatut, updated_at: new Date().toISOString() })
      .eq("id", commandeId);

    if (!error) {
      setCommandes(prev => prev.map(c => c.id === commandeId ? { ...c, statut: nouveauStatut } : c));
    }
    setMajEnCours(null);
  }

  function tempsEcoule(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "Inter, sans-serif" }}>
      <p style={{ color: "#9ca3af", fontSize: 14 }}>Chargement...</p>
    </div>
  );

  const nom = user?.user_metadata?.name || user?.email?.split("@")[0] || "Vendeur";
  const prenom = nom.split(" ")[0];
  const initiales = nom.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  // ── Stats calculees a partir des VRAIES annonces ────────────
  const totalRevenu = annonces.reduce((s, a) => s + (a.prix_vente || 0), 0);
  const produitsActifs = annonces.filter(a => a.statut === "actif").length;
  const prixCoherents = annonces.filter(a => a.score_prix === "bon").length;
  const aVerifier = annonces.length - prixCoherents;
  const commandesEnAttente = commandes.filter(c => c.statut === "en_attente").length;

  const STATS = [
    { label: "Revenus totaux", value: `${formatPrix(totalRevenu)} GHS`, detail: `${annonces.length} annonce${annonces.length > 1 ? "s" : ""} au total`, couleur: "#15803d", fond: "#f0fdf4", iconPath: "M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M1 10h22" },
    { label: "Produits actifs", value: String(produitsActifs), detail: `sur ${annonces.length} annonces`, couleur: "#7c3aed", fond: "#faf5ff", iconPath: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
    { label: "Prix coherents", value: String(prixCoherents), detail: `${aVerifier} a verifier`, couleur: "#0e7490", fond: "#ecfeff", iconPath: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18" },
    { label: "Trust Score", value: "96/100", detail: "Excellent", couleur: "#d97706", fond: "#fffbeb", iconPath: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 500; color: #6b7280; transition: all 0.15s; }
        .nav-item:hover { background: #f3f4f6; color: #111827; }
        .nav-item.active { background: #f0fdf4; color: #15803d; font-weight: 700; }
        .stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px; display: flex; align-items: center; gap: 16px; }
        .row { display: grid; grid-template-columns: 2fr 1fr 1fr 70px 70px 80px; gap: 12px; align-items: center; padding: 14px 20px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
        .row:hover { background: #fafafa; }
        .row:last-child { border-bottom: none; }
        .badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
        .badge-bon { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .badge-eleve { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .topbar-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; transition: all 0.15s; }
        .topbar-btn:hover { border-color: #15803d; background: #f0fdf4; }
        .thumb { width: 36px; height: 36px; border-radius: 9px; object-fit: cover; flex-shrink: 0; border: 1px solid #e5e7eb; }
      `}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside style={{ width: 224, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100, overflowY: "auto" }}>

        {/* Logo */}
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #f3f4f6" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, background: "#15803d", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: 15 }}>
              <span style={{ color: "#15803d" }}>Student</span>
              <span style={{ color: "#111827" }}>Market</span>
            </span>
          </a>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "10px" }}>
          {NAV_ITEMS.map(item => (
            <div
              key={item.label}
              className={`nav-item${activeNav === item.label ? " active" : ""}`}
              onClick={() => setActiveNav(item.label)}
              style={{ justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <NavIcon
                  path={item.icon}
                  size={16}
                  color={activeNav === item.label ? "#15803d" : "#6b7280"}
                />
                <span>{item.label}</span>
              </div>
              {item.label === "Commandes" && commandesEnAttente > 0 && (
                <span style={{ background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 7px" }}>
                  {commandesEnAttente}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* Trust Score */}
        <div style={{ margin: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>Trust Score</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#111827" }}>
            96<span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>/100</span>
          </div>
          <p style={{ fontSize: 12, color: "#15803d", fontWeight: 700, margin: "2px 0 8px" }}>Excellent</p>
          <div style={{ height: 5, background: "#dcfce7", borderRadius: 3 }}>
            <div style={{ height: "100%", width: "96%", background: "#15803d", borderRadius: 3 }} />
          </div>
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>Continuez comme ça !</p>
        </div>

        {/* Boost */}
        <div style={{ margin: "0 10px 10px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Booster vos ventes</p>
          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, marginBottom: 10 }}>Mettez en avant vos annonces.</p>
          <button style={{ width: "100%", background: "#15803d", color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Créer une promotion
          </button>
        </div>

        {/* Support */}
        <div style={{ padding: "10px 18px 18px", borderTop: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 3 }}>Besoin d'aide ?</p>
          <a href="mailto:support@studentmarket.gh" style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>
            Contacter le support
          </a>
        </div>
      </aside>

      {/* ── CONTENU PRINCIPAL ───────────────────────────────────── */}
      <div style={{ marginLeft: 224, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* TOPBAR */}
        <header style={{ height: 58, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 24px", gap: 12, position: "sticky", top: 0, zIndex: 50 }}>

          {/* Recherche */}
          <div style={{ flex: 1, maxWidth: 440, display: "flex", alignItems: "center", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "0 12px", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder="Rechercher un produit, une commande..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "#111827", padding: "9px 0", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>

            {/* Publier */}
            <button
              onClick={() => router.push("/vendre")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Publier une annonce
            </button>

            {/* Profil */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 11px", border: "1px solid #e5e7eb", borderRadius: 10, cursor: "pointer", background: "#fff" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                {initiales}
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{prenom}</p>
                <p style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>Vendeur vérifié</p>
              </div>
            </div>

            {/* Déconnexion */}
            <button className="topbar-btn" onClick={handleLogout} title="Se déconnecter">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </header>

        {/* PAGE */}
        <main style={{ flex: 1, padding: "24px" }}>

          {/* En-tête */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 3, letterSpacing: "-0.4px" }}>
                Bienvenue, {prenom}
              </h1>
              <p style={{ fontSize: 13, color: "#9ca3af" }}>Voici ce qui se passe dans votre boutique aujourd'hui.</p>
            </div>
          </div>

          {/* STATISTIQUES */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            {STATS.map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ width: 42, height: 42, borderRadius: 11, background: s.fond, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={s.couleur} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.iconPath} />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, marginBottom: 3 }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 2, letterSpacing: "-0.5px" }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: s.couleur, fontWeight: 600 }}>{s.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {activeNav === "Commandes" ? (
            /* ── SECTION COMMANDES ─────────────────────────────── */
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Commandes reçues</h2>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{commandes.length} commande{commandes.length > 1 ? "s" : ""} au total</p>
              </div>

              {chargementCommandes ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>Chargement des commandes...</p>
                </div>
              ) : commandes.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 6 }}>Aucune commande pour le moment</p>
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>Les commandes reçues sur vos annonces apparaîtront ici.</p>
                </div>
              ) : (
                commandes.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid #f3f4f6" }}>
                    {c.annonces?.photos && c.annonces.photos.length > 0 ? (
                      <img src={c.annonces.photos[0]} alt="" className="thumb" style={{ width: 44, height: 44 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 9, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12z"/></svg>
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 1 }}>{c.annonces?.titre || "Annonce supprimée"}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af" }}>
                        Commandé par {c.acheteur_nom || "un étudiant"} · {tempsEcoule(c.created_at)}
                      </p>
                    </div>

                    <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d", flexShrink: 0 }}>
                      {formatPrix(c.annonces?.prix_vente)} GHS
                    </span>

                    <div style={{ flexShrink: 0, minWidth: 190, display: "flex", justifyContent: "flex-end" }}>
                      {c.statut === "en_attente" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => mettreAJourStatut(c.id, "confirmee")}
                            disabled={majEnCours === c.id}
                            style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => mettreAJourStatut(c.id, "refusee")}
                            disabled={majEnCours === c.id}
                            style={{ background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            Refuser
                          </button>
                        </div>
                      ) : (
                        <span className={`badge ${c.statut === "confirmee" ? "badge-bon" : "badge-eleve"}`}>
                          {c.statut === "confirmee" ? "Confirmée" : c.statut === "refusee" ? "Refusée" : c.statut}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* ── TABLEAU DES ANNONCES (onglet Dashboard par defaut) ── */
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Mes annonces récentes</h2>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{annonces.length} annonce{annonces.length > 1 ? "s" : ""} au total</p>
              </div>
              <a href="/annonces" style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>Voir toutes →</a>
            </div>

            {chargementAnnonces ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#9ca3af" }}>Chargement de vos annonces...</p>
              </div>
            ) : annonces.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 6 }}>Aucune annonce pour le moment</p>
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>Publiez votre première annonce pour commencer à vendre.</p>
                <a href="/vendre" style={{ background: "#15803d", color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700, display: "inline-block" }}>
                  Publier une annonce
                </a>
              </div>
            ) : (
              <>
                {/* En-têtes colonnes */}
                <div className="row" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "9px 20px" }}>
                  {["Produit", "Prix", "Fair Price", "Vues", "Favoris", "Statut"].map(h => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</span>
                  ))}
                </div>

                {/* Lignes */}
                {annonces.map(a => (
                  <div key={a.id} className="row">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {a.photos && a.photos.length > 0 ? (
                        <img src={a.photos[0]} alt="" className="thumb" />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12z"/></svg>
                        </div>
                      )}
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 1 }}>{a.titre}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{a.categorie} · {a.ville}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{formatPrix(a.prix_vente)} GHS</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, color: "#374151" }}>{formatPrix(a.prix_achat)} GHS</span>
                      <span className={`badge ${a.score_prix === "bon" ? "badge-bon" : "badge-eleve"}`}>
                        {a.score_prix === "bon" ? "Bon" : "À vérifier"}
                      </span>
                    </div>
                    <span style={{ color: "#374151" }}>{a.vues ?? 0}</span>
                    <span style={{ color: "#374151" }}>{a.favoris ?? 0}</span>
                    <span className={`badge ${a.statut === "actif" ? "badge-bon" : "badge-eleve"}`}>
                      {a.statut === "actif" ? "Actif" : a.statut || "—"}
                    </span>
                  </div>
                ))}
              </>
            )}

            <div style={{ padding: "12px 20px", textAlign: "center", borderTop: "1px solid #f3f4f6" }}>
              <a href="/annonces" style={{ fontSize: 13, color: "#15803d", fontWeight: 700 }}>Voir toutes mes annonces →</a>
            </div>
          </div>
          )}

        </main>
      </div>
    </div>
  );
}