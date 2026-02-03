import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  Login,
  Register,
  Dashboard,
  Profile,
  MyReports,
  MyReportDetail,
  BlockedUsers,
  Sync,
  Reports,
  ReportDetail,
  Entreprises
} from './pages';
import { MainLayout } from './components/layout';
import { AuthProvider, useAuth } from './contexts';
import { ROUTES } from './constants';

// ============================================
// COMPOSANTS DE PROTECTION DES ROUTES
// ============================================

// Route protégée - nécessite une authentification
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
}

// Route réservée aux managers (type_user = 3)
function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (user?.type_user !== 3) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}

// Route publique (redirige vers dashboard si déjà connecté)
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}

// Écran de chargement
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Chargement...</p>
    </div>
  );
}

// ============================================
// CONFIGURATION DES ROUTES
// ============================================

function AppRoutes() {
  return (
    <Routes>
      {/* ======================== */}
      {/* ROUTES PUBLIQUES (sans layout) */}
      {/* ======================== */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      {/* ======================== */}
      {/* ROUTES VISITEURS (publiques avec layout) */}
      {/* ======================== */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        }
      />
      <Route
        path={ROUTES.MAP}
        element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        }
      />

      {/* ======================== */}
      {/* ROUTES UTILISATEURS CONNECTÉS */}
      {/* ======================== */}
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MY_REPORTS}
        element={
          <ProtectedRoute>
            <MainLayout>
              <MyReports />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-reports/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MyReportDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* ======================== */}
      {/* ROUTES MANAGER (admin) */}
      {/* ======================== */}
      <Route
        path={ROUTES.ADMIN.REPORTS}
        element={
          <ManagerRoute>
            <MainLayout>
              <Reports />
            </MainLayout>
          </ManagerRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.REPORT_DETAIL}
        element={
          <ManagerRoute>
            <MainLayout>
              <ReportDetail />
            </MainLayout>
          </ManagerRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.SYNC}
        element={
          <ManagerRoute>
            <MainLayout>
              <Sync />
            </MainLayout>
          </ManagerRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.BLOCKED_USERS}
        element={
          <ManagerRoute>
            <MainLayout>
              <BlockedUsers />
            </MainLayout>
          </ManagerRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.ENTREPRISES}
        element={
          <ManagerRoute>
            <MainLayout>
              <Entreprises />
            </MainLayout>
          </ManagerRoute>
        }
      />

      {/* ======================== */}
      {/* REDIRECTIONS */}
      {/* ======================== */}
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
