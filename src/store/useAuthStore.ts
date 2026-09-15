import { create } from "zustand";
import { api, setAuthToken } from "../api/client";

const STORAGE_KEY = "jiblog:token";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  initialized: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response &&
    err.response.data &&
    typeof err.response.data === "object" &&
    "error" in err.response.data &&
    typeof err.response.data.error === "string"
  ) {
    return err.response.data.error;
  }
  return fallback;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  initialized: false,

  init: async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      set({ initialized: true });
      return;
    }
    setAuthToken(token);
    set({ token, initialized: true });
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.user });
    } catch {
      // 토큰이 만료됐거나 유효하지 않음 -> 로그아웃 처리
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
      set({ token: null, user: null });
    }
  },

  login: async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;
      localStorage.setItem(STORAGE_KEY, token);
      setAuthToken(token);
      set({ token, user });
    } catch (err) {
      throw new Error(extractErrorMessage(err, "로그인에 실패했어요."));
    }
  },

  signup: async (email, password) => {
    try {
      const res = await api.post("/auth/signup", { email, password });
      const { token, user } = res.data;
      localStorage.setItem(STORAGE_KEY, token);
      setAuthToken(token);
      set({ token, user });
    } catch (err) {
      throw new Error(extractErrorMessage(err, "회원가입에 실패했어요."));
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    set({ token: null, user: null });
  },
}));
