"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPrix } from "@/lib/format";

type Conversation = {
  commande_id: string;
  contact_id: string;
  contact_nom: string;
  contact_role: "vendeur" | "acheteur";
  annonce_titre: string;
  annonce_photo?: string;
  annonce_prix?: number;
  dernier_message?: string;
  dernier_message_at?: string;
  non_lus: number;
};

type Message = {
  id: string;
  commande_id: string;
  expediteur_id: string;
  destinataire_id: string;
  contenu: string;
  type?: "texte" | "photo" | "video";
  media_url?: string | null;
  lu: boolean;
  created_at: string;
};

type MediaItem = {
  id: string;
  file: File;
  url: string;
  type: "photo" | "video";
  legende: string;
};

const AVATAR_COLORS = ["#15803d", "#7c3aed", "#0e7490", "#c2410c", "#be185d", "#4338ca", "#b45309", "#0f766e"];

function couleurAvatar(nom: string): string {
  let hash = 0;
  for (let i = 0; i < nom.length; i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initiales(nom: string): string {
  return nom.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatRelatif(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `${j} j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function dateSeparateur(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const hier = new Date();
  hier.setDate(hier.getDate() - 1);
  const memeJour = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (memeJour(d, today)) return "Aujourd'hui";
  if (memeJour(d, hier)) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

export default function MessagesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<"vendeur" | "acheteur">("acheteur");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convActive, setConvActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contenu, setContenu] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState("");
  const [loading, setLoading] = useState(true);
  const [rechercheConv, setRechercheConv] = useState("");
  const [enBasDeLaConv, setEnBasDeLaConv] = useState(true);
  const [mediaQueue, setMediaQueue] = useState<MediaItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth"); return; }
      const uid = session.user.id;
      setUserId(uid);
      setRole(session.user.user_metadata?.role === "vendeur" ? "vendeur" : "acheteur");

      const { data: commandes } = await supabase
        .from("commandes")
        .select("id, acheteur_id, vendeur_id, acheteur_nom, annonces(titre, vendeur_nom, photos, prix_vente)")
        .or(`acheteur_id.eq.${uid},vendeur_id.eq.${uid}`)
        .eq("statut", "confirmee")
        .order("created_at", { ascending: false });

      if (!commandes) { setLoading(false); return; }

      const convs: Conversation[] = await Promise.all(
        commandes.map(async (c: any) => {
          const estAcheteur = c.acheteur_id === uid;
          const contactId = estAcheteur ? c.vendeur_id : c.acheteur_id;
          const contactNom = estAcheteur ? (c.annonces?.vendeur_nom || "Vendeur") : (c.acheteur_nom || "Acheteur");

          const { data: msgs } = await supabase
            .from("messages")
            .select("contenu, created_at")
            .eq("commande_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("commande_id", c.id)
            .eq("destinataire_id", uid)
            .eq("lu", false);

          const photos = c.annonces?.photos;

          return {
            commande_id: c.id,
            contact_id: contactId,
            contact_nom: contactNom,
            contact_role: estAcheteur ? "vendeur" : "acheteur",
            annonce_titre: (c.annonces as any)?.titre || "Annonce",
            annonce_photo: Array.isArray(photos) && photos.length > 0 ? photos[0] : undefined,
            annonce_prix: c.annonces?.prix_vente,
            dernier_message: msgs?.[0]?.contenu,
            dernier_message_at: msgs?.[0]?.created_at,
            non_lus: count || 0,
          } as Conversation;
        })
      );

      convs.sort((a, b) => {
        const da = a.dernier_message_at ? new Date(a.dernier_message_at).getTime() : 0;
        const db = b.dernier_message_at ? new Date(b.dernier_message_at).getTime() : 0;
        return db - da;
      });

      setConversations(convs);
      setLoading(false);
    }
    init();
  }, [router]);

  useEffect(() => {
    if (!convActive || !userId) return;
    setEnBasDeLaConv(true);

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

      setConversations(prev => prev.map(c => c.commande_id === convActive!.commande_id ? { ...c, non_lus: 0 } : c));
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
    if (enBasDeLaConv) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, enBasDeLaConv]);
  
  useEffect(() => {
    if (mediaQueue.length > 0 && previewIndex >= mediaQueue.length) {
      setPreviewIndex(mediaQueue.length - 1);
    }
  }, [mediaQueue, previewIndex]);

  function gererScroll() {
    const el = messagesListRef.current;
    if (!el) return;
    const distanceDuBas = el.scrollHeight - el.scrollTop - el.clientHeight;
    setEnBasDeLaConv(distanceDuBas < 80);
  }

  const conversationsFiltrees = useMemo(() => {
    if (!rechercheConv.trim()) return conversations;
    const q = rechercheConv.toLowerCase();
    return conversations.filter(c =>
      c.contact_nom.toLowerCase().includes(q) || c.annonce_titre.toLowerCase().includes(q)
    );
  }, [conversations, rechercheConv]);

  async function envoyer() {
    if (!contenu.trim() || !convActive || !userId || envoi) return;
    setEnvoi(true);
    setErreurEnvoi("");

    const texteEnvoye = contenu.trim();
    const { error } = await supabase.from("messages").insert({
      commande_id: convActive.commande_id,
      expediteur_id: userId,
      destinataire_id: convActive.contact_id,
      contenu: texteEnvoye,
      lu: false,
    });

    if (!error) {
      setContenu("");
      const maintenant = new Date().toISOString();
      setConversations(prev => {
        const maj = prev.map(c => c.commande_id === convActive.commande_id
          ? { ...c, dernier_message: texteEnvoye, dernier_message_at: maintenant }
          : c
        );
        return [...maj].sort((a, b) => {
          const da = a.dernier_message_at ? new Date(a.dernier_message_at).getTime() : 0;
          const db = b.dernier_message_at ? new Date(b.dernier_message_at).getTime() : 0;
          return db - da;
        });
      });
    } else {
      setErreurEnvoi("Le message n'a pas pu être envoyé : " + error.message);
    }
    setEnvoi(false);
  }

  async function envoyerFichierUnique(file: File, legendeTexte: string): Promise<string | null> {
    if (!convActive || !userId) return "Session invalide.";
    if (file.size > 25 * 1024 * 1024) return "Fichier trop volumineux (25 Mo maximum).";
    try {
      const estVideo = file.type.startsWith("video/");
      const ext = file.name.split(".").pop() || (estVideo ? "mp4" : "jpg");
      const fileName = `msg-${convActive.commande_id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error: erreurUpload } = await supabase.storage
        .from("Photos")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (erreurUpload) return "Envoi échoué : " + erreurUpload.message;

      const { data: urlData } = supabase.storage.from("Photos").getPublicUrl(data.path);
      const type = estVideo ? "video" : "photo";
      const texteParDefaut = estVideo ? "🎥 Vidéo" : "📷 Photo";
      const texteEnregistre = legendeTexte || texteParDefaut;

      const { error } = await supabase.from("messages").insert({
        commande_id: convActive.commande_id,
        expediteur_id: userId,
        destinataire_id: convActive.contact_id,
        contenu: texteEnregistre,
        type,
        media_url: urlData.publicUrl,
        lu: false,
      });

      if (error) return "Message non enregistré : " + error.message;

      const maintenant = new Date().toISOString();
      setConversations(prev => {
        const maj = prev.map(c => c.commande_id === convActive.commande_id
          ? { ...c, dernier_message: texteEnregistre, dernier_message_at: maintenant }
          : c
        );
        return [...maj].sort((a, b) => {
          const da = a.dernier_message_at ? new Date(a.dernier_message_at).getTime() : 0;
          const db = b.dernier_message_at ? new Date(b.dernier_message_at).getTime() : 0;
          return db - da;
        });
      });
      return null;
    } catch {
      return "Impossible de contacter le serveur.";
    }
  }

  function handleFichierChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const nouveaux: MediaItem[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "photo",
      legende: "",
    }));
    setPreviewIndex(mediaQueue.length);
    setMediaQueue(prev => [...prev, ...nouveaux]);
    setAttachMenuOpen(false);
    e.target.value = "";
  }

  function changerLegendeActuelle(texte: string) {
    setMediaQueue(prev => prev.map((m, i) => i === previewIndex ? { ...m, legende: texte } : m));
  }

  function retirerDuQueue(id: string) {
    setMediaQueue(prev => {
      const item = prev.find(m => m.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter(m => m.id !== id);
    });
  }

  function annulerTout() {
    mediaQueue.forEach(m => URL.revokeObjectURL(m.url));
    setMediaQueue([]);
  }

  async function envoyerQueue() {
    if (mediaQueue.length === 0 || envoi) return;
    setEnvoi(true);
    setErreurEnvoi("");
    const aEnvoyer = [...mediaQueue];
    for (const item of aEnvoyer) {
      const erreur = await envoyerFichierUnique(item.file, item.legende.trim());
      if (erreur) setErreurEnvoi(erreur);
    }
    aEnvoyer.forEach(m => URL.revokeObjectURL(m.url));
    setMediaQueue([]);
    setEnvoi(false);
  }
  function formatHeure(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  const dashboardHref = role === "vendeur" ? "/dashboard/vendeur" : "/dashboard/acheteur";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Chargement...</p>
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif", padding: "20px 24px" }}>
      <style>{`
        .conv-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background 0.1s; }
        .conv-item:hover { background: #f9fafb; }
        .conv-item.active { background: #f0fdf4; }
        .conv-item.unread { background: #fafffe; }
        .msg-bubble { max-width: 70%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .msg-moi { background: #15803d; color: #fff; border-bottom-right-radius: 4px; align-self: flex-end; }
        .msg-lui { background: #fff; color: #111827; border: 1px solid #e5e7eb; border-bottom-left-radius: 4px; align-self: flex-start; }
        input:focus { outline: none; border-color: #15803d !important; }
        .date-sep { text-align: center; font-size: 11px; color: #9ca3af; font-weight: 600; margin: 8px 0 4px; }
        .messages-list::-webkit-scrollbar { width: 7px; }
        .messages-list::-webkit-scrollbar-track { background: transparent; }
        .messages-list::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .messages-list::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        .role-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.4px; }

        .back-btn-mobile { display: none; }

        @media (max-width: 768px) {
          .messages-grid { grid-template-columns: 1fr !important; }
          .conv-list-pane.conv-hidden-mobile { display: none !important; }
          .chat-pane.chat-hidden-mobile { display: none !important; }
          .back-btn-mobile { display: flex !important; }
          .msg-bubble { max-width: 85% !important; }
        }
      `}</style>
      {mediaQueue.length > 0 && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
            <button onClick={annulerTout} aria-label="Annuler" style={{ background: "rgba(255,255,255,0.1)", border: "none", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            {mediaQueue.length > 1 && (
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 }}>
                {previewIndex + 1} / {mediaQueue.length}
              </span>
            )}
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px", minHeight: 0 }}>
            {mediaQueue[previewIndex].type === "photo" ? (
              <img src={mediaQueue[previewIndex].url} alt="Aperçu" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, objectFit: "contain" }} />
            ) : (
              <video key={mediaQueue[previewIndex].id} src={mediaQueue[previewIndex].url} controls autoPlay style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} />
            )}
          </div>

          <div style={{ padding: "0 16px 12px" }}>
            <input
              value={mediaQueue[previewIndex].legende}
              onChange={e => changerLegendeActuelle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") envoyerQueue(); }}
              placeholder="Ajouter une légende..."
              style={{ width: "100%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 24, padding: "13px 18px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ padding: "0 16px 16px", display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {mediaQueue.map((item, i) => (
                <div key={item.id} style={{ position: "relative", flexShrink: 0 }}>
                  <button
                    onClick={() => setPreviewIndex(i)}
                    style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", border: i === previewIndex ? "2px solid #15803d" : "2px solid transparent", padding: 0, cursor: "pointer", background: "#222" }}
                  >
                    {item.type === "photo" ? (
                      <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </button>
                  {mediaQueue.length > 1 && (
                    <button
                      onClick={() => retirerDuQueue(item.id)}
                      aria-label="Retirer"
                      style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#dc2626", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              ))}
              <label style={{ width: 52, height: 52, borderRadius: 10, border: "1.5px dashed rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <input type="file" accept="image/*,video/*" multiple onChange={handleFichierChange} style={{ display: "none" }} />
              </label>
            </div>
            <button
              onClick={envoyerQueue}
              disabled={envoi}
              style={{ position: "relative", width: 48, height: 48, borderRadius: "50%", background: "#15803d", border: "none", cursor: envoi ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: envoi ? 0.6 : 1 }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              {mediaQueue.length > 1 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: "#fff", color: "#15803d", fontSize: 11, fontWeight: 800, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {mediaQueue.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <button onClick={() => router.push(dashboardHref)} style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>
          ← Retour au dashboard
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Messages</h1>
      </div>

      <div className="messages-grid" style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: "calc(100dvh - 160px)", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>

        <div className={`conv-list-pane${convActive ? " conv-hidden-mobile" : ""}`} style={{ borderRight: "1px solid #e5e7eb", overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 9, padding: "0 10px", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input
                value={rechercheConv}
                onChange={e => setRechercheConv(e.target.value)}
                placeholder="Rechercher une conversation..."
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "#111827", padding: "8px 0", fontFamily: "inherit" }}
              />
            </div>
          </div>

          {conversationsFiltrees.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>
                {conversations.length === 0 ? "Aucune conversation" : "Aucun résultat"}
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>
                {conversations.length === 0 ? "Les conversations s'ouvrent après confirmation d'une commande." : "Essayez un autre terme de recherche."}
              </p>
            </div>
          ) : (
            conversationsFiltrees.map(conv => {
              const nonLu = conv.non_lus > 0;
              return (
                <div
                  key={conv.commande_id}
                  className={`conv-item${convActive?.commande_id === conv.commande_id ? " active" : ""}${nonLu ? " unread" : ""}`}
                  onClick={() => setConvActive(conv)}
                >
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: couleurAvatar(conv.contact_nom), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    {initiales(conv.contact_nom)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: nonLu ? 800 : 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.contact_nom}</p>
                      <span style={{ fontSize: 11, color: nonLu ? "#15803d" : "#9ca3af", fontWeight: nonLu ? 700 : 400, flexShrink: 0 }}>{formatRelatif(conv.dernier_message_at)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <p style={{ fontSize: 12, color: nonLu ? "#111827" : "#6b7280", fontWeight: nonLu ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {conv.dernier_message || "Démarrer la conversation"}
                      </p>
                      {nonLu && (
                        <span style={{ background: "#15803d", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20, flexShrink: 0 }}>
                          {conv.non_lus}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {conv.annonce_titre}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!convActive ? (
          <div className="chat-pane" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Vos messages</p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Sélectionnez une conversation pour commencer.</p>
          </div>
        ) : (
          <div className="chat-pane" style={{ display: "flex", flexDirection: "column", background: "#f9fafb", minHeight: 0 }}>

            {/* En-tête contact */}
            <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <button className="back-btn-mobile" onClick={() => setConvActive(null)} aria-label="Retour aux conversations" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginRight: 2 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: couleurAvatar(convActive.contact_nom), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {initiales(convActive.contact_nom)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{convActive.contact_nom}</p>
                  <span className="role-badge" style={{ background: convActive.contact_role === "vendeur" ? "#f0fdf4" : "#eff6ff", color: convActive.contact_role === "vendeur" ? "#15803d" : "#1d4ed8" }}>
                    {convActive.contact_role}
                  </span>
                </div>
              </div>
            </div>

            {/* Carte produit épinglée */}
            <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0fdf4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {convActive.annonce_photo ? (
                  <img src={convActive.annonce_photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12z"/></svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "#9ca3af" }}>Au sujet de</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{convActive.annonce_titre}</p>
              </div>
              {typeof convActive.annonce_prix === "number" && (
                <p style={{ fontSize: 14, fontWeight: 800, color: "#15803d", flexShrink: 0 }}>{formatPrix(convActive.annonce_prix)} GHS</p>
              )}
            </div>

            <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div ref={messagesListRef} onScroll={gererScroll} className="messages-list" style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>Démarrez la conversation avec {convActive.contact_nom}.</p>
                  </div>
                )}
                {messages.map((m, i) => {
                  const afficherSeparateur = i === 0 || dateSeparateur(m.created_at) !== dateSeparateur(messages[i - 1].created_at);
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column" }}>
                      {afficherSeparateur && <div className="date-sep">{dateSeparateur(m.created_at)}</div>}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: m.expediteur_id === userId ? "flex-end" : "flex-start" }}>
                        <div className={`msg-bubble ${m.expediteur_id === userId ? "msg-moi" : "msg-lui"}`} style={m.type === "photo" || m.type === "video" ? { padding: 6 } : undefined}>
                          {m.type === "photo" && m.media_url ? (
                            <>
                              <img src={m.media_url} alt="Photo envoyée" style={{ maxWidth: 240, maxHeight: 240, borderRadius: 10, display: "block" }} />
                              {m.contenu && m.contenu !== "📷 Photo" && (
                                <p style={{ margin: "6px 4px 2px", fontSize: 13 }}>{m.contenu}</p>
                              )}
                            </>
                          ) : m.type === "video" && m.media_url ? (
                            <>
                              <video src={m.media_url} controls style={{ maxWidth: 240, maxHeight: 240, borderRadius: 10, display: "block" }} />
                              {m.contenu && m.contenu !== "🎥 Vidéo" && (
                                <p style={{ margin: "6px 4px 2px", fontSize: 13 }}>{m.contenu}</p>
                              )}
                            </>
                          ) : (
                            m.contenu
                          )}
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
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {!enBasDeLaConv && (
                <button
                  onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); setEnBasDeLaConv(true); }}
                  aria-label="Aller aux derniers messages"
                  style={{ position: "absolute", bottom: 16, right: 16, width: 40, height: 40, borderRadius: "50%", background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2"><path d="M12 5v14M5 12l7 7-7-7 7 7"/></svg>
                </button>
              )}
            </div>

            {erreurEnvoi && (
              <div style={{ background: "#fef2f2", borderTop: "1px solid #fecaca", padding: "8px 20px" }}>
                <p style={{ fontSize: 12, color: "#dc2626" }}>{erreurEnvoi}</p>
              </div>
            )}

            <div style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "14px 20px", display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                {attachMenuOpen && (
                  <>
                    <div onClick={() => setAttachMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                    <div style={{ position: "absolute", bottom: "calc(100% + 10px)", left: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, boxShadow: "0 8px 28px rgba(0,0,0,0.14)", padding: 8, minWidth: 240, zIndex: 50 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#111827" }}
                        onMouseOver={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseOut={e => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        </div>
                        Prendre une photo
                        <input type="file" accept="image/*" capture="environment" onChange={handleFichierChange} disabled={envoi} style={{ display: "none" }} />
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#111827" }}
                        onMouseOver={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseOut={e => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                        </div>
                        Photo ou vidéo depuis la galerie
                        <input type="file" accept="image/*,video/*" multiple onChange={handleFichierChange} disabled={envoi} style={{ display: "none" }} />
                      </label>
                    </div>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setAttachMenuOpen(o => !o)}
                  disabled={envoi}
                  aria-label="Joindre un fichier"
                  style={{ width: 42, height: 42, borderRadius: "50%", background: attachMenuOpen ? "#e5e7eb" : "#f3f4f6", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: envoi ? "not-allowed" : "pointer", opacity: envoi ? 0.6 : 1 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8"><path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </button>
              </div>
              <input
                value={contenu}
                onChange={e => setContenu(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                placeholder="Écrivez votre message..."
                style={{ flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", color: "#111827", background: "#f9fafb" }}
              />
              <button
                onClick={envoyer}
                disabled={envoi || !contenu.trim()}
                style={{ width: 42, height: 42, borderRadius: "50%", background: contenu.trim() ? "#15803d" : "#e5e7eb", border: "none", cursor: contenu.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
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