import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import type { SwapRequest, User, Shift } from '../../types';
import { Card, Badge, Btn, Modal, EmptyState, Spinner, Avatar, toast } from '../../components/ui';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { formatDate, formatTime, statusColor, statusLabel, skillColor, shiftHours } from '../../utils/helpers';

type FilterTab = 'All' | 'AwaitingManager' | 'AwaitingEmployee' | 'Approved' | 'RejectedByEmployee' | 'RejectedByManager';

// Safe extraction helpers — work whether field is populated object or raw ID string
function getUser(field: any): User | null {
  if (field && typeof field === 'object' && field.fullName) return field as User;
  return null;
}
function getShift(field: any): Shift | null {
  if (field && typeof field === 'object' && field.shiftDate) return field as Shift;
  return null;
}

export default function ManagerSwapsPage() {
  const [swaps, setSwaps]       = useState<SwapRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState<FilterTab>('All');
  const [deciding, setDeciding] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.get<SwapRequest[]>('/swaps');
      setSwaps(Array.isArray(data) ? data : []);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  const managerDecide = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setDeciding(id);
    try {
      const updated = await api.patch<SwapRequest>(`/swaps/${id}/manager-decide`, { action, rejectionReason: reason });
      setSwaps(prev => prev.map(s => s._id === id ? updated : s));
      toast(action === 'approve' ? '✅ Approved! Shift reassigned.' : 'Swap rejected.', action === 'approve' ? 'success' : 'info');
      setRejectModal(null);
      setRejectReason('');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setDeciding(null);
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'All',                label: 'All Requests'         },
    { key: 'AwaitingManager',    label: 'Needs Your Action'    },
    { key: 'AwaitingEmployee',   label: 'Awaiting Employee'    },
    { key: 'Approved',           label: 'Approved'             },
    { key: 'RejectedByEmployee', label: 'Rejected by Employee' },
    { key: 'RejectedByManager',  label: 'Rejected by Manager'  },
  ];

  const filtered = filter === 'All' ? swaps : swaps.filter(s => s.overallStatus === filter);
  const awaitingCount = swaps.filter(s => s.overallStatus === 'AwaitingManager').length;

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:40}}>
      <Spinner/><span style={{color:'var(--text-secondary)'}}>Loading…</span>
    </div>
  );

  if (error) return (
    <div style={{padding:40,textAlign:'center'}}>
      <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
      <div style={{color:'var(--danger)',fontWeight:600,marginBottom:8}}>{error}</div>
      <Btn onClick={load}>Try Again</Btn>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{marginBottom:24}}>
        <p style={{fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Manager → Swaps</p>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
          <h1 style={{fontSize:22,fontWeight:800}}>Swap Requests</h1>
          {awaitingCount > 0 && (
            <div style={{
              background:'var(--warning-bg)',border:'1px solid rgba(245,158,11,0.3)',
              borderRadius:8,padding:'8px 16px',fontSize:13,color:'var(--warning)',fontWeight:600,
              display:'flex',alignItems:'center',gap:8,
            }}>
              ⚠️ {awaitingCount} swap{awaitingCount>1?'s':''} awaiting your decision
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:6,marginBottom:18,flexWrap:'wrap'}}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            padding:'6px 14px',borderRadius:20,cursor:'pointer',
            border:`1px solid ${filter===t.key?'var(--accent)':'var(--border)'}`,
            background:filter===t.key?'var(--accent-subtle)':'transparent',
            color:filter===t.key?'var(--accent)':'var(--text-secondary)',
            fontSize:12,fontWeight:600,fontFamily:'var(--font)',
            display:'flex',alignItems:'center',gap:5,
          }}>
            {t.label}
            {t.key==='AwaitingManager' && awaitingCount>0 && (
              <span style={{background:'var(--danger)',color:'#fff',borderRadius:10,padding:'0 5px',fontSize:10,fontWeight:700}}>
                {awaitingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length===0 && (
        <EmptyState icon="🔄" title="No swap requests" subtitle="Swap requests will appear here"/>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {filtered.map(swap => {
          const requester = getUser(swap.requestedByEmployeeId);
          const target    = getUser(swap.targetEmployeeId);
          const shift     = getShift(swap.shiftId);
          const isAwaitingMe = swap.overallStatus === 'AwaitingManager';

          return (
            <Card key={swap._id} style={{
              border: isAwaitingMe ? '1px solid rgba(245,158,11,0.5)' : '1px solid var(--border)',
              background: isAwaitingMe ? 'rgba(245,158,11,0.02)' : 'var(--bg-card)',
              padding:18,
            }}>
              {/* Row 1: Employees + Status */}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:14,flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                  {/* Requester */}
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <Avatar name={requester?.fullName||'?'} size={38}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>{requester?.fullName||'Employee'}</div>
                      <div style={{fontSize:10,color:'var(--text-muted)'}}>{requester?.skill||''} · Requesting</div>
                    </div>
                  </div>
                  <div style={{fontSize:18,color:'var(--accent)',background:'var(--accent-subtle)',borderRadius:6,padding:'3px 8px'}}>⇄</div>
                  {/* Target */}
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <Avatar name={target?.fullName||'?'} size={38}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>{target?.fullName||'Employee'}</div>
                      <div style={{fontSize:10,color:'var(--text-muted)'}}>{target?.skill||''} · Replacement</div>
                    </div>
                  </div>
                </div>
                {/* Status + time */}
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
                  <Badge label={statusLabel(swap.overallStatus)} variant={statusColor(swap.overallStatus)}/>
                  <div style={{fontSize:10,color:'var(--text-muted)'}}>
                    {formatDate(swap.createdAt,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
              </div>

              {/* Shift details */}
              {shift && (
                <div style={{
                  background:'var(--bg-input)',
                  border:`1px solid ${skillColor(shift.requiredSkill||'')}33`,
                  borderLeft:`4px solid ${skillColor(shift.requiredSkill||'')}`,
                  borderRadius:8,padding:'10px 14px',marginBottom:12,
                }}>
                  <div style={{fontSize:10,fontWeight:700,color:skillColor(shift.requiredSkill||''),textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>
                    Shift Being Swapped
                  </div>
                  <div style={{display:'flex',gap:14,flexWrap:'wrap',fontSize:13,alignItems:'center'}}>
                    <span>📅 <strong>{formatDate(shift.shiftDate,{weekday:'short',month:'long',day:'numeric'})}</strong></span>
                    <span>🕐 <strong>{formatTime(shift.startTime)} – {formatTime(shift.endTime)}</strong>
                      <span style={{marginLeft:5,fontSize:11,color:'var(--text-secondary)',background:'var(--bg-card)',borderRadius:5,padding:'2px 6px'}}>
                        {shiftHours(shift.startTime,shift.endTime)}h
                      </span>
                    </span>
                    <span>🏷 <strong style={{color:skillColor(shift.requiredSkill||'')}}>{shift.requiredSkill}</strong></span>
                    {shift.location && <span>📍 {shift.location}</span>}
                  </div>
                </div>
              )}

              {/* Reason */}
              {swap.reason && (
                <div style={{fontSize:12,color:'var(--text-secondary)',fontStyle:'italic',padding:'6px 10px',background:'var(--bg-card)',borderRadius:6,borderLeft:'3px solid var(--border)',marginBottom:10}}>
                  💬 "{swap.reason}"
                </div>
              )}

              {/* 3-step trail */}
              <div style={{display:'flex',alignItems:'center',marginBottom:12}}>
                {[
                  { label:'Requested', done:true, active:false, color:'var(--accent)' },
                  { label:'Employee',
                    done: swap.employeeStatus!=='Pending',
                    active: swap.employeeStatus==='Pending',
                    color: swap.employeeStatus==='Accepted'?'var(--success)':swap.employeeStatus==='Rejected'?'var(--danger)':'var(--border)',
                  },
                  { label:'Manager',
                    done: swap.managerStatus!=='Pending',
                    active: swap.overallStatus==='AwaitingManager',
                    color: swap.managerStatus==='Approved'?'var(--success)':swap.managerStatus==='Rejected'?'var(--danger)':'var(--border)',
                  },
                ].map((step, i) => (
                  <React.Fragment key={i}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                      <div style={{
                        width:24,height:24,borderRadius:'50%',
                        background:step.done?step.color:step.active?'var(--warning)':'var(--bg-input)',
                        border:`2px solid ${step.done?step.color:step.active?'var(--warning)':'var(--border)'}`,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:10,color:'#fff',fontWeight:700,
                      }}>
                        {step.done?'✓':step.active?'…':String(i+1)}
                      </div>
                      <div style={{fontSize:9,color:'var(--text-muted)',whiteSpace:'nowrap'}}>{step.label}</div>
                    </div>
                    {i<2 && <div style={{flex:1,height:2,margin:'0 4px',marginBottom:14,background:step.done?step.color:'var(--border)'}}/>}
                  </React.Fragment>
                ))}
              </div>

              {/* Employee decision */}
              {swap.employeeStatus!=='Pending' && (
                <div style={{
                  fontSize:12,marginBottom:10,padding:'7px 10px',
                  background:swap.employeeStatus==='Accepted'?'var(--success-bg)':'var(--danger-bg)',
                  borderRadius:6,
                  color:swap.employeeStatus==='Accepted'?'var(--success)':'var(--danger)',
                }}>
                  {swap.employeeStatus==='Accepted'?'✅':'❌'}
                  {' '}<strong>{target?.fullName||'Employee'}</strong>
                  {swap.employeeStatus==='Accepted'?' accepted':' declined'} this swap
                  {swap.employeeRejectionReason && (
                    <span style={{color:'var(--text-muted)',fontStyle:'italic'}}> — "{swap.employeeRejectionReason}"</span>
                  )}
                </div>
              )}

              {/* Manager actions */}
              {isAwaitingMe && (
                <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid var(--border)'}}>
                  <Btn variant="danger" size="sm"
                    onClick={() => { setRejectModal(swap._id); setRejectReason(''); }}
                    loading={deciding===swap._id}>
                    ✕ Reject
                  </Btn>
                  <Btn variant="success" size="sm"
                    onClick={() => managerDecide(swap._id,'approve')}
                    loading={deciding===swap._id}>
                    ✓ Approve & Reassign
                  </Btn>
                </div>
              )}

              {/* Final decision */}
              {swap.managerStatus!=='Pending' && (
                <div style={{fontSize:10,color:'var(--text-muted)',textAlign:'right',marginTop:6}}>
                  {swap.managerStatus==='Approved'?'✅ Approved':'❌ Rejected'} by manager
                  {swap.managerDecidedAt && ` · ${formatDate(swap.managerDecidedAt,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}`}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Swap Request">
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <p style={{fontSize:13,color:'var(--text-secondary)'}}>Reason for rejecting (optional):</p>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. Insufficient coverage..." rows={3} style={{resize:'vertical'}}/>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Btn variant="ghost" onClick={() => setRejectModal(null)}>Cancel</Btn>
            <Btn variant="danger"
              onClick={() => rejectModal && managerDecide(rejectModal,'reject',rejectReason)}
              loading={!!deciding}>
              Confirm Reject
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
