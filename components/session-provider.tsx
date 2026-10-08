"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SessionUser = { name: string };

type SessionContextValue = {
  user: SessionUser | null;
  login: (user: SessionUser) => void;
  signOut: () => void;
};

const USER_KEY = "av_user";

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // First render is always "no session" to avoid hydration mismatches;
  // the stored user is read in an effect.
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(USER_KEY) || "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setUser(stored);
    } catch {}
  }, []);

  const login = useCallback((next: SessionUser) => {
    setUser(next);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ user, login, signOut }),
    [user, login, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
