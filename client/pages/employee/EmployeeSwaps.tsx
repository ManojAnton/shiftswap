import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import type { Shift, User, SwapRequest, AvailableForShiftResponse } from '../../types';
import { Card, Btn, Badge, Modal, FormField, EmptyState, Spinner, Avatar, toast } from '../../components/ui';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { formatDate, formatTime, getDayOfWeek, statusColor, statusLabel, skillColor, shiftHours } from '../../utils/helpers';

interface ColleagueWithShift extends User { theirShift?: Shift; }

export default function EmployeeSwapsPage() {
  const [myShifts, setMyShifts]           = useState<Shift[]>([]);
  const [mySwaps, setMySwaps]             = useState<SwapRequest[]>([]);
  const [canExchange, setCanExchange]     = useState<ColleagueWithShift[]>([]);
  const [canCover, setCanCover]           = useState<User[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [targetEmployee, setTargetEmployee] = useState('');
  const [reason, setReason]               = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [loadingColleagues, setLoadingColleagues] = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [loading, setLoading]             = useState(true);
  const [cancelling, setCancelling]       = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [shifts, sentSwaps] = await Promise.all([
        api.get<Shift[]>('/shifts/my'),
        api.get<SwapRequest[]>('/swaps/sent'),
      ]);
      setMyShifts(shifts);
      setMySwaps(sentSwaps);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  const openSwapModal = async (shift: Shift) => {
    setSelectedShift(shift);
    setTargetEmployee('');
    setReason('');
    setCanExchange([]);
    setCanCover([]);
    setShowModal(true);
    setLoadingColleagues(true);
    try {
      const day = getDayOfWeek(shift.shiftDate);
      const params = new URLSearchParams({
        day,
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftDate: shift.shiftDate,
        excludeShiftId: shift._id,
      });
      const result = await api.get<AvailableForShiftResponse>(`/availability/available-for-shift?${params}`);
      setCanExchange(result.canExchange || []);
      setCanCover(result.canCover || []);
    } catch {
      setCanExchange([]);
      setCanCover([]);
    }
    setLoadingColleagues(false);
  };

  const submitSwap = async () => {
    if (!selectedShift || !targetEmployee) return;
    setSubmitting(true);
    try {
      await api.post<SwapRequest>('/swaps', {
        shiftId: selectedShift._id,
        targetEmployeeId: targetEmployee,
        reason,
      });
      toast('Swap request sent!');
      setShowModal(false);
      setSelectedShift(null);
      await load();
    } catch (e: any) { toast(e.message, 'error'); }
    setSubmitting(false);
  };

  const cancelSwap = async (id: string) => {
    setCancelling(id);
    try {
      await api.patch(`/swaps/${id}/cancel`);
      toast('Swap request cancelled.');
      await load();
    } catch (e: any) { toast(e.message, 'error'); }
    setCancelling(null);
  };

  const pendingShiftIds = new Set(
    mySwaps
      .filter(s => ['AwaitingEmployee','AwaitingManager'].includes(s.overallStatus))
      .map(s => (s.shiftId as any)?._id || s.shiftId)
  );

  const swappableShifts = myShifts.filter(s => {
    const shiftDate = new Date(s.shiftDate);
    return shiftDate >= new Date() && !pendingShiftIds.has(s._id);
  });

  const totalColleagues = canExchange.length + canCover.length;
  const selectedColleague = [...canExchange, ...canCover].find(e => e._id === targetEmployee);

  if (loading) return <div style={{display:'flex',alignItems:'center',gap:12,padding:40}}><Spinner/></div>;

  return (
    <div className="fade-in" style={{maxWidth:'100%',overflowX:'hidden'}}>
      <div style={{marginBottom:24}}>
        <p style={{fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Employee → Swaps</p>
        <h1 style={{fontSize:22,fontWeight:800}}>Request Shift Swap</h1>
        <p style={{color:'var(--text-secondary)',fontSize:13,marginTop:4}}>Select a shift to swap or find someone to cover it</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:20}}>
        {/* Left: Swappable shifts */}
        <div style={{minWidth:0}}>
          <h3 style={{fontSize:12,fontWeight:700,marginBottom:10,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em'}}>
            Your Upcoming Shifts
          </h3>
          {swappableShifts.length === 0 && (
            <EmptyState icon="📋" title="No upcoming shifts" subtitle="You have no swappable shifts right now"/>
          )}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {swappableShifts.map(shift => (
              <Card key={shift._id} style={{
                padding:14,
                borderLeft:`3px solid ${skillColor(shift.requiredSkill)}`,
              }}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}>
                      <span style={{fontSize:10,fontWeight:700,color:skillColor(shift.requiredSkill),textTransform:'uppercase'}}>{shift.requiredSkill}</span>
                      <span style={{fontSize:10,color:'var(--text-muted)'}}>{shiftHours(shift.startTime,shift.endTime)}h</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {formatDate(shift.shiftDate,{weekday:'short',month:'short',day:'numeric'})}
                    </div>
                    <div style={{fontSize:12,color:'var(--text-secondary)'}}>
                      {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                    </div>
                  </div>
                  <Btn size="sm" variant="secondary" onClick={() => openSwapModal(shift)} style={{flexShrink:0}}>
                    Swap →
                  </Btn>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: My swap history */}
        <div style={{minWidth:0}}>
          <h3 style={{fontSize:12,fontWeight:700,marginBottom:10,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em'}}>
            My Swap Requests
          </h3>
          {mySwaps.length === 0 && (
            <EmptyState icon="🔄" title="No swap requests yet" subtitle="Your requests will appear here"/>
          )}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {mySwaps.map(swap => {
              const shift = swap.shiftId as Shift;
              const target = swap.targetEmployeeId as User;
              const canCancel = swap.overallStatus === 'AwaitingEmployee';
              return (
                <Card key={swap._id} style={{padding:14}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:8}}>
                    <div style={{minWidth:0}}>
                      {shift && (
                        <div style={{fontSize:12,fontWeight:600,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {formatDate(shift.shiftDate,{weekday:'short',month:'short',day:'numeric'})} · {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
                        </div>
                      )}
                      <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text-secondary)'}}>
                        <span>with</span>
                        <Avatar name={target?.fullName || '?'} size={16}/>
                        <span style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{target?.fullName || 'Unknown'}</span>
                      </div>
                    </div>
                    <Badge label={statusLabel(swap.overallStatus)} variant={statusColor(swap.overallStatus)}/>
                  </div>

                  {/* Status trail */}
                  <div style={{display:'flex',gap:4,alignItems:'center',fontSize:10,marginBottom: canCancel ? 8 : 0}}>
                    <StepDot done={true} label="Sent"/>
                    <div style={{flex:1,height:1,background:'var(--border)'}}/>
                    <StepDot done={swap.employeeStatus !== 'Pending'} active={swap.employeeStatus === 'Pending'} label="Colleague"/>
                    <div style={{flex:1,height:1,background:'var(--border)'}}/>
                    <StepDot done={swap.managerStatus !== 'Pending'} active={swap.overallStatus === 'AwaitingManager'} label="Manager"/>
                  </div>

                  {swap.reason && (
                    <div style={{fontSize:11,color:'var(--text-muted)',fontStyle:'italic',marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      "{swap.reason}"
                    </div>
                  )}
                  {canCancel && (
                    <Btn size="sm" variant="ghost" onClick={() => cancelSwap(swap._id)} loading={cancelling === swap._id}>
                      Cancel
                    </Btn>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Swap Request Modal ─────────────────────────── */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Request Shift Swap" width={600}>
        {selectedShift && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Shift being swapped */}
            <div style={{
              background:'var(--bg-input)',
              border:`1px solid ${skillColor(selectedShift.requiredSkill)}44`,
              borderLeft:`4px solid ${skillColor(selectedShift.requiredSkill)}`,
              borderRadius:8, padding:'12px 16px',
            }}>
              <div style={{fontSize:10,fontWeight:700,color:skillColor(selectedShift.requiredSkill),textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>
                Your Shift — {selectedShift.requiredSkill}
              </div>
              <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>
                {formatDate(selectedShift.shiftDate,{weekday:'long',month:'long',day:'numeric'})}
              </div>
              <div style={{fontSize:13,color:'var(--text-secondary)'}}>
                {formatTime(selectedShift.startTime)} – {formatTime(selectedShift.endTime)} · {shiftHours(selectedShift.startTime,selectedShift.endTime)}h
              </div>
            </div>

            {/* Colleague selection */}
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',letterSpacing:'0.08em',textTransform:'uppercase',display:'block',marginBottom:8}}>
                Select Colleague
              </label>

              {loadingColleagues ? (
                <div style={{display:'flex',alignItems:'center',gap:8,padding:16,background:'var(--bg-input)',borderRadius:8}}>
                  <Spinner size={16}/>
                  <span style={{fontSize:13,color:'var(--text-secondary)'}}>Finding colleagues…</span>
                </div>
              ) : totalColleagues === 0 ? (
                <div style={{padding:'14px 16px',background:'var(--danger-bg)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,fontSize:13,color:'var(--danger)'}}>
                  ⚠️ No colleagues available during this shift time.
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:320,overflowY:'auto',paddingRight:4}}>

                  {/* Group 1: Can Exchange */}
                  {canExchange.length > 0 && (
                    <div>
                      <div style={{
                        fontSize:11,fontWeight:700,color:'var(--accent)',
                        textTransform:'uppercase',letterSpacing:'0.06em',
                        marginBottom:6,padding:'6px 10px',
                        background:'var(--accent-subtle)',borderRadius:6,
                        display:'flex',alignItems:'center',gap:6,
                      }}>
                        🔄 Can Exchange Shifts ({canExchange.length})
                        <span style={{fontSize:10,fontWeight:400,color:'var(--text-secondary)'}}>
                          — they also have a shift that day
                        </span>
                      </div>
                      {canExchange.map(emp => (
                        <ColleagueCard
                          key={emp._id}
                          emp={emp}
                          selected={targetEmployee === emp._id}
                          onSelect={() => setTargetEmployee(emp._id)}
                          type="exchange"
                          theirShift={emp.theirShift}
                        />
                      ))}
                    </div>
                  )}

                  {/* Group 2: Can Cover */}
                  {canCover.length > 0 && (
                    <div style={{marginTop: canExchange.length > 0 ? 8 : 0}}>
                      <div style={{
                        fontSize:11,fontWeight:700,color:'var(--success)',
                        textTransform:'uppercase',letterSpacing:'0.06em',
                        marginBottom:6,padding:'6px 10px',
                        background:'var(--success-bg)',borderRadius:6,
                        display:'flex',alignItems:'center',gap:6,
                      }}>
                        ✅ Can Cover ({canCover.length})
                        <span style={{fontSize:10,fontWeight:400,color:'var(--text-secondary)'}}>
                          — free that day, will take your shift
                        </span>
                      </div>
                      {canCover.map(emp => (
                        <ColleagueCard
                          key={emp._id}
                          emp={emp}
                          selected={targetEmployee === emp._id}
                          onSelect={() => setTargetEmployee(emp._id)}
                          type="cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* What happens preview */}
            {selectedColleague && selectedShift && (
              <div style={{
                background:'var(--bg-input)',borderRadius:8,padding:'12px 14px',
                border:'1px solid var(--border)',fontSize:12,
              }}>
                <div style={{fontWeight:700,marginBottom:8,color:'var(--text-primary)'}}>📋 What happens if approved:</div>
                {(selectedColleague as ColleagueWithShift).theirShift ? (
                  <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                    <div style={{flex:1,minWidth:120,padding:'8px 10px',background:'var(--bg-card)',borderRadius:6,fontSize:11}}>
                      <div style={{color:'var(--text-muted)',marginBottom:3}}>You take:</div>
                      <div style={{fontWeight:600}}>{formatTime((selectedColleague as ColleagueWithShift).theirShift!.startTime)} – {formatTime((selectedColleague as ColleagueWithShift).theirShift!.endTime)}</div>
                      <div style={{color:'var(--text-muted)',fontSize:10}}>{(selectedColleague as ColleagueWithShift).theirShift!.requiredSkill}</div>
                    </div>
                    <div style={{fontSize:16,color:'var(--accent)'}}>⇄</div>
                    <div style={{flex:1,minWidth:120,padding:'8px 10px',background:'var(--bg-card)',borderRadius:6,fontSize:11}}>
                      <div style={{color:'var(--text-muted)',marginBottom:3}}>{selectedColleague.fullName} takes:</div>
                      <div style={{fontWeight:600}}>{formatTime(selectedShift.startTime)} – {formatTime(selectedShift.endTime)}</div>
                      <div style={{color:'var(--text-muted)',fontSize:10}}>{selectedShift.requiredSkill}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{color:'var(--success)',fontWeight:500}}>
                    ✅ {selectedColleague.fullName} will cover your {formatTime(selectedShift.startTime)}–{formatTime(selectedShift.endTime)} shift. You get the day off.
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            <FormField label="Reason (optional)">
              <textarea
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="e.g. Doctor appointment, family commitment..."
                rows={2} style={{resize:'vertical'}}
              />
            </FormField>

            <div style={{
              background:'var(--accent-subtle)',border:'1px solid rgba(59,130,246,0.2)',
              borderRadius:8,padding:'10px 14px',fontSize:12,color:'var(--accent)',
            }}>
              ℹ️ Your colleague must accept first, then the manager gives final approval.
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={submitSwap} disabled={!targetEmployee} loading={submitting}>
                Send Swap Request
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Colleague card component
function ColleagueCard({ emp, selected, onSelect, type, theirShift }: {
  emp: User; selected: boolean; onSelect: () => void;
  type: 'exchange' | 'cover'; theirShift?: Shift;
}) {
  return (
    <label style={{
      display:'flex',alignItems:'center',gap:10,padding:'10px 12px',
      border:`1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      background: selected ? 'var(--accent-subtle)' : 'var(--bg-input)',
      borderRadius:8,cursor:'pointer',transition:'all 0.15s',marginBottom:5,
    }}>
      <input type="radio" name="target" value={emp._id} checked={selected}
        onChange={onSelect} style={{width:'auto',accentColor:'var(--accent)',flexShrink:0}}/>
      <Avatar name={emp.fullName} size={32}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.fullName}</div>
        <div style={{fontSize:11,color:'var(--text-muted)'}}>{emp.skill}</div>
      </div>
      {type === 'exchange' && theirShift ? (
        <div style={{
          fontSize:10,fontWeight:600,color:'var(--accent)',
          background:'var(--accent-subtle)',borderRadius:6,
          padding:'3px 8px',textAlign:'right',flexShrink:0,
        }}>
          🔄 {formatTime(theirShift.startTime)}–{formatTime(theirShift.endTime)}
        </div>
      ) : (
        <div style={{
          fontSize:10,fontWeight:600,color:'var(--success)',
          background:'var(--success-bg)',borderRadius:6,
          padding:'3px 8px',flexShrink:0,
        }}>
          ✅ Free
        </div>
      )}
    </label>
  );
}

function StepDot({ done, active, label }: { done: boolean; active?: boolean; label: string }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
      <div style={{
        width:16,height:16,borderRadius:'50%',flexShrink:0,
        background: done ? 'var(--success)' : active ? 'var(--warning)' : 'var(--border)',
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:9,color:'#fff',fontWeight:700,
      }}>{done ? '✓' : active ? '…' : ''}</div>
      <span style={{fontSize:9,whiteSpace:'nowrap',color:'var(--text-muted)'}}>{label}</span>
    </div>
  );
}
