"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

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
  universite?: string;
  created_at: string;
};

const categories = [
  "Tous",
  "Smartphone",
  "Laptop",
  "Casque / Écouteurs",
  "Tablette",
  "Console de jeu",
];

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("Tous");
  const [chargement, setChargement] = useState(true);
  const [selected, setSelected] = useState<Annonce | null>(null);

  useEffect(() => {
    chargerAnnonces();
  }, []);

  async function chargerAnnonces() {
    try {
      setChargement(true);

      const { data, error } = await supabase
        .from("annonces")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur Supabase :", error.message);
        return;
      }

      setAnnonces((data as Annonce[]) || []);
    } catch (error) {
      console.error("Erreur inattendue :", error);
    } finally {
      setChargement(false);
    }
  }

  const annoncesFiltrees = useMemo(() => {
    return annonces
      .filter(
        (annonce) =>
          categorie === "Tous" || annonce.categorie === categorie
      )
      .filter((annonce) =>
        annonce.titre
          ?.toLowerCase()
          .includes(recherche.toLowerCase())
      );
  }, [annonces, categorie, recherche]);

  function getCategorieLabel(categorie: string) {
    switch (categorie) {
      case "Smartphone":
        return "Smartphone";
      case "Laptop":
        return "Ordinateur portable";
      case "Casque / Écouteurs":
        return "Audio";
      case "Console de jeu":
        return "Console";
      case "Tablette":
        return "Tablette";
      default:
        return "Appareil";
    }
  }

  function formatPrix(prix?: number) {
    if (!prix) return "—";

    return new Intl.NumberFormat("fr-FR").format(prix);
  }

  function buildWhatsAppLink(telephone?: string, titre?: string, prix?: number) {
    if (!telephone) return "#";

    const numero = telephone.replace(/\s/g, "").replace(/^0/, "233");

    const message = encodeURIComponent(
      `Bonjour, je suis intéressé par votre annonce "${titre}" affichée à GHS ${prix}.`
    );

    return `https://wa.me/${numero}?text=${message}`;
  }

  if (selected) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          padding: "32px 16px",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <button
            onClick={() => setSelected(null)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#475569",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "20px",
            }}
          >
            ← Retour aux annonces
          </button>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 40px rgba(15,23,42,0.08)",
            }}
          >
            <div
              style={{
                height: "240px",
                background:
                  "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "18px 24px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#15803d",
                  border: "1px solid #bbf7d0",
                }}
              >
                {getCategorieLabel(selected.categorie)}
              </div>
            </div>

            <div style={{ padding: "32px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "20px",
                  flexWrap: "wrap",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <span
                    style={{
                      background:
                        selected.score_prix === "bon"
                          ? "#dcfce7"
                          : "#fef3c7",
                      color:
                        selected.score_prix === "bon"
                          ? "#166534"
                          : "#92400e",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {selected.score_prix === "bon"
                      ? "Prix cohérent"
                      : "Prix à vérifier"}
                  </span>

                  <h1
                    style={{
                      fontSize: "30px",
                      fontWeight: 800,
                      color: "#0f172a",
                      marginTop: "16px",
                      marginBottom: "8px",
                    }}
                  >
                    {selected.titre}
                  </h1>

                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                      margin: 0,
                    }}
                  >
                    {selected.etat} • {selected.duree_utilisation} mois
                    d’utilisation • {selected.ville}
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      fontSize: "36px",
                      fontWeight: 800,
                      color: "#15803d",
                      margin: 0,
                    }}
                  >
                    GHS {formatPrix(selected.prix_vente)}
                  </p>

                  <p
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      marginTop: "6px",
                    }}
                  >
                    Prix d’achat : GHS{" "}
                    {formatPrix(selected.prix_achat)}
                  </p>
                </div>
              </div>

              {selected.description && (
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "20px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: "10px",
                    }}
                  >
                    Description
                  </h3>

                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.7,
                      color: "#475569",
                      margin: 0,
                    }}
                  >
                    {selected.description}
                  </p>
                </div>
              )}

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "16px",
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: "12px",
                  }}
                >
                  Informations vendeur
                </h3>

                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#111827",
                    margin: "0 0 6px",
                  }}
                >
                  {selected.vendeur_nom || "Étudiant"}
                </p>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: 0,
                  }}
                >
                  {selected.universite || "Université non renseignée"}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <a
                  href={buildWhatsAppLink(
                    selected.telephone,
                    selected.titre,
                    selected.prix_vente
                  )}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 2,
                    minWidth: "220px",
                    background:
                      "linear-gradient(135deg,#16a34a,#15803d)",
                    color: "#ffffff",
                    textDecoration: "none",
                    textAlign: "center",
                    fontWeight: 700,
                    padding: "14px 18px",
                    borderRadius: "14px",
                    fontSize: "14px",
                    boxShadow:
                      "0 8px 24px rgba(22,163,74,0.18)",
                  }}
                >
                  Contacter via WhatsApp
                </a>

                <a
                  href={`tel:${selected.telephone || ""}`}
                  style={{
                    flex: 1,
                    minWidth: "160px",
                    background: "#ffffff",
                    color: "#15803d",
                    textDecoration: "none",
                    textAlign: "center",
                    fontWeight: 700,
                    padding: "14px 18px",
                    borderRadius: "14px",
                    fontSize: "14px",
                    border: "1.5px solid #bbf7d0",
                  }}
                >
                  Appeler
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
      }}
    >
      <section
        style={{
          background:
            "linear-gradient(135deg,#166534 0%,#15803d 100%)",
          padding: "32px 16px 88px",
        }}
      >
        <div style={{ maxWidth: "980px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "28px",
            }}
          >
            <a
              href="/"
              style={{
                textDecoration: "none",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "22px",
              }}
            >
              StudentMarket
            </a>

            <a
              href="/vendre"
              style={{
                background: "#ffffff",
                color: "#15803d",
                padding: "12px 18px",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              Publier une annonce
            </a>
          </div>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#ffffff",
              marginBottom: "10px",
            }}
          >
            Marketplace étudiante
          </h1>

          <p
            style={{
              color: "#dcfce7",
              fontSize: "15px",
              marginBottom: "24px",
            }}
          >
            {annoncesFiltrees.length} annonce
            {annoncesFiltrees.length > 1 ? "s" : ""} disponible
            {annoncesFiltrees.length > 1 ? "s" : ""}
          </p>

          <div
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: "16px",
              padding: "14px 18px",
              backdropFilter: "blur(10px)",
            }}
          >
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un appareil..."
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "15px",
              }}
            />
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: "980px",
          margin: "-48px auto 0",
          padding: "0 16px 40px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "16px",
            marginBottom: "24px",
            boxShadow: "0 8px 30px rgba(15,23,42,0.06)",
            border: "1px solid #e2e8f0",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategorie(item)}
              style={{
                padding: "10px 16px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
                transition: "0.2s ease",
                background:
                  categorie === item ? "#15803d" : "#f1f5f9",
                color:
                  categorie === item ? "#ffffff" : "#334155",
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {chargement ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
            }}
          >
            <p
              style={{
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              Chargement des annonces...
            </p>
          </div>
        ) : annoncesFiltrees.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "60px 24px",
              textAlign: "center",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "#0f172a",
                marginBottom: "10px",
              }}
            >
              Aucune annonce disponible
            </h2>

            <p
              style={{
                color: "#64748b",
                marginBottom: "24px",
              }}
            >
              Aucun résultat ne correspond à votre recherche.
            </p>

            <a
              href="/vendre"
              style={{
                display: "inline-block",
                background: "#15803d",
                color: "#ffffff",
                textDecoration: "none",
                padding: "12px 20px",
                borderRadius: "12px",
                fontWeight: 700,
              }}
            >
              Publier une annonce
            </a>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "18px",
            }}
          >
            {annoncesFiltrees.map((annonce) => (
              <div
                key={annonce.id}
                onClick={() => setSelected(annonce)}
                style={{
                  background: "#ffffff",
                  borderRadius: "22px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  transition: "0.25s ease",
                  boxShadow: "0 4px 20px rgba(15,23,42,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 16px 32px rgba(15,23,42,0.10)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(15,23,42,0.05)";
                }}
              >
                <div
                  style={{
                    height: "180px",
                    background:
                      "linear-gradient(135deg,#ecfdf5,#d1fae5)",
                    padding: "20px",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      background:
                        annonce.score_prix === "bon"
                          ? "#15803d"
                          : "#d97706",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "6px 10px",
                      borderRadius: "999px",
                    }}
                  >
                    {annonce.score_prix === "bon"
                      ? "Prix cohérent"
                      : "À vérifier"}
                  </span>

                  <div
                    style={{
                      background: "#ffffff",
                      color: "#15803d",
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "8px 12px",
                      borderRadius: "999px",
                    }}
                  >
                    {getCategorieLabel(annonce.categorie)}
                  </div>
                </div>

                <div style={{ padding: "18px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginBottom: "6px",
                    }}
                  >
                    {annonce.categorie} • {annonce.ville}
                  </p>

                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "#0f172a",
                      marginBottom: "8px",
                      lineHeight: 1.4,
                    }}
                  >
                    {annonce.titre}
                  </h3>

                  <p
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      marginBottom: "18px",
                    }}
                  >
                    {annonce.etat} •{" "}
                    {annonce.duree_utilisation} mois
                    d’utilisation
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "26px",
                          fontWeight: 800,
                          color: "#15803d",
                          margin: 0,
                        }}
                      >
                        GHS {formatPrix(annonce.prix_vente)}
                      </p>

                      <p
                        style={{
                          fontSize: "12px",
                          color: "#94a3b8",
                          marginTop: "4px",
                        }}
                      >
                        Achat : GHS{" "}
                        {formatPrix(annonce.prix_achat)}
                      </p>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      marginBottom: "16px",
                    }}
                  >
                    {annonce.vendeur_nom || "Étudiant"}
                  </p>

                  <button
                    style={{
                      width: "100%",
                      background:
                        "linear-gradient(135deg,#16a34a,#15803d)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "12px",
                      padding: "12px",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Voir l’annonce
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
