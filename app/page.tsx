"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const NAV_CATS = [
  { label: "Smartphones", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>, subs: ["iPhone", "Samsung", "Tecno", "Infinix", "Huawei", "Xiaomi"] },
  { label: "Laptops", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M1 20h22"/></svg>, subs: ["MacBook", "HP", "Dell", "Lenovo", "Asus", "Acer"] },
  { label: "Audio", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>, subs: ["AirPods", "Sony WH", "JBL", "Bose", "Samsung Buds", "Oraimo"] },
  { label: "Tablettes", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>, subs: ["iPad", "Samsung Tab", "Huawei MatePad", "Lenovo Tab", "Amazon Fire"] },
  { label: "Consoles", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="10" rx="3"/><path d="M6 12h4m-2-2v4"/><circle cx="17" cy="11" r="1" fill="currentColor"/><circle cx="19" cy="13" r="1" fill="currentColor"/></svg>, subs: ["PlayStation 5", "Xbox Series", "Nintendo Switch", "PS4", "Xbox One"] },
  { label: "Accessoires", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, subs: ["Chargeurs", "Coques", "Cables", "Supports", "Power Banks", "Claviers"] },
];

const CAT_ITEMS = [
  { label: "Smartphones", count: "48 listings", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", activeBg: "#dcfce7", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="#15803d"/></svg> },
  { label: "Laptops", count: "32 listings", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", activeBg: "#dbeafe", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M1 20h22"/></svg> },
  { label: "Audio", count: "21 listings", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe", activeBg: "#ede9fe", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> },
  { label: "Tablettes", count: "14 listings", color: "#b45309", bg: "#fff7ed", border: "#fed7aa", activeBg: "#ffedd5", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.8"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="#b45309"/></svg> },
  { label: "Consoles", count: "9 listings", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca", activeBg: "#fee2e2", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.8"><rect x="2" y="7" width="20" height="10" rx="3"/><path d="M6 12h4m-2-2v4"/><circle cx="17" cy="11" r="1" fill="#b91c1c"/><circle cx="19" cy="13" r="1" fill="#b91c1c"/></svg> },
  { label: "Accessoires", count: "37 listings", color: "#065f46", bg: "#ecfdf5", border: "#a7f3d0", activeBg: "#d1fae5", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  { label: "Cameras", count: "6 listings", color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc", activeBg: "#cffafe", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0e7490" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> },
  { label: "Montres", count: "11 listings", color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe", activeBg: "#e0e7ff", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8"><circle cx="12" cy="12" r="7"/><path d="M12 9v3l2 2M9 3h6M9 21h6"/></svg> },
];

const STEPS = [
  { num: "01", en: "Take 4 Photos", fr: "Prends 4 photos", desc: "Photograph your device from all angles. Better photos sell faster.", img: "/photo1.png" },
  { num: "02", en: "AI Price Check", fr: "Evaluation par IA", desc: "Our AI compares with Jumia, Tonaton and Jiji to find the right price.", img: "/photo2.png" },
  { num: "03", en: "Sell & Get Paid", fr: "Vends et encaisse", desc: "Receive your payment via MTN MoMo, Telecel Cash or AirtelTigo.", img: "/photo3.png" },
];

const TESTIMONIALS = [
  { name: "Kofi Mensah", uni: "KNUST · Kumasi", text: "I sold my laptop in less than 3 hours. The AI price was exactly right and MoMo payment was instant." },
  { name: "Ama Serwaa", uni: "UG Legon · Accra", text: "Found a great deal on an iPhone. The seller was verified and everything went smoothly. 100% recommend." },
  { name: "Kwame Boateng", uni: "Ashesi University", text: "Best platform for students. The AI evaluation saved me from underpricing my MacBook Air." },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setActiveStep(s => (s + 1) % 3), 3000);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    onScroll();
    supabase.from("annonces").select("*").order("created_at", { ascending: false }).limit(6).then(({ data }) => {
      if (data) setAnnonces(data);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUser(data.session.user);
    });
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "true") {
      setToast(true);
      setTimeout(() => setToast(false), 3500);
      window.history.replaceState({}, "", "/");
    }
    return () => { clearInterval(interval); window.removeEventListener("scroll", onScroll); };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setUserMenuOpen(false);
    window.location.href = "/";
  }

  const firstName = user?.user_metadata?.name?.split(" ")[0] || "Mon compte";
  const fullName = user?.user_metadata?.name || "";

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "'Inter', system-ui, sans-serif", color: "#111827" }}>

      {/* TOAST */}
      {toast && user && (
        <div style={{ position: "fixed", top: "80px", right: "24px", zIndex: 500, background: "#15803d", color: "#fff", padding: "12px 20px", borderRadius: "12px", boxShadow: "0 8px 24px rgba(21,128,61,0.3)", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 600 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          Bon retour, {firstName}!
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes infiniteScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .anim-1 { animation: fadeUp 0.6s ease 0s forwards; opacity: 0; }
        .anim-2 { animation: fadeUp 0.6s ease 0.1s forwards; opacity: 0; }
        .anim-3 { animation: fadeUp 0.6s ease 0.2s forwards; opacity: 0; }
        .dropdown-cat { animation: fadeDown 0.18s ease forwards; }
        .cat-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; cursor: pointer; transition: background 0.15s; font-size: 14px; font-weight: 500; color: #374151; text-decoration: none; }
        .cat-item:hover, .cat-item.active { background: #f0fdf4; color: #15803d; }
        .listing-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; transition: all 0.22s; cursor: pointer; text-decoration: none; display: block; }
        .listing-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.09); border-color: #bbf7d0; }
        .step-card { border-radius: 16px; overflow: hidden; border: 1.5px solid #e5e7eb; background: #fff; cursor: pointer; transition: all 0.35s; }
        .step-card.active { border-color: #15803d; box-shadow: 0 16px 40px rgba(21,128,61,0.1); }
        .step-img { width: 100%; height: 180px; object-fit: cover; display: block; transition: transform 0.45s; }
        .step-card.active .step-img { transform: scale(1.04); }
        .tcard { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px; transition: all 0.25s; }
        .tcard:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.06); }
        .btn-primary { text-decoration: none; background: #15803d; color: #fff; font-weight: 700; border-radius: 8px; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; transition: all 0.18s; border: none; cursor: pointer; }
        .btn-primary:hover { background: #166534; box-shadow: 0 6px 18px rgba(21,128,61,0.25); transform: translateY(-1px); }
        .btn-outline { text-decoration: none; background: transparent; color: #15803d; font-weight: 700; border-radius: 8px; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid #15803d; transition: all 0.18s; }
        .btn-outline:hover { background: #f0fdf4; }
        .float-cta { position: fixed; bottom: 28px; right: 28px; z-index: 300; box-shadow: 0 8px 28px rgba(21,128,61,0.35); }
        .nav-link { text-decoration: none; font-size: 13px; color: #4b5563; font-weight: 500; padding: 6px 4px; transition: color 0.15s; white-space: nowrap; }
        .nav-link:hover { color: #15803d; }
        .uni-label { font-size: 14px; font-weight: 800; color: #d1d5db; letter-spacing: 1.5px; transition: color 0.2s; cursor: default; }
        .uni-label:hover { color: #15803d; }
        .carousel-track { display: flex; gap: 14px; width: max-content; animation: infiniteScroll 28s linear infinite; }
        .carousel-track:hover { animation-play-state: paused; }
        .carousel-item { text-decoration: none; border-radius: 16px; padding: 22px 20px 18px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; width: 148px; flex-shrink: 0; transition: transform 0.22s, box-shadow 0.22s; }
        .carousel-item:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.08); }
        .hero-float-card { position: absolute; background: #fff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.10); border: 1px solid #f3f4f6; z-index: 2; }
        .user-menu-item { display: flex; align-items: center; gap: 10px; text-decoration: none; font-size: 13px; color: #374151; font-weight: 500; padding: 9px 12px; border-radius: 8px; transition: background 0.15s; width: 100%; background: transparent; border: none; cursor: pointer; font-family: inherit; text-align: left; }
        .user-menu-item:hover { background: #f0fdf4; color: #15803d; }
        .user-menu-item.danger { color: #dc2626; }
        .user-menu-item.danger:hover { background: #fef2f2; color: #dc2626; }
      `}</style>

      {/* TOP BAR */}
      <div style={{ background: "#15803d", padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#86efac", animation: "pulse 2s infinite", flexShrink: 0 }} />
        <p style={{ fontSize: "12px", color: "#fff", fontWeight: 600, margin: 0 }}>
          StudentMarket Ghana is live · 100% free for students ·{" "}
          <a href="/vendre" style={{ color: "#86efac", textDecoration: "underline" }}>Start selling today</a>
        </p>
      </div>

      {/* STICKY HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 200, background: "#fff", borderBottom: "1px solid #e5e7eb", boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.07)" : "none", transition: "box-shadow 0.3s" }}>
        <div style={{ padding: "0 40px", height: "64px", display: "flex", alignItems: "center", gap: "32px" }}>
          <a href="/" style={{ textDecoration: "none", fontWeight: 900, fontSize: "22px", letterSpacing: "-0.5px", flexShrink: 0 }}>
            <span style={{ color: "#15803d" }}>Student</span><span style={{ color: "#111827" }}>Market</span>
          </a>

          {/* SEARCH BAR */}
          <div style={{ flex: 1, maxWidth: "640px", display: "flex", alignItems: "center", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "0 4px 0 16px", transition: "border-color 0.2s" }}
            onFocus={e => (e.currentTarget.style.borderColor = "#15803d")}
            onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" style={{ flexShrink: 0, marginRight: "10px" }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for devices, brands, models..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: "14px", color: "#111827", fontFamily: "inherit", background: "transparent", padding: "10px 0" }} />
            <a href="/annonces" className="btn-primary" style={{ padding: "8px 20px", fontSize: "13px" }}>Search</a>
          </div>

          {/* RIGHT NAV */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {user ? (
              <>
                {/* USER DROPDOWN */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 14px", borderRadius: "9px", border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.2s" }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "#bbf7d0"}
                    onMouseOut={e => { if (!userMenuOpen) e.currentTarget.style.borderColor = "#e5e7eb"; }}
                  >
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{firstName}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" style={{ transform: userMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="m6 9 6 6 6-6"/></svg>
                  </button>

                  {/* DROPDOWN MENU */}
                  {userMenuOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "8px", minWidth: "220px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)", zIndex: 300, animation: "fadeDown 0.18s ease forwards" }}>
                      {/* USER INFO */}
                      <div style={{ padding: "10px 12px 12px", borderBottom: "1px solid #f3f4f6", marginBottom: "6px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>{fullName}</p>
                        <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>{user?.email}</p>
                      </div>
                      {/* MENU ITEMS */}
                      <a href="/dashboard" className="user-menu-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        Mon dashboard
                      </a>
                      <a href="/annonces" className="user-menu-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        Mes annonces
                      </a>
                      <a href="/vendre" className="user-menu-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                        Publier une annonce
                      </a>
                      <div style={{ borderTop: "1px solid #f3f4f6", margin: "6px 0" }} />
                      <button className="user-menu-item danger" onClick={handleSignOut}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Se deconnecter
                      </button>
                    </div>
                  )}
                </div>
                <a href="/vendre" className="btn-primary" style={{ padding: "9px 18px", fontSize: "13px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  Sell a Device
                </a>
              </>
            ) : (
              <>
                <a href="/auth" className="nav-link" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Sign In
                </a>
                <a href="/vendre" className="btn-primary" style={{ padding: "9px 18px", fontSize: "13px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  Sell a Device
                </a>
              </>
            )}
          </div>
        </div>

        {/* CATEGORY NAV */}
        <div style={{ borderTop: "1px solid #f3f4f6", padding: "0 40px", display: "flex", alignItems: "center", gap: "4px", height: "44px" }}>
          {NAV_CATS.map(cat => (
            <div key={cat.label} style={{ position: "relative" }} onMouseEnter={() => setHoveredCat(cat.label)} onMouseLeave={() => setHoveredCat(null)}>
              <div className={`cat-item${hoveredCat === cat.label ? " active" : ""}`}>
                {cat.icon}
                <span>{cat.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </div>
              {hoveredCat === cat.label && (
                <div className="dropdown-cat" style={{ position: "absolute", top: "100%", left: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px", minWidth: "200px", boxShadow: "0 16px 40px rgba(0,0,0,0.1)", zIndex: 300 }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", letterSpacing: "1.5px", marginBottom: "8px", padding: "0 8px" }}>{cat.label.toUpperCase()}</p>
                  {cat.subs.map(sub => (
                    <a key={sub} href="/annonces" style={{ display: "block", textDecoration: "none", fontSize: "13px", color: "#374151", fontWeight: 500, padding: "8px 10px", borderRadius: "7px", transition: "all 0.15s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.color = "#15803d"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#374151"; }}
                    >{sub}</a>
                  ))}
                  <div style={{ borderTop: "1px solid #f3f4f6", marginTop: "8px", paddingTop: "8px" }}>
                    <a href="/annonces" style={{ display: "block", textDecoration: "none", fontSize: "12px", color: "#15803d", fontWeight: 700, padding: "6px 10px" }}>View all {cat.label} →</a>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: "16px" }}>
            <a href="/annonces" className="nav-link">All Listings</a>
            <a href="/annonces" className="nav-link">Best Prices</a>
            <a href="/annonces" className="nav-link">New Arrivals</a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={{ background: "#fff", padding: "56px 40px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "center", borderBottom: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div>
          <div className="anim-1" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "100px", padding: "5px 14px", marginBottom: "22px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#15803d", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "11px", color: "#15803d", fontWeight: 700, letterSpacing: "1.2px" }}>STUDENT MARKETPLACE — GHANA</span>
          </div>
          <h1 className="anim-2" style={{ fontSize: "48px", fontWeight: 900, color: "#111827", lineHeight: 1.08, letterSpacing: "-2px", marginBottom: "16px" }}>
            Achetez et revendez<br />vos <span style={{ color: "#15803d" }}>appareils etudiants</span><br />en toute confiance
          </h1>
          <p className="anim-3" style={{ fontSize: "15px", color: "#6b7280", lineHeight: 1.8, marginBottom: "28px", maxWidth: "420px" }}>
            Trouvez des smartphones, laptops, tablettes et accessoires a prix raisonnables. Notre IA estime le juste prix du marche ghaneen pour vous.
          </p>
          <div className="anim-3" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
            <a href="/annonces" className="btn-primary" style={{ padding: "13px 24px" }}>
              Explorer les annonces
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="/vendre" className="btn-outline" style={{ padding: "13px 24px" }}>
              Publier une annonce
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            </a>
          </div>
          <div className="anim-3" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: "Prix justes grace a l IA" },
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: "Paiement securise MoMo" },
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: "Etudiants uniquement" },
            ].map(b => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {b.icon}
                <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "420px" }}>
          <div style={{ position: "absolute", width: "440px", height: "440px", borderRadius: "50%", background: "radial-gradient(circle, #dcfce7 0%, #f0fdf4 60%, transparent 100%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 0 }} />
          <img src="/hero-student.png" alt="Student" style={{ position: "relative", zIndex: 1, height: "400px", width: "auto", objectFit: "contain" }} />
          <div className="hero-float-card" style={{ top: "20px", right: "0px", padding: "16px 20px", minWidth: "200px" }}>
            <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 4px", fontWeight: 500 }}>Estimation IA</p>
            <p style={{ fontSize: "20px", fontWeight: 900, color: "#15803d", margin: "0 0 8px", letterSpacing: "-0.5px" }}>GHS 1,250 - 1,450</p>
            <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 8px", fontWeight: 500 }}>Prix du marche</p>
            <svg width="120" height="32" viewBox="0 0 120 32">
              <polyline points="0,28 20,22 40,26 60,16 80,18 100,10 120,6" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ position: "absolute", bottom: "48px", right: "16px", background: "#15803d", borderRadius: "100px", padding: "10px 18px", display: "flex", alignItems: "center", gap: "8px", zIndex: 2, boxShadow: "0 6px 20px rgba(21,128,61,0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Prix coherent</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "28px 40px", display: "flex", justifyContent: "center" }}>
        {[
          { value: "120+", en: "Active Listings", fr: "Annonces actives" },
          { value: "85+", en: "Verified Students", fr: "Etudiants verifies" },
          { value: "98%", en: "AI Accuracy", fr: "Precision IA" },
          { value: "MoMo", en: "Payment Accepted", fr: "Paiement accepte" },
        ].map((s, i) => (
          <div key={s.en} style={{ textAlign: "center", padding: "0 48px", borderRight: i < 3 ? "1px solid #f3f4f6" : "none" }}>
            <p style={{ fontSize: "24px", fontWeight: 900, color: "#15803d", margin: "0 0 3px", letterSpacing: "-0.8px" }}>{s.value}</p>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", margin: "0 0 1px" }}>{s.en}</p>
            <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>{s.fr}</p>
          </div>
        ))}
      </section>

      {/* CATEGORIES CAROUSEL */}
      <section style={{ padding: "48px 0", background: "#fff", borderBottom: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "0 40px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111827" }}>Shop by Category</h2>
          <a href="/annonces" style={{ textDecoration: "none", fontSize: "13px", color: "#15803d", fontWeight: 600 }}>View all →</a>
        </div>
        <div style={{ overflow: "hidden" }}>
          <div className="carousel-track">
            {[...CAT_ITEMS, ...CAT_ITEMS].map((cat, idx) => (
              <a key={`${cat.label}-${idx}`} href="/annonces" className="carousel-item"
                style={{ background: cat.bg, border: `1.5px solid ${cat.border}` }}
                onMouseOver={e => { e.currentTarget.style.background = cat.activeBg; e.currentTarget.style.borderColor = cat.color; }}
                onMouseOut={e => { e.currentTarget.style.background = cat.bg; e.currentTarget.style.borderColor = cat.border; }}
              >
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  {cat.icon}
                </div>
                <p style={{ fontWeight: 700, color: cat.color, fontSize: "13px", margin: 0 }}>{cat.label}</p>
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0, fontWeight: 500 }}>{cat.count}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST LISTINGS */}
      <section style={{ padding: "48px 40px", background: "#f9fafb" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <p style={{ fontSize: "10px", color: "#15803d", fontWeight: 700, letterSpacing: "2px", marginBottom: "4px" }}>LATEST · RECENTES</p>
              <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#111827", letterSpacing: "-0.5px" }}>Recent Listings</h2>
            </div>
            <a href="/annonces" style={{ textDecoration: "none", fontSize: "13px", color: "#15803d", fontWeight: 600 }}>View all →</a>
          </div>
          {annonces.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", background: "#fff", borderRadius: "14px", border: "1px dashed #d1d5db" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p style={{ fontSize: "15px", color: "#9ca3af", marginBottom: "16px" }}>No listings yet. Be the first to sell.</p>
              <a href="/vendre" className="btn-primary" style={{ padding: "10px 22px" }}>Publish a listing</a>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
              {annonces.map(a => (
                <a key={a.id} href="/annonces" className="listing-card">
                  <div style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", height: "148px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.4">
                      {a.categorie === "Smartphone" ? <><rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="#15803d"/></> : a.categorie === "Laptop" ? <><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M1 20h22"/></> : <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>}
                    </svg>
                    <div style={{ position: "absolute", top: "10px", left: "10px", background: a.score_prix === "bon" ? "#15803d" : "#d97706", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px" }}>
                      {a.score_prix === "bon" ? "AI Verified" : "Check Price"}
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 4px" }}>{a.categorie} · {a.ville}</p>
                    <p style={{ fontWeight: 700, color: "#111827", fontSize: "14px", margin: "0 0 8px", lineHeight: 1.3 }}>{a.titre}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontSize: "18px", fontWeight: 900, color: "#15803d", margin: 0 }}>GHS {a.prix_vente}</p>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0, textDecoration: "line-through" }}>GHS {a.prix_achat}</p>
                    </div>
                    <p style={{ fontSize: "11px", color: "#6b7280", margin: "6px 0 0" }}>{a.vendeur_nom} · {a.universite}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "64px 40px", background: "#fff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p style={{ fontSize: "10px", color: "#15803d", fontWeight: 700, letterSpacing: "2px", marginBottom: "8px" }}>HOW IT WORKS · COMMENT CA MARCHE</p>
            <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#111827", letterSpacing: "-0.8px", marginBottom: "8px" }}>Simple. Fast. Secure.</h2>
            <p style={{ fontSize: "14px", color: "#6b7280", maxWidth: "340px", margin: "0 auto", lineHeight: 1.7 }}>Sell your device in 3 steps and get paid directly.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "18px" }}>
            {STEPS.map((item, i) => (
              <div key={item.num} className={`step-card${activeStep === i ? " active" : ""}`} onClick={() => setActiveStep(i)}>
                <div style={{ overflow: "hidden", height: "180px", position: "relative" }}>
                  <img src={item.img} alt={item.en} className="step-img" />
                  <div style={{ position: "absolute", inset: 0, background: activeStep === i ? "rgba(21,128,61,0.05)" : "rgba(0,0,0,0.02)" }} />
                </div>
                <div style={{ padding: "22px 24px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 900, color: "#15803d", letterSpacing: "2px", marginBottom: "7px" }}>{item.num}</div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111827", marginBottom: "2px" }}>{item.en}</h3>
                  <p style={{ fontSize: "12px", color: "#15803d", fontWeight: 600, marginBottom: "7px" }}>{item.fr}</p>
                  <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "64px 40px", background: "#f9fafb" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p style={{ fontSize: "10px", color: "#15803d", fontWeight: 700, letterSpacing: "2px", marginBottom: "8px" }}>REVIEWS · TEMOIGNAGES</p>
            <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#111827", letterSpacing: "-0.8px" }}>What students say</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "18px" }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="tcard">
                <div style={{ display: "flex", gap: "3px", marginBottom: "14px" }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#15803d"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
                <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.7, marginBottom: "16px" }}>"{t.text}"</p>
                <div>
                  <p style={{ fontWeight: 700, color: "#111827", fontSize: "13px", margin: "0 0 2px" }}>{t.name}</p>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>{t.uni}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UNIVERSITIES */}
      <section style={{ padding: "40px", background: "#fff", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
        <p style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 700, letterSpacing: "2px", marginBottom: "24px" }}>TRUSTED BY STUDENTS FROM · PRESENTE DANS</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "48px", flexWrap: "wrap" }}>
          {["KNUST", "UG LEGON", "ASHESI", "GIMPA", "UCC"].map(u => (
            <span key={u} className="uni-label">{u}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "64px 40px", background: "#f9fafb" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", background: "linear-gradient(135deg, #052e16 0%, #15803d 100%)", borderRadius: "20px", padding: "64px 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <p style={{ fontSize: "10px", color: "#86efac", fontWeight: 700, letterSpacing: "2px", marginBottom: "12px", position: "relative" }}>START SELLING TODAY</p>
          <h2 style={{ fontSize: "34px", fontWeight: 900, color: "#fff", marginBottom: "12px", letterSpacing: "-1.2px", position: "relative" }}>
            Ready to sell your device?<br /><span style={{ color: "#4ade80" }}>Pret a vendre ?</span>
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "32px", maxWidth: "380px", margin: "0 auto 32px", lineHeight: 1.8, position: "relative" }}>
            Publish your listing in under 2 minutes and reach thousands of students across Ghana.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", position: "relative" }}>
            <a href="/vendre" style={{ textDecoration: "none", background: "#4ade80", color: "#000", fontWeight: 800, padding: "12px 28px", borderRadius: "8px", fontSize: "14px", display: "inline-block", transition: "all 0.2s" }}
              onMouseOver={e => e.currentTarget.style.background = "#86efac"}
              onMouseOut={e => e.currentTarget.style.background = "#4ade80"}
            >Start Selling</a>
            <a href="/annonces" style={{ textDecoration: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 600, padding: "12px 28px", borderRadius: "8px", fontSize: "14px", border: "1.5px solid rgba(255,255,255,0.2)", display: "inline-block" }}>Browse Listings</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "48px 40px 32px", background: "#fff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "40px", marginBottom: "32px" }}>
          <div>
            <span style={{ fontWeight: 900, fontSize: "20px", letterSpacing: "-0.5px", display: "block", marginBottom: "10px" }}>
              <span style={{ color: "#15803d" }}>Student</span><span style={{ color: "#111827" }}>Market</span>
            </span>
            <p style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.7, maxWidth: "220px" }}>The student tech marketplace in Ghana. Buy and sell verified devices with AI-powered pricing.</p>
          </div>
          {[
            { title: "PLATFORM", links: ["Marketplace", "Sell a Device", "How it works", "AI Pricing"] },
            { title: "UNIVERSITIES", links: ["KNUST", "UG Legon", "Ashesi", "GIMPA", "UCC"] },
            { title: "SUPPORT", links: ["Contact Us", "FAQ", "Terms of Use", "Privacy Policy"] },
          ].map(col => (
            <div key={col.title}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#111827", letterSpacing: "1px", marginBottom: "14px" }}>{col.title}</p>
              {col.links.map(l => (
                <a key={l} href="#" style={{ display: "block", textDecoration: "none", fontSize: "13px", color: "#6b7280", marginBottom: "9px", transition: "color 0.15s" }}
                  onMouseOver={e => e.currentTarget.style.color = "#15803d"}
                  onMouseOut={e => e.currentTarget.style.color = "#6b7280"}
                >{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: "1100px", margin: "0 auto", paddingTop: "20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "12px", color: "#9ca3af" }}>2025 StudentMarket Ghana. All rights reserved.</p>
          <p style={{ fontSize: "12px", color: "#9ca3af" }}>KNUST · UG Legon · Ashesi · GIMPA · UCC</p>
        </div>
      </footer>

      {/* FLOATING CTA */}
      <a href="/vendre" className="btn-primary float-cta" style={{ padding: "12px 20px", fontSize: "13px", borderRadius: "10px" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
        Sell a Device
      </a>

    </main>
  );
}
