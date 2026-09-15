import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(msg);
    timer.current = setTimeout(() => setMessage(null), 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-5">
          <div className="animate-rise-in flex max-w-md items-center gap-2.5 rounded-2xl bg-ink px-4 py-3.5 shadow-card">
            <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-emerald-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0D1B34" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5 9.5 17 19 7" />
              </svg>
            </span>
            <span className="text-[13px] font-semibold text-white">{message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
