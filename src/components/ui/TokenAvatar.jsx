export default function TokenAvatar({ logo, symbol, size=40, className='' }) {
  const colors = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899'];
  const color = colors[(symbol?.charCodeAt(0)||0) % colors.length];
  return (
    <div className={`rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold ${className}`}
      style={{ width:size, height:size, background: logo?'transparent':`${color}22`, border:`1.5px solid ${color}44` }}>
      {logo
        ? <img src={logo} alt={symbol} className="w-full h-full object-cover" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='flex';}} />
        : null}
      <span style={{display:logo?'none':'flex',color, fontSize:size*0.36, fontWeight:700}}>{symbol?.[0]?.toUpperCase()}</span>
    </div>
  );
}
