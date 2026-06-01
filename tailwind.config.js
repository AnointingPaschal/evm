export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gold: { 50:'#FFFBEB',100:'#FEF3C7',200:'#FDE68A',300:'#FCD34D',400:'#FBBF24',500:'#F59E0B',600:'#D97706',700:'#B45309',800:'#92400E' },
        navy: { 950:'#010812',900:'#020817',800:'#0A1628',700:'#0F1F3D',600:'#162447',500:'#1E3A5F',400:'#264D7E' },
      },
      fontFamily: {
        display: ['Sora','sans-serif'],
        body: ['DM Sans','sans-serif'],
        mono: ['JetBrains Mono','monospace'],
      },
      animation: {
        'shimmer':'shimmer 2.5s linear infinite',
        'float':'float 3s ease-in-out infinite',
        'glow-pulse':'glow-pulse 2s ease-in-out infinite',
        'slide-up':'slide-up 0.3s ease forwards',
        'fade-in':'fade-in 0.25s ease forwards',
      },
      keyframes: {
        shimmer:{'0%':{backgroundPosition:'-200% 0'},'100%':{backgroundPosition:'200% 0'}},
        float:{'0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-8px)'}},
        'glow-pulse':{'0%,100%':{boxShadow:'0 0 8px #F59E0B44'},'50%':{boxShadow:'0 0 24px #F59E0B88,0 0 48px #F59E0B33'}},
        'slide-up':{'from':{opacity:0,transform:'translateY(12px)'},'to':{opacity:1,transform:'translateY(0)'}},
        'fade-in':{'from':{opacity:0},'to':{opacity:1}},
      }
    },
  },
  plugins: [],
}
