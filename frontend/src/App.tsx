import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { AdminRoute, CenteredSpinner, ProtectedRoute } from "./components/bits";
import { Landing } from "./pages/Landing";
import { Login, Register } from "./pages/Auth";
// Dashboard pulls in Recharts (~200 KB gz) — code-split so first paint stays fast.
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
import { Browse } from "./pages/Browse";
import { Detail } from "./pages/Detail";
import { Saved } from "./pages/Saved";
import { Submit } from "./pages/Submit";
import { Profile } from "./pages/Profile";
import { Admin } from "./pages/Admin";
import { NotFound } from "./pages/NotFound";

/**
 * Route map (public / protected):
 *  /                    Landing (public)
 *  /login /register     Auth (public)
 *  /browse              Browse + search (public, saving needs login)
 *  /opportunities/:id   Detail (public, apply-tracking needs login)
 *  /dashboard           Stats + charts (protected)
 *  /saved               Bookmarks (protected)
 *  /submit              Create / ?id= edit (protected)
 *  /profile             Settings (protected)
 *  /admin               Admin console (admin only)
 */
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Suspense fallback={<CenteredSpinner />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/opportunities/:id" element={<Detail />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <Saved />
                </ProtectedRoute>
              }
            />
            <Route
              path="/submit"
              element={
                <ProtectedRoute>
                  <Submit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
