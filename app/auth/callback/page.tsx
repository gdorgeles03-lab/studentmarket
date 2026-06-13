"use client";
import { supabase } from "../../../lib/supabase";
import { useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  name: string;
  email: string;
  university: string;
  password: string;
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>({ name: "", email: "", university: "", password: "" });
  const [emailSent, setEmailSent] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const universities = ["KNUST - Kumasi", "University of Ghana - Legon", "Ashesi University", "GIMPA - Accra", "University of Cape Coast", "GCTU", "Autre universite"];

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function getPasswordCriteria() {
    const p = form.password;
    return [
      { label: "8 caracteres minimum", ok: p.length >= 8 },
      { label: "Une lettre majuscule", ok: /[A-Z]/.test(p) },
      { label: "Une lettre minuscule", ok: /[a-z]/.test(p) },
      { label: "Un chiffre", ok: /[0-9]/.test(p) },
      { label: "Un caractere special", ok: /[^A-Za-z0-9]/.test(p) },
    ];
  }

  function getPasswordScore() {
    return getPasswordCriteria().filter(c => c.ok).length;
  }

  function getStrengthColor(score: number) {
    if (score <= 1) return "#ef4444";
    if (score <= 2) return "#f97316";
    if (score <= 3) return "#eab308";
    if (score <= 4) return "#22c55e";
    return "#15803d";
  }

  function getStrengthLabel(score: number) {
    if (!form.password) return "";
    if (score <= 1) return "Tres faible";
    if (score <= 2) return "Faible";
    if (score <= 3) return "Moyen";
    if (score <= 4) return "Fort";
    return "Excellent";
  }

  const score = getPasswordScore();
  const criteria = getPasswordCriteria();

  async function handleSubmit() {
    if (submitting) return; // anti double-clic / double-soumission

    if (mode === "register" && step === 1) {
      if (!form.name || !form.email || !form.password) { alert("Veuillez remplir tous les champs."); return; }
      if (score < 2) { alert("Veuillez choisir un mot de passe plus securise."); return; }
      setStep(2);
      return;
    }

    if (mode === "register" && step === 2) {
      if (!form.university) { alert("Veuillez selectionner votre universite."); return; }
      setSubmitting(true);
      try {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { name: form.name, university: form.university },
            // Dynamique : fonctionne en local (localhost:3000), staging et prod,
            // au lieu d'une URL codée en dur.
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          if (error.message.includes("already registered") || error.message.includes("already been registered") || error.message.includes("User already registered")) {
            alert("Cette adresse e-mail est deja associee a un compte. Veuillez vous connecter ou reinitialiser votre mot de passe.");
          } else {
            alert(error.message);
          }
          return;
        }
        setEmailSent(true);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === "login") {
      if (!form.email || !form.password) { alert("Veuillez remplir tous les champs."); return; }
      setSubmitting(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) { alert("Email ou mot de passe incorrect."); return; }
        // Navigation client (pas de reload complet) : évite tout aller-retour
        // de rechargement de page avec le middleware sur /dashboard.
        router.push("/dashboard");
      } finally {
        setSubmitting(false);
      }
    }
  }

  // ── ECRAN EMAIL ENVOYE ──────────────────────────────────────────
  if (emailSent) {
    return (
      <main style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: "16px" }}>
        <style>{`
          .resend-link { background: transparent; border: none; color: #15803d; font-weight: 600; font-size: 13px; cursor: pointer; font-family: inherit; text-decoration: underline; }
          .resend-link:disabled { opacity: 0.6; cursor: not-allowed; }
        `}</style>
        <div style={{ background: "#fff", borderRadius: "20px", padding: "48px 40px", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f0fdf4", border: "2px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>Verifie ton email !</h2>
          <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.7, marginBottom: "8px" }}>
            Un lien de confirmation a ete envoye a
          </p>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#15803d", marginBottom: "24px" }}>{form.email}</p>
          <p style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.6, marginBottom: "28px" }}>
            Clique sur le lien dans l email pour activer ton compte. Verifie aussi tes spams.
          </p>

          {resendSuccess && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              <span style={{ fontSize: "13px", color: "#15803d", fontWeight: 600 }}>Un nouvel email a ete envoye avec succes.</span>
            </div>
          )}

          <a href="/" style={{ display: "block", background: "#15803d", color: "#fff", fontWeight: 700, padding: "13px", borderRadius: "10px", textDecoration: "none", fontSize: "14px", marginBottom: "12px" }}>
            Aller a l accueil
          </a>

          <button
            className="resend-link"
            disabled={submitting}
            onClick={async () => {
              setResendSuccess(false);
              setSubmitting(true);
              try {
                const { error } = await supabase.auth.resend({ type: "signup", email: form.email });
                if (error) { alert("Erreur lors du renvoi. Veuillez reessayer."); return; }
                setResendSuccess(true);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Renvoyer l email de confirmation
          </button>
        </div>
      </main>
    );
  }

  // ── PAGE PRINCIPALE ─────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus { outline: none; border-color: #15803d !important; box-shadow: 0 0 0 3px rgba(21,128,61,0.08); }
        .auth-inp { width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 13px 14px 13px 42px; font-size: 14px; color: #111827; font-family: inherit; background: #fff; transition: border-color 0.2s; }
        .auth-inp-plain { width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 13px 14px; font-size: 14px; color: #111827; font-family: inherit; background: #fff; transition: border-color 0.2s; }
        .tab-btn { flex: 1; padding: 10px; border-radius: 9px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; font-family: inherit; transition: all 0.2s; }
        .stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px; flex: 1; text-align: center; }
        .trust-item { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; flex: 1; }
        .crit-item { display: flex; align-items: center; gap: 8px; font-size: 12px; transition: color 0.2s; }
        .submit-btn { width: 100%; background: #15803d; color: #fff; font-weight: 800; padding: 13px; border-radius: 10px; border: none; cursor: pointer; font-size: 14px; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
        .submit-btn:hover { background: #166534; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ padding: "14px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", background: "#fff" }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", background: "#15803d", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <div>
            <div style={{ lineHeight: 1 }}>
              <span style={{ fontWeight: 900, fontSize: "17px", color: "#15803d" }}>Student</span>
              <span style={{ fontWeight: 900, fontSize: "17px", color: "#111827" }}>Market</span>
            </div>
            <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>La marketplace des etudiants ghaneens</p>
          </div>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px", color: "#6b7280" }}>
            {mode === "register" ? "Deja un compte ?" : "Pas encore de compte ?"}
          </span>
          <button
            onClick={() => { setMode(mode === "register" ? "login" : "register"); setStep(1); }}
            style={{ background: "transparent", border: "1.5px solid #15803d", color: "#15803d", fontWeight: 700, padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontFamily: "inherit" }}
          >
            {mode === "register" ? "Se connecter" : "S inscrire gratuitement"}
          </button>
        </div>
      </nav>

      {/* MAIN GRID */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "calc(100vh - 72px)" }}>

        {/* LEFT */}
        <div style={{ padding: "48px 64px", background: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", gap: "28px" }}>
          <div>
            <h1 style={{ fontSize: "42px", fontWeight: 900, color: "#111827", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: "14px" }}>
              {mode === "register" ? (
                <>Achete, vends et echange<br /><span style={{ color: "#15803d" }}>entre etudiants pres</span><br /><span style={{ color: "#15803d" }}>de ton campus.</span></>
              ) : (
                <>Bon retour sur<br /><span style={{ color: "#15803d" }}>StudentMarket</span><br />Ghana.</>
              )}
            </h1>
            <p style={{ fontSize: "15px", color: "#6b7280", lineHeight: 1.7, maxWidth: "400px" }}>
              Smartphones, laptops, tablettes et accessoires a prix raisonnables. Rapide. Simple. Securise.
            </p>
          </div>

          {/* STATS */}
          <div style={{ display: "flex", gap: "12px" }}>
            {[
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>, value: "12 000+", label: "Etudiants actifs" },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, value: "25+", label: "Universites partenaires" },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, value: "8 500+", label: "Annonces ce mois" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>{s.icon}</div>
                <p style={{ fontSize: "19px", fontWeight: 900, color: "#111827", margin: "0 0 2px" }}>{s.value}</p>
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* TESTIMONIAL */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "20px 22px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg,#dcfce7,#bbf7d0)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6, marginBottom: "6px", fontStyle: "italic" }}>
                "J ai vendu mon MacBook en 2 jours grace a StudentMarket. Super simple et efficace !"
              </p>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>— Ama, etudiante a UG Legon</p>
            </div>
          </div>

          {/* TRUST BADGES */}
          <div style={{ display: "flex", gap: "16px" }}>
            {[
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title: "100% Securise", desc: "Donnees protegees" },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, title: "Email verifie", desc: "Etudiants seulement" },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>, title: "Zero spam", desc: "Jamais partage" },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: "Communaute", desc: "Espace sur" },
            ].map(t => (
              <div key={t.title} className="trust-item">
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>{t.icon}</div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#111827" }}>{t.title}</p>
                <p style={{ fontSize: "10px", color: "#9ca3af" }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — FORM */}
        <div style={{ background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 48px", position: "relative" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "480px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>

            {/* PROGRESS HEADER */}
            {mode === "register" && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid #bbf7d0", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", margin: 0 }}>Inscription rapide</p>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>Moins de 30 secondes</p>
                    </div>
                  </div>
                  <div style={{ width: "42px", height: "42px", position: "relative" }}>
                    <svg width="42" height="42" viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                      <circle cx="21" cy="21" r="16" fill="none" stroke="#15803d" strokeWidth="3"
                        strokeDasharray="100" strokeDashoffset={step === 1 ? "50" : "0"}
                        strokeLinecap="round" transform="rotate(-90 21 21)"
                        style={{ transition: "stroke-dashoffset 0.5s" }}
                      />
                    </svg>
                    <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "11px", fontWeight: 700, color: "#15803d" }}>{step}/2</span>
                  </div>
                </div>
                <div style={{ height: "3px", background: "#e5e7eb", borderRadius: "2px", marginBottom: "18px" }}>
                  <div style={{ height: "100%", width: step === 1 ? "50%" : "100%", background: "#15803d", borderRadius: "2px", transition: "width 0.4s" }} />
                </div>
              </>
            )}

            {/* TABS */}
            <div style={{ display: "flex", background: "#f3f4f6", borderRadius: "12px", padding: "4px", marginBottom: "20px" }}>
              <button className="tab-btn" onClick={() => { setMode("register"); setStep(1); }}
                style={{ background: mode === "register" ? "#fff" : "transparent", color: mode === "register" ? "#15803d" : "#6b7280", boxShadow: mode === "register" ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
                Creer un compte
              </button>
              <button className="tab-btn" onClick={() => setMode("login")}
                style={{ background: mode === "login" ? "#fff" : "transparent", color: mode === "login" ? "#15803d" : "#6b7280", boxShadow: mode === "login" ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
                Se connecter
              </button>
            </div>

            {/* STEP TITLE */}
            <div style={{ marginBottom: "18px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#111827", marginBottom: "3px" }}>
                {mode === "register" ? `Etape ${step} sur 2` : "Bon retour !"}
              </h2>
              <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                {mode === "register" && step === 1 ? "Cree ton compte pour commencer a publier." : mode === "register" && step === 2 ? "Dis-nous ou tu etudies." : "Connecte-toi pour acceder a ton compte."}
              </p>
            </div>

            {/* FIELDS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* REGISTER STEP 1 */}
              {mode === "register" && step === 1 && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Nom complet</label>
                    <div style={{ position: "relative" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input className="auth-inp" name="name" value={form.name} onChange={handleChange} placeholder="Ex: Kofi Mensah" />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Email universitaire</label>
                    <div style={{ position: "relative" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input className="auth-inp" type="email" name="email" value={form.email} onChange={handleChange} placeholder="exemple@ug.edu.gh" />
                    </div>
                    <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>Un email de verification sera envoye a cette adresse</p>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Mot de passe</label>
                    <div style={{ position: "relative" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <input className="auth-inp" type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 caracteres" style={{ paddingRight: "44px" }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", padding: "4px" }}>
                        {showPassword
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>

                    {form.password && (
                      <div style={{ marginTop: "10px" }}>
                        <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                          {[1,2,3,4,5].map(i => (
                            <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i <= score ? getStrengthColor(score) : "#e5e7eb", transition: "background 0.3s" }} />
                          ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "11px", color: "#9ca3af" }}>Force du mot de passe</span>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: getStrengthColor(score) }}>{getStrengthLabel(score)}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                          {criteria.map(c => (
                            <div key={c.label} className="crit-item" style={{ color: c.ok ? "#15803d" : "#9ca3af" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.ok ? "#15803d" : "#d1d5db"} strokeWidth="2.5">
                                {c.ok ? <path d="M20 6L9 17l-5-5"/> : <circle cx="12" cy="12" r="10"/>}
                              </svg>
                              {c.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* REGISTER STEP 2 */}
              {mode === "register" && step === 2 && (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Ton universite</label>
                  <select className="auth-inp-plain" name="university" value={form.university} onChange={handleChange}>
                    <option value="">Selectionne ton universite</option>
                    {universities.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>Utilisee pour verifier que tu es bien etudiant(e)</p>
                </div>
              )}

              {/* LOGIN */}
              {mode === "login" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Email</label>
                    <div style={{ position: "relative" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input className="auth-inp" type="email" name="email" value={form.email} onChange={handleChange} placeholder="ton.email@ug.edu.gh" />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Mot de passe</label>
                      <a href="/auth/reset" style={{ fontSize: "12px", color: "#15803d", textDecoration: "none", fontWeight: 500 }}>Mot de passe oublie ?</a>
                    </div>
                    <div style={{ position: "relative" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <input className="auth-inp" type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Votre mot de passe" style={{ paddingRight: "44px" }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", padding: "4px" }}>
                        {showPassword
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* CTA BUTTON */}
              <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                {submitting
                  ? "Veuillez patienter..."
                  : mode === "register" && step === 1 ? "Continuer vers ma premiere annonce"
                  : mode === "register" && step === 2 ? "Creer mon compte gratuitement"
                  : "Se connecter"}
              </button>

              {mode === "register" && step === 2 && (
                <button onClick={() => setStep(1)} style={{ width: "100%", background: "transparent", color: "#6b7280", fontWeight: 600, padding: "10px", borderRadius: "10px", border: "1.5px solid #e5e7eb", cursor: "pointer", fontSize: "14px", fontFamily: "inherit" }}>
                  Retour
                </button>
              )}
            </div>

            {/* LEGAL */}
            <p style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center", marginTop: "14px", lineHeight: 1.6 }}>
              En creant un compte, tu acceptes nos{" "}
              <a href="#" style={{ color: "#15803d", textDecoration: "none" }}>Conditions d utilisation</a>{" "}
              et notre{" "}
              <a href="#" style={{ color: "#15803d", textDecoration: "none" }}>Politique de confidentialite</a>.
            </p>
          </div>

          {/* HELP LINK */}
          <div style={{ position: "absolute", bottom: "20px", display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "20px", padding: "8px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>Besoin d aide ?</span>
            <a href="mailto:support@studentmarket.gh" style={{ fontSize: "12px", color: "#15803d", textDecoration: "none", fontWeight: 700 }}>Nous contacter</a>
          </div>
        </div>
      </div>
    </main>
  );
}
