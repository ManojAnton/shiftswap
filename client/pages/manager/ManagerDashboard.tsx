import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../api/client';
import type { ManagerDashboard } from '../../types';
import { Card, StatCard, Spinner } from '../../components/ui';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { actionLabel, formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ManagerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await api.get<ManagerDashboard>('/dashboard/manager');
      setData(d);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  if (loading) return <div style={{display:'flex',alignItems:'center',gap:12,padding:40}}><Spinner/><span style={{color:'var(--text-secondary)'}}>Loading dashboard…</span></div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{marginBottom:32}}>
        <p style={{fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Manager Dashboard</p>
        <h1 style={{fontSize:28,fontWeight:800,marginBottom:4}}>Good {greeting()}, {user?.fullName?.split(' ')[0]} 👋</h1>
        <p style={{color:'var(--text-secondary)',fontSize:14}}>Here's what's happening this week.</p>
      </div>

      {/* Stats Grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:28}}>
        <StatCard icon="📋" label="Shifts This Week" value={data?.totalShiftsThisWeek ?? 0} color="var(--accent)"/>
        <StatCard icon="⏳" label="Pending Swaps" value={data?.pendingSwaps ?? 0} color="var(--warning)" sub="Awaiting action"/>
        <StatCard icon="✅" label="Approved Swaps" value={data?.approvedSwaps ?? 0} color="var(--success)"/>
        <StatCard icon="❌" label="Rejected Swaps" value={data?.rejectedSwaps ?? 0} color="var(--danger)"/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        {/* Recent Activity */}
        <Card>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <h3 style={{fontWeight:700,fontSize:15}}>Recent Activity</h3>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:0}}>
            {data?.recentActivity?.length === 0 && (
              <p style={{color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:24}}>No recent activity</p>
            )}
            {data?.recentActivity?.slice(0,8).map((a,i) => (
              <div key={i} style={{
                display:'flex',alignItems:'center',gap:12,padding:'12px 0',
                borderBottom: i < (data.recentActivity.length-1) ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{width:36,height:36,borderRadius:10,background:'var(--accent-subtle)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
                  {actionIcon(a.action)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500}}>{actionLabel(a.action)}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>
                    {a.performedBy?.fullName} · {formatDate(a.timestamp, {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <Card>
            <h3 style={{fontWeight:700,fontSize:15,marginBottom:16}}>Quick Actions</h3>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[
                { label:'Create New Schedule', icon:'📅', path:'/manager/schedules', color:'var(--accent)' },
                { label:'Review Swap Requests', icon:'🔄', path:'/manager/swaps', color:'var(--warning)', badge: data?.awaitingManagerSwaps },
                { label:'Manage Employees', icon:'👥', path:'/manager/employees', color:'var(--purple)' },
                { label:'View Availability', icon:'🕐', path:'/manager/availability', color:'var(--success)' },
              ].map(item => (
                <button key={item.path} onClick={() => navigate(item.path)} style={{
                  display:'flex',alignItems:'center',gap:12,padding:'12px 16px',
                  background:'var(--bg-card-hover)',border:'1px solid var(--border)',
                  borderRadius:'var(--radius-sm)',cursor:'pointer',textAlign:'left',
                  transition:'all 0.15s', color:'var(--text-primary)',
                }}>
                  <span style={{fontSize:18}}>{item.icon}</span>
                  <span style={{flex:1,fontSize:13,fontWeight:500}}>{item.label}</span>
                  {item.badge ? (
                    <span style={{background:'var(--warning)',color:'#000',borderRadius:10,padding:'2px 8px',fontSize:11,fontWeight:700}}>{item.badge}</span>
                  ) : <span style={{color:'var(--text-muted)',fontSize:16}}>›</span>}
                </button>
              ))}
            </div>
          </Card>

          <Card style={{background:'linear-gradient(135deg,rgba(59,130,246,0.1) 0%,rgba(139,92,246,0.1) 100%)'}}>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <div style={{fontSize:36}}>👥</div>
              <div>
                <div style={{fontSize:22,fontWeight:800,color:'var(--accent)'}}>{data?.activeEmployees}</div>
                <div style={{fontSize:12,color:'var(--text-secondary)'}}>Active Employees</div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{data?.totalEmployees} total</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function actionIcon(action: string) {
  if (action.includes('Schedule')) return '📅';
  if (action.includes('Approved')) return '✅';
  if (action.includes('Rejected')) return '❌';
  if (action.includes('Swap')) return '🔄';
  return '📌';
}
