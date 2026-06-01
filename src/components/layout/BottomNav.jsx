import { NavLink } from 'react-router-dom';
import { Home, ArrowLeftRight, Clock, Settings } from 'lucide-react';

const tabs = [
  { to:'/home', icon:Home, label:'Home' },
  { to:'/swap', icon:ArrowLeftRight, label:'Swap' },
  { to:'/history', icon:Clock, label:'History' },
  { to:'/settings', icon:Settings, label:'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-semibold ${isActive ? 'text-brand-500 dark:text-brand-400' : ''}`}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
