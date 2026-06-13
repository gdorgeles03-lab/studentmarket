"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      // detectSessionInUrl (activé dans lib/supabase.ts) traite automatiquement
      // le fragment #access_token=...&refresh_token=... au chargement du client.
      // getSession() peut nécessiter un court délai pour refléter ce traitement
      // initial — on tente quelques fois avant de conclure à une erreur.
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          setStatus("error");
          return;
        }

        if (data.session) {
          setEmail(data.session.user.email || "");
          setStatus("success");
          return;
        }

        // Pas encore de session : attendre un court instant que le SDK
        // termine le traitement du hash, puis réessayer.
        await new Promise((r) => setTimeout(r, 300));
      }

      if (mounted) setStatus("error");
    }

    handleCallback();
    return () => { mounted = false; };
  }, []);

  if (status === "loading") {
    return (
      <main style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "3px solid #e5e7eb", borderTop: "3px solid #15803d", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Verification en cours...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: "16px" }}>
        <div style={{ background: "#fff", borderRadius: "20px", padding: "48px 40px", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fef2f2", border: "2px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>Lien invalide ou expire</h2>
          <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.7, marginBottom: "28px" }}>
            Ce lien de confirmation n est plus valide. Veuillez vous inscrire a nouveau ou demander un nouveau lien.
          </p>
          <a href="/auth" style={{ display: "block", background: "#15803d", color: "#fff", fontWeight: 700, padding: "13px", borderRadius: "10px", textDecoration: "none", fontSize: "14px" }}>
            Retourner a l inscription
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: "16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .anim-scale { animation: scaleIn 0.5s ease forwards; }
        .anim-1 { animation: fadeUp 0.5s ease 0.1s forwards; opacity: 0; }
        .anim-2 { animation: fadeUp 0.5s ease 0.2s forwards; opacity: 0; }
        .anim-3 { animation: fadeUp 0.5s ease 0.3s forwards; opacity: 0; }
        .anim-4 { animation: fadeUp 0.5s ease 0.4s forwards; opacity: 0; }
        .cta-primary { display: block; background: #15803d; color: #fff; font-weight: 800; padding: 14px; border-radius: 10px; text-decoration: none; font-size: 15px; transition: background 0.2s; text-align: center; }
        .cta-primary:hover { background: #166534; }
      `}</style>

      {/* LOGO */}
      <div className="anim-1" style={{ marginBottom: "32px", textAlign: "center" }}>
        <a href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "40px", height: "40px", background: "#15803d", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span style={{ fontWeight: 900, fontSize: "20px" }}>
            <span style={{ color: "#15803d" }}>Student</span><span style={{ color: "#111827" }}>Market</span>
          </span>
        </a>
      </div>

      {/* CARD */}
      <div style={{ background: "#fff", borderRadius: "24px", padding: "48px 40px", maxWidth: "500px", width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>

        {/* SUCCESS ICON */}
        <div className="anim-scale" style={{ marginBottom: "24px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "3px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", position: "relative" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "24px", height: "24px", background: "#15803d", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
          </div>
        </div>

        <h1 className="anim-1" style={{ fontSize: "24px", fontWeight: 900, color: "#111827", marginBottom: "8px", letterSpacing: "-0.5px" }}>
          Email confirme avec succes !
        </h1>

        <p className="anim-2" style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.7, marginBottom: "6px" }}>
          Votre adresse e-mail a ete verifiee
        </p>

        {email && (
          <div className="anim-2" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "6px 14px", marginBottom: "24px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#15803d" }}>{email}</span>
          </div>
        )}

        {/* SECURITY BADGE */}
        <div className="anim-3" style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "16px 20px", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "center", textAlign: "left" }}>
          <div style={{ width: "36px", height: "36px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>Compte securise et verifie</p>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>Votre identite etudiante a ete confirmee. Vous pouvez maintenant acceder a toutes les fonctionnalites.</p>
          </div>
        </div>

        {/* FEATURES */}
        <div className="anim-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "28px" }}>
          {[
            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, label: "Publier des annonces" },
            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: "Contacter les vendeurs" },
            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: "Paiement via MoMo" },
            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, label: "Profil verifie" },
          ].map(f => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f9fafb", borderRadius: "10px", padding: "10px 12px", border: "1px solid #f3f4f6" }}>
              <div style={{ width: "26px", height: "26px", background: "#f0fdf4", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{f.icon}</div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="anim-4" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <a href="/dashboard" className="cta-primary">
            Acceder a StudentMarket
          </a>
          <a href="/vendre" style={{ display: "block", background: "#f0fdf4", color: "#15803d", fontWeight: 700, padding: "13px", borderRadius: "10px", textDecoration: "none", fontSize: "14px", border: "1.5px solid #bbf7d0" }}>
            Publier ma premiere annonce
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <p className="anim-4" style={{ marginTop: "24px", fontSize: "12px", color: "#9ca3af" }}>
        StudentMarket Ghana · <a href="mailto:support@studentmarket.gh" style={{ color: "#15803d", textDecoration: "none" }}>support@studentmarket.gh</a>
      </p>
    </main>
  );
}
