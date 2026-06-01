import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider, useWallet } from './context/WalletContext';
import Sidebar from './components/layout/Sidebar';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import TokenDetail from './pages/TokenDetail';
import History from './pages/History';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import LockScreen from './pages/LockScreen';

function AppInner() {
  const { activeWallet, isLocked } = useWallet();
  if (!activeWallet) return <Onboarding />;
  if (isLocked) return <LockScreen />;
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/token/:tokenId" element={<TokenDetail />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <Toaster position="top-right" toastOptions={{
        style: { background:'#0A1628', color:'#fff', border:'1px solid rgba(245,158,11,0.2)', fontFamily:'DM Sans,sans-serif', fontSize:'13px' },
        success: { iconTheme: { primary:'#F59E0B', secondary:'#0A1628' } },
        error: { iconTheme: { primary:'#f87171', secondary:'#0A1628' } },
      }} />
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/*" element={<AppInner />} />
      </Routes>
    </WalletProvider>
  );
}
