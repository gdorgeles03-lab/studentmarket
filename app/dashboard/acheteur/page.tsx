"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { formatPrix } from "@/lib/format";

type Commande = {
  id: string;
  statut: "en_attente" | "confirmee" | "refusee" | "terminee" | "annulee";
  created_at: string;
  annonces?: {
    titre: string;
    prix_vente: number;
    photos: string[];
  };
};

function Icon({ path, size = 18, color = "currentColor" }: { path: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const STATUTS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  en_attente: { label: "En attente", bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  confirmee: { label: "Confirmée", bg: "#F0FDF4", color: "#15803d", border: "#86EFAC" },
  refusee: { label: "Refusée", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  terminee: { label: "Terminée", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  annulee: { label: "Annulée", bg: "#F9FAFB", color: "#6B7280", border: "#E5E7EB" },
};

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getDailyBuckets(nbJours: number) {
  const buckets: { start: Date; end: Date; date: Date }[] = [];
  for (let i = nbJours - 1; i >= 0; i--) {
    const jour = new Date();
    jour.setHours(0, 0, 0, 0);
    jour.setDate(jour.getDate() - i);
    const fin = new Date(jour);
    fin.setDate(fin.getDate() + 1);
    buckets.push({ start: jour, end: fin, date: jour });
  }
  return buckets;
}

function getMonthlyBuckets() {
  const buckets: { start: Date; end: Date; date: Date }[] = [];
  const maintenant = new Date();
  for (let i = 11; i >= 0; i--) {
    const debut = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
    const fin = new Date(maintenant.getFullYear(), maintenant.getMonth() - i + 1, 1);
    buckets.push({ start: debut, end: fin, date: debut });
  }
  return buckets;
}

export default function DashboardAcheteur() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<"semaine" | "mois" | "annee">("mois");
  const labelsJours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }

      const role = session.user.user_metadata?.role;
      if (role === "vendeur") { router.replace("/dashboard/vendeur"); return; }

      setUser(session.user);

      const { data } = await supabase
        .from("commandes")
        .select("*, annonces(titre, prix_vente, photos)")
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

  const donneesGraphique = useMemo(() => {
    const buckets = periode === "semaine" ? getDailyBuckets(7) : periode === "annee" ? getMonthlyBuckets() : getDailyBuckets(30);

    return buckets.map(b => {
      const dans = commandes.filter(c => {
        const t = new Date(c.created_at).getTime();
        return t >= b.start.getTime() && t < b.end.getTime();
      });
      const label = periode === "annee"
        ? b.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
        : periode === "semaine"
        ? b.date.toLocaleDateString("fr-FR", { weekday: "short" })
        : b.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

      return {
        label,
        total: dans.length,
        enAttente: dans.filter(c => c.statut === "en_attente").length,
        traitees: dans.filter(c => c.statut === "confirmee" || c.statut === "terminee").length,
        annulees: dans.filter(c => c.statut === "annulee").length,
      };
    });
  }, [commandes, periode]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <p style={{ color: "#9ca3af" }}>Chargement...</p>
      </div>
    );
  }

  const nom = user?.user_metadata?.name || user?.email?.split("@")[0] || "Acheteur";
  const prenom = nom.split(" ")[0];

  const stats = {
    total: commandes.length,
    enAttente: commandes.filter(c => c.statut === "en_attente").length,
    confirmees: commandes.filter(c => c.statut === "confirmee").length,
    depense: commandes.filter(c => c.statut === "confirmee" || c.statut === "terminee")
      .reduce((s, c) => s + (c.annonces?.prix_vente || 0), 0),
  };

  const maxVal = Math.max(...donneesGraphique.flatMap(d => [d.total, d.enAttente, d.traitees, d.annulees]), 1);
  const labelsAffiches = donneesGraphique.filter((_, i) =>
    periode === "mois" ? (i % 5 === 0 || i === donneesGraphique.length - 1) : true
  );
  const W = 580, H = 140, paddingLeft = 10, paddingRight = 10;
  const graphW = W - paddingLeft - paddingRight;
  const aucuneActivite = commandes.length === 0;

  // Largeur d'une "colonne" du graphique et seuil au-dessus duquel on affiche les valeurs chiffrées
  // (en vue "Mois", 30 colonnes sont trop serrées pour des labels lisibles)
  const dayWidth = graphW / (donneesGraphique.length || 1);
  const afficherValeurs = dayWidth > 24;
  const BAR_MAX_H = H - 22; // on réserve de la place en haut pour les labels et la ligne de moyenne

  const moyenneTotal = donneesGraphique.length > 0
    ? donneesGraphique.reduce((s, d) => s + d.total, 0) / donneesGraphique.length
    : 0;
  const uniteMoyenne = periode === "annee" ? "mois" : "jour";

  return (
    <>
      <style>{`
        .stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; }
        .btn-primary { background: #15803d; color: #fff; border: none; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .recent-cmd-row { flex-wrap: wrap !important; }
          .recent-cmd-meta { width: 100% !important; display: flex !important; justify-content: space-between !important; margin-top: 8px !important; }
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>
          Bienvenue, {prenom}
        </h1>
        <p style={{ fontSize: 14, color: "#9ca3af" }}>Voici un résumé de vos commandes.</p>
      </div>

      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Commandes totales", value: String(stats.total), sub: `${stats.enAttente} en attente`, icon: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18", color: "#15803d", bg: "#f0fdf4" },
          { label: "En attente", value: String(stats.enAttente), sub: "de confirmation vendeur", icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2", color: "#d97706", bg: "#fffbeb" },
          { label: "Confirmées", value: String(stats.confirmees), sub: "prêtes à récupérer", icon: "M20 6L9 17l-5-5", color: "#7c3aed", bg: "#faf5ff" },
          { label: "Total dépensé", value: `${formatPrix(stats.depense)} GHS`, sub: "commandes confirmées", icon: "M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M1 10h22", color: "#0e7490", bg: "#ecfeff" },
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

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>
              Activité {periode === "semaine" ? "sur 7 jours" : periode === "annee" ? "sur 12 mois" : "sur 30 jours"}
            </h2>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{stats.total} commande{stats.total > 1 ? "s" : ""} · {stats.confirmees} confirmée{stats.confirmees > 1 ? "s" : ""}</p>
          </div>
          <div style={{ display: "flex", gap: 6, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 9, padding: 3 }}>
            {([["semaine", "Semaine"], ["mois", "Mois"], ["annee", "Année"]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setPeriode(val)} style={{ padding: "5px 12px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: periode === val ? "#15803d" : "transparent", color: periode === val ? "#fff" : "#6b7280" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
          {[
            { label: "Commandes", color: "#15803d" },
            { label: "En attente", color: "#d97706" },
            { label: "Traitées", color: "#7c3aed" },
            { label: "Annulées", color: "#9ca3af" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: "#6b7280" }}>{l.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 14, height: 0, borderTop: "2px dashed #111827" }} />
            <span style={{ fontSize: 11, color: "#6b7280" }}>Moyenne</span>
          </div>
        </div>

        {!aucuneActivite && (
          <p style={{ fontSize: 12, color: "#111827", fontWeight: 700, marginBottom: 10 }}>
            Moyenne : {moyenneTotal.toFixed(1)} commande{moyenneTotal >= 2 ? "s" : ""} / {uniteMoyenne}
          </p>
        )}

        {aucuneActivite ? (
          <div style={{ height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f9fafb", borderRadius: 10, border: "1px dashed #e5e7eb" }}>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>Aucune activité sur cette période</p>
            <p style={{ fontSize: 11, color: "#d1d5db" }}>Le graphique apparaîtra à votre première commande</p>
          </div>
        ) : (
          <>
            <svg width="100%" height="160" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              {[0, 1, 2, 3].map(i => <line key={i} x1="0" y1={i * (H / 3)} x2={W} y2={i * (H / 3)} stroke="#f3f4f6" strokeWidth="1" />)}
              {donneesGraphique.map((d, i) => {
                const gap = 1.5;
                const barWidth = (dayWidth * 0.82 - gap * 3) / 4;
                const xBase = paddingLeft + i * dayWidth + dayWidth * 0.09;
                const valeurs = [
                  { val: d.total, color: "#15803d" },
                  { val: d.enAttente, color: "#d97706" },
                  { val: d.traitees, color: "#7c3aed" },
                  { val: d.annulees, color: "#9ca3af" },
                ];
                return (
                  <g key={i}>
                    {valeurs.map((v, idx) => {
                      const h = maxVal > 0 ? (v.val / maxVal) * BAR_MAX_H : 0;
                      const x = xBase + idx * (barWidth + gap);
                      return <rect key={idx} x={x} y={H - h} width={barWidth} height={h} fill={v.color} rx="1" />;
                    })}
                    {afficherValeurs && d.total > 0 && (
                      <text
                        x={xBase + barWidth / 2}
                        y={H - (maxVal > 0 ? (d.total / maxVal) * BAR_MAX_H : 0) - 4}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="700"
                        fill="#15803d"
                      >
                        {d.total}
                      </text>
                    )}
                  </g>
                );
              })}
              {maxVal > 0 && (
                <>
                  <line
                    x1={paddingLeft}
                    y1={H - (moyenneTotal / maxVal) * BAR_MAX_H}
                    x2={W - paddingRight}
                    y2={H - (moyenneTotal / maxVal) * BAR_MAX_H}
                    stroke="#111827"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <text
                    x={W - paddingRight}
                    y={H - (moyenneTotal / maxVal) * BAR_MAX_H - 4}
                    textAnchor="end"
                    fontSize="9"
                    fontWeight="700"
                    fill="#111827"
                  >
                    Moy. {moyenneTotal.toFixed(1)}
                  </text>
                </>
              )}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {labelsAffiches.map((d, i) => <span key={i} style={{ fontSize: 10, color: "#9ca3af" }}>{d.label}</span>)}
            </div>
          </>
        )}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #e5e7eb" }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Mes commandes récentes</h2>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>{commandes.length} commande{commandes.length > 1 ? "s" : ""}</p>
          </div>
          <a href="/dashboard/acheteur/Commandes" style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>
            Voir toutes →
          </a>
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
              <div key={c.id} className="recent-cmd-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f0fdf4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon path="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8" size={20} color="#86efac" />}
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{c.annonces?.titre || "Annonce"}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>{new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
                </div>
                <div className="recent-cmd-meta" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <p style={{ fontSize: 15, fontWeight: 800, color: "#15803d" }}>{formatPrix(c.annonces?.prix_vente)} GHS</p>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 8, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}