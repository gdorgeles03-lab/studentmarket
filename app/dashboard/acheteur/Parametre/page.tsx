"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function ParametresAcheteurPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [changement, setChangement] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }

      const role = session.user.user_metadata?.role;
      if (role === "vendeur") { router.replace("/dashboard/vendeur"); return; }

      setUser(session.user);
      setLoading(false);
    });
  }, [router]);

  async function passerEnVendeur() {
    const ok = window.confirm("Passer en mode Vendeur ?");
    if (!ok) return;
    setChangement(true);
    await supabase.auth.updateUser({ data: { role: "vendeur" } });
    router.replace("/dashboard/vendeur");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <p style={{ color: "#9ca3af" }}>Chargement...</p>
      </div>
    );
  }

  const nom = user?.user_metadata?.name || user?.email?.split("@")[0] || "Acheteur";

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "20px 32px" }}>
        <button onClick={() => router.push("/dashboard/acheteur")} style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", marginBottom: 12, display: "block" }}>
          ← Retour au dashboard
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Paramètres</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Gérez votre compte, {nom}.</p>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Rôle actuel</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
            Vous êtes en mode <strong style={{ color: "#15803d" }}>Acheteur</strong>. Vous pouvez passer en mode Vendeur pour publier des annonces.
          </p>
          <button
            onClick={passerEnVendeur}
            disabled={changement}
            style={{
              background: "#fff", color: "#374151", border: "1.5px solid #e5e7eb", borderRadius: 9,
              padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: changement ? "not-allowed" : "pointer",
              fontFamily: "inherit", opacity: changement ? 0.6 : 1,
            }}
          >
            {changement ? "Changement en cours..." : "Passer en mode Vendeur"}
          </button>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Compte</h2>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
            Email : <strong style={{ color: "#111827" }}>{user?.email}</strong>
          </p>
        </div>
      </div>
    </main>
  );
}
