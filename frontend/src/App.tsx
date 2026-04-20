import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import InputPage from './pages/Input/InputPage';
import GuardianDashboardPage from './pages/Guardian/GuardianDashboardPage';
import GuardianLinkSetupPage from './pages/Guardian/GuardianLinkSetupPage';
import ProtectedPersonPage from './pages/Guardian/ProtectedPersonPage';
import SandboxPage from './pages/Sandbox/SandboxPage';
import AccountPage from './pages/Account/AccountPage';
import { getStoredUser, isDependentUser, isGuardianUser } from './utils/userSession';

function GuardianRoute() {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isGuardianUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <GuardianDashboardPage />;
}

function ProtectedRoute() {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isDependentUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <ProtectedPersonPage />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/results" element={<Navigate to="/input" replace />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/input" element={<InputPage />} />
          <Route path="/guardian" element={<GuardianRoute />} />
          <Route path="/guardian-link" element={<GuardianLinkSetupPage />} />
          <Route path="/protected" element={<ProtectedRoute />} />
          <Route path="/sandbox" element={<SandboxPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
