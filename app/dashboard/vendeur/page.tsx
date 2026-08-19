"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Annonce = {
  id: string;
  titre: string;
  categorie: string;
  ville: string;
  prix_vente?: number;
  prix_achat?: number;
  score_prix?: string;
  created_at?: string;
  vues?: number;
  favoris?: number;
  statut?: string;
  photos?: string[];
};

type Commande = {
  id: string;
  annonce_id: string;
  acheteur_id: string;
  acheteur_nom: string;
  statut: string;
  created_at: string;
  annonces?: { titre: string; prix_vente: number; photos?: string[] };
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

type Conversation = {
  commande_id: string;
  autre_utilisateur_id: string;
  autre_utilisateur_nom: string;
  annonce_titre: string;
  dernier_message?: string;
  dernier_message_date?: string;
  non_lus: number;
};

function Icon({ name, size = 18, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const s = { width: size, height: size };
  const p = { fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, React.JSX.Element> = {
    grid: <svg viewBox="0 0 24 24" style={s} {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    box: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    shopping: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
    message: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    chart: <svg viewBox="0 0 24 24" style={s} {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    tag: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    wallet: <svg viewBox="0 0 24 24" style={s} {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    star: <svg viewBox="0 0 24 24" style={s} {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    settings: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    bell: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    search: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    plus: <svg viewBox="0 0 24 24" style={s} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    eye: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    share: <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    arrow: <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    logout: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    shield: <svg viewBox="0 0 24 24" style={s} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    check: <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    send: <svg viewBox="0 0 24 24" style={s} {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    back: <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="15 18 9 12 15 6"/></svg>,
  };
  return icons[name] || <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="12" cy="12" r="10"/></svg>;
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: "grid" },
  { label: "Mes Produits", icon: "box" },
  { label: "Commandes", icon: "shopping", badge: "commandes" },
  { label: "Messages", icon: "message", badge: "messages" },
  { label: "Analytics", icon: "chart" },
  { label: "Promotions", icon: "tag" },
  { label: "Wallet", icon: "wallet" },
  { label: "Avis Clients", icon: "star" },
  { label: "Parametres", icon: "settings" },
];

const MOCK_GRAPHIQUE = [1200, 1800, 1500, 2200, 1900, 2800, 2400, 3100, 2700, 3500, 3200, 3800];

export default function DashboardVendeur() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Messagerie
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convActive, setConvActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [nouveauMsg, setNouveauMsg] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }
      setUser(session.user);

      // Annonces
      const { data: ann } = await supabase
        .from("annonces").select("*")
        .eq("vendeur_id", session.user.id)
        .order("created_at", { ascending: false });
      if (ann) setAnnonces(ann);

      // Commandes
      const { data: cmd } = await supabase
        .from("commandes").select("*, annonces(titre, prix_vente, photos)")
        .eq("vendeur_id", session.user.id)
        .order("created_at", { ascending: false });
      if (cmd) setCommandes(cmd);

      // Conversations : charger les messages dont je suis expediteur ou destinataire
      await chargerConversations(session.user.id);

      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) router.replace("/auth");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // Scroll automatique vers le bas dans le chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function chargerConversations(userId: string) {
    // Récupérer tous les messages impliquant cet utilisateur
    const { data } = await supabase
      .from("messages")
      .select("*, commandes(id, annonce_id, acheteur_id, acheteur_nom, vendeur_id, annonces(titre))")
      .or(`expediteur_id.eq.${userId},destinataire_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (!data) return;

    // Grouper par commande_id pour construire les conversations
    const convMap = new Map<string, Conversation>();
    for (const msg of data) {
      if (!convMap.has(msg.commande_id)) {
        const commande = msg.commandes as any;
        const autreId = msg.expediteur_id === userId ? msg.destinataire_id : msg.expediteur_id;
        const autreNom = commande?.acheteur_id === autreId
          ? (commande?.acheteur_nom || "Acheteur")
          : "Vendeur";

        convMap.set(msg.commande_id, {
          commande_id: msg.commande_id,
          autre_utilisateur_id: autreId,
          autre_utilisateur_nom: autreNom,
          annonce_titre: commande?.annonces?.titre || "Annonce",
          dernier_message: msg.contenu,
          dernier_message_date: msg.created_at,
          non_lus: 0,
        });
      }
      // Compter les non lus
      if (!msg.lu && msg.destinataire_id === userId) {
        const conv = convMap.get(msg.commande_id)!;
        conv.non_lus += 1;
      }
    }
    setConversations(Array.from(convMap.values()));
  }

  async function ouvrirConversation(conv: Conversation) {
    setConvActive(conv);
    // Charger les messages de cette conversation
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("commande_id", conv.commande_id)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);

    // Marquer comme lus
    await supabase
      .from("messages")
      .update({ lu: true })
      .eq("commande_id", conv.commande_id)
      .eq("destinataire_id", user?.id);

    // Mettre à jour localement
    setConversations(prev => prev.map(c =>
      c.commande_id === conv.commande_id ? { ...c, non_lus: 0 } : c
    ));
  }

  async function envoyerMessage() {
    if (!nouveauMsg.trim() || !convActive || !user || envoi) return;
    setEnvoi(true);
    const contenu = nouveauMsg.trim();
    setNouveauMsg("");

    const { data, error } = await supabase.from("messages").insert({
      commande_id: convActive.commande_id,
      expediteur_id: user.id,
      destinataire_id: convActive.autre_utilisateur_id,
      contenu,
      lu: false,
    }).select().single();

    if (!error && data) {
      setMessages(prev => [...prev, data]);
      setConversations(prev => prev.map(c =>
        c.commande_id === convActive.commande_id
          ? { ...c, dernier_message: contenu, dernier_message_date: data.created_at }
          : c
      ));
    }
    setEnvoi(false);
  }

  async function changerStatutCommande(id: string, statut: string) {
    const { error } = await supabase.from("commandes").update({ statut }).eq("id", id);
    if (!error) setCommandes(prev => prev.map(c => c.id === id ? { ...c, statut } : c));
  }

  async function supprimerAnnonce(id: string) {
    const { error } = await supabase.from("annonces").delete().eq("id", id);
    if (!error) setAnnonces(prev => prev.filter(a => a.id !== id));
    setDeleteId(null);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "Inter, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#15803d", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Chargement...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  const nom = user?.user_metadata?.name || user?.email?.split("@")[0] || "Vendeur";
  const prenom = nom.split(" ")[0];
  const initiales = nom.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const totalRevenu = annonces.reduce((s, a) => s + (a.prix_vente || 0), 0);
  const trustScore = 96;
  const commandesEnAttente = commandes.filter(c => c.statut === "en_attente").length;
  const totalNonLus = conversations.reduce((s, c) => s + c.non_lus, 0);

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
        .icon-btn:hover { border-color: #15803d; background: #f0fdf4; }
        .icon-btn.danger:hover { border-color: #dc2626; background: #fef2f2; }
        .topbar-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; transition: all 0.15s; }
        .topbar-btn:hover { border-color: #15803d; background: #f0fdf4; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 500; display: flex; align-items: center; justify-content: center; }
        .action-btn { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 12px; background: #f9fafb; border: 1px solid #e5e7eb; cursor: pointer; transition: all 0.15s; font-size: 14px; font-weight: 600; color: #374151; text-decoration: none; width: 100%; font-family: inherit; }
        .action-btn:hover { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
        .conv-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
        .conv-item:hover { background: #f9fafb; }
        .conv-item.active { background: #f0fdf4; }
        .msg-bubble { max-width: 70%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-break: break-word; }
        .msg-moi { background: #15803d; color: #fff; border-bottom-right-radius: 4px; margin-left: auto; }
        .msg-autre { background: #f3f4f6; color: #111827; border-bottom-left-radius: 4px; }
        .cmd-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; gap: 12px; }
        .cmd-row:last-child { border-bottom: none; }
        .badge-statut { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        .input-msg { flex: 1; border: none; outline: none; font-size: 14px; font-family: inherit; background: transparent; color: #111827; padding: "8px 0"; }
      `}</style>

      {/* MODAL SUPPRESSION */}
      {deleteId && (
        <div className="overlay" onClick={() => setDeleteId(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px", maxWidth: 400, width: "90%", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", border: "2px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Icon name="trash" size={24} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Supprimer cette annonce ?</h3>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }}>Cette action est irreversible.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#374151" }}>Annuler</button>
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
          {NAV_ITEMS.map(item => {
            const badgeCount = item.badge === "commandes" ? commandesEnAttente : item.badge === "messages" ? totalNonLus : 0;
            return (
              <div key={item.label} className={`nav-item${activeNav === item.label ? " active" : ""}`} onClick={() => setActiveNav(item.label)}>
                <Icon name={item.icon} size={17} color={activeNav === item.label ? "#15803d" : "#6b7280"} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {badgeCount > 0 && (
                  <span style={{ background: activeNav === item.label ? "#15803d" : "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>
                    {badgeCount}
                  </span>
                )}
              </div>
            );
          })}
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
        <div style={{ margin: "0 12px 12px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Booster vos ventes</p>
          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, marginBottom: 12 }}>Mettez en avant vos annonces.</p>
          <button style={{ width: "100%", background: "#15803d", color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Creer une promotion
          </button>
        </div>
        <div style={{ padding: "12px 20px 20px", borderTop: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Besoin d aide ?</p>
          <button style={{ background: "transparent", border: "none", color: "#15803d", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
            Contacter le support
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: 230, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* TOPBAR */}
        <header style={{ height: 60, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 28px", gap: 16, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ flex: 1, maxWidth: 480, display: "flex", alignItems: "center", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "0 14px", gap: 8 }}>
            <Icon name="search" size={15} color="#9ca3af" />
            <input placeholder="Rechercher un produit, une commande..." style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "#111827", padding: "9px 0", fontFamily: "inherit" }} />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "#fff", border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              onClick={() => router.push("/vendre")}>
              <Icon name="plus" size={15} color="#fff" />
              Publier une annonce
            </button>
            <div className="topbar-btn" style={{ position: "relative" }}>
              <Icon name="bell" size={17} color="#6b7280" />
              {commandesEnAttente > 0 && <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "2px solid #fff" }} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 10, cursor: "pointer", background: "#fff" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                {initiales}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{prenom}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Vendeur verifie</span>
                  <Icon name="check" size={11} color="#15803d" />
                </div>
              </div>
            </div>
            <button className="topbar-btn" onClick={async () => { await supabase.auth.signOut(); router.replace("/auth"); }}>
              <Icon name="logout" size={16} color="#6b7280" />
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: activeNav === "Messages" ? "0" : "28px", overflow: "hidden" }}>

          {/* ── MESSAGES ── */}
          {activeNav === "Messages" && (
            <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>

              {/* Liste conversations */}
              <div style={{ width: 300, borderRight: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #f3f4f6" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Messages</h2>
                  <div style={{ display: "flex", alignItems: "center", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 12px", gap: 8 }}>
                    <Icon name="search" size={14} color="#9ca3af" />
                    <input placeholder="Rechercher..." style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "8px 0", fontFamily: "inherit" }} />
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {conversations.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 16px" }}>
                      <Icon name="message" size={32} color="#d1d5db" />
                      <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 12 }}>Aucune conversation</p>
                      <p style={{ fontSize: 12, color: "#d1d5db", marginTop: 4 }}>Les messages arrivent quand un acheteur vous contacte.</p>
                    </div>
                  ) : conversations.map(conv => (
                    <div key={conv.commande_id} className={`conv-item${convActive?.commande_id === conv.commande_id ? " active" : ""}`}
                      onClick={() => ouvrirConversation(conv)}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, color: "#15803d" }}>
                        {conv.autre_utilisateur_nom.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.autre_utilisateur_nom}</p>
                          {conv.dernier_message_date && (
                            <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>
                              {new Date(conv.dernier_message_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{conv.annonce_titre}</p>
                        {conv.dernier_message && (
                          <p style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.dernier_message}</p>
                        )}
                      </div>
                      {conv.non_lus > 0 && (
                        <span style={{ background: "#15803d", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>{conv.non_lus}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Zone de chat */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f9fafb" }}>
                {!convActive ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <Icon name="message" size={28} color="#15803d" />
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Vos messages</p>
                    <p style={{ fontSize: 14, color: "#9ca3af" }}>Selectionnez une conversation pour commencer.</p>
                  </div>
                ) : (
                  <>
                    {/* Header chat */}
                    <div style={{ padding: "14px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 }}>
                      <button onClick={() => setConvActive(null)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <Icon name="back" size={18} color="#6b7280" />
                      </button>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                        {convActive.autre_utilisateur_nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{convActive.autre_utilisateur_nom}</p>
                        <p style={{ fontSize: 12, color: "#9ca3af" }}>{convActive.annonce_titre}</p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 10 }}>
                      {messages.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px", color: "#9ca3af", fontSize: 14 }}>
                          Debut de la conversation. Envoyez votre premier message.
                        </div>
                      ) : messages.map(msg => {
                        const estMoi = msg.expediteur_id === user?.id;
                        return (
                          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: estMoi ? "flex-end" : "flex-start" }}>
                            <div className={`msg-bubble ${estMoi ? "msg-moi" : "msg-autre"}`}>
                              {msg.contenu}
                            </div>
                            <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                              {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input message */}
                    <div style={{ padding: "14px 20px", background: "#fff", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "10px 16px", gap: 10 }}>
                        <input
                          className="input-msg"
                          placeholder="Ecrivez votre message..."
                          value={nouveauMsg}
                          onChange={e => setNouveauMsg(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyerMessage(); } }}
                        />
                      </div>
                      <button
                        onClick={envoyerMessage}
                        disabled={!nouveauMsg.trim() || envoi}
                        style={{ width: 42, height: 42, borderRadius: 12, background: nouveauMsg.trim() ? "#15803d" : "#e5e7eb", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: nouveauMsg.trim() ? "pointer" : "default", transition: "all 0.2s", flexShrink: 0 }}
                      >
                        <Icon name="send" size={17} color={nouveauMsg.trim() ? "#fff" : "#9ca3af"} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── MES PRODUITS ── */}
          {activeNav === "Mes Produits" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 4 }}>Mes Produits</h1>
                  <p style={{ fontSize: 14, color: "#9ca3af" }}>{annonces.length} annonce{annonces.length > 1 ? "s" : ""} publiee{annonces.length > 1 ? "s" : ""}</p>
                </div>
                <button onClick={() => router.push("/vendre")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  <Icon name="plus" size={16} color="#fff" />
                  Nouvelle annonce
                </button>
              </div>
              {annonces.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 24px", background: "#fff", borderRadius: 16, border: "1px dashed #d1d5db" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Icon name="box" size={28} color="#15803d" />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Aucun produit</p>
                  <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>Vous n avez pas encore publie d annonce.</p>
                  <button onClick={() => router.push("/vendre")} style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Publier ma premiere annonce
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {annonces.map(a => {
                    const photo = Array.isArray(a.photos) && a.photos.length > 0 ? a.photos[0] : null;
                    return (
                      <div key={a.id} className="product-card">
                        <div style={{ height: 180, background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", position: "relative", overflow: "hidden" }}>
                          {photo
                            ? <img src={photo} alt={a.titre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="box" size={40} color="#86efac" /></div>
                          }
                          <div style={{ position: "absolute", top: 10, left: 10, background: "#15803d", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>
                            {a.statut ? a.statut.charAt(0).toUpperCase() + a.statut.slice(1) : "Actif"}
                          </div>
                          {a.score_prix && (
                            <div style={{ position: "absolute", top: 10, right: 10, background: a.score_prix === "bon" ? "#f0fdf4" : "#fffbeb", color: a.score_prix === "bon" ? "#15803d" : "#92400e", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, border: `1px solid ${a.score_prix === "bon" ? "#bbf7d0" : "#fde68a"}` }}>
                              {a.score_prix === "bon" ? "Prix coherent" : "Prix eleve"}
                            </div>
                          )}
                        </div>
                        <div style={{ padding: 16 }}>
                          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{a.categorie} · {a.ville}</p>
                          <p style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 8, lineHeight: 1.3 }}>{a.titre}</p>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#15803d" }}>{(a.prix_vente || 0).toLocaleString()} GHS</span>
                            {a.prix_achat && <span style={{ fontSize: 13, color: "#9ca3af", textDecoration: "line-through" }}>{a.prix_achat.toLocaleString()} GHS</span>}
                          </div>
                          <div style={{ display: "flex", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #f3f4f6" }}>
                            <span style={{ fontSize: 12, color: "#6b7280" }}>{a.vues || 0} vues</span>
                            <span style={{ fontSize: 12, color: "#6b7280" }}>{a.favoris || 0} favoris</span>
                            {a.created_at && <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: "auto" }}>{new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151", fontFamily: "inherit" }} onClick={() => router.push("/vendre")}>Modifier</button>
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

          {/* ── COMMANDES ── */}
          {activeNav === "Commandes" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 4 }}>Commandes</h1>
                <p style={{ fontSize: 14, color: "#9ca3af" }}>{commandes.length} commande{commandes.length > 1 ? "s" : ""} au total</p>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "12px 20px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
                  {["Produit", "Acheteur", "Statut", "Actions"].map(h => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</span>
                  ))}
                </div>
                {commandes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af", fontSize: 14 }}>Aucune commande pour l instant.</div>
                ) : commandes.map(cmd => (
                  <div key={cmd.id} className="cmd-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="box" size={16} color="#15803d" />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{cmd.annonces?.titre || "Produit"}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(cmd.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{cmd.acheteur_nom}</span>
                    <span className="badge-statut" style={{
                      background: cmd.statut === "confirmee" ? "#f0fdf4" : cmd.statut === "refusee" ? "#fef2f2" : cmd.statut === "terminee" ? "#eff6ff" : "#fffbeb",
                      color: cmd.statut === "confirmee" ? "#15803d" : cmd.statut === "refusee" ? "#dc2626" : cmd.statut === "terminee" ? "#1d4ed8" : "#92400e",
                    }}>
                      {cmd.statut === "en_attente" ? "En attente" : cmd.statut === "confirmee" ? "Confirmee" : cmd.statut === "refusee" ? "Refusee" : cmd.statut === "terminee" ? "Terminee" : cmd.statut}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {cmd.statut === "en_attente" && (
                        <>
                          <button onClick={() => changerStatutCommande(cmd.id, "confirmee")} style={{ padding: "6px 12px", borderRadius: 7, background: "#15803d", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Confirmer</button>
                          <button onClick={() => changerStatutCommande(cmd.id, "refusee")} style={{ padding: "6px 12px", borderRadius: 7, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Refuser</button>
                        </>
                      )}
                      {cmd.statut === "confirmee" && (
                        <button onClick={() => changerStatutCommande(cmd.id, "terminee")} style={{ padding: "6px 12px", borderRadius: 7, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Terminer</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── COMING SOON ── */}
          {["Analytics", "Promotions", "Wallet", "Avis Clients", "Parametres"].includes(activeNav) && (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Icon name={NAV_ITEMS.find(n => n.label === activeNav)?.icon || "grid"} size={28} color="#15803d" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{activeNav}</h2>
              <p style={{ fontSize: 14, color: "#9ca3af" }}>Cette section sera disponible prochainement.</p>
            </div>
          )}

          {/* ── DASHBOARD PRINCIPAL ── */}
          {activeNav === "Dashboard" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111827", marginBottom: 4, letterSpacing: "-0.5px" }}>Bienvenue, {prenom} !</h1>
                  <p style={{ fontSize: 14, color: "#9ca3af" }}>Voici ce qui se passe dans votre boutique aujourd hui.</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Revenus totaux", value: `${totalRevenu.toLocaleString()} GHS`, sub: `${annonces.length} annonces au total`, icon: "wallet", color: "#15803d", bg: "#f0fdf4" },
                  { label: "Produits actifs", value: String(annonces.filter(a => !a.statut || a.statut === "actif").length), sub: `sur ${annonces.length} annonces`, icon: "box", color: "#7c3aed", bg: "#faf5ff" },
                  { label: "Prix coherents", value: String(annonces.filter(a => a.score_prix === "bon").length), sub: `${annonces.filter(a => a.score_prix !== "bon").length} a verifier`, icon: "shield", color: "#0e7490", bg: "#ecfeff" },
                  { label: "Trust Score", value: `${trustScore}/100`, sub: "Excellent", icon: "star", color: "#d97706", bg: "#fffbeb" },
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
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 20 }}>Ventes sur 30 jours</h2>
                  <svg width="100%" height="160" viewBox="0 0 600 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#15803d" stopOpacity="0.15"/>
                        <stop offset="100%" stopColor="#15803d" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {[0,1,2,3].map(i => <line key={i} x1="0" y1={i*40} x2="600" y2={i*40} stroke="#f3f4f6" strokeWidth="1"/>)}
                    <path d={`M ${MOCK_GRAPHIQUE.map((v,i) => `${i*54},${150-(v/4000)*140}`).join(" L ")} L ${11*54},150 L 0,150 Z`} fill="url(#grad)"/>
                    <polyline points={MOCK_GRAPHIQUE.map((v,i) => `${i*54},${150-(v/4000)*140}`).join(" ")} fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    {MOCK_GRAPHIQUE.map((v,i) => <circle key={i} cx={i*54} cy={150-(v/4000)*140} r="4" fill="#fff" stroke="#15803d" strokeWidth="2.5"/>)}
                  </svg>
                </div>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px" }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 16 }}>Actions rapides</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Nouvelle annonce", icon: "plus", action: () => router.push("/vendre") },
                      { label: "Mes produits", icon: "box", action: () => setActiveNav("Mes Produits") },
                      { label: "Messages", icon: "message", action: () => setActiveNav("Messages") },
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
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Mes annonces recentes</h2>
                  <button onClick={() => setActiveNav("Mes Produits")} style={{ fontSize: 13, color: "#15803d", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Voir toutes →</button>
                </div>
                <div style={{ padding: "10px 20px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 90px", gap: 12 }}>
                  {["Produit", "Prix", "Fair Price", "Statut"].map(h => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</span>
                  ))}
                </div>
                {annonces.slice(0, 5).map(a => {
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
                          {a.score_prix === "bon" ? "Bon" : "Eleve"}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "#f0fdf4", color: "#15803d", display: "inline-block" }}>
                        {a.statut ? a.statut.charAt(0).toUpperCase() + a.statut.slice(1) : "Actif"}
                      </span>
                    </div>
                  );
                })}
                {annonces.length === 0 && (
                  <div style={{ textAlign: "center", padding: "32px", color: "#9ca3af", fontSize: 14 }}>Aucune annonce publiee.</div>
                )}
                <div style={{ padding: "14px 20px", textAlign: "center" }}>
                  <button onClick={() => setActiveNav("Mes Produits")} style={{ fontSize: 13, color: "#15803d", fontWeight: 700, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    Voir toutes mes annonces →
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}