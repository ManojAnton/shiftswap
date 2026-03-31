import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import type { EmployeeDashboard, Shift } from '../../types';
import { Card, StatCard, Spinner, Avatar, Badge } from '../../components/ui';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { formatDate, formatTime, getDayOfWeek, skillColor, shiftHours } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function getWeekMonday(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + offset * 7);
  monday.setHours(0,0,0,0);
  return monday;
}

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]   = useState<EmployeeDashboard | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, 1 = next week

  const load = useCallback(async () => {
    try {
      const [s, sh] = await Promise.all([
        api.get<EmployeeDashboard>('/dashboard/employee'),
        api.get<Shift[]>('/shifts/my'),
      ]);
      setStats(s);
      setShifts(sh);
      // Auto-select the week that has more shifts
      const thisMonday = getWeekMonday(0);
      const nextMonday = getWeekMonday(1);
      const thisWeekEnd = new Date(thisMonday.getTime() + 7*86400000);
      const nextWeekEnd = new Date(nextMonday.getTime() + 7*86400000);
      const thisCount = sh.filter(s => new Date(s.shiftDate) >= thisMonday && new Date(s.shiftDate) < thisWeekEnd).length;
      const nextCount = sh.filter(s => new Date(s.shiftDate) >= nextMonday && new Date(s.shiftDate) < nextWeekEnd).length;
      if (thisCount === 0 && nextCount > 0) setWeekOffset(1);
      else setWeekOffset(0);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  const monday = getWeekMonday(weekOffset);
  const weekEnd = new Date(monday.getTime() + 7*86400000);

  const weekShifts = shifts.filter(s => {
    const d = new Date(s.shiftDate);
    return d >= monday && d < weekEnd;
  });

  const shiftsByDay: Record<string, Shift | null> = {};
  DAYS.forEach((day, i) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    shiftsByDay[day] = weekShifts.find(s => {
      const sd = new Date(s.shiftDate);
      return sd.toDateString() === dayDate.toDateString();
    }) || null;
  });

  const weekLabel = `${monday.toLocaleDateString('en-CA',{month:'short',day:'numeric'})} – ${new Date(monday.getTime()+6*86400000).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})}`;

  if (loading) return <div style={{display:'flex',alignItems:'center',gap:12,padding:40}}><Spinner/></div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{marginBottom:24}}>
        <p style={{fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Employee Portal</p>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:4}}>
          <Avatar name={user?.fullName||''} size={44}/>
          <div>
            <h1 style={{fontSize:22,fontWeight:800}}>My Schedule</h1>
            <p style={{color:'var(--text-secondary)',fontSize:13}}>{user?.fullName} · {user?.skill} · {user?.employeeId}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:24}}>
        <StatCard icon="⏱" label="Hours This Week" value={`${stats?.totalHoursThisWeek??0}h`} color="var(--accent)"/>
        <StatCard icon="📋" label="Shifts This Week" value={stats?.shiftsThisWeek??0} color="var(--purple)"/>
        <StatCard icon="🔄" label="Pending Swaps" value={stats?.pendingSwaps??0} color="var(--warning)"/>
        <StatCard icon="📬" label="Incoming" value={stats?.incomingSwaps??0} color="var(--success)"/>
        <StatCard icon="📅" label="Days Off" value={stats?.daysOff??0} color="var(--text-secondary)"/>
      </div>

      {/* Week view */}
      <Card>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
          <div>
            <h3 style={{fontWeight:700,fontSize:15}}>
              {weekOffset === 0 ? 'Current Week' : 'Next Week'}
            </h3>
            <p style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{weekLabel}</p>
          </div>
          {/* Week nav */}
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button
              onClick={() => setWeekOffset(0)}
              style={{
                padding:'5px 12px', borderRadius:6, fontSize:12, fontWeight:600,
                background: weekOffset===0 ? 'var(--accent)' : 'var(--bg-card-hover)',
                color: weekOffset===0 ? '#fff' : 'var(--text-secondary)',
                border: weekOffset===0 ? 'none' : '1px solid var(--border)',
                cursor:'pointer', fontFamily:'var(--font)',
              }}
            >This Week</button>
            <button
              onClick={() => setWeekOffset(1)}
              style={{
                padding:'5px 12px', borderRadius:6, fontSize:12, fontWeight:600,
                background: weekOffset===1 ? 'var(--accent)' : 'var(--bg-card-hover)',
                color: weekOffset===1 ? '#fff' : 'var(--text-secondary)',
                border: weekOffset===1 ? 'none' : '1px solid var(--border)',
                cursor:'pointer', fontFamily:'var(--font)',
              }}
            >Next Week</button>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
          {DAYS.map((day, i) => {
            const shift = shiftsByDay[day];
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div key={day} style={{
                borderRadius:10,
                border:`1px solid ${isToday ? 'var(--accent)' : 'var(--border)'}`,
                background: isToday ? 'var(--accent-subtle)' : 'var(--bg-input)',
                overflow:'hidden', minHeight:110,
              }}>
                {/* Day header */}
                <div style={{
                  padding:'7px 8px',
                  background: isToday ? 'var(--accent)' : 'transparent',
                  borderBottom:`1px solid ${isToday ? 'transparent' : 'var(--border)'}`,
                  display:'flex',alignItems:'center',justifyContent:'space-between',
                }}>
                  <span style={{fontSize:10,fontWeight:700,color:isToday?'#fff':'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{day.slice(0,3)}</span>
                  <span style={{fontSize:12,fontWeight:800,color:isToday?'rgba(255,255,255,0.9)':'var(--text-primary)'}}>
                    {date.getDate()}
                  </span>
                </div>

                {/* Shift content */}
                <div style={{padding:'8px'}}>
                  {shift ? (
                    <div>
                      <div style={{width:'100%',height:2,borderRadius:2,background:skillColor(shift.requiredSkill),marginBottom:6}}/>
                      {shift.swappedWith && (
                        <div style={{fontSize:8,fontWeight:700,color:'var(--success)',background:'var(--success-bg)',borderRadius:4,padding:'2px 5px',marginBottom:4,display:'inline-block'}}>
                          🔄 Swapped
                        </div>
                      )}
                      <div style={{fontSize:10,fontWeight:700,color:skillColor(shift.requiredSkill),marginBottom:3}}>
                        {shift.requiredSkill}
                      </div>
                      <div style={{fontSize:11,color:'var(--text-primary)',fontWeight:600}}>
                        {formatTime(shift.startTime)}
                      </div>
                      <div style={{fontSize:10,color:'var(--text-muted)'}}>
                        – {formatTime(shift.endTime)}
                      </div>
                      <div style={{marginTop:5,fontSize:10,color:'var(--text-muted)',background:'var(--bg-card)',borderRadius:4,padding:'2px 5px',display:'inline-block'}}>
                        {shiftHours(shift.startTime,shift.endTime)}h
                      </div>
                    </div>
                  ) : (
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:70}}>
                      <span style={{fontSize:10,color:'var(--text-muted)'}}>Day off</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* All shifts list */}
      {shifts.length > 0 && (
        <Card style={{marginTop:16}}>
          <h3 style={{fontWeight:700,fontSize:14,marginBottom:14}}>All My Shifts ({shifts.length})</h3>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {shifts.map(shift => (
              <div key={shift._id} style={{
                display:'flex',alignItems:'center',gap:12,padding:'10px 12px',
                background:'var(--bg-input)',borderRadius:8,
                borderLeft:`3px solid ${skillColor(shift.requiredSkill)}`,
              }}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)',width:120,flexShrink:0}}>
                  {formatDate(shift.shiftDate,{weekday:'short',month:'short',day:'numeric'})}
                </div>
                <div style={{fontSize:12,color:'var(--text-primary)',fontWeight:500}}>
                  {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                </div>
                <Badge label={shift.requiredSkill} variant="accent"/>
                {shift.swappedWith && (
                  <span style={{fontSize:10,fontWeight:700,color:'var(--success)',background:'var(--success-bg)',borderRadius:4,padding:'2px 7px'}}>
                    🔄 Swapped
                  </span>
                )}
                <div style={{fontSize:11,color:'var(--text-muted)',marginLeft:'auto'}}>
                  {shiftHours(shift.startTime,shift.endTime)}h
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
