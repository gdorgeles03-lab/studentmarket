"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ── TYPES ────────────────────────────────────────────────────────
type Commande = {
  id: string;
  statut: string;
  created_at: string;
  annonces: {
    titre: string;
    photos?: string[];
    prix_vente?: number;
    ville?: string;
    vendeur_nom?: string;
  } | null;
};

const NAV_ITEMS = [
  { label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { label: "Mes commandes", icon: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0" },
  { label: "Messages", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { label: "Parametres", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" },
];

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

function tempsEcoule(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

const STATUT_LABELS: Record<string, { texte: string; couleur: string; fond: string; bordure: string }> = {
  en_attente: { texte: "En attente", couleur: "#92400e", fond: "#fffbeb", bordure: "#fde68a" },
  confirmee: { texte: "Confirmée", couleur: "#15803d", fond: "#f0fdf4", bordure: "#bbf7d0" },
  refusee: { texte: "Refusée", couleur: "#dc2626", fond: "#fef2f2", bordure: "#fecaca" },
  terminee: { texte: "Terminée", couleur: "#1d4ed8", fond: "#eff6ff", bordure: "#bfdbfe" },
  annulee: { texte: "Annulée", couleur: "#6b7280", fond: "#f9fafb", bordure: "#e5e7eb" },
};

export default function DashboardAcheteur() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [chargementCommandes, setChargementCommandes] = useState(true);

  // ── Auth + redirection selon le role ────────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (!session) { router.replace("/auth"); return; }

      const role = session.user.user_metadata?.role;
      if (role === "vendeur") { router.replace("/dashboard/vendeur"); return; }

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

  // ── Chargement des VRAIES commandes de cet acheteur ─────────
  useEffect(() => {
    if (!user) return;

    async function chargerCommandes() {
      setChargementCommandes(true);
      const { data, error } = await supabase
        .from("commandes")
        .select("*, annonces(titre, photos, prix_vente, ville, vendeur_nom)")
        .eq("acheteur_id", user!.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCommandes(data as unknown as Commande[]);
      }
      setChargementCommandes(false);
    }

    chargerCommandes();
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "Inter, sans-serif" }}>
      <p style={{ color: "#9ca3af", fontSize: 14 }}>Chargement...</p>
    </div>
  );

  const nom = user?.user_metadata?.name || user?.email?.split("@")[0] || "Acheteur";
  const prenom = nom.split(" ")[0];
  const initiales = nom.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  // ── Stats calculees a partir des VRAIES commandes ───────────
  const totalCommandes = commandes.length;
  const enAttente = commandes.filter(c => c.statut === "en_attente").length;
  const confirmees = commandes.filter(c => c.statut === "confirmee").length;
  const totalDepense = commandes
    .filter(c => c.statut === "confirmee" || c.statut === "terminee")
    .reduce((s, c) => s + (c.annonces?.prix_vente || 0), 0);

  const STATS = [
    { label: "Commandes totales", value: String(totalCommandes), detail: `${enAttente} en attente`, couleur: "#15803d", fond: "#f0fdf4", iconPath: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18" },
    { label: "En attente", value: String(enAttente), detail: "de confirmation vendeur", couleur: "#d97706", fond: "#fffbeb", iconPath: "M12 8v4l3 3 M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z" },
    { label: "Confirmées", value: String(confirmees), detail: "prêtes à récupérer", couleur: "#1d4ed8", fond: "#eff6ff", iconPath: "M20 6L9 17l-5-5" },
    { label: "Total dépensé", value: `${formatPrix(totalDepense)} GHS`, detail: "commandes confirmées", couleur: "#7c3aed", fond: "#faf5ff", iconPath: "M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M1 10h22" },
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
        .topbar-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; transition: all 0.15s; }
        .topbar-btn:hover { border-color: #15803d; background: #f0fdf4; }
        .thumb { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; flex-shrink: 0; border: 1px solid #e5e7eb; }
      `}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside style={{ width: 224, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100, overflowY: "auto" }}>
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

        <nav style={{ flex: 1, padding: "10px" }}>
          {NAV_ITEMS.map(item => (
            <div
              key={item.label}
              className={`nav-item${activeNav === item.label ? " active" : ""}`}
              onClick={() => setActiveNav(item.label)}
            >
              <NavIcon path={item.icon} size={16} color={activeNav === item.label ? "#15803d" : "#6b7280"} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.label === "Mes commandes" && enAttente > 0 && (
                <span style={{ background: "#d97706", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 7px" }}>
                  {enAttente}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div style={{ margin: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#15803d", marginBottom: 4 }}>Envie de vendre aussi ?</p>
          <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5, marginBottom: 10 }}>Créez une annonce en quelques minutes.</p>
          <a href="/vendre" style={{ display: "block", textAlign: "center", background: "#15803d", color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700 }}>
            Publier une annonce
          </a>
        </div>

        <div style={{ padding: "10px 18px 18px", borderTop: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 3 }}>Besoin d'aide ?</p>
          <a href="mailto:support@studentmarket.gh" style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>
            Contacter le support
          </a>
        </div>
      </aside>

      {/* ── CONTENU PRINCIPAL ───────────────────────────────────── */}
      <div style={{ marginLeft: 224, flex: 1, display: "flex", flexDirection: "column" }}>

        <header style={{ height: 58, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 24px", gap: 12, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ flex: 1, maxWidth: 440, display: "flex", alignItems: "center", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "0 12px", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder="Rechercher un produit..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "#111827", padding: "9px 0", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => router.push("/annonces")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Explorer la marketplace
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 11px", border: "1px solid #e5e7eb", borderRadius: 10, cursor: "pointer", background: "#fff" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                {initiales}
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{prenom}</p>
                <p style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>Acheteur vérifié</p>
              </div>
            </div>

            <button className="topbar-btn" onClick={handleLogout} title="Se déconnecter">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: "24px" }}>

          <div style={{ marginBottom: 22 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 3, letterSpacing: "-0.4px" }}>
              Bienvenue, {prenom}
            </h1>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Voici un résumé de vos commandes.</p>
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

          {/* MES COMMANDES */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Mes commandes</h2>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{commandes.length} commande{commandes.length > 1 ? "s" : ""} au total</p>
            </div>

            {chargementCommandes ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#9ca3af" }}>Chargement de vos commandes...</p>
              </div>
            ) : commandes.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 6 }}>Aucune commande pour le moment</p>
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>Parcourez la marketplace pour trouver votre bonheur.</p>
                <a href="/annonces" style={{ background: "#15803d", color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700, display: "inline-block" }}>
                  Explorer les annonces
                </a>
              </div>
            ) : (
              commandes.map(c => {
                const s = STATUT_LABELS[c.statut] || STATUT_LABELS.en_attente;
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid #f3f4f6" }}>
                    {c.annonces?.photos && c.annonces.photos.length > 0 ? (
                      <img src={c.annonces.photos[0]} alt="" className="thumb" />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12z"/></svg>
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 1 }}>{c.annonces?.titre || "Annonce supprimée"}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af" }}>
                        Vendu par {c.annonces?.vendeur_nom || "un étudiant"} · {c.annonces?.ville} · {tempsEcoule(c.created_at)}
                      </p>
                    </div>

                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", flexShrink: 0 }}>
                      {formatPrix(c.annonces?.prix_vente)} GHS
                    </span>

                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: s.fond, color: s.couleur, border: `1px solid ${s.bordure}`, flexShrink: 0 }}>
                      {s.texte}
                    </span>

                    {c.statut === "confirmee" && (
                      <a
                        href={`/messages/${c.id}`}
                        style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: "#15803d", borderRadius: 8, padding: "8px 14px", flexShrink: 0 }}
                      >
                        Discuter
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </main>
      </div>
    </div>
  );
}