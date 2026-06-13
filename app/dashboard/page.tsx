"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!user) {
        // Navigation client : pas de full reload. Le middleware gère déjà
        // la redirection serveur si la session est invalide ; ce fallback
        // côté client couvre le cas où la session expire après montage.
        router.replace("/auth");
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from("annonces")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (!error) setAnnonces(data || []);
      setLoading(false);
    }

    init();
    return () => { mounted = false; };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", background: "#f9fafb" }}>
      <p style={{ fontSize: "14px", color: "#6b7280" }}>Chargement...</p>
    </main>
  );

  const nom = user?.user_metadata?.name || user?.email;
  const universite = user?.user_metadata?.university || "Université non renseignée";
  const initiales = nom?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const totalAnnonces = annonces.length;
  const annoncesActives = annonces.filter(a => a.score_prix === "bon").length;

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', system-ui, sans-serif", color: "#111827" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        .nav-link { font-size: 13px; color: #6b7280; font-weight: 500; transition: color 0.15s; }
        .nav-link:hover { color: #111827; }
        .row-item:last-child { border-bottom: none !important; }
        .row-item { transition: background 0.1s; }
        .row-item:hover { background: #f9fafb; }
        .logout-btn { background: transparent; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #6b7280; cursor: pointer; font-family: inherit; font-weight: 500; transition: all 0.15s; }
        .logout-btn:hover { border-color: #d1d5db; color: #374151; }
        .new-listing-btn { background: #15803d; color: #ffffff; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 8px; display: inline-block; transition: background 0.15s; }
        .new-listing-btn:hover { background: #166534; }
      `}</style>

      {/* NAVIGATION */}
      <nav style={{
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        height: "58px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: 800, fontSize: "16px", color: "#15803d", letterSpacing: "-0.3px" }}>Student</span>
          <span style={{ fontWeight: 800, fontSize: "16px", color: "#111827", letterSpacing: "-0.3px" }}>Market</span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <a href="/annonces" className="nav-link">Marketplace</a>
          <a href="/vendre" className="nav-link">Publier une annonce</a>
          <div style={{ width: "1px", height: "18px", background: "#e5e7eb" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700, color: "#15803d",
            }}>
              {initiales}
            </div>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>{nom}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </nav>

      {/* CONTENU PRINCIPAL */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px" }}>

        {/* EN-TÊTE DE PAGE */}
        <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>
            Tableau de bord
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", letterSpacing: "-0.4px", marginBottom: "4px" }}>
            Bienvenue, {nom}
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>{universite}</p>
        </div>

        {/* STATISTIQUES */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Total annonces publiées", value: totalAnnonces },
            { label: "Annonces au prix cohérent", value: annoncesActives },
            { label: "Annonces à vérifier", value: totalAnnonces - annoncesActives },
          ].map(s => (
            <div key={s.label} style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "20px 24px",
            }}>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                {s.value}
              </p>
              <p style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* TABLEAU DES ANNONCES */}
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>

          {/* EN-TÊTE DU TABLEAU */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 24px", borderBottom: "1px solid #e5e7eb",
          }}>
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                Annonces publiées
              </h2>
              <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                {totalAnnonces} annonce{totalAnnonces > 1 ? "s" : ""} au total
              </p>
            </div>
            <a href="/vendre" className="new-listing-btn">
              Nouvelle annonce
            </a>
          </div>

          {/* ENTÊTES COLONNES */}
          {annonces.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 100px",
              padding: "10px 24px",
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
            }}>
              {["Appareil", "Catégorie", "Ville", "Prix de vente", "Statut"].map(h => (
                <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {h}
                </span>
              ))}
            </div>
          )}

          {/* LIGNES */}
          {annonces.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
                Vous n'avez pas encore publié d'annonce.
              </p>
              <a href="/vendre" style={{
                background: "#15803d", color: "#fff",
                fontSize: "13px", fontWeight: 600,
                padding: "9px 18px", borderRadius: "8px",
                display: "inline-block",
              }}>
                Publier ma première annonce
              </a>
            </div>
          ) : (
            annonces.map((a) => (
              <div
                key={a.id}
                className="row-item"
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 100px",
                  padding: "14px 24px",
                  borderBottom: "1px solid #f3f4f6",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "2px" }}>
                    {a.titre}
                  </p>
                  <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                    {a.etat} · {a.duree_utilisation} mois d'utilisation
                  </p>
                </div>
                <span style={{ fontSize: "13px", color: "#374151" }}>{a.categorie}</span>
                <span style={{ fontSize: "13px", color: "#374151" }}>{a.ville}</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                  GHS {a.prix_vente?.toLocaleString()}
                </span>
                <span style={{
                  fontSize: "11px", fontWeight: 600,
                  padding: "3px 10px", borderRadius: "6px",
                  display: "inline-block", textAlign: "center",
                  background: a.score_prix === "bon" ? "#f0fdf4" : "#fffbeb",
                  color: a.score_prix === "bon" ? "#166534" : "#92400e",
                  border: `1px solid ${a.score_prix === "bon" ? "#bbf7d0" : "#fde68a"}`,
                }}>
                  {a.score_prix === "bon" ? "Cohérent" : "À vérifier"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* PIED DE PAGE */}
        <div style={{ marginTop: "32px", paddingTop: "20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "12px", color: "#9ca3af" }}>
            StudentMarket Ghana · Plateforme réservée aux étudiants
          </p>
          <a href="mailto:support@studentmarket.gh" style={{ fontSize: "12px", color: "#15803d", fontWeight: 500 }}>
            support@studentmarket.gh
          </a>
        </div>

      </div>
    </main>
  );
}
