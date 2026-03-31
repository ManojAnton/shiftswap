import React, { useState, useEffect, useCallback } from 'react';
import { initials } from '../../utils/helpers';
export type { BadgeVariant } from '../../utils/helpers';
import type { BadgeVariant } from '../../utils/helpers';

// ── Badge ──────────────────────────────────────────────────────────
export function Badge({ label, variant='muted' }: { label: string; variant?: BadgeVariant }) {
  const styles: Record<BadgeVariant, React.CSSProperties> = {
    success: { background:'var(--success-bg)', color:'var(--success)', border:'1px solid rgba(16,185,129,0.2)' },
    warning: { background:'var(--warning-bg)', color:'var(--warning)', border:'1px solid rgba(245,158,11,0.2)' },
    danger:  { background:'var(--danger-bg)',  color:'var(--danger)',  border:'1px solid rgba(239,68,68,0.2)' },
    purple:  { background:'var(--purple-bg)',  color:'var(--purple)',  border:'1px solid rgba(139,92,246,0.2)' },
    accent:  { background:'var(--accent-subtle)', color:'var(--accent)', border:'1px solid rgba(59,130,246,0.2)' },
    muted:   { background:'rgba(71,85,105,0.2)', color:'var(--text-secondary)', border:'1px solid var(--border)' },
  };
  return (
    <span style={{
      ...styles[variant],
      padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600,
      letterSpacing:'0.04em', whiteSpace:'nowrap', display:'inline-block',
    }}>{label}</span>
  );
}

// ── Button ─────────────────────────────────────────────────────────
type BtnVariant = 'primary'|'secondary'|'danger'|'ghost'|'success';
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: 'sm'|'md'|'lg'; loading?: boolean; icon?: React.ReactNode;
}
export function Btn({ variant='primary', size='md', loading, icon, children, style, disabled, ...rest }: BtnProps) {
  const base: React.CSSProperties = {
    display:'inline-flex', alignItems:'center', gap:6, borderRadius:'var(--radius-sm)',
    fontWeight:600, border:'none', cursor: disabled||loading ? 'not-allowed' : 'pointer',
    opacity: disabled||loading ? 0.7 : 1,
    transition:'all 0.2s', letterSpacing:'0.01em', whiteSpace:'nowrap',
    fontFamily:'var(--font)',
  };
  const sizes = { sm:{padding:'6px 14px',fontSize:12}, md:{padding:'9px 18px',fontSize:13}, lg:{padding:'12px 24px',fontSize:14} };
  const variants: Record<BtnVariant, React.CSSProperties> = {
    primary:   { background:'var(--accent)',   color:'#fff' },
    secondary: { background:'var(--bg-card-hover)', color:'var(--text-primary)', border:'1px solid var(--border-light)' },
    danger:    { background:'var(--danger)',   color:'#fff' },
    ghost:     { background:'transparent',     color:'var(--text-secondary)', border:'1px solid var(--border)' },
    success:   { background:'var(--success)',  color:'#fff' },
  };
  return (
    <button style={{...base,...sizes[size],...variants[variant],...style}} disabled={disabled||loading} {...rest}>
      {loading ? <Spinner size={14}/> : icon}
      {children}
    </button>
  );
}

// ── Card ───────────────────────────────────────────────────────────
export function Card({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={className} style={{
      background:'var(--bg-card)', border:'1px solid var(--border)',
      borderRadius:'var(--radius)', padding:24, ...style,
    }}>{children}</div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────
export function Spinner({ size=20, color='var(--accent)' }: { size?: number; color?: string }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      border:`2px solid transparent`, borderTopColor:color,
      borderRightColor:color, animation:'spin 0.7s linear infinite', flexShrink:0,
    }}/>
  );
}

// ── PageLoader ─────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16}}>
      <Spinner size={40}/>
      <p style={{color:'var(--text-secondary)',fontSize:14}}>Loading…</p>
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────
export function Avatar({ name, size=36 }: { name: string; size?: number }) {
  const colors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:color+'22',
      border:`2px solid ${color}44`, display:'flex', alignItems:'center',
      justifyContent:'center', flexShrink:0,
      fontSize:size*0.35, fontWeight:700, color,
    }}>{initials(name)}</div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width=520 }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16,
    }}>
      <div onClick={e=>e.stopPropagation()} className="fade-in" style={{
        background:'var(--bg-card)', border:'1px solid var(--border-light)',
        borderRadius:'var(--radius-lg)', width:'100%', maxWidth:width,
        maxHeight:'90vh', overflowY:'auto', boxShadow:'var(--shadow-lg)',
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:'1px solid var(--border)'}}>
          <h3 style={{fontSize:16,fontWeight:700}}>{title}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-secondary)',fontSize:22,cursor:'pointer',lineHeight:1,padding:'0 4px'}}>×</button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────
interface ToastMsg { id: number; message: string; type: 'success'|'error'|'info'; }
let toastListeners: ((t: ToastMsg) => void)[] = [];
let toastId = 0;

export function toast(message: string, type: 'success'|'error'|'info' = 'success') {
  const t = { id: ++toastId, message, type };
  toastListeners.forEach(fn => fn(t));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const handler = (t: ToastMsg) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter(f => f !== handler); };
  }, []);

  const colors = { success:'var(--success)', error:'var(--danger)', info:'var(--accent)' };

  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,display:'flex',flexDirection:'column',gap:8}}>
      {toasts.map(t => (
        <div key={t.id} className="slide-in" style={{
          background:'var(--bg-card)', border:`1px solid ${colors[t.type]}44`,
          borderLeft:`3px solid ${colors[t.type]}`,
          padding:'12px 18px', borderRadius:'var(--radius-sm)',
          boxShadow:'var(--shadow)', color:'var(--text-primary)', fontSize:13,
          maxWidth:340, fontWeight:500,
        }}>{t.message}</div>
      ))}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{textAlign:'center',padding:'48px 24px',color:'var(--text-secondary)'}}>
      <div style={{fontSize:40,marginBottom:12}}>{icon}</div>
      <div style={{fontWeight:600,fontSize:15,color:'var(--text-primary)',marginBottom:6}}>{title}</div>
      {subtitle && <div style={{fontSize:13}}>{subtitle}</div>}
    </div>
  );
}

// ── FormField ──────────────────────────────────────────────────────
export function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <label style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)',letterSpacing:'0.05em',textTransform:'uppercase'}}>{label}</label>
      {children}
      {error && <span style={{fontSize:11,color:'var(--danger)'}}>{error}</span>}
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────────────────
export function StatCard({ icon, label, value, color='var(--accent)', sub }: {
  icon: string; label: string; value: string|number; color?: string; sub?: string;
}) {
  return (
    <Card style={{padding:'20px 24px'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
        <div>
          <div style={{fontSize:12,color:'var(--text-secondary)',fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:8}}>{label}</div>
          <div style={{fontSize:30,fontWeight:800,color,lineHeight:1}}>{value}</div>
          {sub && <div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>{sub}</div>}
        </div>
        <div style={{fontSize:24,background:`${color}15`,padding:10,borderRadius:'var(--radius-sm)'}}>{icon}</div>
      </div>
    </Card>
  );
}
