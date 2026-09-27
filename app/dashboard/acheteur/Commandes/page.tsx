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
  raison_annulation?: string | null;
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
      .update({ statut: "annulee", raison_annulation: "acheteur" })
      .eq("id", id);
    if (!error) setCommandes(prev => prev.map(c => c.id === id ? { ...c, statut: "annulee", raison_annulation: "acheteur" } : c));
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

  return (
    <>
      <style>{`
        .cmd-card { background: #fff; border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 18px 20px; transition: all 0.2s; }
        .cmd-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .btn-primary { background: #15803d; color: #fff; border: none; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .btn-danger { background: #fff; color: #DC2626; border: 1.5px solid #FECACA; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .btn-danger:hover { background: #FEF2F2; }

        @media (max-width: 900px) {
          .cmd-header { flex-wrap: wrap !important; }
          .cmd-price-block { width: 100% !important; text-align: left !important; margin-top: 10px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "0 14px", gap: 8, marginBottom: 20 }}>
        <Icon path="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" size={15} color="#9ca3af" />
        <input
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="Rechercher une commande..."
          style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "#111827", padding: "11px 0", fontFamily: "inherit" }}
        />
      </div>


              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
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
                        <div className="cmd-header" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 56, height: 56, borderRadius: 12, background: "#f0fdf4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon path="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8" size={24} color="#86efac" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 160 }}>
                            <p style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 3 }}>{c.annonces?.titre || "Annonce supprimée"}</p>
                            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
                              Vendeur : <strong>{c.annonces?.vendeur_nom || "—"}</strong> · {c.annonces?.ville || "—"}
                            </p>
                            <p style={{ fontSize: 11, color: "#9ca3af" }}>
                              {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          </div>
                          <div className="cmd-price-block" style={{ textAlign: "right", flexShrink: 0 }}>
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
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f6", display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {c.statut === "confirmee" && c.annonces?.telephone && (
                              <a
                                href={"https://wa.me/" + (c.annonces?.telephone || "").replace(/^0/, "233") + "?text=" + encodeURIComponent("Bonjour, ma commande pour " + (c.annonces?.titre || "") + " a ete confirmee. Quand pouvons-nous nous retrouver ?")}
                                target="_blank"
                                rel="noreferrer"
                                style={{ flex: 1, minWidth: 200, background: "#15803d", color: "#fff", textAlign: "center", fontWeight: 700, padding: "10px", borderRadius: 9, fontSize: 13, textDecoration: "none", display: "block" }}
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

                        {/* Message si annulée automatiquement */}
                        {c.statut === "annulee" && c.raison_annulation === "vendu_ailleurs" && (
                          <div style={{ marginTop: 10, background: "#F9FAFB", borderRadius: 10, padding: "10px 14px", border: "1px solid #E5E7EB" }}>
                            <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>
                              Cet article a été vendu à un autre acheteur avant que votre commande ne soit traitée.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
    </>
  );
}