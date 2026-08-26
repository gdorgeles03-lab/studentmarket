"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Conversation = {
  commande_id: string;
  vendeur_id: string;
  vendeur_nom: string;
  annonce_titre: string;
  dernier_message?: string;
  non_lus: number;
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

export default function MessagesAcheteurPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convActive, setConvActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contenu, setContenu] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth"); return; }
      setUserId(session.user.id);

      const { data: commandes } = await supabase
        .from("commandes")
        .select("id, vendeur_id, annonces(titre, vendeur_nom)")
        .eq("acheteur_id", session.user.id)
        .eq("statut", "confirmee")
        .order("created_at", { ascending: false });

      if (!commandes) { setLoading(false); return; }

      const convs: Conversation[] = await Promise.all(
        commandes.map(async (c: any) => {
          const { data: msgs } = await supabase
            .from("messages")
            .select("contenu, lu, expediteur_id")
            .eq("commande_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("commande_id", c.id)
            .eq("destinataire_id", session.user.id)
            .eq("lu", false);

          return {
            commande_id: c.id,
            vendeur_id: c.vendeur_id,
            vendeur_nom: (c.annonces as any)?.vendeur_nom || "Vendeur",
            annonce_titre: (c.annonces as any)?.titre || "Annonce",
            dernier_message: msgs?.[0]?.contenu,
            non_lus: count || 0,
          };
        })
      );

      setConversations(convs);
      setLoading(false);
    }
    init();
  }, [router]);

  useEffect(() => {
    if (!convActive || !userId) return;

    async function chargerMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("commande_id", convActive!.commande_id)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);

      await supabase
        .from("messages")
        .update({ lu: true })
        .eq("commande_id", convActive!.commande_id)
        .eq("destinataire_id", userId);
    }

    chargerMessages();

    const channel = supabase
      .channel(`messages:${convActive.commande_id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `commande_id=eq.${convActive.commande_id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [convActive, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function envoyer() {
    if (!contenu.trim() || !convActive || !userId || envoi) return;
    setEnvoi(true);

    const { error } = await supabase.from("messages").insert({
      commande_id: convActive.commande_id,
      expediteur_id: userId,
      destinataire_id: convActive.vendeur_id,
      contenu: contenu.trim(),
      lu: false,
    });

    if (!error) {
      setContenu("");
      setConversations(prev =>
        prev.map(c => c.commande_id === convActive.commande_id
          ? { ...c, dernier_message: contenu.trim() }
          : c
        )
      );
    }
    setEnvoi(false);
  }

  function formatHeure(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function initiales(nom: string) {
    return nom.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .conv-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background 0.1s; }
        .conv-item:hover { background: #f9fafb; }
        .conv-item.active { background: #f0fdf4; }
        .msg-bubble { max-width: 70%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; }
        .msg-moi { background: #15803d; color: #fff; border-bottom-right-radius: 4px; align-self: flex-end; }
        .msg-lui { background: #fff; color: #111827; border: 1px solid #e5e7eb; border-bottom-left-radius: 4px; align-self: flex-start; }
        input:focus { outline: none; border-color: #15803d !important; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>
          ← Retour
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Messages</h1>
        <span style={{ fontSize: 13, color: "#9ca3af" }}>— conversations avec vos vendeurs</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", height: "calc(100vh - 65px)" }}>

        {/* LISTE CONVERSATIONS */}
        <div style={{ background: "#fff", borderRight: "1px solid #e5e7eb", overflowY: "auto" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              {conversations.length} conversation{conversations.length > 1 ? "s" : ""}
            </p>
          </div>

          {loading ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              Chargement...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>Aucune conversation</p>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>Les conversations s'ouvrent après confirmation d'une commande.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.commande_id}
                className={`conv-item${convActive?.commande_id === conv.commande_id ? " active" : ""}`}
                onClick={() => setConvActive(conv)}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {initiales(conv.vendeur_nom)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{conv.vendeur_nom}</p>
                    {conv.non_lus > 0 && (
                      <span style={{ background: "#15803d", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>
                        {conv.non_lus}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {conv.annonce_titre}
                  </p>
                  {conv.dernier_message && (
                    <p style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {conv.dernier_message}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ZONE CHAT */}
        {!convActive ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Vos messages</p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Selectionnez une conversation pour commencer.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", background: "#f9fafb" }}>

            {/* Header chat */}
            <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                {initiales(convActive.vendeur_nom)}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{convActive.vendeur_nom}</p>
                <p style={{ fontSize: 12, color: "#9ca3af" }}>Re: {convActive.annonce_titre}</p>
              </div>
              <div style={{ marginLeft: "auto", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "4px 12px" }}>
                <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>Commande confirmée</span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>Démarrez la conversation avec {convActive.vendeur_nom}.</p>
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.expediteur_id === userId ? "flex-end" : "flex-start" }}>
                  <div className={`msg-bubble ${m.expediteur_id === userId ? "msg-moi" : "msg-lui"}`}>
                    {m.contenu}
                  </div>
                  <span style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                    {formatHeure(m.created_at)}
                    {m.expediteur_id === userId && (
                      <span style={{ marginLeft: 6, color: m.lu ? "#15803d" : "#9ca3af" }}>
                        {m.lu ? "✓✓" : "✓"}
                      </span>
                    )}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input envoi */}
            <div style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "14px 20px", display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={contenu}
                onChange={e => setContenu(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                placeholder={`Écrire à ${convActive.vendeur_nom}...`}
                style={{ flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", color: "#111827", background: "#f9fafb" }}
              />
              <button
                onClick={envoyer}
                disabled={envoi || !contenu.trim()}
                style={{ width: 42, height: 42, borderRadius: "50%", background: contenu.trim() ? "#15803d" : "#e5e7eb", border: "none", cursor: contenu.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}