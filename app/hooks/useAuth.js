"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "../lib/api";

const USER_KEY = "voyage-user";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Hook for authentication operations.
 *
 * Provides `register()`, `login()`, and `startOAuth()` methods that call the
 * Voyage-Server auth endpoints. On success, saves the returned user object to
 * localStorage under the same key the rest of the app reads, then redirects to
 * the dashboard.
 *
 * Exposes `error` (most recent failure) and `loading` (request in flight).
 */
export function useAuth() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function register({ email, password, displayName }) {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      });
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      router.push("/?authenticated=1");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function login({ email, password }) {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      router.push("/?authenticated=1");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function startOAuth(provider) {
    window.location.href = `${API_URL}/auth/${provider}/start`;
  }

  return { register, login, startOAuth, error, loading };
}
