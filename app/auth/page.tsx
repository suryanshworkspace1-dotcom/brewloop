"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const signUp = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email to confirm signup!");
    }

    setLoading(false);
  };

  const signIn = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Logged in successfully!");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Auth Page</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", margin: 10, padding: 8 }}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", margin: 10, padding: 8 }}
      />

      <button onClick={signUp} disabled={loading} style={{ margin: 10 }}>
        Sign Up
      </button>

      <button onClick={signIn} disabled={loading} style={{ margin: 10 }}>
        Sign In
      </button>

      <p>{message}</p>
    </div>
  );
}