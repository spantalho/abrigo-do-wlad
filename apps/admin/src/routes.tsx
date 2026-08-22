import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AdoptionsDashboard from "./pages/AdoptionsDashboard";
import Dashboard from "./pages/Dashboard";
import DogDashboard from "./pages/DogDashboard";
import EditDog from "./pages/EditDog";
import EditRecycle from "./pages/EditRecycle";
import NewDog from "./pages/NewDog";
import NewRecycle from "./pages/NewRecycle";
import RecycleDashboard from "./pages/RecycleDashboard";
import SystemKeys from "./pages/SystemKeys";

function ProtectedLayout() {
  const { user, loading, error } = useAuth();
  if (loading) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Validando sessão...</div>;
  }
  if (!user) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
        <div>
          <h1>Acesso não autorizado</h1>
          <p>{error ?? "Esta identidade não possui acesso ao painel."}</p>
        </div>
      </main>
    );
  }
  return <Outlet />;
}

function DeveloperLayout() {
  const { user } = useAuth();
  return user?.role === "developer" ? <Outlet /> : <Navigate to="/admin" replace />;
}

export default function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<ProtectedLayout />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/dog" element={<DogDashboard />} />
              <Route path="/admin/dog/new" element={<NewDog />} />
              <Route path="/admin/dog/edit/:id" element={<EditDog />} />
              <Route path="/admin/recycle" element={<RecycleDashboard />} />
              <Route path="/admin/recycle/new" element={<NewRecycle />} />
              <Route path="/admin/recycle/edit/:id" element={<EditRecycle />} />
              <Route path="/admin/adoptions" element={<AdoptionsDashboard />} />
              <Route element={<DeveloperLayout />}>
                <Route path="/admin/system-keys" element={<SystemKeys />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
