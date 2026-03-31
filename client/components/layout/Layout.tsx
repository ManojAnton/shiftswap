import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui';
import { api } from '../../api/client';
import type { SwapRequest } from '../../types';
import NotificationBell from '../ui/NotificationBell';

interface NavItem { label: string; path: string; icon: string; badgeKey?: string; }

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [navBadges, setNavBadges] = useState<Record<string, number>>({});

  // Load badge counts for nav items
  const loadBadges = useCallback(async () => {
    try {
      const swaps = await api.get<SwapRequest[]>('/swaps');
      if (isManager) {
        const awaitingManager = swaps.filter(s => s.overallStatus === 'AwaitingManager').length;
        setNavBadges({ swaps: awaitingManager });
      } else {
        const incoming = swaps.filter(s => {
          const targetId = String((s.targetEmployeeId as any)?._id || s.targetEmployeeId);
          return targetId === String(user?._id) && s.employeeStatus === 'Pending';
        }).length;
        setNavBadges({ incoming });
      }
    } catch {}
  }, [isManager, user]);

  useEffect(() => { loadBadges(); }, [loadBadges]);
  useEffect(() => {
    const id = setInterval(loadBadges, 30000);
    return () => clearInterval(id);
  }, [loadBadges]);

  const managerNav: NavItem[] = [
    { label: 'Dashboard',       path: '/manager/dashboard',    icon: '⊞' },
    { label: 'Create Schedule', path: '/manager/schedules',    icon: '📅' },
    { label: 'Swap Requests',   path: '/manager/swaps',        icon: '🔄', badgeKey: 'swaps' },
    { label: 'Availability',    path: '/manager/availability', icon: '🕐' },
    { label: 'Employees',       path: '/manager/employees',    icon: '👥' },
  ];

  const employeeNav: NavItem[] = [
    { label: 'My Schedule',         path: '/employee/dashboard',    icon: '📅' },
    { label: 'Update Availability', path: '/employee/availability', icon: '🕐' },
    { label: 'Request Swap',        path: '/employee/swaps',        icon: '🔄' },
    { label: 'Incoming Requests',   path: '/employee/incoming',     icon: '📬', badgeKey: 'incoming' },
  ];

  const nav = isManager ? managerNav : employeeNav;
  const sideW = collapsed ? 64 : 232;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: sideW, flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 100, transition: 'width 0.22s ease', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '18px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 900, color: '#fff',
            boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
          }}>S</div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', lineHeight: 1.2 }}>ShiftSwap</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                {isManager ? '👔 Manager' : '👤 Employee'}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {nav.map(item => {
            const active = pathname.startsWith(item.path);
            const badge = item.badgeKey ? navBadges[item.badgeKey] : 0;
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: collapsed ? 0 : 10,
                  padding: collapsed ? '10px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: active ? 'var(--accent-subtle)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400, fontSize: 13,
                  transition: 'all 0.15s', width: '100%',
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  fontFamily: 'var(--font)', position: 'relative',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0, position: 'relative' }}>
                  {item.icon}
                  {/* Badge dot on icon when collapsed */}
                  {collapsed && badge > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      background: 'var(--danger)', color: '#fff',
                      borderRadius: 10, padding: '0 4px', fontSize: 9, fontWeight: 800,
                      minWidth: 14, textAlign: 'center', lineHeight: '14px',
                    }}>{badge}</span>
                  )}
                </span>
                {!collapsed && (
                  <>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                      {item.label}
                    </span>
                    {badge > 0 && (
                      <span style={{
                        background: 'var(--danger)', color: '#fff',
                        borderRadius: 10, padding: '1px 7px',
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>{badge}</span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {!collapsed && user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', marginBottom: 6,
              background: 'var(--bg-card)', borderRadius: 8,
            }}>
              <Avatar name={user.fullName} size={30}/>
              <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8, width: '100%', padding: '8px 10px',
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', borderRadius: 8, fontSize: 12, fontWeight: 500,
            fontFamily: 'var(--font)',
          }}>
            <span style={{ fontSize: 14 }}>{collapsed ? '▶' : '◀'}</span>
            {!collapsed && 'Collapse'}
          </button>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8, width: '100%', padding: '8px 10px',
            background: 'none', border: 'none', color: 'var(--danger)',
            cursor: 'pointer', borderRadius: 8, fontSize: 12, fontWeight: 600,
            fontFamily: 'var(--font)',
          }}>
            <span style={{ fontSize: 14 }}>⎋</span>
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────── */}
      <div style={{
        marginLeft: sideW, flex: 1,
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh', transition: 'margin-left 0.22s ease',
        minWidth: 0,
      }}>
        {/* Top header bar */}
        <header style={{
          height: 56, flexShrink: 0,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 28px', gap: 12,
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          {/* Current role badge */}
          <div style={{
            fontSize: 11, fontWeight: 600,
            color: isManager ? 'var(--accent)' : 'var(--success)',
            background: isManager ? 'var(--accent-subtle)' : 'var(--success-bg)',
            border: `1px solid ${isManager ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)'}`,
            borderRadius: 20, padding: '4px 12px',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {isManager ? '👔 Manager' : '👤 Employee'}
          </div>

          {/* User name */}
          {user && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {user.fullName}
            </div>
          )}

          {/* 🔔 Notification Bell */}
          <NotificationBell />
        </header>

        {/* Page content */}
        <main style={{
          flex: 1,
          padding: '24px 28px',
          minWidth: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
          boxSizing: 'border-box',
          maxWidth: '100%',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
