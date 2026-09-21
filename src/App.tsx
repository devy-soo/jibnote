import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/ToastProvider";
import { RequireAuth } from "./components/RequireAuth";
import { useAuthStore } from "./store/useAuthStore";
import { useListingStore } from "./store/useListingStore";
import { usePreferencesStore } from "./store/usePreferencesStore";
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { ListingList } from "./pages/ListingList";
import { ListingDetail } from "./pages/ListingDetail";
import { ListingForm } from "./pages/ListingForm";
import { PreferencesForm } from "./pages/PreferencesForm";

export default function App() {
  const initAuth = useAuthStore((s) => s.init);
  const initialized = useAuthStore((s) => s.initialized);
  const token = useAuthStore((s) => s.token);
  const fetchAll = useListingStore((s) => s.fetchAll);
  const reset = useListingStore((s) => s.reset);
  const fetchPreferences = usePreferencesStore((s) => s.fetch);
  const resetPreferences = usePreferencesStore((s) => s.reset);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!initialized) return;
    if (token) {
      fetchAll().catch(() => {});
      fetchPreferences().catch(() => {});
    } else {
      reset();
      resetPreferences();
    }
  }, [initialized, token, fetchAll, reset, fetchPreferences, resetPreferences]);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <ListingList />
              </RequireAuth>
            }
          />
          <Route
            path="/new"
            element={
              <RequireAuth>
                <ListingForm />
              </RequireAuth>
            }
          />
          <Route
            path="/preferences"
            element={
              <RequireAuth>
                <PreferencesForm />
              </RequireAuth>
            }
          />
          <Route
            path="/listing/:id"
            element={
              <RequireAuth>
                <ListingDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/listing/:id/edit"
            element={
              <RequireAuth>
                <ListingForm />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
