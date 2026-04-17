import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import InputPage from './pages/Input/InputPage';
import ResultsPage from './pages/Results/ResultsPage';
import GuardianDashboardPage from './pages/Guardian/GuardianDashboardPage';
import ProtectedPersonPage from './pages/Guardian/ProtectedPersonPage';
import SandboxPage from './pages/Sandbox/SandboxPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/input" element={<InputPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/guardian" element={<GuardianDashboardPage />} />
        <Route path="/protected" element={<ProtectedPersonPage />} />
        <Route path="/sandbox" element={<SandboxPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
