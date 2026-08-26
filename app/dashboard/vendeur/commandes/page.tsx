"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Commande = {
  id: string;
  annonce_id: string;
  acheteur_id: string;
  acheteur_nom: string;
  statut: "en_attente" | "confirmee" | "refusee" | "terminee";
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

    if (!error) {
      setCommandes(prev =>
        prev.map(c => c.id === id ? { ...c, statut } : c)
      );
    }
    setTraitement(null);
  }

  const couleurStatut: Record<string, { bg: string; color: string; label: string }> = {
    en_attente: { bg: "#FFF7ED", color: "#C2410C", label: "En attente" },
    confirmee: { bg: "#F0FDF4", color: "#15803d", label: "Confirmée" },
    refusee: { bg: "#FEF2F2", color: "#DC2626", label: "Refusée" },
    terminee: { bg: "#EFF6FF", color: "#1D4ED8", label: "Terminée" },
  };

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <p style={{ color: "#9ca3af" }}>Chargement...</p>
    </main>
  );

  const enAttente = commandes.filter(c => c.statut === "en_attente").length;

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
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

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 32px" }}>

        {commandes.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "60px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 }}>Aucune commande reçue</p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Les commandes apparaîtront ici quand des acheteurs s'intéresseront à vos annonces.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {commandes.map(c => {
              const s = couleurStatut[c.statut] || couleurStatut.en_attente;
              const photo = c.annonces?.photos?.[0];
              return (
                <div key={c.id} style={{ background: "#fff", border: `1.5px solid ${c.statut === "en_attente" ? "#FED7AA" : "#e5e7eb"}`, borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: c.statut === "en_attente" ? 14 : 0 }}>

                    {/* Photo */}
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: "#f0fdf4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {photo
                        ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12z"/></svg>
                      }
                    </div>

                    {/* Infos */}
                    <div style={{ flex: 1 }}>
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

                    {/* Prix */}
                    {c.annonces?.prix_vente && (
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#15803d", flexShrink: 0 }}>
                        {c.annonces.prix_vente.toLocaleString()} GHS
                      </p>
                    )}

                    {/* Statut */}
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 8, background: s.bg, color: s.color, flexShrink: 0 }}>
                      {s.label}
                    </span>
                  </div>

                  {/* Actions si en attente */}
                  {c.statut === "en_attente" && (
                    <div style={{ display: "flex", gap: 10, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
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
                        onClick={() => router.push(`/dashboard/vendeur/messages`)}
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
                        onClick={() => router.push(`/dashboard/vendeur/messages`)}
                        style={{ background: "#f0fdf4", color: "#15803d", border: "1.5px solid #bbf7d0", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Continuer la discussion →
                      </button>
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