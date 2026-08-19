"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";

type Annonce = {
  id: string;
  titre: string;
  categorie: string;
  etat: string;
  prix_achat: number;
  prix_vente: number;
  duree_utilisation: number;
  description?: string;
  ville: string;
  telephone?: string;
  score_prix: "bon" | "eleve" | "bas";
  vendeur_nom?: string;
  vendeur_id: string;
  universite?: string;
  created_at: string;
  photos?: string[];
};

const CATEGORIES = ["Tous", "Smartphone", "Laptop", "Casque / Ecouteurs", "Tablette", "Console de jeu"];

function tempsEcoule(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function formatPrix(prix?: number) {
  if (!prix) return "—";
  return new Intl.NumberFormat("fr-FR").format(prix);
}

function buildWhatsAppLink(telephone?: string, titre?: string, prix?: number) {
  if (!telephone) return "#";
  const numero = telephone.replace(/\s/g, "").replace(/^0/, "233");
  const message = encodeURIComponent(`Bonjour, je suis intéressé par votre annonce "${titre}" affichée à GHS ${prix}.`);
  return `https://wa.me/${numero}?text=${message}`;
}

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("Tous");
  const [chargement, setChargement] = useState(true);
  const [selected, setSelected] = useState<Annonce | null>(null);
  const [favoris, setFavoris] = useState<Set<string>>(new Set());
  const [photoActive, setPhotoActive] = useState(0);
  const [tri, setTri] = useState("recentes");

  // ── Etat lie a l'utilisateur connecte et a la commande ──────
  const [user, setUser] = useState<User | null>(null);
  const [commandeEnCours, setCommandeEnCours] = useState(false);
  const [commandeExistante, setCommandeExistante] = useState(false);
  const [commandeConfirmee, setCommandeConfirmee] = useState(false);
  const [erreurCommande, setErreurCommande] = useState("");

  useEffect(() => {
    async function chargerAnnonces() {
      setChargement(true);
      const { data, error } = await supabase
        .from("annonces")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setAnnonces((data as Annonce[]) || []);
      setChargement(false);
    }
    chargerAnnonces();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });
  }, []);

  // ── Verifie si une commande existe deja pour cette annonce + cet utilisateur ──
  useEffect(() => {
    if (!selected || !user) {
      setCommandeExistante(false);
      return;
    }
    async function verifierCommande() {
      const { data } = await supabase
        .from("commandes")
        .select("id")
        .eq("annonce_id", selected!.id)
        .eq("acheteur_id", user!.id)
        .maybeSingle();
      setCommandeExistante(!!data);
    }
    verifierCommande();
  }, [selected, user]);

  const annoncesFiltrees = useMemo(() => {
    const resultat = annonces
      .filter(a => categorie === "Tous" || a.categorie === categorie)
      .filter(a => a.titre?.toLowerCase().includes(recherche.toLowerCase()));

    const trie = [...resultat];
    if (tri === "prix_croissant") {
      trie.sort((a, b) => (a.prix_vente || 0) - (b.prix_vente || 0));
    } else if (tri === "prix_decroissant") {
      trie.sort((a, b) => (b.prix_vente || 0) - (a.prix_vente || 0));
    } else {
      trie.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return trie;
  }, [annonces, categorie, recherche, tri]);

  function toggleFavori(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setFavoris(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function ouvrirAnnonce(annonce: Annonce) {
    setSelected(annonce);
    setCommandeConfirmee(false);
    setErreurCommande("");
    setPhotoActive(0);
  }

  // ── Creation de la commande ──────────────────────────────────
  async function passerCommande() {
    setErreurCommande("");

    if (!user) {
      window.location.href = "/auth";
      return;
    }
    if (!selected) return;

    if (selected.vendeur_id === user.id) {
      setErreurCommande("Vous ne pouvez pas commander votre propre annonce.");
      return;
    }

    setCommandeEnCours(true);
    try {
      const { error } = await supabase.from("commandes").insert({
        annonce_id: selected.id,
        acheteur_id: user.id,
        vendeur_id: selected.vendeur_id,
        acheteur_nom: user.user_metadata?.name || user.email || "Étudiant",
        statut: "en_attente",
      });

      if (error) {
        setErreurCommande("Impossible de passer la commande. Réessayez.");
        return;
      }

      setCommandeConfirmee(true);
      setCommandeExistante(true);
    } catch {
      setErreurCommande("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setCommandeEnCours(false);
    }
  }

  // ── PAGE DÉTAIL ────────────────────────────────────────────────
  if (selected) {
    return (
      <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" }}>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } a { text-decoration: none; }`}</style>

        <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", height: 58, display: "flex", alignItems: "center", padding: "0 40px", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, background: "#15803d", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: 17 }}>
              <span style={{ color: "#15803d" }}>Student</span><span style={{ color: "#111827" }}>Market</span>
            </span>
          </a>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="/annonces" style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Marketplace</a>
            <a href="/vendre" style={{ fontSize: 13, fontWeight: 600, background: "#15803d", color: "#fff", padding: "7px 14px", borderRadius: 8 }}>Publier une annonce</a>
          </div>
        </nav>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px" }}>
          <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 13, fontWeight: 500, marginBottom: 20, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
            ← Retour aux annonces
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

            {/* Gauche */}
            <div>
              {/* Photo principale */}
              <div style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderRadius: 16, height: 320, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, border: "1px solid #e5e7eb", position: "relative", overflow: "hidden" }}>
                {selected.photos && selected.photos.length > 0 ? (
                  <img src={selected.photos[photoActive] || selected.photos[0]} alt={selected.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5" style={{ display: "block", margin: "0 auto 8px" }}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12z"/></svg>
                    <p style={{ fontSize: 13, color: "#86efac" }}>{selected.categorie}</p>
                  </div>
                )}
                <span style={{ position: "absolute", top: 14, left: 14, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: selected.score_prix === "bon" ? "#15803d" : "#d97706", color: "#fff" }}>
                  {selected.score_prix === "bon" ? "Prix cohérent" : "À vérifier"}
                </span>
              </div>

              {/* Miniatures */}
              {selected.photos && selected.photos.length > 1 && (
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {selected.photos.slice(0, 5).map((p, i) => (
                    <div
                      key={i}
                      onClick={() => setPhotoActive(i)}
                      style={{
                        width: 64, height: 64, borderRadius: 10, overflow: "hidden", cursor: "pointer",
                        border: photoActive === i ? "2px solid #15803d" : "1px solid #e5e7eb",
                        opacity: photoActive === i ? 1 : 0.75,
                        transition: "all 0.15s",
                      }}
                    >
                      <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              {selected.description && (
                <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e5e7eb", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Description</h3>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{selected.description}</p>
                </div>
              )}

              {/* Détails */}
              <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e5e7eb" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Détails de l'annonce</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Catégorie", val: selected.categorie },
                    { label: "État", val: selected.etat },
                    { label: "Durée d'utilisation", val: `${selected.duree_utilisation} mois` },
                    { label: "Localisation", val: selected.ville },
                    { label: "Prix d'achat", val: `GHS ${formatPrix(selected.prix_achat)}` },
                    { label: "Publié", val: tempsEcoule(selected.created_at) },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ background: "#f9fafb", borderRadius: 9, padding: "10px 12px", border: "1px solid #f3f4f6" }}>
                      <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 3 }}>{label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Droite */}
            <div style={{ position: "sticky", top: 76 }}>

              {/* Prix */}
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1px solid #e5e7eb", marginBottom: 12 }}>
                <p style={{ fontSize: 30, fontWeight: 800, color: "#15803d", marginBottom: 4, letterSpacing: "-0.5px" }}>
                  GHS {formatPrix(selected.prix_vente)}
                </p>
                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>Prix d'achat original : GHS {formatPrix(selected.prix_achat)}</p>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4, lineHeight: 1.3 }}>{selected.titre}</h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                  {selected.etat} · {selected.duree_utilisation} mois d'utilisation · {selected.ville}
                </p>

                {/* ── BOUTON COMMANDER ────────────────────────── */}
                {commandeConfirmee ? (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px", marginBottom: 8, textAlign: "center" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#15803d", marginBottom: 2 }}>Commande envoyée !</p>
                    <p style={{ fontSize: 12, color: "#6b7280" }}>Le vendeur va bientôt confirmer votre demande.</p>
                  </div>
                ) : commandeExistante ? (
                  <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px", marginBottom: 8, textAlign: "center" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Vous avez déjà commandé cet article</p>
                  </div>
                ) : (
                  <button
                    onClick={passerCommande}
                    disabled={commandeEnCours || selected.vendeur_id === user?.id}
                    style={{
                      display: "block", width: "100%", background: selected.vendeur_id === user?.id ? "#d1d5db" : "#15803d",
                      color: "#fff", textAlign: "center", fontWeight: 700, padding: "13px", borderRadius: 10, fontSize: 14,
                      marginBottom: 8, border: "none", cursor: selected.vendeur_id === user?.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {commandeEnCours ? "Envoi en cours..." : selected.vendeur_id === user?.id ? "Votre propre annonce" : "Commander"}
                  </button>
                )}

                {erreurCommande && (
                  <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8, textAlign: "center" }}>{erreurCommande}</p>
                )}

                <a href={buildWhatsAppLink(selected.telephone, selected.titre, selected.prix_vente)} target="_blank" rel="noreferrer"
                  style={{ display: "block", background: "#fff", color: "#15803d", textAlign: "center", fontWeight: 700, padding: "12px", borderRadius: 10, fontSize: 14, border: "1.5px solid #bbf7d0", marginBottom: 8 }}>
                  Contacter via WhatsApp
                </a>
                <a href={`tel:${selected.telephone || ""}`}
                  style={{ display: "block", background: "#fff", color: "#6b7280", textAlign: "center", fontWeight: 600, padding: "10px", borderRadius: 10, fontSize: 13, border: "1px solid #e5e7eb" }}>
                  Appeler le vendeur
                </a>
              </div>

              {/* Vendeur */}
              <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e5e7eb", marginBottom: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Informations vendeur</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 700 }}>
                    {(selected.vendeur_nom || "E")[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{selected.vendeur_nom || "Étudiant"}</p>
                    <p style={{ fontSize: 12, color: "#6b7280" }}>{selected.universite || "Université non renseignée"}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", borderRadius: 8, padding: "8px 12px", border: "1px solid #bbf7d0" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>Étudiant vérifié</span>
                </div>
              </div>

              {/* Sécurité */}
              <div style={{ background: "#f9fafb", borderRadius: 14, padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Conseils de sécurité</p>
                {["Rencontrez-vous sur le campus", "Vérifiez l'appareil avant paiement", "Privilégiez le paiement en main propre"].map(c => (
                  <p key={c} style={{ fontSize: 11, color: "#6b7280", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#15803d" }}>·</span> {c}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── PAGE LISTE ─────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; cursor: pointer; transition: box-shadow 0.2s, transform 0.2s; }
        .card:hover { box-shadow: 0 8px 24px rgba(15,23,42,0.10); transform: translateY(-2px); }
        .cat-btn { padding: 8px 16px; border-radius: 999px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; font-size: 13px; font-weight: 500; color: #374151; transition: all 0.15s; font-family: inherit; }
        .cat-btn.active { background: #15803d; color: #fff; border-color: #15803d; }
        .cat-btn:hover:not(.active) { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
        .fav-btn { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
        .fav-btn:hover { background: #fff; transform: scale(1.1); }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", height: 58, display: "flex", alignItems: "center", padding: "0 40px", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, background: "#15803d", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span style={{ fontWeight: 900, fontSize: 17 }}>
            <span style={{ color: "#15803d" }}>Student</span><span style={{ color: "#111827" }}>Market</span>
          </span>
        </a>

        <div style={{ flex: 1, maxWidth: 480, margin: "0 32px" }}>
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "0 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher un appareil, une marque..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 13, padding: "10px 0", background: "transparent", color: "#111827", fontFamily: "inherit" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/vendre" style={{ fontSize: 13, fontWeight: 700, background: "#15803d", color: "#fff", padding: "8px 16px", borderRadius: 9, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Publier une annonce
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "linear-gradient(135deg, #166534 0%, #15803d 100%)", padding: "48px 40px 100px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: "-0.8px" }}>
            Marketplace étudiante
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 16 }}>
            Trouvez, achetez et vendez en toute confiance au sein de votre communauté.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              {annoncesFiltrees.length} annonce{annoncesFiltrees.length > 1 ? "s" : ""} disponible{annoncesFiltrees.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <section style={{ maxWidth: 1100, margin: "-56px auto 0", padding: "0 32px 60px" }}>

        {/* Filtres */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 24, border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(15,23,42,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map(item => (
              <button key={item} onClick={() => setCategorie(item)} className={`cat-btn${categorie === item ? " active" : ""}`}>
                {item}
              </button>
            ))}
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151", fontFamily: "inherit" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><line x1="4" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="16" y2="18"/></svg>
            Filtres
          </button>
        </div>

        {/* Titre section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Annonces récentes</h2>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>Découvrez les dernières annonces publiées par les étudiants.</p>
          </div>
          <select
            value={tri}
            onChange={e => setTri(e.target.value)}
            style={{ border: "1px solid #e5e7eb", borderRadius: 9, padding: "7px 12px", fontSize: 13, fontFamily: "inherit", color: "#374151", background: "#fff", cursor: "pointer" }}
          >
            <option value="recentes">Plus récentes</option>
            <option value="prix_croissant">Prix croissant</option>
            <option value="prix_decroissant">Prix décroissant</option>
          </select>
        </div>

        {/* Grille */}
        {chargement ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 14, color: "#6b7280" }}>Chargement des annonces...</p>
          </div>
        ) : annoncesFiltrees.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 14, padding: "60px 24px", textAlign: "center", border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Aucune annonce disponible</p>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Soyez le premier à publier dans cette catégorie.</p>
            <a href="/vendre" style={{ background: "#15803d", color: "#fff", padding: "10px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700, display: "inline-block" }}>
              Publier une annonce
            </a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {annoncesFiltrees.map(annonce => (
              <div key={annonce.id} className="card" onClick={() => ouvrirAnnonce(annonce)}>

                {/* Image */}
                <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
                  {annonce.photos && annonce.photos.length > 0 ? (
                    <img src={annonce.photos[0]} alt={annonce.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12z"/></svg>
                    </div>
                  )}

                  {/* Badge prix */}
                  <span style={{ position: "absolute", top: 10, left: 10, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: annonce.score_prix === "bon" ? "#15803d" : "#d97706", color: "#fff" }}>
                    {annonce.score_prix === "bon" ? "Vérifiée" : "À vérifier"}
                  </span>

                  {/* Bouton favori */}
                  <button className="fav-btn" style={{ position: "absolute", top: 10, right: 10 }} onClick={e => toggleFavori(annonce.id, e)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={favoris.has(annonce.id) ? "#ef4444" : "none"} stroke={favoris.has(annonce.id) ? "#ef4444" : "#9ca3af"} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>

                {/* Infos */}
                <div style={{ padding: "14px 16px" }}>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                    {annonce.categorie} · {annonce.ville}
                  </p>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6, lineHeight: 1.3 }}>
                    {annonce.titre}
                  </h3>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#15803d", marginBottom: 10 }}>
                    GHS {formatPrix(annonce.prix_vente)}
                  </p>

                  {/* Footer carte */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{annonce.ville}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{tempsEcoule(annonce.created_at)}</span>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: annonce.score_prix === "bon" ? "#f0fdf4" : "#fff7ed", border: `1px solid ${annonce.score_prix === "bon" ? "#bbf7d0" : "#fde68a"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={annonce.score_prix === "bon" ? "#15803d" : "#d97706"} strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer badges */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 48, padding: "24px", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
          {[
            { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "Transactions sécurisées" },
            { icon: "M20 6L9 17l-5-5", label: "Étudiants vérifiés" },
            { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4", label: "Paiements sécurisés" },
            { icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", label: "Support étudiant 24/7" },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d={icon}/></svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}