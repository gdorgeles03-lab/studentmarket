"use client";

import { useState } from "react";

export default function AuthPage() {
  const [mode, setMode] = useState("register");

  const [form, setForm] = useState({
    name: "",
    email: "",
    university: "",
    password: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const universities = [
    "KNUST - Kumasi",
    "University of Ghana - Legon",
    "Ashesi University",
    "GIMPA - Accra",
    "University of Cape Coast",
    "Ghana Communication Technology University",
    "Autre université",
  ];

  // ✅ Correction TypeScript / React
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ Empêche le rechargement de page
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Veuillez remplir les champs obligatoires.");
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f0fdf4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            padding: "48px 40px",
            maxWidth: "440px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#14532d",
              marginBottom: "8px",
            }}
          >
            {mode === "register"
              ? "Compte créé avec succès !"
              : "Connexion réussie !"}
          </h2>

          <p style={{ color: "#6b7280", marginBottom: "32px" }}>
            Bienvenue sur StudentMarket Ghana
          </p>

          <a
            href="/"
            style={{
              display: "block",
              background: "#16a34a",
              color: "#fff",
              fontWeight: "600",
              padding: "14px",
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "15px",
            }}
          >
            Aller à l'accueil
          </a>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "24px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
          padding: "40px",
          maxWidth: "460px",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: "36px" }}>🎓</span>

            <span
              style={{
                fontWeight: "800",
                fontSize: "22px",
                color: "#15803d",
              }}
            >
              StudentMarket
            </span>
          </a>

          <p
            style={{
              color: "#9ca3af",
              fontSize: "13px",
              marginTop: "6px",
            }}
          >
            La marketplace des étudiants ghanéens 🇬🇭
          </p>
        </div>

        {/* SWITCH LOGIN / REGISTER */}
        <div
          style={{
            display: "flex",
            background: "#f3f4f6",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "28px",
          }}
        >
          <button
            onClick={() => setMode("register")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              background: mode === "register" ? "#fff" : "transparent",
              color: mode === "register" ? "#15803d" : "#6b7280",
            }}
          >
            Créer un compte
          </button>

          <button
            onClick={() => setMode("login")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              background: mode === "login" ? "#fff" : "transparent",
              color: mode === "login" ? "#15803d" : "#6b7280",
            }}
          >
            Se connecter
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {mode === "register" && (
            <div>
              <label>Nom complet</label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ex: Kofi Mensah"
                style={{
                  width: "100%",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              />
            </div>
          )}

          <div>
            <label>Adresse email</label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ton.email@ug.edu.gh"
              style={{
                width: "100%",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "12px",
              }}
            />
          </div>

          {mode === "register" && (
            <div>
              <label>Ton université</label>

              <select
                name="university"
                value={form.university}
                onChange={handleChange}
                style={{
                  width: "100%",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <option value="">Sélectionne ton université</option>

                {universities.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label>Mot de passe</label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 8 caractères"
              style={{
                width: "100%",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "12px",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              background: "#16a34a",
              color: "#fff",
              fontWeight: "700",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {mode === "register"
              ? "🚀 Créer mon compte gratuitement"
              : "🔑 Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}