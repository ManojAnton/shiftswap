import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import type { SwapRequest, Shift, User } from '../../types';
import { Card, Badge, Btn, Modal, EmptyState, Spinner, Avatar, toast } from '../../components/ui';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { formatDate, formatTime, statusColor, statusLabel, shiftHours, skillColor } from '../../utils/helpers';

export default function EmployeeIncomingPage() {
  const [incoming, setIncoming] = useState<SwapRequest[]>([]);
  const [history, setHistory] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    const [inc, all] = await Promise.all([
      api.get<SwapRequest[]>('/swaps/incoming'),
      api.get<SwapRequest[]>('/swaps'),
    ]);
    setIncoming(inc);
    setHistory(all.filter(s =>
      typeof s.targetEmployeeId === 'object' && s.employeeStatus !== 'Pending'
    ));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  const respond = async (id: string, action: 'accept' | 'reject', reason?: string) => {
    setDeciding(id);
    try {
      await api.patch<SwapRequest>(`/swaps/${id}/employee-respond`, { action, rejectionReason: reason });
      toast(action === 'accept' ? '✅ Swap accepted! Awaiting manager approval.' : 'Swap declined.');
      setRejectModal(null);
      setRejectReason('');
      await load();
    } catch (e: any) { toast(e.message, 'error'); }
    setDeciding(null);
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', gap:12, padding:40 }}><Spinner/></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize:12, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Employee → Incoming</p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <h1 style={{ fontSize:24, fontWeight:800 }}>Incoming Swap Requests</h1>
          {incoming.length > 0 && (
            <div style={{
              background:'var(--warning-bg)', border:'1px solid rgba(245,158,11,0.3)',
              borderRadius:8, padding:'10px 18px', fontSize:13, color:'var(--warning)', fontWeight:600,
            }}>
              📬 {incoming.length} request{incoming.length > 1 ? 's' : ''} need{incoming.length === 1 ? 's' : ''} your response
            </div>
          )}
        </div>
        <p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:6 }}>
          Colleagues have asked you to cover their shifts. Accept or decline below.
        </p>
      </div>

      {/* Pending incoming */}
      {incoming.length === 0 ? (
        <EmptyState icon="📬" title="No pending requests" subtitle="When a colleague requests you to cover their shift, it will appear here"/>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:32 }}>
          {incoming.map(swap => {
            const shift = swap.shiftId as Shift;
            const requester = swap.requestedByEmployeeId as User;
            const targetShift = swap.targetEmployeeShift as Shift | null;

            return (
              <Card key={swap._id} style={{
                border:'1px solid rgba(245,158,11,0.35)',
                background:'rgba(245,158,11,0.02)', padding:20,
              }}>
                {/* Requester info */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <Avatar name={requester.fullName} size={44}/>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700 }}>{requester.fullName}</div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
                      {requester.skill} · wants you to cover their shift
                    </div>
                  </div>
                </div>

                {/* SWAP VISUAL: Their shift ↔ Your shift */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, alignItems:'center', marginBottom:16 }}>
                  {/* Their shift (what they want you to take) */}
                  <div style={{
                    background:'var(--bg-input)',
                    border:`1px solid ${skillColor(shift?.requiredSkill || '')}44`,
                    borderLeft:`4px solid ${skillColor(shift?.requiredSkill || '')}`,
                    borderRadius:8, padding:'12px 14px',
                  }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--warning)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                      📤 {requester.fullName.split(' ')[0]}'s Shift (you would take this)
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color:skillColor(shift?.requiredSkill || ''), marginBottom:4 }}>
                      {shift?.requiredSkill}
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>
                      {formatDate(shift?.shiftDate, { weekday:'short', month:'short', day:'numeric' })}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
                      {formatTime(shift?.startTime)} – {formatTime(shift?.endTime)}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                      ⏱ {shiftHours(shift?.startTime, shift?.endTime)}h
                      {shift?.location && ` · 📍 ${shift.location}`}
                    </div>
                  </div>

                  {/* Swap arrow */}
                  <div style={{
                    display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    fontSize:22, color:'var(--accent)',
                  }}>
                    ⇄
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>swap</div>
                  </div>

                  {/* Their shift on that day (what they would take of yours) */}
                  <div style={{
                    background:'var(--bg-input)',
                    border: targetShift
                      ? `1px solid ${skillColor(targetShift.requiredSkill)}44`
                      : '1px solid var(--border)',
                    borderLeft: targetShift
                      ? `4px solid ${skillColor(targetShift.requiredSkill)}`
                      : '4px solid var(--border)',
                    borderRadius:8, padding:'12px 14px',
                  }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                      📥 Your Day (what you already have)
                    </div>
                    {targetShift ? (
                      <>
                        <div style={{ fontSize:11, fontWeight:700, color:skillColor(targetShift.requiredSkill), marginBottom:4 }}>
                          {targetShift.requiredSkill}
                        </div>
                        <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>
                          {formatDate(targetShift.shiftDate, { weekday:'short', month:'short', day:'numeric' })}
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
                          {formatTime(targetShift.startTime)} – {formatTime(targetShift.endTime)}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                          ⏱ {shiftHours(targetShift.startTime, targetShift.endTime)}h
                          {targetShift.location && ` · 📍 ${targetShift.location}`}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize:12, color:'var(--success)', fontWeight:500 }}>
                        ✅ You have no shift that day — free to cover!
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason */}
                {swap.reason && (
                  <div style={{
                    fontSize:13, color:'var(--text-secondary)', fontStyle:'italic',
                    padding:'8px 12px', background:'var(--bg-card)',
                    borderRadius:6, borderLeft:'3px solid var(--border)',
                    marginBottom:14,
                  }}>
                    💬 Reason: "{swap.reason}"
                  </div>
                )}

                {/* Info note */}
                <div style={{
                  fontSize:12, color:'var(--text-secondary)',
                  background:'var(--accent-subtle)', borderRadius:6,
                  padding:'8px 12px', marginBottom:14,
                  border:'1px solid rgba(59,130,246,0.15)',
                }}>
                  ℹ️ If you accept, the manager will give final approval before the shift is officially reassigned.
                </div>

                <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:14 }}>
                  Requested {formatDate(swap.createdAt, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                </div>

                {/* Action buttons */}
                <div style={{ display:'flex', gap:10 }}>
                  <Btn
                    variant="danger" onClick={() => { setRejectModal(swap._id); setRejectReason(''); }}
                    loading={deciding === swap._id}
                    style={{ flex:1, justifyContent:'center' }}
                  >
                    ✕ Decline
                  </Btn>
                  <Btn
                    variant="success" onClick={() => respond(swap._id, 'accept')}
                    loading={deciding === swap._id}
                    style={{ flex:1, justifyContent:'center' }}
                  >
                    ✓ Accept
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Past Responses
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {history.slice(0,10).map(swap => {
              const shift = swap.shiftId as Shift;
              return (
                <Card key={swap._id} style={{ padding:'12px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                    <Avatar name={(swap.requestedByEmployeeId as User).fullName} size={32}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500 }}>
                        {(swap.requestedByEmployeeId as User).fullName}
                      </div>
                      {shift && (
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                          {formatDate(shift.shiftDate, { month:'short', day:'numeric' })} · {formatTime(shift.startTime)}–{formatTime(shift.endTime)} · {shift.requiredSkill}
                        </div>
                      )}
                    </div>
                    <Badge label={statusLabel(swap.overallStatus)} variant={statusColor(swap.overallStatus)}/>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Decline Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Decline Swap Request">
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <p style={{ fontSize:13, color:'var(--text-secondary)' }}>You can provide a reason for declining (optional):</p>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. I have a prior commitment..." rows={3} style={{ resize:'vertical' }}/>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <Btn variant="ghost" onClick={() => setRejectModal(null)}>Cancel</Btn>
            <Btn variant="danger"
              onClick={() => rejectModal && respond(rejectModal, 'reject', rejectReason)}
              loading={!!deciding}>
              Confirm Decline
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
