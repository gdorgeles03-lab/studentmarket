"use client";
import { useRouter } from "next/navigation";
export default function CommandesPage() {
  const router = useRouter();
  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, sans-serif", padding: "40px 32px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", marginBottom: 24 }}>
          ← Retour au dashboard
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Commandes</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>Suivez toutes vos commandes reçues.</p>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#6b7280" }}>Aucune commande pour le moment.</p>
        </div>
      </div>
    </main>
  );
}
