"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type FormState = {
  name: string;
  email: string;
  university: string;
  password: string;
  role: "vendeur" | "acheteur" | "";
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    university: "",
    password: "",
    role: "",
  });
  const [emailSent, setEmailSent] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");

  const universities = [
    "KNUST - Kumasi",
    "University of Ghana - Legon",
    "Ashesi University",
    "GIMPA - Accra",
    "University of Cape Coast",
    "GCTU",
    "Chenan Africa",
    "Autre universite",
  ];

  useEffect(() => {
    let mounted = true;
    async function redirectIfAlreadyLoggedIn() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session) {
        const role = session.user.user_metadata?.role;
        if (role === "acheteur") {
          router.replace("/dashboard/acheteur");
        } else {
          router.replace("/dashboard/vendeur");
        }
        return;
      }
      setCheckingSession(false);
    }
    redirectIfAlreadyLoggedIn();
    return () => { mounted = false; };
  }, [router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  }

  function getPasswordCriteria() {
    const password = form.password;
    return [
      { label: "8 caracteres minimum", ok: password.length >= 8 },
      { label: "Une lettre majuscule", ok: /[A-Z]/.test(password) },
      { label: "Une lettre minuscule", ok: /[a-z]/.test(password) },
      { label: "Un chiffre", ok: /[0-9]/.test(password) },
      { label: "Un caractere special", ok: /[^A-Za-z0-9]/.test(password) },
    ];
  }

  function getPasswordScore() {
    return getPasswordCriteria().filter((c) => c.ok).length;
  }

  async function handleVerifyCode() {
    if (!confirmationCode.trim()) {
      alert("Entre le code reçu par email.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        email: form.email,
        token: confirmationCode.trim(),
        type: "email",
      });
      if (error) {
        alert("Code invalide ou expiré. Vérifie ton email.");
        return;
      }
      if (!session) {
        alert("Session non créée. Demande un nouveau code.");
        return;
      }
      const role = session.user.user_metadata?.role;
      if (role === "acheteur") {
        router.replace("/dashboard/acheteur");
      } else {
        router.replace("/dashboard/vendeur");
      }
    } catch {
      alert("Impossible de vérifier le code. Vérifie ta connexion.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (submitting) return;

    if (mode === "register" && step === 1) {
      if (!form.name || !form.email || !form.password) {
        alert("Veuillez remplir tous les champs.");
        return;
      }
      if (getPasswordScore() < 2) {
        alert("Veuillez choisir un mot de passe plus securise.");
        return;
      }
      setStep(2);
      return;
    }

    if (mode === "register" && step === 2) {
      if (!form.university) {
        alert("Veuillez selectionner votre universite.");
        return;
      }
      setStep(3);
      return;
    }

    if (mode === "register" && step === 3) {
      if (!form.role) {
        alert("Veuillez choisir votre rôle.");
        return;
      }
      setSubmitting(true);
      try {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              name: form.name,
              university: form.university,
              role: form.role,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          if (
            error.message.includes("already registered") ||
            error.message.includes("already been registered") ||
            error.message.includes("User already registered")
          ) {
            alert("Email déjà utilisé. Connectez-vous.");
          } else {
            alert(error.message);
          }
          return;
        }
        setAwaitingCode(true);
      } catch {
        alert("Impossible de contacter Supabase. Vérifie ta connexion.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === "login") {
      if (!form.email || !form.password) {
        alert("Veuillez remplir tous les champs.");
        return;
      }
      setSubmitting(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error || !data.session) {
          alert("Email ou mot de passe incorrect, ou compte non confirmé.");
          return;
        }
        const role = data.session.user.user_metadata?.role;
        if (role === "acheteur") {
          router.replace("/dashboard/acheteur");
        } else {
          router.replace("/dashboard/vendeur");
        }
      } finally {
        setSubmitting(false);
      }
    }
  }

  async function handleResendEmail() {
    if (!form.email || submitting) return;
    setResendSuccess(false);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: form.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        alert("Erreur lors du renvoi. Veuillez reessayer.");
        return;
      }
      setResendSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  // ÉCRAN — Vérification de session
  if (checkingSession) {
    return (
      <main style={styles.centeredPage}>
        <p style={styles.mutedText}>Verification de la session...</p>
      </main>
    );
  }

  // ÉCRAN — Saisie du code OTP
  if (awaitingCode) {
    return (
      <main style={styles.centeredPage}>
        <section style={styles.card}>
          <div style={{ marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>
              Vérification email
            </p>
            <h2 style={styles.title}>Entrez votre code</h2>
            <p style={styles.mutedText}>
              Un code à 8 chiffres a été envoyé à{" "}
              <strong style={{ color: "#111827" }}>{form.email}</strong>.
              Vérifiez aussi vos spams.
            </p>
          </div>

          <label style={styles.label}>
            Code de confirmation
            <input
              type="text"
              maxLength={8}
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, ""))}
              placeholder="00000000"
              style={{
                border: "1.5px solid #e5e7eb",
                borderRadius: "10px",
                padding: "14px 16px",
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "10px",
                textAlign: "center",
                outline: "none",
                fontFamily: "inherit",
                color: "#111827",
                width: "100%",
              }}
            />
          </label>

          <button
            type="button"
            onClick={handleVerifyCode}
            disabled={submitting || confirmationCode.length < 8}
            style={{
              ...styles.primaryButton,
              marginTop: "16px",
              opacity: submitting || confirmationCode.length < 8 ? 0.6 : 1,
              cursor: submitting || confirmationCode.length < 8 ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Vérification en cours..." : "Confirmer et accéder au Dashboard"}
          </button>

          <button
            type="button"
            onClick={async () => {
              setConfirmationCode("");
              await supabase.auth.resend({ type: "signup", email: form.email });
              alert("Nouveau code envoyé. Vérifiez votre email.");
            }}
            style={{ ...styles.secondaryButton, marginTop: "10px" }}
          >
            Renvoyer le code
          </button>
        </section>
      </main>
    );
  }

  // ÉCRAN — Email envoyé
  if (emailSent) {
    return (
      <main style={styles.centeredPage}>
        <section style={styles.card}>
          <h1 style={styles.title}>Verifie ton email</h1>
          <p style={styles.mutedText}>Un lien de confirmation a ete envoye a :</p>
          <p style={styles.highlightText}>{form.email}</p>
          {resendSuccess && (
            <p style={styles.successText}>Un nouvel email a ete envoye avec succes.</p>
          )}
          <a href="/" style={styles.primaryLink}>Aller a l accueil</a>
          <button
            type="button"
            onClick={handleResendEmail}
            disabled={submitting}
            style={styles.secondaryButton}
          >
            Renvoyer l email de confirmation
          </button>
        </section>
      </main>
    );
  }

  const criteria = getPasswordCriteria();

  // ÉCRAN — Formulaire principal
  return (
    <main style={styles.page}>
      <section style={styles.authPanel}>
        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => { setMode("register"); setStep(1); }}
            style={mode === "register" ? styles.activeTab : styles.tab}
          >
            Creer un compte
          </button>
          <button
            type="button"
            onClick={() => { setMode("login"); setStep(1); }}
            style={mode === "login" ? styles.activeTab : styles.tab}
          >
            Se connecter
          </button>
        </div>

        <h1 style={styles.title}>
          {mode === "register" ? `Inscription - etape ${step}/3` : "Connexion"}
        </h1>

        <div style={styles.form}>

          {/* ÉTAPE 1 — Infos personnelles */}
          {mode === "register" && step === 1 && (
            <>
              <label style={styles.label}>
                Nom complet
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex: Kofi Mensah"
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="exemple@ug.edu.gh"
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Mot de passe
                <div style={styles.passwordRow}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 caracteres"
                    style={styles.passwordInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={styles.smallButton}
                  >
                    {showPassword ? "Masquer" : "Voir"}
                  </button>
                </div>
              </label>
              {form.password && (
                <div style={styles.criteriaList}>
                  {criteria.map((c) => (
                    <span key={c.label} style={c.ok ? styles.validCriterion : styles.invalidCriterion}>
                      {c.ok ? "OK" : "--"} {c.label}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ÉTAPE 2 — Université */}
          {mode === "register" && step === 2 && (
            <label style={styles.label}>
              Ton universite
              <select
                name="university"
                value={form.university}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">Selectionne ton universite</option>
                {universities.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </label>
          )}

          {/* ÉTAPE 3 — Choix du rôle */}
          {mode === "register" && step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                Vous pourrez changer de rôle à tout moment depuis votre profil.
              </p>
              {[
                {
                  value: "vendeur",
                  titre: "Je suis vendeur",
                  desc: "Je veux publier des annonces et vendre mes appareils.",
                },
                {
                  value: "acheteur",
                  titre: "Je suis acheteur",
                  desc: "Je veux parcourir les annonces et acheter des appareils.",
                },
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => setForm((f) => ({ ...f, role: option.value as "vendeur" | "acheteur" }))}
                  style={{
                    border: `1.5px solid ${form.role === option.value ? "#15803d" : "#e5e7eb"}`,
                    borderRadius: "12px",
                    padding: "16px",
                    cursor: "pointer",
                    background: form.role === option.value ? "#f0fdf4" : "#fff",
                    transition: "all 0.15s",
                  }}
                >
                  <p style={{ fontSize: "14px", fontWeight: 700, color: form.role === option.value ? "#15803d" : "#111827", marginBottom: "4px" }}>
                    {option.titre}
                  </p>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                    {option.desc}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* CONNEXION */}
          {mode === "login" && (
            <>
              <label style={styles.label}>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ton.email@ug.edu.gh"
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Mot de passe
                <div style={styles.passwordRow}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Votre mot de passe"
                    style={styles.passwordInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={styles.smallButton}
                  >
                    {showPassword ? "Masquer" : "Voir"}
                  </button>
                </div>
              </label>
            </>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={styles.primaryButton}
          >
            {submitting
              ? "Veuillez patienter..."
              : mode === "register" && step === 1
              ? "Continuer"
              : mode === "register" && step === 2
              ? "Continuer"
              : mode === "register" && step === 3
              ? "Creer mon compte"
              : "Se connecter"}
          </button>

          {mode === "register" && step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={submitting}
              style={styles.secondaryButton}
            >
              Retour
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  centeredPage: {
    minHeight: "100vh",
    background: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  authPanel: {
    width: "100%",
    maxWidth: "480px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 10px 32px rgba(0,0,0,0.06)",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "32px",
    textAlign: "center",
    boxShadow: "0 10px 32px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  tabs: {
    display: "flex",
    gap: "6px",
    background: "#f3f4f6",
    padding: "4px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  tab: {
    flex: 1,
    border: 0,
    background: "transparent",
    borderRadius: "9px",
    padding: "10px",
    cursor: "pointer",
    color: "#6b7280",
    fontWeight: 700,
  },
  activeTab: {
    flex: 1,
    border: 0,
    background: "#fff",
    borderRadius: "9px",
    padding: "10px",
    cursor: "pointer",
    color: "#15803d",
    fontWeight: 800,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: "22px",
    fontWeight: 900,
    color: "#111827",
    margin: "0 0 18px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "13px",
    color: "#374151",
    fontWeight: 700,
  },
  input: {
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    padding: "12px 13px",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  passwordRow: {
    display: "flex",
    gap: "8px",
  },
  passwordInput: {
    flex: 1,
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    padding: "12px 13px",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  primaryButton: {
    border: 0,
    borderRadius: "10px",
    background: "#15803d",
    color: "#fff",
    padding: "13px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    width: "100%",
  },
  secondaryButton: {
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    background: "#fff",
    color: "#374151",
    padding: "12px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
  },
  smallButton: {
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    background: "#fff",
    color: "#374151",
    padding: "0 12px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  criteriaList: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
    fontSize: "12px",
  },
  validCriterion: { color: "#15803d" },
  invalidCriterion: { color: "#9ca3af" },
  mutedText: {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  highlightText: {
    color: "#15803d",
    fontWeight: 800,
    fontSize: "14px",
  },
  successText: {
    color: "#15803d",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    padding: "10px",
    fontSize: "13px",
    fontWeight: 700,
  },
  primaryLink: {
    display: "block",
    borderRadius: "10px",
    background: "#15803d",
    color: "#fff",
    padding: "13px",
    fontSize: "14px",
    fontWeight: 800,
    textDecoration: "none",
    margin: "8px 0",
  },
};