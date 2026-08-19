"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Commande = {
  id: string;
  statut: string;
  acheteur_id: string;
  vendeur_id: string;
  acheteur_nom?: string;
  annonces: {
    titre: string;
    photos?: string[];
    prix_vente?: number;
    vendeur_nom?: string;
  } | null;
};

type Message = {
  id: string;
  commande_id: string;
  expediteur_id: string;
  destinataire_id: string;
  contenu: string;
  lu: boolean;
  created_at: string;
};

function formatHeure(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const commandeId = params?.commandeId as string;

  const [user, setUser] = useState<User | null>(null);
  const [commande, setCommande] = useState<Commande | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (!session) { router.replace("/auth"); return; }
      setUser(session.user);
    });
    return () => { mounted = false; };
  }, [router]);

  // ── Chargement de la commande + verification d'acces ────────
  useEffect(() => {
    if (!user || !commandeId) return;

    async function chargerCommande() {
      const { data, error } = await supabase
        .from("commandes")
        .select("*, annonces(titre, photos, prix_vente, vendeur_nom)")
        .eq("id", commandeId)
        .single();

      if (error || !data) {
        setErreur("Commande introuvable.");
        setChargement(false);
        return;
      }

      const c = data as unknown as Commande;
      const estConcerne = c.acheteur_id === user!.id || c.vendeur_id === user!.id;

      if (!estConcerne) {
        setErreur("Vous n'avez pas accès à cette conversation.");
        setChargement(false);
        return;
      }

      if (c.statut !== "confirmee") {
        setErreur("La conversation s'ouvre une fois que le vendeur a confirmé la commande.");
        setChargement(false);
        return;
      }

      setCommande(c);
      setChargement(false);
    }

    chargerCommande();
  }, [user, commandeId]);

  // ── Chargement des messages + abonnement temps reel ──────────
  useEffect(() => {
    if (!commande || !user) return;

    async function chargerMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("commande_id", commandeId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data as Message[]);

      // Marque comme lus les messages recus par l'utilisateur courant
      await supabase
        .from("messages")
        .update({ lu: true })
        .eq("commande_id", commandeId)
        .eq("destinataire_id", user!.id)
        .eq("lu", false);
    }

    chargerMessages();

    const channel = supabase
      .channel(`messages-${commandeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `commande_id=eq.${commandeId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commande, user, commandeId]);

  // ── Scroll automatique vers le bas ────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function envoyerMessage() {
    if (!texte.trim() || !commande || !user) return;

    const destinataireId = user.id === commande.acheteur_id ? commande.vendeur_id : commande.acheteur_id;

    setEnvoi(true);
    const { error } = await supabase.from("messages").insert({
      commande_id: commandeId,
      expediteur_id: user.id,
      destinataire_id: destinataireId,
      contenu: texte.trim(),
      lu: false,
    });

    if (!error) {
      setTexte("");
    }
    setEnvoi(false);
  }

  if (chargement) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "Inter, sans-serif" }}>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Chargement...</p>
      </div>
    );
  }

  if (erreur) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "Inter, sans-serif", padding: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "32px", maxWidth: 420, textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Conversation indisponible</p>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>{erreur}</p>
          <button onClick={() => router.back()} style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!commande || !user) return null;

  const estAcheteur = user.id === commande.acheteur_id;
  const nomInterlocuteur = estAcheteur ? (commande.annonces?.vendeur_nom || "Vendeur") : (commande.acheteur_nom || "Acheteur");

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* HEADER */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>

        {commande.annonces?.photos && commande.annonces.photos.length > 0 ? (
          <img src={commande.annonces.photos[0]} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: "cover", border: "1px solid #e5e7eb" }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: 9, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12z"/></svg>
          </div>
        )}

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{nomInterlocuteur}</p>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>{commande.annonces?.titre} · {commande.annonces?.prix_vente} GHS</p>
        </div>

        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
          Confirmée
        </span>
      </header>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10, maxWidth: 720, width: "100%", margin: "0 auto" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Aucun message pour l'instant. Convenez ensemble du lieu et de l'heure de remise.</p>
          </div>
        ) : (
          messages.map(m => {
            const estMoi = m.expediteur_id === user.id;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: estMoi ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "70%", padding: "10px 14px", borderRadius: 14,
                  background: estMoi ? "#15803d" : "#fff",
                  color: estMoi ? "#fff" : "#111827",
                  border: estMoi ? "none" : "1px solid #e5e7eb",
                  borderBottomRightRadius: estMoi ? 4 : 14,
                  borderBottomLeftRadius: estMoi ? 14 : 4,
                }}>
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>{m.contenu}</p>
                  <p style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: "right" }}>{formatHeure(m.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* SAISIE */}
      <div style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "14px 24px" }}>
        <div style={{ display: "flex", gap: 10, maxWidth: 720, margin: "0 auto" }}>
          <input
            value={texte}
            onChange={e => setTexte(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyerMessage(); } }}
            placeholder="Écrire un message..."
            style={{ flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
          <button
            onClick={envoyerMessage}
            disabled={envoi || !texte.trim()}
            style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: 10, padding: "0 20px", fontSize: 13, fontWeight: 700, cursor: envoi || !texte.trim() ? "not-allowed" : "pointer", opacity: envoi || !texte.trim() ? 0.6 : 1 }}
          >
            Envoyer
          </button>
        </div>
      </div>
    </main>
  );
}