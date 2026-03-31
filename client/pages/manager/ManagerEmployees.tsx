import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import type { User } from '../../types';
import { Card, Badge, Btn, Modal, FormField, EmptyState, Spinner, Avatar, toast } from '../../components/ui';
import { SKILLS } from '../../utils/helpers';

export default function ManagerEmployeesPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editEmp, setEditEmp] = useState<User | null>(null);
  const [form, setForm] = useState({ fullName:'', email:'', password:'', skill:'Cashier', employmentType:'Full-Time', phone:'' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await api.get<User[]>('/users');
    setEmployees(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveEmployee = async () => {
    setSaving(true);
    try {
      if (editEmp) {
        const updated = await api.put<User>(`/users/${editEmp._id}`, form);
        setEmployees(prev => prev.map(e => e._id === editEmp._id ? updated : e));
        toast('Employee updated!');
      } else {
        const created = await api.post<User>('/users', form);
        setEmployees(prev => [created, ...prev]);
        toast('Employee added!');
      }
      setShowAdd(false); setEditEmp(null);
      setForm({ fullName:'', email:'', password:'', skill:'Cashier', employmentType:'Full-Time', phone:'' });
    } catch (e: any) { toast(e.message, 'error'); }
    setSaving(false);
  };

  const toggleStatus = async (emp: User) => {
    try {
      const updated = await api.put<User>(`/users/${emp._id}`, { status: emp.status === 'Active' ? 'Inactive' : 'Active' });
      setEmployees(prev => prev.map(e => e._id === emp._id ? updated : e));
      toast(`Employee ${updated.status === 'Active' ? 'activated' : 'deactivated'}`);
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const openEdit = (emp: User) => {
    setEditEmp(emp);
    setForm({ fullName:emp.fullName, email:emp.email, password:'', skill:emp.skill||'Cashier', employmentType:emp.employmentType||'Full-Time', phone:emp.phone||'' });
    setShowAdd(true);
  };

  const filtered = employees.filter(e =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const skillColors: Record<string, string> = {
    'Cashier':'#3b82f6','Floor Staff':'#10b981','Stock Room':'#f59e0b','Supervisor':'#8b5cf6','Customer Service':'#ec4899',
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',gap:12,padding:40}}><Spinner/></div>;

  return (
    <div className="fade-in">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
        <div>
          <p style={{fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Manager → Employees</p>
          <h1 style={{fontSize:24,fontWeight:800}}>Employee Management</h1>
        </div>
        <Btn onClick={() => { setEditEmp(null); setForm({ fullName:'', email:'', password:'', skill:'Cashier', employmentType:'Full-Time', phone:'' }); setShowAdd(true); }} icon="+" size="md">Add Employee</Btn>
      </div>

      {/* Search */}
      <div style={{marginBottom:20}}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search employees…" style={{maxWidth:360}}/>
      </div>

      {/* Stats */}
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {[
          { label:'Total', count: employees.length, color:'var(--accent)' },
          { label:'Active', count: employees.filter(e=>e.status==='Active').length, color:'var(--success)' },
          { label:'Full-Time', count: employees.filter(e=>e.employmentType==='Full-Time').length, color:'var(--purple)' },
          { label:'Part-Time', count: employees.filter(e=>e.employmentType==='Part-Time').length, color:'var(--warning)' },
        ].map(s => (
          <div key={s.label} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'10px 20px',display:'flex',gap:10,alignItems:'center'}}>
            <span style={{fontSize:18,fontWeight:800,color:s.color}}>{s.count}</span>
            <span style={{fontSize:12,color:'var(--text-secondary)'}}>{s.label}</span>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState icon="👥" title="No employees found" subtitle="Add your first employee or adjust your search"/>}

      {/* Table */}
      <Card style={{padding:0,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid var(--border)'}}>
              {['Employee','Contact','Role/Skill','Type','Status','Actions'].map(h => (
                <th key={h} style={{textAlign:'left',padding:'12px 16px',fontSize:11,color:'var(--text-muted)',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, i) => (
              <tr key={emp._id} style={{borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none', transition:'background 0.15s'}}>
                <td style={{padding:'12px 16px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <Avatar name={emp.fullName} size={36}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:600}}>{emp.fullName}</div>
                      <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'var(--mono)'}}>{emp.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td style={{padding:'12px 16px'}}>
                  <div style={{fontSize:12,color:'var(--text-secondary)'}}>{emp.email}</div>
                  {emp.phone && <div style={{fontSize:11,color:'var(--text-muted)'}}>{emp.phone}</div>}
                </td>
                <td style={{padding:'12px 16px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:skillColors[emp.skill||'']||'#64748b',flexShrink:0}}/>
                    <span style={{fontSize:12,fontWeight:500}}>{emp.skill}</span>
                  </div>
                </td>
                <td style={{padding:'12px 16px'}}>
                  <Badge label={emp.employmentType||'Full-Time'} variant={emp.employmentType==='Full-Time'?'accent':'purple'}/>
                </td>
                <td style={{padding:'12px 16px'}}>
                  <Badge label={emp.status} variant={emp.status==='Active'?'success':'danger'}/>
                </td>
                <td style={{padding:'12px 16px'}}>
                  <div style={{display:'flex',gap:8}}>
                    <Btn size="sm" variant="ghost" onClick={() => openEdit(emp)}>Edit</Btn>
                    <Btn size="sm" variant={emp.status==='Active'?'danger':'success'} onClick={() => toggleStatus(emp)}>
                      {emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditEmp(null); }} title={editEmp ? 'Edit Employee' : 'Add Employee'}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="Full Name">
            <input value={form.fullName} onChange={e=>setForm(p=>({...p,fullName:e.target.value}))} placeholder="Jane Smith"/>
          </FormField>
          <FormField label="Email">
            <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="jane@company.com"/>
          </FormField>
          {!editEmp && (
            <FormField label="Password">
              <input type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="Min. 8 characters"/>
            </FormField>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="Skill">
              <select value={form.skill} onChange={e=>setForm(p=>({...p,skill:e.target.value}))}>
                {SKILLS.map(s=><option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Employment Type">
              <select value={form.employmentType} onChange={e=>setForm(p=>({...p,employmentType:e.target.value}))}>
                <option>Full-Time</option>
                <option>Part-Time</option>
              </select>
            </FormField>
          </div>
          <FormField label="Phone (optional)">
            <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="(555) 000-0000"/>
          </FormField>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
            <Btn variant="ghost" onClick={() => { setShowAdd(false); setEditEmp(null); }}>Cancel</Btn>
            <Btn onClick={saveEmployee} loading={saving}>{editEmp ? 'Save Changes' : 'Add Employee'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
