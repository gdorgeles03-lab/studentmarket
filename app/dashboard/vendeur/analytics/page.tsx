"use client";
import { useEffect, useState, useMemo } from "react";
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
  telephone?: string;
};

type CommandeGraph = {
  created_at: string;
  statut: string;
  annonces?: {
    titre: string;
    ville: string;
    categorie: string;
    prix_vente: number;
  }[];
};

function Icon({ name, size = 18, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const s: React.CSSProperties = { width: size, height: size };
  const p = { fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, React.ReactElement> = {
    grid: <svg viewBox="0 0 24 24" style={s} {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    box: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    shopping: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
    message: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    chart: <svg viewBox="0 0 24 24" style={s} {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    wallet: <svg viewBox="0 0 24 24" style={s} {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    star: <svg viewBox="0 0 24 24" style={s} {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    settings: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    bell: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    search: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    plus: <svg viewBox="0 0 24 24" style={s} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    trash: <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    eye: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    arrow: <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    logout: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    shield: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    check: <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    close: <svg viewBox="0 0 24 24" style={s} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    map: <svg viewBox="0 0 24 24" style={s} {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    trending: <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    calendar: <svg viewBox="0 0 24 24" style={s} {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    lock: <svg viewBox="0 0 24 24" style={s} {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  };
  return icons[name] || <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="12" cy="12" r="10"/></svg>;
}

const NAV_ITEMS = [
  { label: "Dashboard",    icon: "grid" },
  { label: "Mes Produits", icon: "box" },
  { label: "Commandes",    icon: "shopping", badge: 0 },
  { label: "Messages",     icon: "message",  badge: 0 },
  { label: "Analytics",   icon: "chart" },
  { label: "Wallet",      icon: "wallet" },
  { label: "Avis Clients",icon: "star" },
  { label: "Parametres",  icon: "settings" },
];

type Periode = "7j" | "30j" | "3m" | "12m";

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getDateDebut(periode: Periode): Date {
  const d = new Date();
  if (periode === "7j")  { d.setDate(d.getDate() - 7); }
  if (periode === "30j") { d.setDate(d.getDate() - 30); }
  if (periode === "3m")  { d.setMonth(d.getMonth() - 3); }
  if (periode === "12m") { d.setFullYear(d.getFullYear() - 1); }
  return d;
}

export default function DashboardVendeur() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [commandes, setCommandes] = useState<CommandeGraph[]>([]);
  const [toutesCommandes, setToutesCommandes] = useState<CommandeGraph[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [rechercheActive, setRechercheActive] = useState(false);

  // Analytics
  const [periodeAnalytics, setPeriodeAnalytics] = useState<Periode>("30j");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }
      setUser(session.user);

      const { data: annoncesData } = await supabase
        .from("annonces").select("*")
        .eq("vendeur_id", session.user.id)
        .order("created_at", { ascending: false });
      if (annoncesData) setAnnonces(annoncesData);

      // Commandes 30j pour le graphique dashboard
      const il_y_a_30j = new Date();
      il_y_a_30j.setDate(il_y_a_30j.getDate() - 30);
      const { data: commandesData } = await supabase
        .from("commandes")
        .select("created_at, statut, annonces(titre, ville, categorie, prix_vente)")
        .eq("vendeur_id", session.user.id)
        .gte("created_at", il_y_a_30j.toISOString());
      if (commandesData) setCommandes(commandesData as CommandeGraph[]);

      // Toutes les commandes pour analytics
      const { data: toutesData } = await supabase
        .from("commandes")
        .select("created_at, statut, annonces(titre, ville, categorie, prix_vente)")
        .eq("vendeur_id", session.user.id)
        .order("created_at", { ascending: true });
      if (toutesData) setToutesCommandes(toutesData as CommandeGraph[]);

      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) router.replace("/auth");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // ── GRAPHIQUE 30J ─────────────────────────────────────────────
  const donneesGraphique = useMemo(() => {
    const jours = getLast30Days();
    return jours.map(jour => ({
      jour,
      commandes: commandes.filter(c => c.created_at.split("T")[0] === jour && c.statut === "confirmee").length,
      ventes: commandes.filter(c => c.created_at.split("T")[0] === jour && c.statut === "terminee").length,
    }));
  }, [commandes]);

  const maxVal = useMemo(() => Math.max(...donneesGraphique.map(d => Math.max(d.commandes, d.ventes)), 1), [donneesGraphique]);

  // ── ANALYTICS PAR PÉRIODE ─────────────────────────────────────
  const commandesPeriode = useMemo(() => {
    const debut = getDateDebut(periodeAnalytics);
    return toutesCommandes.filter(c => new Date(c.created_at) >= debut);
  }, [toutesCommandes, periodeAnalytics]);

  const analyticsData = useMemo(() => {
    const confirmees = commandesPeriode.filter(c => c.statut === "confirmee" || c.statut === "terminee");
    const terminees  = commandesPeriode.filter(c => c.statut === "terminee");
    const totalVues  = annonces.reduce((s, a) => s + (a.vues || 0), 0);
    const totalVuesPeriode = totalVues; // vues cumulées (pas de date sur les vues)
    const revenuPeriode = terminees.reduce((s, c) => s + ((c.annonces as any)?.prix_vente || 0), 0);
    const tauxConversion = totalVues > 0 ? ((confirmees.length / totalVues) * 100).toFixed(1) : "0";

    // Article le plus vendu
    const compteur: Record<string, { count: number; titre: string; revenu: number }> = {};
    terminees.forEach(c => {
      const titre = (c.annonces as any)?.titre || "Inconnu";
      if (!compteur[titre]) compteur[titre] = { count: 0, titre, revenu: 0 };
      compteur[titre].count += 1;
      compteur[titre].revenu += (c.annonces as any)?.prix_vente || 0;
    });
    const topProduits = Object.values(compteur).sort((a, b) => b.count - a.count).slice(0, 3);

    // Zones géographiques
    const zones: Record<string, number> = {};
    confirmees.forEach(c => {
      const ville = (c.annonces as any)?.ville || "Inconnue";
      zones[ville] = (zones[ville] || 0) + 1;
    });
    const topZones = Object.entries(zones).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Graphique par semaine ou mois selon la période
    const buckets: { label: string; commandes: number; ventes: number }[] = [];
    const nbBuckets = periodeAnalytics === "7j" ? 7 : periodeAnalytics === "30j" ? 10 : periodeAnalytics === "3m" ? 6 : 12;
    const debut = getDateDebut(periodeAnalytics);
    const intervalMs = (Date.now() - debut.getTime()) / nbBuckets;

    for (let i = 0; i < nbBuckets; i++) {
      const start = new Date(debut.getTime() + i * intervalMs);
      const end   = new Date(debut.getTime() + (i + 1) * intervalMs);
      const label = start.toLocaleDateString("fr-FR", periodeAnalytics === "7j" || periodeAnalytics === "30j"
        ? { day: "numeric", month: "short" }
        : { month: "short" }
      );
      const cmd = commandesPeriode.filter(c => {
        const d = new Date(c.created_at);
        return d >= start && d < end && c.statut === "confirmee";
      }).length;
      const vte = commandesPeriode.filter(c => {
        const d = new Date(c.created_at);
        return d >= start && d < end && c.statut === "terminee";
      }).length;
      buckets.push({ label, commandes: cmd, ventes: vte });
    }

    return {
      totalCommandes: confirmees.length,
      totalVentes: terminees.length,
      revenuPeriode,
      totalVuesPeriode,
      tauxConversion,
      topProduits,
      topZones,
      buckets,
    };
  }, [commandesPeriode, annonces, periodeAnalytics]);

  // ── RECHERCHE ────────────────────────────────────────────────
  const annoncesFiltrees = useMemo(() => {
    if (!recherche.trim()) return annonces;
    const q = recherche.toLowerCase().trim();
    return annonces.filter(a =>
      a.titre?.toLowerCase().includes(q) ||
      a.categorie?.toLowerCase().includes(q) ||
      a.ville?.toLowerCase().includes(q)
    );
  }, [annonces, recherche]);

  async function supprimerAnnonce(id: string) {
    const { error } = await supabase.from("annonces").delete().eq("id", id);
    if (!error) setAnnonces(prev => prev.filter(a => a.id !== id));
    setDeleteId(null);
  }

  function handleRechercheChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setRecherche(val);
    setRechercheActive(!!val.trim());
    if (val.trim()) setActiveNav("Dashboard");
  }

  function clearRecherche() { setRecherche(""); setRechercheActive(false); }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "Inter, sans-serif" }}>
      <p style={{ color: "#9ca3af", fontSize: 14 }}>Chargement...</p>
    </div>
  );

  const nom = user?.user_metadata?.name || user?.email?.split("@")[0] || "Vendeur";
  const prenom = nom.split(" ")[0];
  const initiales = nom.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const totalRevenu = annonces.reduce((s, a) => s + (a.prix_vente || 0), 0);
  const trustScore = 96;
  const totalCommandes30j = commandes.filter(c => c.statut === "confirmee" || c.statut === "terminee").length;
  const totalVentes30j    = commandes.filter(c => c.statut === "terminee").length;
  const aucuneDonnee = commandes.length === 0;

  const W = 580; const H = 140; const PL = 10; const PR = 10; const GW = W - PL - PR;

  function pointsLigne(data: { commandes: number; ventes: number }[], cle: "commandes" | "ventes") {
    return data.map((d, i) => {
      const x = PL + (i / Math.max(data.length - 1, 1)) * GW;
      const y = H - (maxVal > 0 ? (d[cle] / maxVal) * (H - 10) : 0);
      return `${x},${y}`;
    }).join(" ");
  }

  function aireRemplie(data: { commandes: number; ventes: number }[], cle: "commandes" | "ventes") {
    const pts = data.map((d, i) => {
      const x = PL + (i / Math.max(data.length - 1, 1)) * GW;
      const y = H - (maxVal > 0 ? (d[cle] / maxVal) * (H - 10) : 0);
      return `${x},${y}`;
    });
    return `M ${pts[0]} L ${pts.join(" L ")} L ${PL + GW},${H} L ${PL},${H} Z`;
  }

  // Pour le graphique analytics
  const maxAnalytics = Math.max(...analyticsData.buckets.map(b => Math.max(b.commandes, b.ventes)), 1);
  function ptAnalytics(data: { commandes: number; ventes: number }[], cle: "commandes" | "ventes") {
    return data.map((d, i) => {
      const x = PL + (i / Math.max(data.length - 1, 1)) * GW;
      const y = H - (maxAnalytics > 0 ? (d[cle] / maxAnalytics) * (H - 10) : 0);
      return `${x},${y}`;
    }).join(" ");
  }

  const labelsJours = donneesGraphique.filter((_, i) => i % 5 === 0 || i === 29).map(d =>
    new Date(d.jour).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
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
        .stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; }
        .product-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; transition: all 0.2s; }
        .product-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
        .icon-btn.danger:hover { border-color: #dc2626; background: #fef2f2; }
        .topbar-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; }
        .topbar-btn:hover { border-color: #15803d; background: #f0fdf4; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 500; display: flex; align-items: center; justify-content: center; }
        .action-btn { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 12px; background: #f9fafb; border: 1px solid #e5e7eb; cursor: pointer; transition: all 0.15s; font-size: 14px; font-weight: 600; color: #374151; width: 100%; font-family: inherit; }
        .action-btn:hover { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
        .search-result-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #f3f4f6; transition: background 0.1s; }
        .search-result-item:hover { background: #f9fafb; }
        .search-result-item:last-child { border-bottom: none; }
        .periode-btn { padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280; font-family: inherit; transition: all 0.15s; }
        .periode-btn.active { background: #15803d; color: #fff; border-color: #15803d; }
        .periode-btn:hover:not(.active) { border-color: #15803d; color: #15803d; }
        .analytics-kpi { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; }
        .zone-bar { height: 8px; border-radius: 4px; background: #15803d; transition: width 0.5s; }
        .premium-badge { display: inline-flex; align-items: center; gap: 5px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
      `}</style>

      {/* MODAL SUPPRESSION */}
      {deleteId && (
        <div className="overlay" onClick={() => setDeleteId(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px", maxWidth: 400, width: "90%", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", border: "2px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Icon name="trash" size={24} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Supprimer cette annonce ?</h3>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }}>Cette action est irréversible.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
              <button onClick={() => supprimerAnnonce(deleteId)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Supprimer</button>
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
            <div key={item.label} className={`nav-item${activeNav === item.label && !rechercheActive ? " active" : ""}`}
              onClick={() => { setActiveNav(item.label); clearRecherche(); }}>
              <Icon name={item.icon} size={17} color={activeNav === item.label && !rechercheActive ? "#15803d" : "#6b7280"} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.label === "Analytics" && (
                <span style={{ fontSize: 10, fontWeight: 700, background: "#fffbeb", color: "#92400e", padding: "1px 6px", borderRadius: 4, border: "1px solid #fde68a" }}>NEW</span>
              )}
            </div>
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
          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Besoin d'aide ?</p>
          <button style={{ background: "transparent", border: "none", color: "#15803d", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
            Contacter le support
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: 230, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* TOPBAR */}
        <header style={{ height: 60, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 28px", gap: 16, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ flex: 1, maxWidth: 480, display: "flex", alignItems: "center", background: "#f9fafb", border: `1.5px solid ${rechercheActive ? "#15803d" : "#e5e7eb"}`, borderRadius: 10, padding: "0 14px", gap: 8, transition: "border-color 0.2s" }}>
            <Icon name="search" size={15} color={rechercheActive ? "#15803d" : "#9ca3af"} />
            <input
              value={recherche}
              onChange={handleRechercheChange}
              placeholder="Rechercher un produit, une catégorie, une ville..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "#111827", padding: "9px 0", fontFamily: "inherit" }}
            />
            {rechercheActive && (
              <button onClick={clearRecherche} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
                <Icon name="close" size={14} color="#9ca3af" />
              </button>
            )}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "#fff", border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }} onClick={() => router.push("/vendre")}>
              <Icon name="plus" size={15} color="#fff" /> Publier une annonce
            </button>
            <div className="topbar-btn"><Icon name="bell" size={17} color="#6b7280" /></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 10, cursor: "pointer", background: "#fff" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{initiales}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{prenom}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Vendeur vérifié</span>
                  <Icon name="check" size={11} color="#15803d" />
                </div>
              </div>
            </div>
            <button className="topbar-btn" onClick={async () => { await supabase.auth.signOut(); router.replace("/auth"); }}>
              <Icon name="logout" size={16} color="#6b7280" />
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px" }}>

          {/* ── RÉSULTATS RECHERCHE ── */}
          {rechercheActive && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
                    Résultats pour "<span style={{ color: "#15803d" }}>{recherche}</span>"
                  </h1>
                  <p style={{ fontSize: 14, color: "#9ca3af" }}>{annoncesFiltrees.length} résultat{annoncesFiltrees.length > 1 ? "s" : ""}</p>
                </div>
                <button onClick={clearRecherche} style={{ fontSize: 13, color: "#6b7280", background: "transparent", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit" }}>Effacer</button>
              </div>
              {annoncesFiltrees.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 14, padding: "60px 24px", textAlign: "center", border: "1px solid #e5e7eb" }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Aucun résultat</p>
                  <p style={{ fontSize: 14, color: "#9ca3af" }}>Aucune annonce ne correspond à "{recherche}"</p>
                </div>
              ) : (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
                  {annoncesFiltrees.map(a => {
                    const photo = Array.isArray(a.photos) && a.photos.length > 0 ? a.photos[0] : null;
                    return (
                      <div key={a.id} className="search-result-item">
                        <div style={{ width: 48, height: 48, borderRadius: 10, background: "#f0fdf4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {photo ? <img src={photo} alt={a.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name="box" size={20} color="#86efac" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{a.titre}</p>
                          <p style={{ fontSize: 12, color: "#9ca3af" }}>{a.categorie} · {a.ville}</p>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "#15803d" }}>{(a.prix_vente || 0).toLocaleString()} GHS</p>
                        <button className="icon-btn danger" onClick={() => setDeleteId(a.id)} style={{ marginLeft: 12 }}>
                          <Icon name="trash" size={14} color="#dc2626" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── MES PRODUITS ── */}
          {!rechercheActive && activeNav === "Mes Produits" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 4 }}>Mes Produits</h1>
                  <p style={{ fontSize: 14, color: "#9ca3af" }}>{annonces.length} annonce{annonces.length > 1 ? "s" : ""} publiée{annonces.length > 1 ? "s" : ""}</p>
                </div>
                <button onClick={() => router.push("/vendre")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  <Icon name="plus" size={16} color="#fff" /> Nouvelle annonce
                </button>
              </div>
              {annonces.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 24px", background: "#fff", borderRadius: 16, border: "1px dashed #d1d5db" }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Aucun produit publié</p>
                  <button onClick={() => router.push("/vendre")} style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Publier ma première annonce
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {annonces.map(a => {
                    const photo = Array.isArray(a.photos) && a.photos.length > 0 ? a.photos[0] : null;
                    return (
                      <div key={a.id} className="product-card">
                        <div style={{ height: 180, background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", position: "relative", overflow: "hidden" }}>
                          {photo ? <img src={photo} alt={a.titre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="box" size={40} color="#86efac" /></div>}
                          <div style={{ position: "absolute", top: 10, left: 10, background: "#15803d", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>
                            {a.statut ? a.statut.charAt(0).toUpperCase() + a.statut.slice(1) : "Actif"}
                          </div>
                        </div>
                        <div style={{ padding: 16 }}>
                          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{a.categorie} · {a.ville}</p>
                          <p style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{a.titre}</p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151", fontFamily: "inherit" }} onClick={() => router.push("/annonces")}>Voir</button>
                            <button className="icon-btn danger" onClick={() => setDeleteId(a.id)}><Icon name="trash" size={14} color="#dc2626" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {!rechercheActive && activeNav === "Analytics" && (
            <div>
              {/* En-tête */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 4, letterSpacing: "-0.4px" }}>Analytics</h1>
                  <p style={{ fontSize: 14, color: "#9ca3af" }}>Performance de vos ventes sur StudentMarket</p>
                </div>
                {/* Sélecteur période */}
                <div style={{ display: "flex", gap: 6, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "4px" }}>
                  {(["7j", "30j", "3m", "12m"] as Periode[]).map(p => (
                    <button key={p} className={`periode-btn${periodeAnalytics === p ? " active" : ""}`} onClick={() => setPeriodeAnalytics(p)}>
                      {p === "7j" ? "7 jours" : p === "30j" ? "30 jours" : p === "3m" ? "3 mois" : "12 mois"}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                {[
                  { label: "Commandes reçues",  value: String(analyticsData.totalCommandes), sub: "sur la période", icon: "shopping", color: "#15803d",  bg: "#f0fdf4" },
                  { label: "Ventes finalisées", value: String(analyticsData.totalVentes),    sub: "transactions terminées", icon: "check",    color: "#1d4ed8",  bg: "#eff6ff" },
                  { label: "Revenu estimé",     value: `${analyticsData.revenuPeriode.toLocaleString()} GHS`, sub: "ventes confirmées", icon: "wallet", color: "#7c3aed",  bg: "#faf5ff" },
                  { label: "Taux conversion",   value: `${analyticsData.tauxConversion}%`,  sub: "vues → commandes", icon: "trending",  color: "#d97706",  bg: "#fffbeb" },
                ].map(s => (
                  <div key={s.label} className="analytics-kpi">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={s.icon} size={17} color={s.color} />
                      </div>
                      <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{s.label}</span>
                    </div>
                    <p style={{ fontSize: 26, fontWeight: 900, color: "#111827", marginBottom: 3, letterSpacing: "-0.5px" }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Graphique évolution */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Évolution commandes & ventes</h2>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{analyticsData.totalCommandes} commandes · {analyticsData.totalVentes} ventes sur la période</p>
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 10, height: 3, background: "#15803d", borderRadius: 2 }} />
                      <span style={{ fontSize: 11, color: "#6b7280" }}>Commandes</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 10, height: 3, background: "#7c3aed", borderRadius: 2, borderTop: "2px dashed #7c3aed" }} />
                      <span style={{ fontSize: 11, color: "#6b7280" }}>Ventes</span>
                    </div>
                  </div>
                </div>
                {analyticsData.totalCommandes === 0 ? (
                  <div style={{ height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f9fafb", borderRadius: 10, border: "1px dashed #e5e7eb" }}>
                    <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>Aucune activité sur cette période</p>
                    <p style={{ fontSize: 11, color: "#d1d5db" }}>Les données apparaîtront à la première commande</p>
                  </div>
                ) : (
                  <>
                    <svg width="100%" height="160" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#15803d" stopOpacity="0.15"/><stop offset="100%" stopColor="#15803d" stopOpacity="0"/></linearGradient>
                        <linearGradient id="gradV" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.1"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/></linearGradient>
                      </defs>
                      {[0,1,2,3].map(i => <line key={i} x1="0" y1={i*(H/3)} x2={W} y2={i*(H/3)} stroke="#f3f4f6" strokeWidth="1"/>)}
                      <path d={`M ${PL},${H} L ${analyticsData.buckets.map((d,i) => `${PL+(i/Math.max(analyticsData.buckets.length-1,1))*GW},${H-(maxAnalytics>0?(d.commandes/maxAnalytics)*(H-10):0)}`).join(" L ")} L ${PL+GW},${H} Z`} fill="url(#gradC)" />
                      <polyline points={ptAnalytics(analyticsData.buckets, "commandes")} fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d={`M ${PL},${H} L ${analyticsData.buckets.map((d,i) => `${PL+(i/Math.max(analyticsData.buckets.length-1,1))*GW},${H-(maxAnalytics>0?(d.ventes/maxAnalytics)*(H-10):0)}`).join(" L ")} L ${PL+GW},${H} Z`} fill="url(#gradV)" />
                      <polyline points={ptAnalytics(analyticsData.buckets, "ventes")} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2"/>
                    </svg>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                      {analyticsData.buckets.filter((_, i) => i % Math.ceil(analyticsData.buckets.length / 6) === 0 || i === analyticsData.buckets.length - 1).map((b, i) => (
                        <span key={i} style={{ fontSize: 10, color: "#9ca3af" }}>{b.label}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Produits + Zones */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

                {/* Top produits */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Articles les plus vendus</h2>
                    <Icon name="star" size={16} color="#d97706" />
                  </div>
                  {analyticsData.topProduits.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>Aucune vente finalisée sur cette période</p>
                  ) : analyticsData.topProduits.map((p, i) => (
                    <div key={p.titre} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < analyticsData.topProduits.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "#fffbeb" : "#f9fafb", border: `1px solid ${i === 0 ? "#fde68a" : "#e5e7eb"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: i === 0 ? "#d97706" : "#9ca3af", flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.titre}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{p.count} vente{p.count > 1 ? "s" : ""}</p>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#15803d", flexShrink: 0 }}>{p.revenu.toLocaleString()} GHS</p>
                    </div>
                  ))}
                </div>

                {/* Zones géographiques */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Zones les plus actives</h2>
                    <Icon name="map" size={16} color="#0e7490" />
                  </div>
                  {analyticsData.topZones.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>Aucune donnée géographique disponible</p>
                  ) : (() => {
                    const maxZone = Math.max(...analyticsData.topZones.map(z => z[1]), 1);
                    return analyticsData.topZones.map(([ville, count]) => (
                      <div key={ville} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{ville}</span>
                          <span style={{ fontSize: 12, color: "#9ca3af" }}>{count} commande{count > 1 ? "s" : ""}</span>
                        </div>
                        <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                          <div className="zone-bar" style={{ width: `${(count / maxZone) * 100}%` }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Vues & Audience */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Audience & Visibilité</h2>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Nombre de fois où vos annonces ont été vues</p>
                  </div>
                  <Icon name="eye" size={16} color="#6b7280" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {[
                    { label: "Vues totales",    value: annonces.reduce((s, a) => s + (a.vues || 0), 0), color: "#1d4ed8" },
                    { label: "Favoris totaux",  value: annonces.reduce((s, a) => s + (a.favoris || 0), 0), color: "#dc2626" },
                    { label: "Annonces actives",value: annonces.filter(a => !a.statut || a.statut === "actif").length, color: "#15803d" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#f9fafb", borderRadius: 10, padding: "16px", textAlign: "center" }}>
                      <p style={{ fontSize: 28, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</p>
                      <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bannière Premium */}
              <div style={{ background: "linear-gradient(135deg, #052e16 0%, #15803d 100%)", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Icon name="star" size={16} color="#fbbf24" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24" }}>Analytics Premium</span>
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 2 }}>Débloquez les analyses avancées : prédictions de prix, comparaison marché, recommandations automatiques.</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Disponible prochainement pour les vendeurs premium.</p>
                </div>
                <button style={{ background: "#fbbf24", color: "#111827", border: "none", borderRadius: 9, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, marginLeft: 20 }}>
                  En savoir plus
                </button>
              </div>
            </div>
          )}
          
          {!rechercheActive && ["Wallet", "Avis Clients", "Parametres"].includes(activeNav) && (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Icon name={NAV_ITEMS.find(n => n.label === activeNav)?.icon || "grid"} size={28} color="#15803d" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{activeNav}</h2>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>Cette section sera disponible prochainement.</p>
          </div>
          )}

          {/* ── DASHBOARD PRINCIPAL ── */}
          {!rechercheActive && activeNav === "Dashboard" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111827", marginBottom: 4, letterSpacing: "-0.5px" }}>Bienvenue, {prenom} !</h1>
                <p style={{ fontSize: 14, color: "#9ca3af" }}>Voici ce qui se passe dans votre boutique aujourd'hui.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Revenus totaux",    value: `${totalRevenu.toLocaleString()} GHS`, sub: `${annonces.length} annonces au total`, icon: "wallet",   color: "#15803d", bg: "#f0fdf4" },
                  { label: "Produits actifs",   value: String(annonces.filter(a => !a.statut || a.statut === "actif").length), sub: `sur ${annonces.length} annonces`, icon: "box", color: "#7c3aed", bg: "#faf5ff" },
                  { label: "Commandes reçues",  value: String(totalCommandes30j), sub: `${totalVentes30j} vente${totalVentes30j > 1 ? "s" : ""} finalisée${totalVentes30j > 1 ? "s" : ""}`, icon: "shopping", color: "#0e7490", bg: "#ecfeff" },
                  { label: "Trust Score",       value: `${trustScore}/100`, sub: "Excellent", icon: "star", color: "#d97706", bg: "#fffbeb" },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={s.icon} size={20} color={s.color} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, marginBottom: 4 }}>{s.label}</p>
                      <p style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 2, letterSpacing: "-0.5px" }}>{s.value}</p>
                      <p style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 16, marginBottom: 24 }}>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Activité sur 30 jours</h2>
                      <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{totalCommandes30j} commandes · {totalVentes30j} ventes finalisées</p>
                    </div>
                    <div style={{ display: "flex", gap: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 3, background: "#15803d", borderRadius: 2 }} /><span style={{ fontSize: 11, color: "#6b7280" }}>Commandes</span></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 3, background: "#7c3aed", borderRadius: 2 }} /><span style={{ fontSize: 11, color: "#6b7280" }}>Ventes</span></div>
                    </div>
                  </div>
                  {aucuneDonnee ? (
                    <div style={{ height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f9fafb", borderRadius: 10, border: "1px dashed #e5e7eb" }}>
                      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>Aucune activité sur 30 jours</p>
                      <p style={{ fontSize: 11, color: "#d1d5db" }}>Le graphique apparaîtra à la première commande confirmée</p>
                    </div>
                  ) : (
                    <>
                      <svg width="100%" height="160" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="gradCommandes" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#15803d" stopOpacity="0.15"/><stop offset="100%" stopColor="#15803d" stopOpacity="0"/></linearGradient>
                          <linearGradient id="gradVentes" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.1"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/></linearGradient>
                        </defs>
                        {[0,1,2,3].map(i => <line key={i} x1="0" y1={i*(H/3)} x2={W} y2={i*(H/3)} stroke="#f3f4f6" strokeWidth="1"/>)}
                        <path d={aireRemplie(donneesGraphique, "commandes")} fill="url(#gradCommandes)" />
                        <polyline points={pointsLigne(donneesGraphique, "commandes")} fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d={aireRemplie(donneesGraphique, "ventes")} fill="url(#gradVentes)" />
                        <polyline points={pointsLigne(donneesGraphique, "ventes")} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2"/>
                        {donneesGraphique.map((d, i) => d.commandes > 0 && <circle key={`c${i}`} cx={PL+(i/(donneesGraphique.length-1))*GW} cy={H-(maxVal>0?(d.commandes/maxVal)*(H-10):0)} r="4" fill="#fff" stroke="#15803d" strokeWidth="2.5"/>)}
                        {donneesGraphique.map((d, i) => d.ventes > 0 && <circle key={`v${i}`} cx={PL+(i/(donneesGraphique.length-1))*GW} cy={H-(maxVal>0?(d.ventes/maxVal)*(H-10):0)} r="4" fill="#fff" stroke="#7c3aed" strokeWidth="2"/>)}
                      </svg>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        {labelsJours.map((l, i) => <span key={i} style={{ fontSize: 10, color: "#9ca3af" }}>{l}</span>)}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px" }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 16 }}>Actions rapides</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Nouvelle annonce",   icon: "plus",    action: () => router.push("/vendre") },
                      { label: "Mes produits",        icon: "box",     action: () => setActiveNav("Mes Produits") },
                      { label: "Voir les Analytics",  icon: "chart",   action: () => setActiveNav("Analytics") },
                    ].map(a => (
                      <button key={a.label} className="action-btn" onClick={a.action}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Icon name={a.icon} size={15} color="#374151" />
                          <span>{a.label}</span>
                        </div>
                        <Icon name="arrow" size={14} color="#9ca3af" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #e5e7eb" }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Mes annonces récentes</h2>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>{annonces.length} annonce{annonces.length > 1 ? "s" : ""} au total</p>
                  </div>
                  <button onClick={() => setActiveNav("Mes Produits")} style={{ fontSize: 13, color: "#15803d", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Voir toutes →</button>
                </div>
                <div style={{ padding: "10px 20px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 90px", gap: 12 }}>
                  {["Produit", "Prix", "Fair Price", "Statut"].map(h => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</span>
                  ))}
                </div>
                {annonces.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px", color: "#9ca3af", fontSize: 14 }}>Aucune annonce publiée.</div>
                ) : annonces.slice(0, 5).map(a => {
                  const photo = Array.isArray(a.photos) && a.photos.length > 0 ? a.photos[0] : null;
                  return (
                    <div key={a.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 90px", gap: 12, padding: "14px 20px", borderBottom: "1px solid #f3f4f6", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0fdf4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {photo ? <img src={photo} alt={a.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name="box" size={18} color="#86efac" />}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{a.titre}</p>
                          <p style={{ fontSize: 11, color: "#9ca3af" }}>{a.categorie} · {a.ville}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{(a.prix_vente || 0).toLocaleString()} GHS</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, color: "#374151" }}>{(a.prix_achat || 0).toLocaleString()} GHS</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: a.score_prix === "bon" ? "#f0fdf4" : "#fffbeb", color: a.score_prix === "bon" ? "#15803d" : "#92400e" }}>
                          {a.score_prix === "bon" ? "Bon" : "Élevé"}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "#f0fdf4", color: "#15803d", display: "inline-block" }}>
                        {a.statut ? a.statut.charAt(0).toUpperCase() + a.statut.slice(1) : "Actif"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}