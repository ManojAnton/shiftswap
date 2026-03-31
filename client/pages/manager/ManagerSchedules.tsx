import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import type { Schedule, Shift, User } from '../../types';
import { Card, Btn, Badge, Modal, FormField, EmptyState, Spinner, Avatar, toast } from '../../components/ui';
import { formatDate, formatTime, getDayOfWeek, toInputDate, SKILLS, skillColor } from '../../utils/helpers';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function ManagerSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selected, setSelected] = useState<Schedule | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [newSched, setNewSched] = useState({ weekStartDate:'', weekEndDate:'' });
  const [newShift, setNewShift] = useState({
    shiftDate:'', startTime:'09:00', endTime:'17:00',
    requiredSkill:'Cashier', assignedEmployeeId:'', location:'Main Store', notes:''
  });

  const load = useCallback(async () => {
    try {
      const [s, e] = await Promise.all([
        api.get<Schedule[]>('/schedules'),
        api.get<User[]>('/users/employees'),
      ]);
      setSchedules(s);
      setEmployees(e);
      if (s.length > 0 && !selected) setSelected(s[0]);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selected) return;
    api.get<{ shifts: Shift[] }>(`/schedules/${selected._id}`)
      .then(d => setShifts(d.shifts))
      .catch(() => setShifts([]));
  }, [selected]);

const handleWeekStart = (date: string) => {
    const parts = date.split('-');
    const d = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2])));
    const end = new Date(d);
    end.setUTCDate(d.getUTCDate() + 6);
    setNewSched({ weekStartDate: date, weekEndDate: toInputDate(end) });
  };

  const createSchedule = async () => {
    try {
      const s = await api.post<Schedule>('/schedules', newSched);
      setSchedules(prev => [s, ...prev]);
      setSelected(s);
      setShifts([]);
      setShowCreate(false);
      setNewSched({ weekStartDate:'', weekEndDate:'' });
      toast('Schedule created!');
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const addShift = async () => {
    if (!selected) return;
    try {
      const s = await api.post<Shift>('/shifts', {
        ...newShift, scheduleId: selected._id,
        assignedEmployeeId: newShift.assignedEmployeeId || undefined,
      });
      setShifts(prev => [...prev, s]);
      setShowAddShift(false);
      setNewShift({ shiftDate:'', startTime:'09:00', endTime:'17:00', requiredSkill:'Cashier', assignedEmployeeId:'', location:'Main Store', notes:'' });
      toast('Shift added!');
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const publishSchedule = async () => {
    if (!selected) return;
    setPublishing(true);
    try {
      const updated = await api.patch<Schedule>(`/schedules/${selected._id}/publish`);
      setSelected(updated);
      setSchedules(prev => prev.map(s => s._id === updated._id ? updated : s));
      toast('Schedule published!', 'success');
    } catch (e: any) { toast(e.message, 'error'); }
    setPublishing(false);
  };

  const deleteShift = async (shiftId: string) => {
    try {
      await api.delete(`/shifts/${shiftId}`);
      setShifts(prev => prev.filter(s => s._id !== shiftId));
      toast('Shift removed');
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const shiftsByDay = DAYS.reduce((acc, day) => {
    acc[day] = shifts.filter(s => getDayOfWeek(s.shiftDate) === day);
    return acc;
  }, {} as Record<string, Shift[]>);

  if (loading) return <div style={{display:'flex',alignItems:'center',gap:12,padding:40}}><Spinner/></div>;

  return (
    <div className="fade-in">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
        <div>
          <p style={{fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Manager → Schedule</p>
          <h1 style={{fontSize:24,fontWeight:800}}>Weekly Schedules</h1>
        </div>
        <Btn onClick={() => setShowCreate(true)} icon="+" size="md" style={{background:'var(--accent)',color:'#fff'}}>New Schedule</Btn>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:20}}>
        {/* Schedule list */}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {schedules.length === 0 && <EmptyState icon="📅" title="No schedules yet" subtitle="Create your first schedule"/>}
          {schedules.map(s => (
            <button key={s._id} onClick={() => setSelected(s)} style={{
              padding:'14px 16px', borderRadius:'var(--radius-sm)', cursor:'pointer', textAlign:'left',
              border:`1px solid ${selected?._id === s._id ? 'var(--accent)' : 'var(--border)'}`,
              background: selected?._id === s._id ? 'var(--accent-subtle)' : 'var(--bg-card)',
              transition:'all 0.15s', fontFamily:'var(--font)',
            }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <div style={{fontSize:13,fontWeight:600}}>{formatDate(s.weekStartDate)}</div>
                <Badge label={s.status} variant={s.status === 'Published' ? 'success' : 'warning'}/>
              </div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>→ {formatDate(s.weekEndDate)}</div>
            </button>
          ))}
        </div>

        {/* Schedule detail */}
        {selected && (
          <div>
            {/* Header bar */}
            <Card style={{marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div>
                  <h2 style={{fontSize:17,fontWeight:700,marginBottom:4}}>
                    {formatDate(selected.weekStartDate)} – {formatDate(selected.weekEndDate)}
                  </h2>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>
                    {shifts.length} shift{shifts.length !== 1 ? 's' : ''} · {employees.length} employees
                  </div>
                </div>
                <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                  <Badge label={selected.status} variant={selected.status === 'Published' ? 'success' : 'warning'}/>
                  <Btn onClick={() => setShowAddShift(true)} variant="secondary" size="sm" icon="+">Add Shift</Btn>
                  {selected.status === 'Draft' && (
                    <Btn onClick={publishSchedule} loading={publishing} size="sm" variant="success">
                      ✓ Publish
                    </Btn>
                  )}
                </div>
              </div>
            </Card>

            {/* Week grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
              {DAYS.map((day, dayIndex) => {
                const weekStart = new Date(selected.weekStartDate);
                weekStart.setUTCHours(0,0,0,0);
                const dayDate = new Date(weekStart);
                dayDate.setDate(weekStart.getDate() + dayIndex);
                const isToday = new Date().toDateString() === dayDate.toDateString();
                const dateNum = dayDate.getUTCDate();
                const monthShort = dayDate.toLocaleDateString('en-CA',{month:'short',timeZone:'UTC'});
                const dayShifts = shiftsByDay[day] || [];

                return (
                  <div key={day} style={{minWidth:0}}>
                    {/* Day header with date */}
                    <div style={{
                      textAlign:'center', padding:'8px 4px', borderRadius:8, marginBottom:6,
                      background: isToday ? 'var(--accent)' : 'var(--bg-card)',
                      border: isToday ? 'none' : '1px solid var(--border)',
                    }}>
                      <div style={{fontSize:10,fontWeight:700,color:isToday?'rgba(255,255,255,0.8)':'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                        {day.slice(0,3)}
                      </div>
                      <div style={{fontSize:16,fontWeight:900,color:isToday?'#fff':'var(--text-primary)',lineHeight:1.1,marginTop:2}}>
                        {dateNum}
                      </div>
                      <div style={{fontSize:9,color:isToday?'rgba(255,255,255,0.7)':'var(--text-muted)',marginTop:1}}>
                        {monthShort}
                      </div>
                      {dayShifts.length > 0 && (
                        <div style={{
                          marginTop:5, fontSize:9, fontWeight:700, color:'#fff',
                          background: isToday ? 'rgba(255,255,255,0.2)' : 'var(--accent)',
                          borderRadius:10, padding:'1px 7px', display:'inline-block',
                        }}>{dayShifts.length}</div>
                      )}
                    </div>

                    {/* Shifts */}
                    <div style={{display:'flex',flexDirection:'column',gap:5}}>
                      {dayShifts.length === 0 ? (
                        <div style={{
                          background:'var(--bg-card)', border:'1px dashed var(--border)',
                          borderRadius:8, padding:'10px 6px', textAlign:'center',
                          fontSize:10, color:'var(--text-muted)', minHeight:60,
                          display:'flex', alignItems:'center', justifyContent:'center',
                        }}>Off</div>
                      ) : dayShifts.map(shift => {
                        const emp = shift.assignedEmployeeId as User | null;
                        return (
                          <div key={shift._id} style={{
                            background:'var(--bg-card)',
                            border:`1px solid ${shift.swappedWith ? 'rgba(16,185,129,0.4)' : skillColor(shift.requiredSkill)+'33'}`,
                            borderLeft:`3px solid ${shift.swappedWith ? 'var(--success)' : skillColor(shift.requiredSkill)}`,
                            borderRadius:8, padding:'7px 8px', fontSize:10, position:'relative',
                          }}>
                            {/* Swapped badge */}
                            {shift.swappedWith && (
                              <div style={{
                                fontSize:8,fontWeight:700,color:'var(--success)',
                                background:'var(--success-bg)',border:'1px solid rgba(16,185,129,0.3)',
                                borderRadius:4,padding:'1px 5px',marginBottom:4,display:'inline-block',
                              }}>🔄 SWAPPED</div>
                            )}
                            {/* Skill */}
                            <div style={{fontWeight:700,color:skillColor(shift.requiredSkill),fontSize:9,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:2}}>
                              {shift.requiredSkill}
                            </div>
                            {/* Time */}
                            <div style={{color:'var(--text-primary)',fontWeight:600,fontSize:10,marginBottom:3}}>
                              {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
                            </div>
                            {/* Current employee */}
                            {emp ? (
                              <div style={{display:'flex',alignItems:'center',gap:3}}>
                                <Avatar name={emp.fullName} size={14}/>
                                <span style={{color:'var(--text-secondary)',fontSize:9,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                  {emp.fullName.split(' ')[0]}
                                </span>
                              </div>
                            ) : (
                              <div style={{color:'var(--danger)',fontSize:9,fontWeight:600}}>⚠ Unassigned</div>
                            )}
                            {/* Swapped from */}
                            {shift.swappedWith && typeof shift.swappedWith === 'object' && (
                              <div style={{fontSize:8,color:'var(--text-muted)',marginTop:3,fontStyle:'italic'}}>
                                was: {(shift.swappedWith as User).fullName.split(' ')[0]}
                              </div>
                            )}
                            {/* Notes */}
                            {shift.notes && !shift.swappedWith && (
                              <div style={{fontSize:8,color:'var(--text-muted)',marginTop:2,fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                {shift.notes}
                              </div>
                            )}
                            {/* Delete */}
                            {selected.status === 'Draft' && (
                              <button onClick={() => deleteShift(shift._id)} style={{
                                position:'absolute',top:3,right:3,background:'none',border:'none',
                                color:'var(--danger)',cursor:'pointer',fontSize:11,lineHeight:1,padding:'1px 3px',
                              }}>×</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full shift list table */}
            {shifts.length > 0 && (
              <Card style={{marginTop:20,padding:0,overflow:'hidden'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',fontWeight:700,fontSize:13}}>
                  All Shifts — Full List
                </div>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{borderBottom:'1px solid var(--border)'}}>
                      {['Date','Day','Time','Skill','Employee','Notes'].map(h => (
                        <th key={h} style={{textAlign:'left',padding:'10px 14px',fontSize:11,color:'var(--text-muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                      ))}
                      {selected.status === 'Draft' && <th/>}
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift, i) => {
                      const emp = shift.assignedEmployeeId as User | null;
                      return (
                        <tr key={shift._id} style={{borderBottom: i < shifts.length-1 ? '1px solid var(--border)' : 'none'}}>
                          <td style={{padding:'10px 14px',fontSize:12,fontWeight:600}}>
                            {formatDate(shift.shiftDate, {month:'short',day:'numeric',year:'numeric'})}
                          </td>
                          <td style={{padding:'10px 14px',fontSize:12,color:'var(--text-secondary)'}}>
                            {getDayOfWeek(shift.shiftDate)}
                          </td>
                          <td style={{padding:'10px 14px',fontSize:12}}>
                            {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                          </td>
                          <td style={{padding:'10px 14px'}}>
                            <span style={{fontSize:11,fontWeight:700,color:skillColor(shift.requiredSkill)}}>{shift.requiredSkill}</span>
                          </td>
                          <td style={{padding:'10px 14px'}}>
                            {emp ? (
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <Avatar name={emp.fullName} size={22}/>
                                <span style={{fontSize:12}}>{emp.fullName}</span>
                              </div>
                            ) : (
                              <span style={{fontSize:11,color:'var(--danger)',fontWeight:600}}>⚠ Unassigned</span>
                            )}
                          </td>
                          <td style={{padding:'10px 14px',fontSize:11,color:'var(--text-muted)',fontStyle:'italic'}}>
                            {shift.swappedWith && typeof shift.swappedWith === 'object' ? (
                              <span style={{color:'var(--success)',fontStyle:'normal',fontWeight:600}}>
                                🔄 Swapped (was: {(shift.swappedWith as User).fullName})
                              </span>
                            ) : shift.notes || '—'}
                          </td>
                          {selected.status === 'Draft' && (
                            <td style={{padding:'10px 14px'}}>
                              <Btn size="sm" variant="ghost" onClick={() => deleteShift(shift._id)}>Remove</Btn>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Create Schedule Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Weekly Schedule">
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="Week Start Date (Monday)">
            <input type="date" value={newSched.weekStartDate} onChange={e => handleWeekStart(e.target.value)}/>
          </FormField>
          <FormField label="Week End Date (auto)">
            <input type="date" value={newSched.weekEndDate} readOnly style={{opacity:0.6}}/>
          </FormField>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Btn>
            <Btn onClick={createSchedule} disabled={!newSched.weekStartDate}>Create Schedule</Btn>
          </div>
        </div>
      </Modal>

      {/* Add Shift Modal */}
      <Modal open={showAddShift} onClose={() => setShowAddShift(false)} title="Add Shift to Schedule">
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="Shift Date">
            <input type="date" value={newShift.shiftDate}
              onChange={e => setNewShift(p => ({...p, shiftDate: e.target.value}))}
              min={selected ? toInputDate(new Date(selected.weekStartDate)) : ''}
              max={selected ? toInputDate(new Date(selected.weekEndDate)) : ''}
            />
          </FormField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="Start Time">
              <input type="time" value={newShift.startTime} onChange={e => setNewShift(p => ({...p, startTime: e.target.value}))}/>
            </FormField>
            <FormField label="End Time">
              <input type="time" value={newShift.endTime} onChange={e => setNewShift(p => ({...p, endTime: e.target.value}))}/>
            </FormField>
          </div>
          <FormField label="Required Skill">
            <select value={newShift.requiredSkill} onChange={e => setNewShift(p => ({...p, requiredSkill: e.target.value, assignedEmployeeId: ''}))}>
              {SKILLS.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Assign Employee">
            <select value={newShift.assignedEmployeeId} onChange={e => setNewShift(p => ({...p, assignedEmployeeId: e.target.value}))}>
              <option value="">— Unassigned —</option>
              {employees.filter(e => e.skill === newShift.requiredSkill).map(e => (
                <option key={e._id} value={e._id}>{e.fullName} ({e.skill})</option>
              ))}
              {employees.filter(e => e.skill !== newShift.requiredSkill).length > 0 && (
                <optgroup label="── Other Skills ──">
                  {employees.filter(e => e.skill !== newShift.requiredSkill).map(e => (
                    <option key={e._id} value={e._id}>{e.fullName} ({e.skill})</option>
                  ))}
                </optgroup>
              )}
            </select>
          </FormField>
          <FormField label="Location">
            <input value={newShift.location} onChange={e => setNewShift(p => ({...p, location: e.target.value}))} placeholder="Main Store"/>
          </FormField>
          <FormField label="Notes / Purpose (optional)">
            <input value={newShift.notes} onChange={e => setNewShift(p => ({...p, notes: e.target.value}))} placeholder="e.g. Holiday rush, Extra coverage needed..."/>
          </FormField>
          <div style={{
            background:'var(--accent-subtle)', border:'1px solid rgba(59,130,246,0.2)',
            borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--accent)',
          }}>
            💡 Multiple shifts per day are supported — all will stack in the calendar.
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Btn variant="ghost" onClick={() => setShowAddShift(false)}>Cancel</Btn>
            <Btn onClick={addShift} disabled={!newShift.shiftDate}>Add Shift</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
