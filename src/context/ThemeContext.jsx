import { createContext, useContext, useState, useEffect } from 'react';
const Ctx = createContext(null);
export const useTheme = () => useContext(Ctx);
export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => localStorage.getItem('vc_theme') === 'dark');
  useEffect(() => {
    dark ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
    localStorage.setItem('vc_theme', dark ? 'dark' : 'light');
  }, [dark]);
  return <Ctx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>{children}</Ctx.Provider>;
};
