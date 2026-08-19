"use client";

import { useRouter } from "next/navigation";

export default function WalletPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        fontFamily: "Inter, sans-serif",
        padding: "40px 32px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "none",
            color: "#6b7280",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          Retour au dashboard
        </button>

        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Wallet
        </h1>

        <p
          style={{
            fontSize: 13,
            color: "#9ca3af",
            marginBottom: 24,
          }}
        >
          Votre solde et historique de paiements.
        </p>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 4,
            }}
          >
            0 GHS
          </p>

          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Solde disponible
          </p>
        </div>
      </div>
    </main>
  );
}
