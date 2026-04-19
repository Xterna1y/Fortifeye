import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import InputPage from './pages/Input/InputPage';
import GuardianDashboardPage from './pages/Guardian/GuardianDashboardPage';
import ProtectedPersonPage from './pages/Guardian/ProtectedPersonPage';
import SandboxPage from './pages/Sandbox/SandboxPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/results" element={<Navigate to="/input" replace />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/input" element={<InputPage />} />
          <Route path="/guardian" element={<GuardianDashboardPage />} />
          <Route path="/protected" element={<ProtectedPersonPage />} />
          <Route path="/sandbox" element={<SandboxPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
