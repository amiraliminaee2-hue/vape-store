"use client";

import { useState, useEffect } from "react";

export function useCsrf() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch("/api/csrf");
        if (!response.ok) {
          throw new Error("Failed to fetch CSRF token");
        }
        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, []);

  return { token, loading, error };
}