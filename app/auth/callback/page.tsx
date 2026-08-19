"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Verification de votre session...");

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          setMessage("Activation de votre session...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          window.history.replaceState({}, "", window.location.pathname);
        }

        setMessage("Lecture de votre session...");

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (!mounted) return;
          if (error) throw error;

          if (session) {
            setEmail(session.user.email || "");
            setStatus("success");
            return;
          }

          await new Promise((resolve) => window.setTimeout(resolve, 300));
        }

        throw new Error("Aucune session trouvee apres confirmation.");
      } catch {
        if (!mounted) return;
        setStatus("error");
      }
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <div style={styles.spinner} />
          <p style={styles.mutedText}>{message}</p>
        </section>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <h1 style={styles.title}>Lien invalide ou expire</h1>
          <p style={styles.mutedText}>
            Ce lien de confirmation n est plus valide. Veuillez vous inscrire a nouveau
            ou demander un nouveau lien.
          </p>
          <button type="button" onClick={() => router.replace("/auth")} style={styles.primaryButton}>
            Retourner a l inscription
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.successIcon}>OK</div>
        <h1 style={styles.title}>Email confirme avec succes</h1>
        <p style={styles.mutedText}>Votre adresse e-mail a ete verifiee.</p>

        {email && <p style={styles.highlightText}>{email}</p>}

        <button type="button" onClick={() => router.replace("/dashboard")} style={styles.primaryButton}>
          Acceder a StudentMarket
        </button>
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
  card: {
    width: "100%",
    maxWidth: "480px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "36px",
    textAlign: "center",
    boxShadow: "0 10px 32px rgba(0,0,0,0.06)",
  },
  spinner: {
    width: "42px",
    height: "42px",
    border: "3px solid #e5e7eb",
    borderTopColor: "#15803d",
    borderRadius: "50%",
    margin: "0 auto 18px",
    animation: "spin 1s linear infinite",
  },
  successIcon: {
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    background: "#f0fdf4",
    border: "2px solid #86efac",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 18px",
    color: "#15803d",
    fontSize: "13px",
    fontWeight: 900,
  },
  title: {
    fontSize: "22px",
    fontWeight: 900,
    color: "#111827",
    margin: "0 0 10px",
  },
  mutedText: {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: 1.7,
    margin: "0 0 18px",
  },
  highlightText: {
    display: "inline-block",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "999px",
    color: "#15803d",
    fontSize: "13px",
    fontWeight: 800,
    padding: "7px 14px",
    margin: "0 0 24px",
  },
  primaryButton: {
    width: "100%",
    border: 0,
    borderRadius: "10px",
    background: "#15803d",
    color: "#fff",
    padding: "13px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
};
