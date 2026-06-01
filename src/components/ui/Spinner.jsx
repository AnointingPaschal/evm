export default function Spinner({ size=20, color='text-brand-500' }) {
  return <div className={`${color} animate-spin`} style={{width:size,height:size,border:`2px solid currentColor`,borderTopColor:'transparent',borderRadius:'50%'}} />;
}
