"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function ParametresAcheteurPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Profil
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfil, setSavingProfil] = useState(false);
  const [messageProfil, setMessageProfil] = useState("");

  // Mot de passe
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmMdp, setConfirmMdp] = useState("");
  const [savingMdp, setSavingMdp] = useState(false);
  const [messageMdp, setMessageMdp] = useState("");

  // Changement de rôle
  const [changementRole, setChangementRole] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }

      const role = session.user.user_metadata?.role;
      if (role === "vendeur") { router.replace("/dashboard/vendeur"); return; }

      setUser(session.user);
      setNom(session.user.user_metadata?.name || "");
      setTelephone(session.user.user_metadata?.phone || "");
      setEmail(session.user.email || "");
      setAvatarUrl(session.user.user_metadata?.avatar_url || null);
      setLoading(false);
    });
  }, [router]);

  async function enregistrerProfil() {
    setSavingProfil(true);
    setMessageProfil("");
    try {
      let urlPhoto = avatarUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const fileName = `avatar-${user!.id}-${Date.now()}.${ext}`;
        const { data, error: erreurUpload } = await supabase.storage
          .from("Photos")
          .upload(fileName, avatarFile, { cacheControl: "3600", upsert: false });

        if (erreurUpload) {
          setMessageProfil("Erreur lors de l'envoi de la photo : " + erreurUpload.message);
          setSavingProfil(false);
          return;
        }

        const { data: urlData } = supabase.storage.from("Photos").getPublicUrl(data.path);
        urlPhoto = urlData.publicUrl;
      }

      const { error } = await supabase.auth.updateUser({
        email: email !== user?.email ? email : undefined,
        data: {
          ...user?.user_metadata,
          name: nom,
          phone: telephone,
          avatar_url: urlPhoto,
        },
      });

      if (error) {
        setMessageProfil("Erreur : " + error.message);
      } else {
        setMessageProfil(
          email !== user?.email
            ? "Profil mis à jour. Vérifiez votre nouvelle adresse email pour confirmer le changement."
            : "Profil mis à jour avec succès."
        );
        setAvatarUrl(urlPhoto);
        setAvatarFile(null);
      }
    } catch {
      setMessageProfil("Impossible de contacter le serveur.");
    } finally {
      setSavingProfil(false);
    }
  }

  async function changerMotDePasse() {
    setMessageMdp("");
    if (nouveauMdp.length < 6) {
      setMessageMdp("Erreur : le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (nouveauMdp !== confirmMdp) {
      setMessageMdp("Erreur : les deux mots de passe ne correspondent pas.");
      return;
    }
    setSavingMdp(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: nouveauMdp });
      if (error) {
        setMessageMdp("Erreur : " + error.message);
      } else {
        setMessageMdp("Mot de passe mis à jour avec succès.");
        setNouveauMdp("");
        setConfirmMdp("");
      }
    } catch {
      setMessageMdp("Impossible de contacter le serveur.");
    } finally {
      setSavingMdp(false);
    }
  }

  async function passerEnVendeur() {
    const ok = window.confirm("Passer en mode Vendeur ?");
    if (!ok) return;
    setChangementRole(true);
    await supabase.auth.updateUser({ data: { ...user?.user_metadata, role: "vendeur" } });
    router.replace("/dashboard/vendeur");
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <p style={{ color: "#9ca3af" }}>Chargement...</p>
      </div>
    );
  }

  const inp: React.CSSProperties = {
    width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10,
    padding: "11px 14px", fontSize: 14, outline: "none",
    background: "#fff", color: "#111827", fontFamily: "inherit", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, sans-serif", padding: "40px 32px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <button onClick={() => router.push("/dashboard/acheteur")} style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", marginBottom: 24 }}>
          ← Retour au dashboard
        </button>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Paramètres</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>Gérez vos informations et votre sécurité.</p>

        {/* PROFIL */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Profil</h2>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "1px solid #bbf7d0", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Photo de profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 22, fontWeight: 700, color: "#15803d" }}>{(nom || "A")[0].toUpperCase()}</span>
              )}
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#15803d", cursor: "pointer" }}>
              Changer la photo
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            </label>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Nom complet</label>
            <input value={nom} onChange={e => setNom(e.target.value)} style={inp} placeholder="Votre nom complet" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Téléphone</label>
            <input value={telephone} onChange={e => setTelephone(e.target.value)} style={inp} placeholder="Ex: 07 00 00 00 00" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Adresse email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} placeholder="vous@exemple.com" />
          </div>

          {messageProfil && (
            <p style={{ fontSize: 13, color: messageProfil.startsWith("Erreur") ? "#dc2626" : "#15803d", marginBottom: 12 }}>
              {messageProfil}
            </p>
          )}

          <button
            onClick={enregistrerProfil}
            disabled={savingProfil}
            style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: savingProfil ? "not-allowed" : "pointer", opacity: savingProfil ? 0.6 : 1, fontFamily: "inherit" }}
          >
            {savingProfil ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

        {/* MOT DE PASSE */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Changer le mot de passe</h2>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Nouveau mot de passe</label>
            <input type="password" value={nouveauMdp} onChange={e => setNouveauMdp(e.target.value)} style={inp} placeholder="Au moins 6 caractères" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Confirmer le mot de passe</label>
            <input type="password" value={confirmMdp} onChange={e => setConfirmMdp(e.target.value)} style={inp} placeholder="Retapez le mot de passe" />
          </div>

          {messageMdp && (
            <p style={{ fontSize: 13, color: messageMdp.startsWith("Erreur") ? "#dc2626" : "#15803d", marginBottom: 12 }}>
              {messageMdp}
            </p>
          )}

          <button
            onClick={changerMotDePasse}
            disabled={savingMdp}
            style={{ background: "#fff", color: "#15803d", border: "1.5px solid #15803d", borderRadius: 9, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: savingMdp ? "not-allowed" : "pointer", opacity: savingMdp ? 0.6 : 1, fontFamily: "inherit" }}
          >
            {savingMdp ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </div>

        {/* RÔLE */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Rôle actuel</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
            Vous êtes en mode <strong style={{ color: "#15803d" }}>Acheteur</strong>. Vous pouvez passer en mode Vendeur pour publier des annonces.
          </p>
          <button
            onClick={passerEnVendeur}
            disabled={changementRole}
            style={{ background: "#fff", color: "#374151", border: "1.5px solid #e5e7eb", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: changementRole ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: changementRole ? 0.6 : 1 }}
          >
            {changementRole ? "Changement en cours..." : "Passer en mode Vendeur"}
          </button>
        </div>
      </div>
    </main>
  );
}