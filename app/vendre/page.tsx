"use client";
import { ChangeEvent, CSSProperties, useEffect, useRef, useState } from "react";
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
  titre: "", categorie: "", prixAchat: "", duree: "", etat: "",
  description: "", telephone: "", ville: "", prixVente: "",
};

const CATEGORIES = ["Smartphone", "Laptop", "Casque / Ecouteurs", "Tablette", "Console de jeu", "Appareil photo", "Autre"];
const ETATS = ["Neuf", "Tres bon etat", "Bon etat", "Etat correct", "A reparer"];
const DUREES = ["Moins d'1 mois", "1 - 3 mois", "3 - 6 mois", "6 - 12 mois", "1 - 2 ans", "Plus de 2 ans"];
const VILLES = ["Accra", "Kumasi", "Tamale", "Cape Coast", "Takoradi", "Autre"];

const DUREE_MAP: Record<string, number> = {
  "Moins d'1 mois": 0.5, "1 - 3 mois": 2, "3 - 6 mois": 4,
  "6 - 12 mois": 9, "1 - 2 ans": 18, "Plus de 2 ans": 30,
};

export default function VendrePage() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [publication, setPublication] = useState(false);
  const [published, setPublished] = useState(false);
  const [form, setForm] = useState<FormDataType>(initialForm);

  // Ref pour révoquer toutes les object URLs créées, même celles déjà
  // retirées de `photos` via removePhoto, au démontage du composant.
  const allObjectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      allObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      allObjectUrlsRef.current.clear();
    };
  }, []);

  // Calcul du prix recommandé. Dépendances limitées aux champs sources
  // (jamais prixVente) : aucune boucle possible, mais on évite aussi un
  // setState inutile si le résultat calculé est identique à l'actuel.
  useEffect(() => {
    const achat = Number(form.prixAchat);
    const mois = DUREE_MAP[form.duree] || 0;

    if (!achat || !form.etat) {
      setScoreResult((prev) => (prev === null ? prev : null));
      return;
    }

    let dep = mois * 0.04;
    if (form.etat === "Tres bon etat") dep -= 0.05;
    if (form.etat === "A reparer") dep += 0.15;
    if (form.categorie === "Smartphone") dep += 0.02;
    dep = Math.min(Math.max(dep, 0), 0.7);

    const prix = Math.round((achat * (1 - dep)) / 10) * 10;
    const min = Math.round((prix * 0.9) / 10) * 10;
    const max = Math.round((prix * 1.1) / 10) * 10;
    let score: ScoreResult["score"] = "bon";
    if (prix > achat * 0.9) score = "eleve";
    if (prix < achat * 0.45) score = "bas";

    setScoreResult((prev) => {
      if (prev && prev.prix === prix && prev.min === min && prev.max === max && prev.score === score) {
        return prev; // évite un re-render identique
      }
      return { prix, min, max, score };
    });

    setForm((prev) => (prev.prixVente === prix.toString() ? prev : { ...prev, prixVente: prix.toString() }));
  }, [form.prixAchat, form.duree, form.etat, form.categorie]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - photos.length;
    const urls = files.slice(0, remaining).map(f => URL.createObjectURL(f));
    urls.forEach((u) => allObjectUrlsRef.current.add(u));
    setPhotos(prev => [...prev, ...urls]);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos(prev => {
      const url = prev[index];
      URL.revokeObjectURL(url);
      allObjectUrlsRef.current.delete(url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function publierAnnonce() {
    if (!scoreResult || !form.titre || !form.categorie || !form.ville || !form.telephone) {
      alert("Veuillez remplir tous les champs obligatoires."); return;
    }
    try {
      setPublication(true);
      const { error } = await supabase.from("annonces").insert({
        titre: form.titre, categorie: form.categorie, etat: form.etat,
        prix_achat: Number(form.prixAchat), prix_vente: Number(form.prixVente),
        duree_utilisation: Number(form.duree), description: form.description,
        ville: form.ville, telephone: form.telephone,
        score_prix: scoreResult?.score || "bon",
        vendeur_nom: "Etudiant", universite: "Ghana", photos,
      });
      if (error) { alert("Une erreur est survenue."); return; }
      setPublished(true);
    } catch { alert("Impossible de publier."); }
    finally { setPublication(false); }
  }

  function resetForm() {
    // Révoquer les URLs de la session terminée avant de repartir à zéro.
    photos.forEach((p) => { URL.revokeObjectURL(p); allObjectUrlsRef.current.delete(p); });
    setPublished(false);
    setForm(initialForm);
    setPhotos([]);
    setScoreResult(null);
  }

  const inp: CSSProperties = {
    width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px",
    padding: "11px 14px", fontSize: "14px", outline: "none",
    background: "#fff", color: "#111827", fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const lbl: CSSProperties = {
    display: "block", fontSize: "13px", fontWeight: 600,
    color: "#374151", marginBottom: "6px",
  };

  if (published) {
    return (
      <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: "20px", padding: "56px 48px", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f0fdf4", border: "2px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>Annonce publiee !</h2>
          <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.7, marginBottom: "32px" }}>Votre annonce est visible par tous les etudiants au Ghana. Vous serez contacte via WhatsApp.</p>
          <div style={{ display: "flex", gap: "10px" }}>
            <a href="/annonces" style={{ flex: 1, background: "#f3f4f6", color: "#374151", fontWeight: 600, padding: "12px", borderRadius: "10px", textDecoration: "none", textAlign: "center", fontSize: "14px" }}>Voir les annonces</a>
            <button onClick={resetForm} style={{ flex: 1, background: "#15803d", color: "#fff", fontWeight: 700, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px" }}>Nouvelle annonce</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus, textarea:focus { border-color: #15803d !important; box-shadow: 0 0 0 3px rgba(21,128,61,0.08); }
        .upload-zone { border: 2px dashed #d1d5db; border-radius: 12px; padding: 32px 24px; text-align: center; cursor: pointer; transition: all 0.2s; background: #fafafa; }
        .upload-zone:hover { border-color: #15803d; background: #f0fdf4; }
        .photo-thumb { position: relative; width: 100%; aspect-ratio: 1; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb; background: #f9fafb; }
        .photo-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .photo-thumb .remove { position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,0.6); border: none; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; }
        .section-block { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px; margin-bottom: 16px; }
        .section-num { width: 28px; height: 28px; border-radius: 50%; background: #15803d; color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tip-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
        .tip-icon { width: 32px; height: 32px; border-radius: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .publish-btn { width: 100%; background: #15803d; color: #fff; font-weight: 700; padding: 14px; border-radius: 10px; border: none; cursor: pointer; font-size: 15px; font-family: inherit; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .publish-btn:hover { background: #166534; }
        .publish-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .top-navlink { text-decoration: none; color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 500; }
        .top-navlink:hover { color: #fff; }
        .login-pill { text-decoration: none; background: rgba(255,255,255,0.15); color: #fff; font-size: 13px; font-weight: 600; padding: 7px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ background: "#15803d", padding: "0 40px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ textDecoration: "none", fontWeight: 900, fontSize: "20px" }}>
          <span style={{ color: "#fff" }}>Student</span><span style={{ color: "#86efac" }}>Market</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <a href="/" className="top-navlink" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            Accueil
          </a>
          <a href="/annonces" className="top-navlink">Annonces</a>
          <a href="/auth" className="login-pill">Se connecter</a>
        </div>
      </nav>

      {/* PAGE HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "24px 40px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#111827", letterSpacing: "-0.5px", marginBottom: "4px" }}>Publier une annonce</h1>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>Vendez vos appareils facilement aux etudiants</p>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 40px", display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>

        {/* LEFT COLUMN */}
        <div>

          {/* SECTION 1 — Infos de base */}
          <div className="section-block">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div className="section-num">1</div>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#111827" }}>Informations de base</h2>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label style={lbl}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12z"/></svg>
                    Categorie
                  </span>
                </label>
                <select name="categorie" value={form.categorie} onChange={handleChange} style={inp}>
                  <option value="">Choisir une categorie</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Nom de l'appareil</label>
                <input name="titre" value={form.titre} onChange={handleChange} placeholder="Ex: iPhone 13, HP Pavilion 15, etc." style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                placeholder="Decrivez l'etat, les caracteristiques, les accessoires inclus..."
                style={{ ...inp, resize: "vertical" }} />
            </div>
          </div>

          {/* SECTION 2 — Photos */}
          <div className="section-block">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div className="section-num">2</div>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#111827" }}>Photos de l'appareil</h2>
                <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "2px" }}>Ajoutez au moins 4 photos claires de votre appareil</p>
              </div>
            </div>

            {photos.length < 5 && (
              <label className="upload-zone" style={{ display: "block", marginBottom: "16px" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Cliquez pour ajouter des photos</p>
                <p style={{ fontSize: "12px", color: "#9ca3af" }}>ou glissez-deposez ici</p>
                <p style={{ fontSize: "11px", color: "#d1d5db", marginTop: "6px" }}>Format accepte : JPG, PNG (max. 5MB)</p>
                <input type="file" accept="image/*" multiple onChange={handlePhoto} style={{ display: "none" }} />
              </label>
            )}

            {photos.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "10px" }}>
                {photos.map((p, i) => (
                  <div key={p} className="photo-thumb">
                    <img src={p} alt="" />
                    <button className="remove" onClick={() => removePhoto(i)}>×</button>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 5 - photos.length) }).map((_, i) => (
                  <label key={`empty-${i}`} style={{ cursor: "pointer" }}>
                    <div style={{ width: "100%", aspectRatio: "1", border: "1.5px dashed #e5e7eb", borderRadius: "10px", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handlePhoto} style={{ display: "none" }} />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3 — Details et prix */}
          <div className="section-block">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div className="section-num">3</div>
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#111827" }}>Details et prix</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <div>
                <label style={lbl}>Prix d'achat (GHS)</label>
                <input type="number" name="prixAchat" value={form.prixAchat} onChange={handleChange} placeholder="Ex: 2500" style={inp} />
              </div>
              <div>
                <label style={lbl}>Duree d'utilisation</label>
                <select name="duree" value={form.duree} onChange={handleChange} style={inp}>
                  <option value="">Selectionner</option>
                  {DUREES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Prix souhaite (GHS)</label>
                <input type="number" name="prixVente" value={form.prixVente} onChange={handleChange} placeholder="Ex: 1800" style={{ ...inp, color: "#15803d", fontWeight: 700 }} />
              </div>
            </div>
          </div>

          {/* SECTION 4 — Infos supplementaires */}
          <div className="section-block">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div className="section-num">4</div>
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#111827" }}>Informations supplementaires</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={lbl}>Etat de l'appareil</label>
                <select name="etat" value={form.etat} onChange={handleChange} style={inp}>
                  <option value="">Selectionner l'etat</option>
                  {ETATS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Lieu
                  </span>
                </label>
                <select name="ville" value={form.ville} onChange={handleChange} style={inp}>
                  <option value="">Selectionner votre localisation</option>
                  {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Numero WhatsApp / MoMo</label>
                <input type="tel" name="telephone" value={form.telephone} onChange={handleChange} placeholder="024 XXX XXXX" style={inp} />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ position: "sticky", top: "80px" }}>

          {/* ESTIMATION CARD */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "24px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>Estimation du prix</h3>
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              </div>
            </div>

            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#15803d", fontWeight: 600, marginBottom: "4px" }}>
                {scoreResult ? `GHS ${scoreResult.min.toLocaleString()} - ${scoreResult.max.toLocaleString()}` : "GHS 0 - 0"}
              </p>
              <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
                {scoreResult ? "Prix suggere pour votre appareil" : "Completez les informations pour obtenir une estimation"}
              </p>

              {scoreResult ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>Niveau de prix</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: scoreResult.score === "bon" ? "#15803d" : scoreResult.score === "eleve" ? "#d97706" : "#dc2626" }}>
                      {scoreResult.score === "bon" ? "Coherent" : scoreResult.score === "eleve" ? "Eleve" : "Bas"}
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "#e5e7eb", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: scoreResult.score === "bon" ? "70%" : scoreResult.score === "eleve" ? "90%" : "30%", background: scoreResult.score === "bon" ? "#15803d" : scoreResult.score === "eleve" ? "#d97706" : "#dc2626", borderRadius: "3px", transition: "width 0.5s" }} />
                  </div>
                </>
              ) : (
                <div style={{ height: "6px", background: "#e5e7eb", borderRadius: "3px" }}>
                  <div style={{ height: "100%", width: "0%", background: "#15803d", borderRadius: "3px" }} />
                </div>
              )}
            </div>

            {scoreResult && (
              <p style={{ fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
                Prix recommande : <strong style={{ color: "#15803d" }}>GHS {scoreResult.prix.toLocaleString()}</strong>
              </p>
            )}
          </div>

          {/* TIPS CARD */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "24px", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>Conseils pour bien vendre</h3>
            {[
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, text: "Prenez des photos claires sous plusieurs angles" },
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text: "Soyez honnete sur l'etat de l'appareil" },
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, text: "Fixez un prix juste et competitif" },
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, text: "Repondez rapidement aux messages" },
            ].map((tip, i) => (
              <div key={i} className="tip-item">
                <div className="tip-icon">{tip.icon}</div>
                <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.5 }}>{tip.text}</p>
              </div>
            ))}
          </div>

          {/* PUBLISH CARD */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Publier votre annonce</h3>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "16px" }}>
              En publiant, vous acceptez nos{" "}
              <a href="#" style={{ color: "#15803d", textDecoration: "none" }}>Conditions d'utilisation</a>.
            </p>
            <button className="publish-btn" onClick={publierAnnonce} disabled={publication || !form.titre || !form.categorie}>
              {publication ? (
                "Publication en cours..."
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Publier maintenant
                </>
              )}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", background: "#f0fdf4", borderRadius: "10px", padding: "12px 14px", border: "1px solid #bbf7d0" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#15803d", margin: 0 }}>Vos informations sont securisees</p>
                <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>Nous ne partageons jamais vos donnees personnelles.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}