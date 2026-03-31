import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import { Card, Spinner, Avatar, EmptyState } from '../../components/ui';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

interface EmployeeAvailability {
  employee: { _id: string; fullName: string; skill: string; employeeId: string };
  availability: Record<string, { isAvailable: boolean; availableFrom: string; availableTo: string }>;
}

export default function ManagerAvailabilityPage() {
  const [data, setData] = useState<EmployeeAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const d = await api.get<EmployeeAvailability[]>('/availability/all-employees');
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{display:'flex',alignItems:'center',gap:12,padding:40}}><Spinner/></div>;

  return (
    <div className="fade-in">
      <div style={{marginBottom:28}}>
        <p style={{fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Manager → Availability</p>
        <h1 style={{fontSize:24,fontWeight:800}}>Employee Availability</h1>
        <p style={{color:'var(--text-secondary)',fontSize:13,marginTop:4}}>Overview of all employee available hours per day</p>
      </div>

      {data.length === 0 && <EmptyState icon="🕐" title="No availability data" subtitle="Employees haven't set their availability yet"/>}

      <Card style={{padding:0,overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:800}}>
          <thead>
            <tr style={{borderBottom:'1px solid var(--border)'}}>
              <th style={{textAlign:'left',padding:'14px 20px',fontSize:11,color:'var(--text-muted)',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',width:200}}>Employee</th>
              {DAYS.map(day => (
                <th key={day} style={{textAlign:'center',padding:'14px 10px',fontSize:11,color:'var(--text-muted)',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase'}}>
                  {day.slice(0,3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.employee._id} style={{borderBottom: i<data.length-1 ? '1px solid var(--border)' : 'none'}}>
                <td style={{padding:'12px 20px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <Avatar name={row.employee.fullName} size={32}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:600}}>{row.employee.fullName}</div>
                      <div style={{fontSize:10,color:'var(--text-muted)'}}>{row.employee.skill}</div>
                    </div>
                  </div>
                </td>
                {DAYS.map(day => {
                  const avail = row.availability[day];
                  return (
                    <td key={day} style={{padding:'12px 8px',textAlign:'center'}}>
                      {avail?.isAvailable ? (
                        <div style={{
                          background:'var(--success-bg)', border:'1px solid rgba(16,185,129,0.2)',
                          borderRadius:6, padding:'4px 6px', fontSize:10, color:'var(--success)', fontWeight:600,
                        }}>
                          {avail.availableFrom}–{avail.availableTo}
                        </div>
                      ) : (
                        <div style={{fontSize:10,color:'var(--text-muted)',padding:'4px 0'}}>—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Legend */}
      <div style={{display:'flex',gap:16,marginTop:16,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text-secondary)'}}>
          <div style={{width:12,height:12,background:'var(--success-bg)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:3}}/>
          Available
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text-secondary)'}}>
          <div style={{width:12,height:12,background:'transparent',borderRadius:3}}/>
          Not Available
        </div>
      </div>
    </div>
  );
}
