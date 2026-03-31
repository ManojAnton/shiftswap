import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Btn } from '../../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const role = await login(email, password);
      navigate(role === 'Manager' ? '/manager/dashboard' : '/employee/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (e: string, p: string) => {
    setEmail(e); setPassword(p);
    setLoading(true); setError('');
    try {
      const role = await login(e, p);
      navigate(role === 'Manager' ? '/manager/dashboard' : '/employee/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-primary)',
      fontFamily: 'var(--font)',
    }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(145deg, #0d1f3c 0%, #0a0f1e 60%, #0f1628 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 64px',
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        {/* Background glow blobs */}
        <div style={{
          position: 'absolute', top: -100, left: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', bottom: -80, right: -80,
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 56 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: '#fff',
            boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
            flexShrink: 0,
          }}>S</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>ShiftSwap</div>
            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Retail Management
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 900,
          color: '#fff', lineHeight: 1.15, marginBottom: 20,
          letterSpacing: '-0.03em',
        }}>
          Smarter Shift<br/>
          <span style={{ color: '#3b82f6' }}>Management</span>
        </h1>
        <p style={{
          fontSize: 15, color: 'rgba(148,163,184,0.85)',
          lineHeight: 1.7, maxWidth: 380, marginBottom: 48,
        }}>
          Streamline your retail workforce — manage weekly schedules,
          track availability, and handle shift swaps all in one place.
        </p>

        {/* Feature list */}
        {[
          { icon: '📅', text: 'Create & publish weekly schedules instantly' },
          { icon: '🔄', text: '2-step shift swap with employee + manager approval' },
          { icon: '🕐', text: 'Real-time availability tracking for all staff' },
          { icon: '👥', text: 'Role-based access for managers and employees' },
        ].map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            marginBottom: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>{f.icon}</div>
            <span style={{ fontSize: 13, color: 'rgba(203,213,225,0.9)', lineHeight: 1.4 }}>{f.text}</span>
          </div>
        ))}

        {/* Bottom tag */}
        <div style={{
          marginTop: 48, fontSize: 12,
          color: 'rgba(100,116,139,0.7)',
        }}>
          PRG-800 · Team Horizon · Seneca Polytechnic
        </div>
      </div>

      {/* ── RIGHT PANEL — Login form ────────────────────────────── */}
      <div style={{
        width: 480, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 48px',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
        overflowY: 'auto',
      }}>
        <div className="fade-in">
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>
            Welcome Back
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 36 }}>
            Sign in to access your dashboard
          </p>

          {/* Login form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{
                fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>Email Address</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@shiftswap.com"
                required autoFocus
                style={{ fontSize: 14, padding: '11px 14px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{
                fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>Password</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ fontSize: 14, padding: '11px 14px' }}
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 8, padding: '10px 14px',
                color: 'var(--danger)', fontSize: 13, fontWeight: 500,
              }}>⚠️ {error}</div>
            )}

            <Btn
              type="submit" loading={loading} size="lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '13px 0', fontSize: 14 }}
            >
              Sign In →
            </Btn>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '28px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quick Demo Login
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          </div>

          {/* Quick login buttons — click and auto-login */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => quickLogin('manager@shiftswap.com', 'Manager@123')}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.25)',
                textAlign: 'left', transition: 'all 0.15s', width: '100%',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: 'rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>👔</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>Manager Portal</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  manager@shiftswap.com
                </div>
              </div>
              <div style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: 16 }}>→</div>
            </button>

            <button
              onClick={() => quickLogin('john@shiftswap.com', 'Employee@123')}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)',
                textAlign: 'left', transition: 'all 0.15s', width: '100%',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: 'rgba(16,185,129,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>👤</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Employee Portal</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  john@shiftswap.com
                </div>
              </div>
              <div style={{ marginLeft: 'auto', color: '#10b981', fontSize: 16 }}>→</div>
            </button>
          </div>

          {/* All employee accounts */}
          <div style={{
            marginTop: 24, padding: 16,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              All Employee Accounts (password: Employee@123)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
              {[
                'john','sarah','mike','emily',
                'lisa','tom','anna','james',
                'priya','carlos','rachel','david',
              ].map(name => (
                <button
                  key={name}
                  onClick={() => quickLogin(`${name}@shiftswap.com`, 'Employee@123')}
                  disabled={loading}
                  style={{
                    padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
                    background: 'transparent', border: '1px solid transparent',
                    color: 'var(--text-secondary)', fontSize: 12, textAlign: 'left',
                    transition: 'all 0.15s', fontFamily: 'var(--mono)',
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLButtonElement).style.background = 'var(--accent-subtle)';
                    (e.target as HTMLButtonElement).style.color = 'var(--accent)';
                    (e.target as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.2)';
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLButtonElement).style.background = 'transparent';
                    (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)';
                    (e.target as HTMLButtonElement).style.borderColor = 'transparent';
                  }}
                >
                  {name}@shiftswap.com
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
