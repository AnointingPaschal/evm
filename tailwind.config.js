export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { 50:'#EFF6FF',100:'#DBEAFE',200:'#BFDBFE',300:'#93C5FD',400:'#60A5FA',500:'#3B82F6',600:'#2563EB',700:'#1D4ED8',800:'#1E40AF',900:'#1E3A8A' },
        navy: { 950:'#050D1A',900:'#0A1628',800:'#0F1F3D',700:'#162447',600:'#1E3A5F' },
        surface: { light:'#F0F4FF', card:'#FFFFFF', border:'#E2E8F0' },
      },
      fontFamily: {
        sans: ['Inter','system-ui','sans-serif'],
        display: ['Inter','sans-serif'],
        mono: ['JetBrains Mono','monospace'],
      },
      borderRadius: { '2xl':'1rem','3xl':'1.5rem','4xl':'2rem' },
      animation: {
        'slide-up':'slide-up 0.28s cubic-bezier(0.32,0.72,0,1) forwards',
        'slide-down':'slide-down 0.25s ease forwards',
        'fade-in':'fade-in 0.2s ease forwards',
        'bounce-in':'bounce-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'shimmer':'shimmer 1.8s linear infinite',
        'spin-slow':'spin 3s linear infinite',
      },
      keyframes: {
        'slide-up':{'0%':{transform:'translateY(100%)',opacity:0},'100%':{transform:'translateY(0)',opacity:1}},
        'slide-down':{'0%':{transform:'translateY(-10px)',opacity:0},'100%':{transform:'translateY(0)',opacity:1}},
        'fade-in':{'0%':{opacity:0},'100%':{opacity:1}},
        'bounce-in':{'0%':{transform:'scale(0.8)',opacity:0},'100%':{transform:'scale(1)',opacity:1}},
        shimmer:{'0%':{backgroundPosition:'-400px 0'},'100%':{backgroundPosition:'400px 0'}},
      },
      boxShadow: {
        'card':'0 1px 3px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.06)',
        'card-md':'0 4px 16px rgba(0,0,0,0.1),0 1px 4px rgba(0,0,0,0.06)',
        'brand':'0 4px 20px rgba(59,130,246,0.35)',
        'brand-lg':'0 8px 32px rgba(59,130,246,0.4)',
        'bottom-nav':'0 -1px 0 rgba(0,0,0,0.06),0 -4px 16px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
