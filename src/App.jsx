import { useState, useMemo, useEffect } from "react";

const SUPABASE_URL = "https://nveqoihntusvwnbfecqn.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZXFvaWhudHVzdnduYmZlY3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODA1NDksImV4cCI6MjA5MDM1NjU0OX0.UzfkPWCkU19M8mlT4TSzFszCQ92qhGZsB5Pl8rjIAng";

// ── Supabase auth helpers ─────────────────────────────────────────────────────
const auth = {
  async signUp(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || "Registrering feilet");
    return data;
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || "Innlogging feilet");
    return data;
  },
  async signInWithGoogle() {
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${window.location.origin}`;
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` },
    });
  },
  async getUser(token) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  },
  getSession() {
    try { return JSON.parse(localStorage.getItem("bt_session")); } catch { return null; }
  },
  saveSession(session) {
    localStorage.setItem("bt_session", JSON.stringify(session));
  },
  clearSession() {
    localStorage.removeItem("bt_session");
  },
};

// ── Supabase DB helpers ───────────────────────────────────────────────────────
const db = {
  async getAll(token) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/people?select=*&order=birthday`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Kunne ikke hente data");
    return res.json();
  },
  async insert(person, token) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/people`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON, Authorization: `Bearer ${token}`,
        "Content-Type": "application/json", Prefer: "return=representation",
      },
      body: JSON.stringify(person),
    });
    if (!res.ok) throw new Error("Kunne ikke lagre person");
    return res.json();
  },
  async delete(id, token) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/people?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Kunne ikke slette person");
  },
};

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#F4F5F7", surface: "#FFFFFF", border: "#E4E7EB", borderStrong: "#CBD2D9",
  text: "#1F2933", textSub: "#52606D", textMuted: "#9AA5B4",
  accent: "#1D4ED8", accentHover: "#1E40AF", accentLight: "#EFF6FF", accentMid: "#BFDBFE",
  todayBg: "#FFFBEB", todayBorder: "#F59E0B", todayText: "#92400E",
  errorText: "#DC2626", errorBg: "#FEF2F2",
  successText: "#065F46", successBg: "#ECFDF5",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&family=Outfit:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F4F5F7; }

  .bt-root { font-family: 'Outfit', sans-serif; background: #F4F5F7; min-height: 100vh; color: #1F2933; }

  /* Auth page */
  .bt-auth-page { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .bt-auth-left { background: #1D4ED8; display: flex; flex-direction: column; justify-content: center; padding: 60px 48px; position: relative; overflow: hidden; }
  .bt-auth-left::before { content: ''; position: absolute; top: -80px; right: -80px; width: 320px; height: 320px; border-radius: 50%; background: rgba(255,255,255,0.06); }
  .bt-auth-left::after { content: ''; position: absolute; bottom: -60px; left: -60px; width: 240px; height: 240px; border-radius: 50%; background: rgba(255,255,255,0.04); }
  .bt-auth-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 56px; animation: fadeUp .5s ease both; }
  .bt-auth-logo-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.15); border-radius: 10px; display: grid; place-items: center; font-size: 20px; }
  .bt-auth-logo-name { font-family: 'Libre Baskerville', serif; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.2px; }
  .bt-auth-hero { animation: fadeUp .5s .1s ease both; }
  .bt-auth-hero h2 { font-family: 'Libre Baskerville', serif; font-size: clamp(26px, 3vw, 36px); font-weight: 700; color: #fff; line-height: 1.25; margin-bottom: 16px; letter-spacing: -0.3px; }
  .bt-auth-hero p { font-size: 15px; color: rgba(255,255,255,0.65); line-height: 1.7; max-width: 340px; }
  .bt-auth-features { margin-top: 44px; display: flex; flex-direction: column; gap: 14px; animation: fadeUp .5s .2s ease both; }
  .bt-auth-feature { display: flex; align-items: center; gap: 12px; }
  .bt-auth-feature-dot { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.12); display: grid; place-items: center; font-size: 14px; flex-shrink: 0; }
  .bt-auth-feature-text { font-size: 13.5px; color: rgba(255,255,255,0.75); }
  .bt-auth-right { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px 48px; background: #F4F5F7; }
  .bt-auth-form-wrap { width: 100%; max-width: 360px; animation: fadeUp .5s .15s ease both; }
  .bt-auth-form-title { font-family: 'Libre Baskerville', serif; font-size: 24px; font-weight: 700; color: #1F2933; margin-bottom: 6px; letter-spacing: -0.2px; }
  .bt-auth-form-sub { font-size: 14px; color: #9AA5B4; margin-bottom: 28px; }
  .bt-auth-field { margin-bottom: 14px; }
  .bt-auth-label { display: block; font-size: 11.5px; font-weight: 600; color: #52606D; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 6px; }
  .bt-auth-input { width: 100%; padding: 11px 14px; border: 1px solid #E4E7EB; border-radius: 9px; font-size: 14px; color: #1F2933; font-family: 'Outfit', sans-serif; outline: none; transition: border-color .15s, box-shadow .15s; background: #fff; }
  .bt-auth-input:focus { border-color: #1D4ED8; box-shadow: 0 0 0 3px #EFF6FF; }
  .bt-auth-input::placeholder { color: #C8CDD5; }
  .bt-auth-input.error { border-color: #DC2626; box-shadow: 0 0 0 3px #FEF2F2; }
  .bt-auth-btn { width: 100%; padding: 12px; background: #1D4ED8; color: #fff; border: none; border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background .15s, box-shadow .15s; margin-top: 8px; letter-spacing: 0.1px; }
  .bt-auth-btn:hover { background: #1E40AF; box-shadow: 0 4px 14px rgba(29,78,216,0.3); }
  .bt-auth-btn:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }
  .bt-auth-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
  .bt-auth-divider-line { flex: 1; height: 1px; background: #E4E7EB; }
  .bt-auth-divider-text { font-size: 12px; color: #C8CDD5; }
  .bt-google-btn { width: 100%; padding: 11px; background: #fff; color: #1F2933; border: 1px solid #E4E7EB; border-radius: 9px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background .15s, border-color .15s, box-shadow .15s; display: flex; align-items: center; justify-content: center; gap: 10px; }
  .bt-google-btn:hover { background: #F4F5F7; border-color: #CBD2D9; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .bt-auth-switch { text-align: center; margin-top: 24px; font-size: 13.5px; color: #9AA5B4; }
  .bt-auth-switch button { background: none; border: none; color: #1D4ED8; cursor: pointer; font-size: 13.5px; font-weight: 600; font-family: 'Outfit', sans-serif; }
  .bt-auth-switch button:hover { text-decoration: underline; }
  .bt-auth-error { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 9px; padding: 10px 14px; font-size: 13px; color: #DC2626; margin-bottom: 16px; }
  .bt-auth-success { background: #ECFDF5; border: 1px solid #6EE7B7; border-radius: 9px; padding: 10px 14px; font-size: 13px; color: #065F46; margin-bottom: 16px; }
  @media (max-width: 700px) {
    .bt-auth-page { grid-template-columns: 1fr; }
    .bt-auth-left { display: none; }
    .bt-auth-right { min-height: 100vh; padding: 40px 24px; }
  }

  /* App */
  .bt-app { padding: 40px 20px 80px; }
  .bt-wrap { max-width: 700px; margin: 0 auto; }
  .bt-header { margin-bottom: 32px; display: flex; align-items: flex-start; justify-content: space-between; }
  .bt-header-left { display: flex; flex-direction: column; }
  .bt-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 4px; }
  .bt-brand-icon { width: 44px; height: 44px; background: #1D4ED8; border-radius: 11px; display: grid; place-items: center; font-size: 22px; flex-shrink: 0; }
  .bt-brand-name { font-family: 'Libre Baskerville', serif; font-size: clamp(20px, 4vw, 26px); font-weight: 700; color: #1F2933; letter-spacing: -0.2px; }
  .bt-brand-sub { font-size: 13.5px; color: #9AA5B4; margin-top: 3px; padding-left: 58px; }
  .bt-signout-btn { padding: 8px 16px; background: transparent; border: 1px solid #E4E7EB; border-radius: 9px; font-size: 13px; color: #52606D; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background .15s; white-space: nowrap; }
  .bt-signout-btn:hover { background: #F4F5F7; }
  .bt-user-badge { font-size: 12px; color: #9AA5B4; margin-bottom: 6px; text-align: right; }

  .bt-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
  .bt-stat { background: #fff; border: 1px solid #E4E7EB; border-radius: 12px; padding: 18px 20px; }
  .bt-stat-val { font-family: 'Libre Baskerville', serif; font-size: 28px; font-weight: 700; color: #1F2933; line-height: 1; }
  .bt-stat-val.accent { color: #1D4ED8; }
  .bt-stat-val.warn { color: #92400E; }
  .bt-stat-key { font-size: 11px; color: #9AA5B4; text-transform: uppercase; letter-spacing: 0.7px; font-weight: 500; margin-top: 6px; }

  .bt-alert { background: #FFFBEB; border: 1px solid #F59E0B; border-radius: 11px; padding: 15px 18px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 13px; }
  .bt-alert-icon { font-size: 22px; flex-shrink: 0; line-height: 1.2; }
  .bt-alert-body strong { font-size: 14px; font-weight: 600; color: #92400E; display: block; }
  .bt-alert-body span { font-size: 12.5px; color: #B45309; margin-top: 2px; display: block; }

  .bt-db-badge { display: inline-flex; align-items: center; gap: 7px; background: #ECFDF5; border: 1px solid #6EE7B7; border-radius: 9px; padding: 9px 14px; margin-bottom: 20px; font-size: 12.5px; color: #065F46; font-weight: 500; }
  .bt-db-dot { width: 7px; height: 7px; border-radius: 50%; background: #10B981; animation: pulse 2s infinite; flex-shrink: 0; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }

  .bt-err-banner { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 9px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: #DC2626; }

  .bt-toolbar { display: flex; gap: 10px; margin-bottom: 14px; align-items: center; }
  .bt-search-wrap { flex: 1; position: relative; }
  .bt-search-ico { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #9AA5B4; font-size: 15px; pointer-events: none; }
  .bt-search { width: 100%; padding: 10px 14px 10px 38px; border: 1px solid #E4E7EB; border-radius: 9px; font-size: 14px; background: #fff; color: #1F2933; font-family: 'Outfit', sans-serif; outline: none; transition: border-color .15s, box-shadow .15s; }
  .bt-search:focus { border-color: #1D4ED8; box-shadow: 0 0 0 3px #EFF6FF; }
  .bt-search::placeholder { color: #9AA5B4; }

  .bt-btn-primary { padding: 10px 20px; background: #1D4ED8; color: #fff; border: none; border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; display: flex; align-items: center; gap: 7px; white-space: nowrap; transition: background .15s, box-shadow .15s; }
  .bt-btn-primary:hover { background: #1E40AF; box-shadow: 0 4px 14px rgba(29,78,216,0.28); }
  .bt-btn-primary:disabled { opacity: .6; cursor: not-allowed; }

  .bt-card { background: #fff; border: 1px solid #E4E7EB; border-radius: 14px; overflow: hidden; }
  .bt-thead { display: grid; grid-template-columns: 1fr 100px 110px 96px 72px; padding: 9px 20px; background: #F4F5F7; border-bottom: 1px solid #E4E7EB; }
  .bt-thead span { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.65px; color: #9AA5B4; }
  .bt-row { display: grid; grid-template-columns: 1fr 100px 110px 96px 72px; padding: 13px 20px; border-bottom: 1px solid #E4E7EB; align-items: center; transition: background .1s; }
  .bt-row:last-child { border-bottom: none; }
  .bt-row:hover { background: #FAFBFC; }
  .bt-row.today { background: #FFFBEB; }
  .bt-row.today:hover { background: #FEF3C7; }
  .bt-row.soon { background: #EFF6FF; }
  .bt-row.soon:hover { background: #E0EFFE; }

  .bt-person { display: flex; align-items: center; gap: 11px; min-width: 0; }
  .bt-avatar { width: 34px; height: 34px; border-radius: 50%; background: #EFF6FF; border: 1px solid #BFDBFE; display: grid; place-items: center; font-size: 11px; font-weight: 700; color: #1D4ED8; flex-shrink: 0; }
  .bt-avatar.today { background: #FFFBEB; border-color: #F59E0B; color: #92400E; }
  .bt-person-name { font-size: 14px; font-weight: 600; color: #1F2933; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bt-person-email { font-size: 11.5px; color: #9AA5B4; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bt-cell { font-size: 13px; color: #52606D; }
  .bt-cell small { font-size: 11px; color: #9AA5B4; display: block; margin-top: 1px; }

  .bt-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .bt-badge.today { background: #FFFBEB; color: #92400E; border: 1px solid #F59E0B; }
  .bt-badge.soon { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
  .bt-badge.normal { color: #9AA5B4; font-weight: 500; }

  .bt-actions { display: flex; gap: 6px; justify-content: flex-end; }
  .bt-icon-btn { width: 28px; height: 28px; border-radius: 7px; border: 1px solid #E4E7EB; background: transparent; cursor: pointer; font-size: 14px; display: grid; place-items: center; transition: background .15s, color .15s, border-color .15s; }
  .bt-icon-btn:focus-visible { outline: 3px solid #BFDBFE; outline-offset: 2px; }
  .bt-icon-btn.mail { color: #1D4ED8; }
  .bt-icon-btn.mail:hover { background: #EFF6FF; border-color: #BFDBFE; }
  .bt-icon-btn.del { color: #9AA5B4; }
  .bt-icon-btn.del:hover { background: #FEF2F2; color: #DC2626; border-color: #FECACA; }

  .bt-loading { padding: 48px 24px; text-align: center; color: #9AA5B4; font-size: 14px; }
  .bt-spinner { width: 28px; height: 28px; border: 3px solid #E4E7EB; border-top-color: #1D4ED8; border-radius: 50%; animation: spin .7s linear infinite; margin: 0 auto 12px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .bt-empty { padding: 56px 24px; text-align: center; }
  .bt-empty-icon { font-size: 36px; margin-bottom: 12px; }
  .bt-empty-title { font-size: 15px; font-weight: 600; color: #52606D; margin-bottom: 4px; }
  .bt-empty-sub { font-size: 13px; color: #9AA5B4; }
  .bt-meta { font-size: 12.5px; color: #9AA5B4; padding: 10px 4px 0; }

  .bt-overlay { position: fixed; inset: 0; background: rgba(17,24,39,.4); display: grid; place-items: center; padding: 20px; z-index: 200; backdrop-filter: blur(3px); }
  .bt-modal { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 440px; box-shadow: 0 24px 60px rgba(0,0,0,.13); }
  .bt-modal-title { font-family: 'Libre Baskerville', serif; font-size: 19px; font-weight: 700; color: #1F2933; margin-bottom: 4px; }
  .bt-modal-sub { font-size: 13px; color: #52606D; margin-bottom: 24px; line-height: 1.5; }
  .bt-field { margin-bottom: 15px; }
  .bt-label { display: block; font-size: 12px; font-weight: 600; color: #52606D; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
  .bt-input { width: 100%; padding: 10px 14px; border: 1px solid #E4E7EB; border-radius: 9px; font-size: 14px; color: #1F2933; font-family: 'Outfit', sans-serif; outline: none; transition: border-color .15s, box-shadow .15s; background: #fff; }
  .bt-input:focus { border-color: #1D4ED8; box-shadow: 0 0 0 3px #EFF6FF; }
  .bt-input::placeholder { color: #9AA5B4; }
  .bt-input.error { border-color: #DC2626; box-shadow: 0 0 0 3px #FEF2F2; }
  .bt-textarea { width: 100%; padding: 10px 14px; border: 1px solid #E4E7EB; border-radius: 9px; font-size: 14px; color: #1F2933; font-family: 'Outfit', sans-serif; outline: none; transition: border-color .15s, box-shadow .15s; background: #fff; resize: vertical; min-height: 120px; line-height: 1.6; }
  .bt-textarea:focus { border-color: #1D4ED8; box-shadow: 0 0 0 3px #EFF6FF; }
  .bt-textarea::placeholder { color: #9AA5B4; }
  .bt-error { font-size: 12px; color: #DC2626; margin-top: 5px; display: block; }
  .bt-required { color: #DC2626; }
  .bt-char-count { font-size: 11px; color: #9AA5B4; text-align: right; margin-top: 4px; }
  .bt-recipient-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 9px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
  .bt-recipient-avatar { width: 32px; height: 32px; border-radius: 50%; background: #1D4ED8; display: grid; place-items: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; }
  .bt-recipient-name { font-size: 14px; font-weight: 600; color: #1F2933; }
  .bt-recipient-email { font-size: 12px; color: #9AA5B4; }
  .bt-modal-actions { display: flex; gap: 10px; margin-top: 24px; }
  .bt-btn-ghost { flex: 1; padding: 11px; border: 1px solid #E4E7EB; background: transparent; border-radius: 9px; font-size: 14px; font-weight: 500; color: #52606D; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background .15s; }
  .bt-btn-ghost:hover { background: #F4F5F7; }
  .bt-btn-submit { flex: 2; padding: 11px; background: #1D4ED8; border: none; border-radius: 9px; font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background .15s; }
  .bt-btn-submit:hover { background: #1E40AF; }
  .bt-btn-submit:disabled { opacity: .6; cursor: not-allowed; }
  .bt-success { text-align: center; padding: 16px 0 8px; }
  .bt-success-check { width: 52px; height: 52px; background: #ECFDF5; border-radius: 50%; display: grid; place-items: center; font-size: 24px; margin: 0 auto 14px; }
  .bt-success-title { font-size: 16px; font-weight: 600; color: #065F46; }
  .bt-success-sub { font-size: 13px; color: #52606D; margin-top: 4px; }

  @media (max-width: 500px) {
    .bt-thead { grid-template-columns: 1fr 86px 60px; }
    .bt-thead span:nth-child(2), .bt-thead span:nth-child(3) { display: none; }
    .bt-row { grid-template-columns: 1fr 86px 60px; }
    .bt-row > .bt-cell:nth-child(2), .bt-row > .bt-cell:nth-child(3) { display: none; }
    .bt-stats { grid-template-columns: 1fr 1fr; }
    .bt-stats .bt-stat:last-child { grid-column: span 2; }
    .bt-auth-card { padding: 28px 20px; }
  }
`;

function getDaysUntil(bStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const b = new Date(bStr);
  const next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  const d = Math.round((next - today) / 86400000);
  return d === 365 ? 0 : d;
}
function getAge(bStr) {
  const t = new Date(), b = new Date(bStr);
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}
function fmtDate(bStr) {
  return new Date(bStr).toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
}
function initials(name) {
  return name.trim().split(/\s+/).slice(0,2).map(n => n[0]).join("").toUpperCase();
}

// ── Google icon SVG ───────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
);

// ── Auth page ─────────────────────────────────────────────────────────────────
function AuthPage({ onSession }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { setError("Fyll inn e-post og passord"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "register") {
        await auth.signUp(email, password);
        setSuccess("Konto opprettet! Sjekk e-posten din for bekreftelse, logg deretter inn.");
        setMode("login");
      } else {
        const session = await auth.signIn(email, password);
        auth.saveSession(session);
        onSession(session);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <style>{css}</style>
    <div className="bt-auth-page">

      {/* Left panel */}
      <div className="bt-auth-left">
        <div className="bt-auth-logo">
          <div className="bt-auth-logo-icon" aria-hidden="true">📋</div>
          <span className="bt-auth-logo-name">Bursdagsoversikt</span>
        </div>
        <div className="bt-auth-hero">
          <h2>Glem aldri en bursdag igjen</h2>
          <p>Hold oversikt over fødselsdager i hele organisasjonen — med automatiske varsler og personlige hilsener.</p>
        </div>
        <div className="bt-auth-features">
          <div className="bt-auth-feature">
            <div className="bt-auth-feature-dot">🎂</div>
            <span className="bt-auth-feature-text">Automatisk e-post på bursdagen</span>
          </div>
          <div className="bt-auth-feature">
            <div className="bt-auth-feature-dot">✉️</div>
            <span className="bt-auth-feature-text">Send personlige hilsener når som helst</span>
          </div>
          <div className="bt-auth-feature">
            <div className="bt-auth-feature-dot">🔒</div>
            <span className="bt-auth-feature-text">Din private liste — kun synlig for deg</span>
          </div>
          <div className="bt-auth-feature">
            <div className="bt-auth-feature-dot">☁️</div>
            <span className="bt-auth-feature-text">Lagret i sky — tilgjengelig overalt</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="bt-auth-right">
        <div className="bt-auth-form-wrap">
          <h1 className="bt-auth-form-title">
            {mode === "login" ? "Logg inn" : "Opprett konto"}
          </h1>
          <p className="bt-auth-form-sub">
            {mode === "login" ? "Velkommen tilbake — logg inn for å fortsette" : "Lag en gratis konto på sekunder"}
          </p>

          {error && <div className="bt-auth-error" role="alert">⚠️ {error}</div>}
          {success && <div className="bt-auth-success" role="status">✓ {success}</div>}

          <button className="bt-google-btn" onClick={auth.signInWithGoogle}>
            <GoogleIcon /> Fortsett med Google
          </button>

          <div className="bt-auth-divider">
            <div className="bt-auth-divider-line" />
            <span className="bt-auth-divider-text">eller med e-post</span>
            <div className="bt-auth-divider-line" />
          </div>

          <div className="bt-auth-field">
            <label className="bt-auth-label" htmlFor="auth-email">E-postadresse</label>
            <input id="auth-email" className="bt-auth-input" type="email" placeholder="ola@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div className="bt-auth-field">
            <label className="bt-auth-label" htmlFor="auth-password">Passord</label>
            <input id="auth-password" className="bt-auth-input" type="password" placeholder="Minst 6 tegn"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>

          <button className="bt-auth-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Venter…" : mode === "login" ? "Logg inn" : "Opprett konto"}
          </button>

          <div className="bt-auth-switch">
            {mode === "login" ? (
              <>Har du ikke konto? <button onClick={() => { setMode("register"); setError(""); setSuccess(""); }}>Registrer deg gratis</button></>
            ) : (
              <>Har du allerede konto? <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>Logg inn</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Handle Google OAuth redirect
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const fakeSession = {
        access_token: params.get("access_token"),
        refresh_token: params.get("refresh_token"),
        user: { email: "" },
      };
      auth.saveSession(fakeSession);
      setSession(fakeSession);
      window.history.replaceState(null, "", window.location.pathname);
      setCheckingSession(false);
      return;
    }

    // Check existing session
    const saved = auth.getSession();
    if (saved?.access_token) {
      auth.getUser(saved.access_token)
        .then(user => {
          if (user) setSession({ ...saved, user });
          else auth.clearSession();
        })
        .finally(() => setCheckingSession(false));
    } else {
      setCheckingSession(false);
    }
  }, []);

  const handleSignOut = async () => {
    if (session?.access_token) await auth.signOut(session.access_token);
    auth.clearSession();
    setSession(null);
  };

  if (checkingSession) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "sans-serif", color: "#9AA5B4" }}>
        <div>Laster…</div>
      </div>
    );
  }

  if (!session) return <AuthPage onSession={s => setSession(s)} />;
  return <BirthdayApp session={session} onSignOut={handleSignOut} />;
}

// ── Birthday app (authenticated) ──────────────────────────────────────────────
function BirthdayApp({ session, onSignOut }) {
  const token = session.access_token;
  const userEmail = session.user?.email || "";

  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", birthday: "", email: "", department: "" });
  const [errors, setErrors] = useState({});

  const [emailTarget, setEmailTarget] = useState(null);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    db.getAll(token)
      .then(data => { setPeople(data); setLoading(false); })
      .catch(err => { setGlobalError(err.message); setLoading(false); });
  }, [token]);

  const sorted = useMemo(() =>
    [...people]
      .filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.department || "").toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => getDaysUntil(a.birthday) - getDaysUntil(b.birthday)),
    [people, search]
  );

  const todayPeople = people.filter(p => getDaysUntil(p.birthday) === 0);
  const nextUp = sorted.find(p => getDaysUntil(p.birthday) > 0);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Navn er påkrevd";
    if (!form.birthday) e.birthday = "Fødselsdato er påkrevd";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Gyldig e-postadresse er påkrevd";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const [inserted] = await db.insert({
        name: form.name.trim(), email: form.email.trim(),
        birthday: form.birthday, department: form.department.trim() || null,
      }, token);
      setPeople(p => [...p, inserted]);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false); setShowModal(false);
        setForm({ name: "", birthday: "", email: "", department: "" }); setErrors({});
      }, 2400);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false); setSubmitted(false);
    setForm({ name: "", birthday: "", email: "", department: "" }); setErrors({});
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Fjern ${name} fra listen?`)) return;
    try {
      await db.delete(id, token);
      setPeople(p => p.filter(x => x.id !== id));
    } catch (err) { setGlobalError(err.message); }
  };

  const openEmailModal = (person) => {
    setEmailTarget(person); setEmailMessage(""); setEmailError(""); setEmailSent(false);
  };
  const closeEmailModal = () => {
    setEmailTarget(null); setEmailMessage(""); setEmailError(""); setEmailSent(false);
  };

  const handleSendEmail = async () => {
    if (!emailMessage.trim()) { setEmailError("Skriv en melding før du sender"); return; }
    setEmailSending(true); setEmailError("");
    try {
      const res = await fetch("/api/send-manual-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: emailTarget.name, email: emailTarget.email, message: emailMessage.trim() }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Kunne ikke sende"); }
      setEmailSent(true);
      setTimeout(() => closeEmailModal(), 2400);
    } catch (err) { setEmailError(err.message); }
    finally { setEmailSending(false); }
  };

  return (
    <>
      <style>{css}</style>
      <div className="bt-root">
        <div className="bt-app">
          <div className="bt-wrap">

            <header className="bt-header">
              <div className="bt-header-left">
                <div className="bt-brand">
                  <div className="bt-brand-icon" aria-hidden="true">📋</div>
                  <h1 className="bt-brand-name">Bursdagsoversikt</h1>
                </div>
                <p className="bt-brand-sub">Administrer og følg opp fødselsdager i organisasjonen</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="bt-user-badge">{userEmail}</div>
                <button className="bt-signout-btn" onClick={onSignOut}>Logg ut</button>
              </div>
            </header>

            <section className="bt-stats" aria-label="Nøkkeltall">
              <div className="bt-stat">
                <div className="bt-stat-val">{people.length}</div>
                <div className="bt-stat-key">Registrerte</div>
              </div>
              <div className="bt-stat">
                <div className={`bt-stat-val${todayPeople.length > 0 ? " warn" : ""}`}>{todayPeople.length}</div>
                <div className="bt-stat-key">Bursdager i dag</div>
              </div>
              <div className="bt-stat">
                <div className="bt-stat-val accent">{nextUp ? getDaysUntil(nextUp.birthday) : "–"}</div>
                <div className="bt-stat-key">Dager til neste</div>
              </div>
            </section>

            {!loading && !globalError && (
              <div className="bt-db-badge" role="status">
                <span className="bt-db-dot" aria-hidden="true" />
                Koblet til Supabase — din private liste
              </div>
            )}

            {globalError && <div className="bt-err-banner" role="alert">⚠️ {globalError}</div>}

            {todayPeople.length > 0 && (
              <div className="bt-alert" role="alert">
                <span className="bt-alert-icon" aria-hidden="true">🎂</span>
                <div className="bt-alert-body">
                  <strong>{todayPeople.map(p => p.name).join(" og ")} har bursdag i dag</strong>
                  <span>Husk å sende en hilsen!</span>
                </div>
              </div>
            )}

            <div className="bt-toolbar">
              <div className="bt-search-wrap">
                <span className="bt-search-ico" aria-hidden="true">⌕</span>
                <input className="bt-search" type="search" placeholder="Søk på navn eller avdeling…"
                  value={search} onChange={e => setSearch(e.target.value)} aria-label="Søk" />
              </div>
              <button className="bt-btn-primary" onClick={() => setShowModal(true)} disabled={loading}>
                <span aria-hidden="true">+</span> Legg til
              </button>
            </div>

            <div className="bt-card" role="region" aria-label="Bursdagsliste">
              <div className="bt-thead" aria-hidden="true">
                <span>Navn</span><span>Dato</span><span>Avdeling</span><span>Nedtelling</span><span></span>
              </div>
              {loading ? (
                <div className="bt-loading" role="status">
                  <div className="bt-spinner" aria-hidden="true" />Henter data…
                </div>
              ) : sorted.length === 0 && search ? (
                <div className="bt-empty" role="status">
                  <div className="bt-empty-icon">🔍</div>
                  <div className="bt-empty-title">Ingen treff for «{search}»</div>
                </div>
              ) : sorted.length === 0 ? (
                <div className="bt-empty" role="status">
                  <div className="bt-empty-icon">👥</div>
                  <div className="bt-empty-title">Ingen personer registrert ennå</div>
                  <div className="bt-empty-sub">Klikk «Legg til» for å komme i gang</div>
                </div>
              ) : (
                <ul style={{ listStyle: "none" }}>
                  {sorted.map(person => {
                    const days = getDaysUntil(person.birthday);
                    const isToday = days === 0;
                    const isSoon = !isToday && days <= 7;
                    return (
                      <li key={person.id} className={`bt-row${isToday ? " today" : isSoon ? " soon" : ""}`}>
                        <div className="bt-person">
                          <div className={`bt-avatar${isToday ? " today" : ""}`} aria-hidden="true">{initials(person.name)}</div>
                          <div style={{ minWidth: 0 }}>
                            <div className="bt-person-name">{person.name}</div>
                            <div className="bt-person-email">{person.email}</div>
                          </div>
                        </div>
                        <div className="bt-cell">{fmtDate(person.birthday)}<small>{getAge(person.birthday)} år</small></div>
                        <div className="bt-cell">{person.department || "–"}</div>
                        <div className="bt-cell">
                          {isToday ? <span className="bt-badge today">I dag 🎂</span>
                            : isSoon ? <span className="bt-badge soon">Om {days} d</span>
                            : <span className="bt-badge normal">{days} dager</span>}
                        </div>
                        <div className="bt-actions">
                          <button className="bt-icon-btn mail" onClick={() => openEmailModal(person)} title="Send e-post">✉</button>
                          <button className="bt-icon-btn del" onClick={() => handleDelete(person.id, person.name)} title="Fjern">×</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {people.length > 0 && <p className="bt-meta">Viser {sorted.length} av {people.length} personer</p>}
          </div>
        </div>
      </div>

      {/* Add person modal */}
      {showModal && (
        <div className="bt-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-heading"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bt-modal">
            {submitted ? (
              <div className="bt-success" role="status">
                <div className="bt-success-check">✓</div>
                <div className="bt-success-title">Person lagret</div>
                <div className="bt-success-sub">{form.name} er registrert</div>
              </div>
            ) : (
              <>
                <h2 className="bt-modal-title" id="modal-heading">Registrer person</h2>
                <p className="bt-modal-sub">Felter merket med * er obligatoriske.</p>
                {errors.submit && <div className="bt-err-banner" role="alert" style={{ marginBottom: 16 }}>⚠️ {errors.submit}</div>}
                {[
                  { key: "name", label: "Fullt navn", type: "text", placeholder: "Ola Nordmann", req: true },
                  { key: "email", label: "E-postadresse", type: "email", placeholder: "ola@bedrift.no", req: true },
                  { key: "birthday", label: "Fødselsdato", type: "date", placeholder: "", req: true },
                  { key: "department", label: "Avdeling", type: "text", placeholder: "f.eks. Teknologi", req: false },
                ].map(f => (
                  <div className="bt-field" key={f.key}>
                    <label className="bt-label" htmlFor={`f-${f.key}`}>{f.label}{f.req && <span className="bt-required"> *</span>}</label>
                    <input id={`f-${f.key}`} className={`bt-input${errors[f.key] ? " error" : ""}`}
                      type={f.type} placeholder={f.placeholder} value={form[f.key]}
                      onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); if (errors[f.key]) setErrors(p => ({ ...p, [f.key]: undefined })); }}
                      aria-required={f.req} aria-invalid={!!errors[f.key]} />
                    {errors[f.key] && <span className="bt-error" role="alert">{errors[f.key]}</span>}
                  </div>
                ))}
                <div className="bt-modal-actions">
                  <button className="bt-btn-ghost" onClick={closeModal}>Avbryt</button>
                  <button className="bt-btn-submit" onClick={handleSubmit} disabled={saving}>
                    {saving ? "Lagrer…" : "Lagre person"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Email modal */}
      {emailTarget && (
        <div className="bt-overlay" role="dialog" aria-modal="true" aria-labelledby="email-heading"
          onClick={e => { if (e.target === e.currentTarget) closeEmailModal(); }}>
          <div className="bt-modal">
            {emailSent ? (
              <div className="bt-success" role="status">
                <div className="bt-success-check">✓</div>
                <div className="bt-success-title">E-post sendt!</div>
                <div className="bt-success-sub">Levert til {emailTarget.email}</div>
              </div>
            ) : (
              <>
                <h2 className="bt-modal-title" id="email-heading">Send e-post</h2>
                <p className="bt-modal-sub">Skriv en personlig melding til mottakeren.</p>
                <div className="bt-recipient-box">
                  <div className="bt-recipient-avatar">{initials(emailTarget.name)}</div>
                  <div>
                    <div className="bt-recipient-name">{emailTarget.name}</div>
                    <div className="bt-recipient-email">{emailTarget.email}</div>
                  </div>
                </div>
                <div className="bt-field">
                  <label className="bt-label" htmlFor="email-msg">Din melding <span className="bt-required">*</span></label>
                  <textarea id="email-msg" className={`bt-textarea${emailError ? " error" : ""}`}
                    placeholder={`Hei ${emailTarget.name.split(" ")[0]}! …`}
                    value={emailMessage} onChange={e => { setEmailMessage(e.target.value); setEmailError(""); }}
                    maxLength={1000} />
                  <div className="bt-char-count">{emailMessage.length}/1000</div>
                  {emailError && <span className="bt-error" role="alert">{emailError}</span>}
                </div>
                <div className="bt-modal-actions">
                  <button className="bt-btn-ghost" onClick={closeEmailModal}>Avbryt</button>
                  <button className="bt-btn-submit" onClick={handleSendEmail} disabled={emailSending}>
                    {emailSending ? "Sender…" : "Send e-post ✉"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
