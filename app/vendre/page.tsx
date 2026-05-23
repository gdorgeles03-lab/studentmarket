"use client";

import { ChangeEvent, CSSProperties, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type FormDataType = {
  titre: string;
  categorie: string;
  prixAchat: string;
  duree: string;
  etat: string;
  description: string;
  telephone: string;
  ville: string;
  prixVente: string;
};

type ScoreResult = {
  prix: number;
  min: number;
  max: number;
  score: "bon" | "eleve" | "bas";
};

const initialForm: FormDataType = {
  titre: "",
  categorie: "",
  prixAchat: "",
  duree: "",
  etat: "",
  description: "",
  telephone: "",
  ville: "",
  prixVente: "",
};

export default function VendrePage() {
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [publication, setPublication] = useState(false);
  const [form, setForm] = useState<FormDataType>(initialForm);

  const categories = [
    "Smartphone",
    "Laptop",
    "Casque / Écouteurs",
    "Tablette",
    "Console de jeu",
    "Appareil photo",
    "Autre",
  ];

  const etats = [
    "Neuf",
    "Très bon état",
    "Bon état",
    "État correct",
    "À réparer",
  ];

  const villes = [
    "Accra",
    "Kumasi",
    "Tamale",
    "Cape Coast",
    "Takoradi",
    "Autre",
  ];

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo));
    };
  }, [photos]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 4 - photos.length;

    if (remainingSlots <= 0) return;

    const urls = files
      .slice(0, remainingSlots)
      .map((file) => URL.createObjectURL(file));

    setPhotos((prev) => [...prev, ...urls]);

    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  function evaluerPrix() {
    const achat = Number(form.prixAchat);
    const mois = Number(form.duree);

    if (!achat || mois < 0 || !form.titre || !form.categorie || !form.etat) {
      alert("Veuillez remplir les informations principales avant l’évaluation.");
      return;
    }

    let depreciation = mois * 0.04;

    if (form.etat === "Très bon état") depreciation -= 0.05;
    if (form.etat === "À réparer") depreciation += 0.15;
    if (form.categorie === "Smartphone") depreciation += 0.02;

    depreciation = Math.min(Math.max(depreciation, 0), 0.7);

    const prix = Math.round((achat * (1 - depreciation)) / 10) * 10;
    const min = Math.round((prix * 0.9) / 10) * 10;
    const max = Math.round((prix * 1.1) / 10) * 10;

    let score: ScoreResult["score"] = "bon";

    if (prix > achat * 0.9) score = "eleve";
    if (prix < achat * 0.45) score = "bas";

    setScoreResult({ prix, min, max, score });

    setForm((prev) => ({
      ...prev,
      prixVente: prix.toString(),
    }));

    setStep(3);
  }

  async function publierAnnonce() {
    if (!scoreResult) {
      alert("Veuillez d’abord évaluer le prix.");
      return;
    }

    if (
      !form.titre ||
      !form.categorie ||
      !form.etat ||
      !form.prixAchat ||
      !form.prixVente ||
      !form.duree ||
      !form.ville ||
      !form.telephone
    ) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      setPublication(true);

      const { error } = await supabase.from("annonces").insert({
        titre: form.titre,
        categorie: form.categorie,
        etat: form.etat,
        prix_achat: Number(form.prixAchat),
        prix_vente: Number(form.prixVente),
        duree_utilisation: Number(form.duree),
        description: form.description,
        ville: form.ville,
        telephone: form.telephone,
        score_prix: scoreResult.score,
        vendeur_nom: "Étudiant",
        universite: "Ghana",
        photos,
      });

      if (error) {
        console.error(error);
        alert("Une erreur est survenue lors de la publication.");
        return;
      }

      setStep(4);
    } catch (err) {
      console.error(err);
      alert("Impossible de publier l’annonce.");
    } finally {
      setPublication(false);
    }
  }

  function resetForm() {
    photos.forEach((photo) => URL.revokeObjectURL(photo));
    setStep(1);
    setPhotos([]);
    setScoreResult(null);
    setForm(initialForm);
  }

  const styles: Record<string, CSSProperties> = {
    input: {
      width: "100%",
      border: "1px solid #d1d5db",
      borderRadius: "12px",
      padding: "12px 16px",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
      background: "#ffffff",
      transition: "border-color 0.2s ease",
    },

    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: 600,
      color: "#374151",
      marginBottom: "6px",
    },

    primaryButton: {
      background: "linear-gradient(135deg,#16a34a,#15803d)",
      color: "#ffffff",
      border: "none",
      borderRadius: "12px",
      padding: "14px",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: "15px",
    },

    secondaryButton: {
      background: "#f3f4f6",
      color: "#374151",
      border: "none",
      borderRadius: "12px",
      padding: "14px",
      fontWeight: 600,
      cursor: "pointer",
      fontSize: "14px",
    },
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            fontWeight: 800,
            fontSize: "22px",
            color: "#15803d",
          }}
        >
          StudentMarket
        </a>

        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Retour
        </a>
      </div>

      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto 24px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: n < 4 ? 1 : "auto",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "13px",
                background: step >= n ? "#16a34a" : "#e5e7eb",
                color: step >= n ? "#fff" : "#9ca3af",
                flexShrink: 0,
              }}
            >
              {step > n ? "✓" : n}
            </div>

            <span
              style={{
                fontSize: "12px",
                color: step >= n ? "#15803d" : "#9ca3af",
                fontWeight: step === n ? 700 : 500,
                whiteSpace: "nowrap",
              }}
            >
              {n === 1
                ? "Photos"
                : n === 2
                ? "Informations"
                : n === 3
                ? "Évaluation"
                : "Publication"}
            </span>

            {n < 4 && (
              <div
                style={{
                  flex: 1,
                  height: "2px",
                  borderRadius: "999px",
                  background: step > n ? "#16a34a" : "#e5e7eb",
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "36px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        }}
      >
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
              Ajouter des photos
            </h1>

            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>
              Ajoutez jusqu’à 4 photos de votre appareil.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: photos[i] ? "none" : "2px dashed #bbf7d0",
                    background: photos[i] ? "#000" : "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {photos[i] ? (
                    <>
                      <img
                        src={photos[i]}
                        alt={`Produit ${i + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          border: "none",
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <label style={{ cursor: "pointer", textAlign: "center", padding: "16px" }}>
                      <div style={{ fontSize: "28px", color: "#16a34a", marginBottom: "8px" }}>
                        +
                      </div>

                      <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                        Ajouter une photo
                      </p>

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhoto}
                        style={{ display: "none" }}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={photos.length < 1}
              style={{
                ...styles.primaryButton,
                width: "100%",
                opacity: photos.length < 1 ? 0.5 : 1,
                cursor: photos.length < 1 ? "not-allowed" : "pointer",
              }}
            >
              Continuer
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
              Informations sur l’appareil
            </h1>

            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>
              Ces informations permettent d’estimer un prix cohérent.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={styles.label}>Titre</label>
                <input
                  name="titre"
                  value={form.titre}
                  onChange={handleChange}
                  placeholder="Ex : Samsung Galaxy A54 128Go"
                  style={styles.input}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={styles.label}>Catégorie</label>
                  <select name="categorie" value={form.categorie} onChange={handleChange} style={styles.input}>
                    <option value="">Sélectionner</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>État</label>
                  <select name="etat" value={form.etat} onChange={handleChange} style={styles.input}>
                    <option value="">Sélectionner</option>
                    {etats.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={styles.label}>Prix d’achat (GHS)</label>
                  <input
                    type="number"
                    name="prixAchat"
                    value={form.prixAchat}
                    onChange={handleChange}
                    placeholder="1400"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>Durée d’utilisation (mois)</label>
                  <input
                    type="number"
                    name="duree"
                    value={form.duree}
                    onChange={handleChange}
                    placeholder="8"
                    style={styles.input}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Description</label>
                <textarea
                  rows={4}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Décrivez l’appareil, les accessoires inclus et les éventuels défauts."
                  style={{ ...styles.input, resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={styles.label}>Ville</label>
                  <select name="ville" value={form.ville} onChange={handleChange} style={styles.input}>
                    <option value="">Sélectionner</option>
                    {villes.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Numéro WhatsApp / MoMo</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={form.telephone}
                    onChange={handleChange}
                    placeholder="024 XXX XXXX"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
              <button type="button" onClick={() => setStep(1)} style={{ ...styles.secondaryButton, flex: 1 }}>
                Retour
              </button>

              <button
                type="button"
                onClick={evaluerPrix}
                disabled={!form.titre || !form.categorie || !form.etat || !form.prixAchat || !form.duree}
                style={{
                  ...styles.primaryButton,
                  flex: 2,
                  opacity:
                    !form.titre || !form.categorie || !form.etat || !form.prixAchat || !form.duree
                      ? 0.5
                      : 1,
                }}
              >
                Évaluer le prix
              </button>
            </div>
          </div>
        )}

        {step === 3 && scoreResult && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
              Résultat de l’évaluation
            </h1>

            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>
              Estimation basée sur les informations fournies.
            </p>

            <div
              style={{
                background:
                  scoreResult.score === "bon"
                    ? "#f0fdf4"
                    : scoreResult.score === "eleve"
                    ? "#fefce8"
                    : "#fef2f2",
                border: `2px solid ${
                  scoreResult.score === "bon"
                    ? "#86efac"
                    : scoreResult.score === "eleve"
                    ? "#fde68a"
                    : "#fca5a5"
                }`,
                borderRadius: "20px",
                padding: "28px",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#6b7280", marginBottom: "8px" }}>
                Prix recommandé
              </p>

              <p
                style={{
                  fontSize: "48px",
                  fontWeight: 800,
                  color:
                    scoreResult.score === "bon"
                      ? "#15803d"
                      : scoreResult.score === "eleve"
                      ? "#92400e"
                      : "#991b1b",
                  margin: "0 0 8px",
                }}
              >
                GHS {scoreResult.prix}
              </p>

              <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                Fourchette estimée : GHS {scoreResult.min} – GHS {scoreResult.max}
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={styles.label}>Prix de vente final (GHS)</label>
              <input
                type="number"
                name="prixVente"
                value={form.prixVente}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#15803d",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={() => setStep(2)} style={{ ...styles.secondaryButton, flex: 1 }}>
                Modifier
              </button>

              <button
                type="button"
                onClick={publierAnnonce}
                disabled={publication}
                style={{
                  ...styles.primaryButton,
                  flex: 2,
                  opacity: publication ? 0.7 : 1,
                  cursor: publication ? "not-allowed" : "pointer",
                }}
              >
                {publication ? "Publication en cours..." : "Publier l’annonce"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#14532d", marginBottom: "12px" }}>
              Annonce publiée
            </h1>

            <p style={{ color: "#6b7280", fontSize: "15px", marginBottom: "32px" }}>
              Votre annonce est désormais visible sur la plateforme.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <a
                href="/annonces"
                style={{
                  ...styles.secondaryButton,
                  flex: 1,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                Voir les annonces
              </a>

              <button type="button" onClick={resetForm} style={{ ...styles.primaryButton, flex: 1 }}>
                Nouvelle annonce
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
