"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const submit = async (e) => {
    e?.preventDefault?.();
    setErr("");
    if (next.length < 8) return setErr("New password must be at least 8 characters");
    if (next !== confirm) return setErr("New password and confirmation don't match");
    if (next === current) return setErr("New password must differ from your current one");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed to change password");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #3f4f61 0%, #2d3a4a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "'Archivo', sans-serif",
    }}>
      <form onSubmit={submit} style={{
        width: "100%",
        maxWidth: 420,
        padding: 40,
        borderRadius: 22,
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        color: "#f1f5f9",
      }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.65, marginBottom: 10 }}>
          {user ? `Signed in as ${user.username}` : "First-time setup"}
        </div>
        <h1 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em", marginBottom: 22 }}>Set Your Password</h1>

        <label style={labelStyle}>Current (temporary) password</label>
        <input type="password" value={current} onChange={(e) => { setCurrent(e.target.value); setErr(""); }} style={inputStyle} autoFocus />

        <label style={{ ...labelStyle, marginTop: 16 }}>New password</label>
        <input type="password" value={next} onChange={(e) => { setNext(e.target.value); setErr(""); }} style={inputStyle} />

        <label style={{ ...labelStyle, marginTop: 16 }}>Confirm new password</label>
        <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setErr(""); }} style={inputStyle} />

        {err && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(224,69,85,0.18)", color: "#fecaca", fontSize: 13, marginTop: 16, fontWeight: 500 }}>{err}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", marginTop: 22, padding: "13px 20px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #4F6BF6, #6B82F8)",
            color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer",
            fontFamily: "inherit", boxShadow: "0 4px 16px rgba(79,107,246,0.30)",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Saving…" : "Set Password & Continue"}
        </button>

        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 16, lineHeight: 1.5 }}>
          Minimum 8 characters. Choose something you'll remember.
        </div>
      </form>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  opacity: 0.7,
  marginBottom: 7,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.20)",
  background: "rgba(255,255,255,0.08)",
  color: "#f1f5f9",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};
