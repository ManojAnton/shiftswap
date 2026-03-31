import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { SwapRequest } from '../../types';
import { formatDate, formatTime } from '../../utils/helpers';

interface NotifItem {
  id: string;
  icon: string;
  msg: string;
  shiftInfo: string;
  urgent: boolean;
  time: string;
  link: string;
}

export default function NotificationBell() {
  const { user, isManager } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);
  const dropRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const swaps = await api.get<SwapRequest[]>('/swaps');
      const myId = String(user?._id);
      const items: NotifItem[] = [];

      for (const swap of swaps) {
        const requester = swap.requestedByEmployeeId as any;
        const target = swap.targetEmployeeId as any;
        const shift = swap.shiftId as any;
        const shiftInfo = shift
          ? `${formatDate(shift.shiftDate, { weekday:'short', month:'short', day:'numeric' })} · ${formatTime(shift.startTime)}–${formatTime(shift.endTime)}`
          : '';

        if (isManager) {
          if (swap.overallStatus === 'AwaitingManager') {
            items.push({
              id: swap._id,
              icon: '⏳',
              msg: `${requester?.fullName} → ${target?.fullName} swap needs your approval`,
              shiftInfo,
              urgent: true,
              time: swap.createdAt,
              link: '/manager/swaps',
            });
          } else {
            // Recent activity (last 24h)
            const diffH = (Date.now() - new Date(swap.createdAt).getTime()) / 3600000;
            if (diffH < 24 && swap.overallStatus !== 'AwaitingEmployee') {
              const icon = swap.overallStatus === 'Approved' ? '✅' : swap.overallStatus.includes('Rejected') ? '❌' : '🔄';
              items.push({
                id: swap._id,
                icon,
                msg: `${requester?.fullName} ↔ ${target?.fullName}: ${swap.overallStatus === 'Approved' ? 'Approved' : 'Rejected'}`,
                shiftInfo,
                urgent: false,
                time: swap.createdAt,
                link: '/manager/swaps',
              });
            }
          }
        } else {
          const targetId = String(target?._id || target);
          const requesterId = String(requester?._id || requester);

          // I am the target — someone wants me to cover
          if (targetId === myId && swap.employeeStatus === 'Pending') {
            items.push({
              id: swap._id,
              icon: '📬',
              msg: `${requester?.fullName} wants you to cover their shift`,
              shiftInfo,
              urgent: true,
              time: swap.createdAt,
              link: '/employee/incoming',
            });
          }

          // I am the requester — status updates
          if (requesterId === myId && swap.overallStatus !== 'AwaitingEmployee') {
            const diffH = (Date.now() - new Date(swap.createdAt).getTime()) / 3600000;
            if (diffH < 48) {
              let icon = '🔄', msg = '';
              if (swap.overallStatus === 'Approved') { icon = '✅'; msg = `Your swap was approved! Shift reassigned.`; }
              else if (swap.overallStatus === 'AwaitingManager') { icon = '🔄'; msg = `${target?.fullName} accepted! Awaiting manager.`; }
              else if (swap.overallStatus === 'RejectedByEmployee') { icon = '❌'; msg = `${target?.fullName} declined your swap request`; }
              else if (swap.overallStatus === 'RejectedByManager') { icon = '❌'; msg = `Manager rejected your swap request`; }
              if (msg) items.push({ id: swap._id + '_req', icon, msg, shiftInfo, urgent: swap.overallStatus === 'Approved', time: swap.createdAt, link: '/employee/swaps' });
            }
          }

          // I am the target and was approved — notify me too
          if (targetId === myId && swap.overallStatus === 'Approved') {
            items.push({
              id: swap._id + '_tgt',
              icon: '✅',
              msg: `Swap approved — you now cover ${requester?.fullName}'s shift`,
              shiftInfo,
              urgent: false,
              time: swap.createdAt,
              link: '/employee/dashboard',
            });
          }
        }
      }

      // Deduplicate by id
      const seen = new Set<string>();
      const deduped = items.filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; });
      deduped.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setNotifs(deduped);
      setUnread(deduped.filter(n => n.urgent).length);
    } catch {}
  }, [isManager, user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 40, height: 40, borderRadius: 10, position: 'relative',
          background: open ? 'var(--accent-subtle)' : 'var(--bg-card)',
          border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, transition: 'all 0.15s', fontFamily: 'var(--font)',
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: 'var(--danger)', color: '#fff',
            borderRadius: 10, padding: '1px 5px',
            fontSize: 10, fontWeight: 800, minWidth: 16, textAlign: 'center',
            border: '2px solid var(--bg-secondary)',
          }}>{unread}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="fade-in" style={{
          position: 'absolute', top: 48, right: 0,
          width: 370, maxHeight: 500,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          zIndex: 999, overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔔 Notifications
              {unread > 0 && (
                <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                  {unread} new
                </span>
              )}
            </div>
            <button
              onClick={() => { setOpen(false); navigate(isManager ? '/manager/swaps' : '/employee/incoming'); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font)' }}
            >View all →</button>
          </div>

          {/* Items */}
          {notifs.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              You're all caught up!
            </div>
          ) : (
            notifs.map(n => (
              <div
                key={n.id}
                onClick={() => { setOpen(false); navigate(n.link); }}
                style={{
                  padding: '13px 18px', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'background 0.15s',
                  background: n.urgent ? 'rgba(245,158,11,0.04)' : 'transparent',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = n.urgent ? 'rgba(245,158,11,0.04)' : 'transparent')}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: n.urgent ? 'var(--warning-bg)' : 'var(--bg-input)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{n.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, lineHeight: 1.4, marginBottom: 4,
                    fontWeight: n.urgent ? 600 : 400,
                    color: n.urgent ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}>{n.msg}</div>
                  {n.shiftInfo && (
                    <div style={{
                      fontSize: 11, color: 'var(--text-muted)',
                      background: 'var(--bg-input)', borderRadius: 6,
                      padding: '3px 8px', display: 'inline-block', marginBottom: 4,
                    }}>📅 {n.shiftInfo}</div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {formatDate(n.time, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {n.urgent && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', flexShrink: 0, marginTop: 6 }}/>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
