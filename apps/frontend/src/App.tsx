import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { ToastContainer } from "./components/ui/ToastContainer";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NewBookmarkPage } from "./pages/NewBookmarkPage";
import { EditBookmarkPage } from "./pages/EditBookmarkPage";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bookmarks/new" element={<NewBookmarkPage />} />
            <Route path="/bookmarks/:id/edit" element={<EditBookmarkPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
