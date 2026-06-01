import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider, useWallet } from './context/WalletContext';
import { ThemeProvider } from './context/ThemeContext';
import BottomNav from './components/layout/BottomNav';
import Home from './pages/Home';
import Send from './pages/Send';
import Receive from './pages/Receive';
import Swap from './pages/Swap';
import History from './pages/History';
import TokenDetail from './pages/TokenDetail';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import LockScreen from './pages/LockScreen';
import Admin from './pages/Admin';

function AppInner() {
  const { activeWallet, isLocked } = useWallet();
  
  if (!activeWallet) return <Onboarding />;
  if (isLocked) return <LockScreen />;
  
  return (
    {/* 
      FIXED: 'w-full' forces edge-to-edge on mobile. 
      'sm:max-w-[420px]' keeps it looking like an app ONLY on desktop screens.
    */}
    <div className="w-full min-h-screen bg-app flex flex-col sm:max-w-[420px] sm:mx-auto sm:border-x sm:border-slate-200 dark:sm:border-white/10 sm:shadow-2xl relative overflow-x-hidden">
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/send" element={<Send />} />
        <Route path="/receive" element={<Receive />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/history" element={<History />} />
        <Route path="/token/:tokenId" element={<TokenDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <Toaster position="top-center" toastOptions={{
          style: { 
            background:'#1E293B', 
            color:'#F8FAFC', 
            borderRadius:'12px', /* Tighter curve */
            fontSize:'12px',     /* Smaller text */
            padding:'8px 12px',  /* Smaller padding */
            fontFamily:'Inter,sans-serif', 
            border:'1px solid rgba(255,255,255,0.1)' 
          },
          success: { iconTheme:{ primary:'#3B82F6', secondary:'#fff' } },
          error: { iconTheme:{ primary:'#EF4444', secondary:'#fff' } },
        }} />
        <Routes>
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/*" element={<AppInner />} />
        </Routes>
      </WalletProvider>
    </ThemeProvider>
  );
}
