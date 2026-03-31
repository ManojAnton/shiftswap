import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import type { Availability } from '../../types';
import { Card, Btn, Spinner, toast } from '../../components/ui';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

interface DayAvail {
  dayOfWeek: string;
  isAvailable: boolean;
  availableFrom: string;
  availableTo: string;
}

export default function EmployeeAvailabilityPage() {
  const [avail, setAvail] = useState<DayAvail[]>(
    DAYS.map(d => ({ dayOfWeek:d, isAvailable:['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(d), availableFrom:'09:00', availableTo:'17:00' }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await api.get<Availability[]>('/availability');
    if (data.length > 0) {
      setAvail(DAYS.map(day => {
        const found = data.find(a => a.dayOfWeek === day);
        return found
          ? { dayOfWeek:day, isAvailable:found.isAvailable, availableFrom:found.availableFrom, availableTo:found.availableTo }
          : { dayOfWeek:day, isAvailable:false, availableFrom:'09:00', availableTo:'17:00' };
      }));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (day: string, field: keyof DayAvail, value: string | boolean) => {
    setAvail(prev => prev.map(a => a.dayOfWeek === day ? { ...a, [field]: value } : a));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/availability/bulk', { availability: avail });
      toast('Availability saved!');
    } catch (e: any) { toast(e.message, 'error'); }
    setSaving(false);
  };

  const totalAvailableHours = avail.reduce((sum, a) => {
    if (!a.isAvailable) return sum;
    const [sh, sm] = a.availableFrom.split(':').map(Number);
    const [eh, em] = a.availableTo.split(':').map(Number);
    return sum + ((eh*60+em) - (sh*60+sm)) / 60;
  }, 0);

  if (loading) return <div style={{display:'flex',alignItems:'center',gap:12,padding:40}}><Spinner/></div>;

  return (
    <div className="fade-in">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12}}>
        <div>
          <p style={{fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Employee → Availability</p>
          <h1 style={{fontSize:24,fontWeight:800}}>Update Availability</h1>
          <p style={{color:'var(--text-secondary)',fontSize:13,marginTop:4}}>Set your weekly available hours for scheduling</p>
        </div>
        <Btn onClick={save} loading={saving} size="md" icon="💾">Save Availability</Btn>
      </div>

      {/* Summary */}
      <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'10px 18px'}}>
          <span style={{fontSize:20,fontWeight:800,color:'var(--accent)'}}>{avail.filter(a=>a.isAvailable).length}</span>
          <span style={{fontSize:12,color:'var(--text-secondary)',marginLeft:8}}>days available</span>
        </div>
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'10px 18px'}}>
          <span style={{fontSize:20,fontWeight:800,color:'var(--success)'}}>{totalAvailableHours.toFixed(0)}h</span>
          <span style={{fontSize:12,color:'var(--text-secondary)',marginLeft:8}}>total hours/week</span>
        </div>
      </div>

      {/* Day-by-day availability */}
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {avail.map((a, i) => (
          <Card key={a.dayOfWeek} style={{
            padding:'16px 20px',
            borderLeft:`3px solid ${a.isAvailable ? 'var(--success)' : 'var(--border)'}`,
            transition:'all 0.2s',
            animation:`fadeIn 0.3s ease ${i*0.04}s both`,
          }}>
            <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
              {/* Day name */}
              <div style={{width:110,flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:700}}>{a.dayOfWeek}</div>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>
                  {['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(a.dayOfWeek) ? 'Weekday' : 'Weekend'}
                </div>
              </div>

              {/* Toggle */}
              <div
                onClick={() => update(a.dayOfWeek, 'isAvailable', !a.isAvailable)}
                style={{
                  width:44,height:24,borderRadius:12,cursor:'pointer',flexShrink:0,
                  background: a.isAvailable ? 'var(--success)' : 'var(--border)',
                  position:'relative',transition:'background 0.2s',
                }}
              >
                <div style={{
                  position:'absolute',top:2,
                  left: a.isAvailable ? 22 : 2,
                  width:20,height:20,borderRadius:'50%',background:'#fff',
                  transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
                }}/>
              </div>

              {/* Status label */}
              <div style={{width:80,fontSize:12,fontWeight:600,color: a.isAvailable ? 'var(--success)' : 'var(--text-muted)'}}>
                {a.isAvailable ? 'Available' : 'Unavailable'}
              </div>

              {/* Time range */}
              {a.isAvailable && (
                <div style={{display:'flex',alignItems:'center',gap:10,flex:1,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <label style={{fontSize:11,color:'var(--text-muted)',whiteSpace:'nowrap'}}>From</label>
                    <input
                      type="time" value={a.availableFrom}
                      onChange={e => update(a.dayOfWeek,'availableFrom',e.target.value)}
                      style={{width:120}}
                    />
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <label style={{fontSize:11,color:'var(--text-muted)',whiteSpace:'nowrap'}}>To</label>
                    <input
                      type="time" value={a.availableTo}
                      onChange={e => update(a.dayOfWeek,'availableTo',e.target.value)}
                      style={{width:120}}
                    />
                  </div>
                  <div style={{fontSize:11,color:'var(--text-secondary)',whiteSpace:'nowrap'}}>
                    {(() => {
                      const [sh,sm] = a.availableFrom.split(':').map(Number);
                      const [eh,em] = a.availableTo.split(':').map(Number);
                      const hrs = ((eh*60+em)-(sh*60+sm))/60;
                      return hrs > 0 ? `${hrs.toFixed(1)}h available` : '';
                    })()}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Save button bottom */}
      <div style={{marginTop:24,display:'flex',justifyContent:'flex-end'}}>
        <Btn onClick={save} loading={saving} size="lg" icon="💾">Save Availability</Btn>
      </div>
    </div>
  );
}
