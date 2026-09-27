"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPrix } from "@/lib/format";


type Commande = {
  id: string;
  annonce_id: string;
  acheteur_id: string;
  acheteur_nom: string;
  statut: "en_attente" | "confirmee" | "refusee" | "terminee" | "annulee";
  raison_annulation?: string | null;
  created_at: string;
  annonces?: { titre: string; prix_vente: number; photos: string[] };
};

export default function CommandesPage() {
  const router = useRouter();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [traitement, setTraitement] = useState<string | null>(null);

  useEffect(() => {
    async function charger() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth"); return; }

      const { data } = await supabase
        .from("commandes")
        .select("*, annonces(titre, prix_vente, photos)")
        .eq("vendeur_id", session.user.id)
        .order("created_at", { ascending: false });

      if (data) setCommandes(data);
      setLoading(false);
    }
    charger();
  }, [router]);

  async function changerStatut(id: string, statut: "confirmee" | "refusee") {
    setTraitement(id);
    const { error } = await supabase
      .from("commandes")
      .update({ statut })
      .eq("id", id);

    if (error) { setTraitement(null); return; }

    if (statut === "confirmee") {
      const commandeConfirmee = commandes.find(c => c.id === id);

      if (commandeConfirmee) {
        // L'annonce passe en "vendu" et disparaît des annonces actives
        await supabase
          .from("annonces")
          .update({ statut: "vendu" })
          .eq("id", commandeConfirmee.annonce_id);

        // Toutes les autres commandes en attente sur cette même annonce sont annulées automatiquement
        const autresIds = commandes
          .filter(c => c.annonce_id === commandeConfirmee.annonce_id && c.id !== id && c.statut === "en_attente")
          .map(c => c.id);

        if (autresIds.length > 0) {
          await supabase
            .from("commandes")
            .update({ statut: "annulee", raison_annulation: "vendu_ailleurs" })
            .in("id", autresIds);
        }

        setCommandes(prev => prev.map(c => {
          if (c.id === id) return { ...c, statut: "confirmee" };
          if (autresIds.includes(c.id)) return { ...c, statut: "annulee", raison_annulation: "vendu_ailleurs" };
          return c;
        }));
        setTraitement(null);
        return;
      }
    }

    setCommandes(prev => prev.map(c => c.id === id ? { ...c, statut } : c));
    setTraitement(null);
  }

  const couleurStatut: Record<string, { bg: string; color: string; label: string }> = {
    en_attente: { bg: "#FFF7ED", color: "#C2410C", label: "En attente" },
    confirmee: { bg: "#F0FDF4", color: "#15803d", label: "Confirmée" },
    refusee: { bg: "#FEF2F2", color: "#DC2626", label: "Refusée" },
    terminee: { bg: "#EFF6FF", color: "#1D4ED8", label: "Terminée" },
    annulee: { bg: "#F9FAFB", color: "#6B7280", label: "Annulée" },
  };

    const groupesConcurrents = useMemo(() => {
    const parAnnonce: Record<string, Commande[]> = {};
    commandes.forEach(c => {
      if (c.statut !== "en_attente") return;
      if (!parAnnonce[c.annonce_id]) parAnnonce[c.annonce_id] = [];
      parAnnonce[c.annonce_id].push(c);
    });
    return Object.values(parAnnonce).filter(groupe => groupe.length > 1);
  }, [commandes]);

  const idsDansGroupeConcurrent = new Set(groupesConcurrents.flat().map(c => c.id));

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <p style={{ color: "#9ca3af" }}>Chargement...</p>
    </main>
  );

  const enAttente = commandes.filter(c => c.statut === "en_attente").length;
  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 640px) {
          .cmd-page-header { padding: 16px !important; }
          .cmd-page-content { padding: 16px !important; }
          .cmd-row { flex-wrap: wrap !important; }
          .cmd-row-meta { width: 100% !important; display: flex !important; justify-content: space-between !important; align-items: center !important; margin-top: 8px !important; }
          .cmd-actions { flex-wrap: wrap !important; }
          .cmd-actions button { flex: 1 1 100% !important; }
        }
      `}</style>

      {/* HEADER */}
      <div className="cmd-page-header" style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push("/dashboard/vendeur")} style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            ← Retour
          </button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
              Commandes
              {enAttente > 0 && (
                <span style={{ marginLeft: 10, background: "#DC2626", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                  {enAttente} en attente
                </span>
              )}
            </h1>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>{commandes.length} commande{commandes.length > 1 ? "s" : ""} au total</p>
          </div>
        </div>
      </div>

      <div className="cmd-page-content" style={{ maxWidth: 900, margin: "0 auto", padding: "24px 32px" }}>

                {commandes.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "60px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 }}>Aucune commande reçue</p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Les commandes apparaîtront ici quand des acheteurs s'intéresseront à vos annonces.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {groupesConcurrents.map(groupe => {
              const premiere = groupe[0];
              const photo = premiere.annonces?.photos?.[0];
              return (
                <div key={premiere.annonce_id} style={{ background: "#fff", border: "1.5px solid #FED7AA", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "#FFFBEB" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f0fdf4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {photo
                        ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12z"/></svg>
                      }
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 2 }}>
                        {premiere.annonces?.titre || "Annonce"}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#C2410C" }}>
                        🔥 {groupe.length} demandes pour cet article
                      </p>
                    </div>
                  </div>
                  {groupe.map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "14px 20px", borderTop: "1px solid #f3f4f6" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.acheteur_nom || "Inconnu"}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => changerStatut(c.id, "confirmee")}
                          disabled={traitement === c.id}
                          style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: traitement === c.id ? 0.6 : 1 }}
                        >
                          {traitement === c.id ? "..." : "Accepter"}
                        </button>
                        <button
                          onClick={() => changerStatut(c.id, "refusee")}
                          disabled={traitement === c.id}
                          style={{ background: "#fff", color: "#DC2626", border: "1.5px solid #FCA5A5", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: traitement === c.id ? 0.6 : 1 }}
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {commandes.filter(c => !idsDansGroupeConcurrent.has(c.id)).map(c => {
              const s = couleurStatut[c.statut] || couleurStatut.en_attente;
              const photo = c.annonces?.photos?.[0];
              return (
                <div key={c.id} style={{ background: "#fff", border: `1.5px solid ${c.statut === "en_attente" ? "#FED7AA" : "#e5e7eb"}`, borderRadius: 14, padding: "18px 20px" }}>
                  <div className="cmd-row" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: c.statut === "en_attente" ? 14 : 0 }}>

                    {/* Photo */}
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: "#f0fdf4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {photo
                        ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12z"/></svg>
                      }
                    </div>

                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
                        {c.annonces?.titre || "Annonce supprimée"}
                      </p>
                      <p style={{ fontSize: 12, color: "#6b7280" }}>
                        Acheteur : <strong>{c.acheteur_nom || "Inconnu"}</strong>
                      </p>
                      <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                        {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>

                    {/* Prix + Statut (groupés pour passer ensemble à la ligne sur mobile) */}
                    <div className="cmd-row-meta" style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                                            {c.annonces?.prix_vente && (
                        <p style={{ fontSize: 16, fontWeight: 800, color: "#15803d" }}>
                          {formatPrix(c.annonces?.prix_vente)} GHS
                        </p>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 8, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions si en attente */}
                  {c.statut === "en_attente" && (
                    <div className="cmd-actions" style={{ display: "flex", gap: 10, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
                      <button
                        onClick={() => changerStatut(c.id, "confirmee")}
                        disabled={traitement === c.id}
                        style={{ flex: 1, background: "#15803d", color: "#fff", border: "none", borderRadius: 9, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: traitement === c.id ? 0.6 : 1 }}
                      >
                        {traitement === c.id ? "..." : "Accepter la commande"}
                      </button>
                      <button
                        onClick={() => changerStatut(c.id, "refusee")}
                        disabled={traitement === c.id}
                        style={{ flex: 1, background: "#fff", color: "#DC2626", border: "1.5px solid #FCA5A5", borderRadius: 9, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: traitement === c.id ? 0.6 : 1 }}
                      >
                        Refuser
                      </button>
                        <button
                        onClick={() => router.push("/dashboard/messages")}
                        style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1.5px solid #BFDBFE", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Envoyer un message
                      </button>
                    </div>
                  )}

                  {/* Bouton message si confirmée */}
                  {c.statut === "confirmee" && (
                    <div style={{ paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
                                          <button
                        onClick={() => router.push("/dashboard/messages")}
                        style={{ background: "#f0fdf4", color: "#15803d", border: "1.5px solid #bbf7d0", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Continuer la discussion →
                      </button>
                    </div>
                  )}

                  {c.statut === "annulee" && c.raison_annulation === "vendu_ailleurs" && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
                      <p style={{ fontSize: 13, color: "#6b7280" }}>
                        Annulée automatiquement : cet article a été confirmé pour un autre acheteur.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}