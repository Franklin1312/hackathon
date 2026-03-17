import React, { useEffect, useState } from 'react'
import { useIssueStore } from '../../context/store'
import IssueCard, { STATUS_META } from '../../components/IssueCard'
import { IssueCardSkeleton } from '../../components/Skeleton'

const CATS    = [{v:'all',l:'All'},{v:'pothole',l:'Pothole'},{v:'garbage',l:'Garbage'},{v:'streetlight',l:'Light'},{v:'water',l:'Water'},{v:'road',l:'Road'}]
const ALL_STATUSES = ['all','SUSPICIOUS','PENDING_VERIFICATION','VERIFIED','ASSIGNED','IN_PROGRESS','RESOLVED']

export default function AdminDashboard() {
  const { issues, loading, fetchIssues, stats, fetchStats, updateIssueStatus } = useIssueStore()
  const [statusF, setStatusF]  = useState('all')
  const [catF, setCatF]        = useState('all')
  const [search, setSearch]    = useState('')
  const [ChartLib, setChartLib]= useState(null)
  const [editing, setEditing]  = useState(null) // {id, status, worker}
  const [saving, setSaving]    = useState(false)

  useEffect(() => {
    fetchIssues()
    fetchStats()
    import('recharts').then(m => setChartLib(m))
  }, [])

  const display = issues.filter(i => {
    const matchStatus = statusF === 'all' || i.status === statusF
    const matchCat    = catF    === 'all' || i.category === catF
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchCat && matchSearch
  })

  const catData = ['pothole','garbage','streetlight','water','road'].map(c => ({
    name: c.charAt(0).toUpperCase()+c.slice(1),
    count: issues.filter(i => i.category === c).length
  }))

  const statData = Object.entries({
    'Suspicious': issues.filter(i=>i.status==='SUSPICIOUS').length,
    'Pending':    issues.filter(i=>i.status==='PENDING_VERIFICATION').length,
    'Verified':   issues.filter(i=>i.status==='VERIFIED').length,
    'Assigned':   issues.filter(i=>i.status==='ASSIGNED').length,
    'In Progress':issues.filter(i=>i.status==='IN_PROGRESS').length,
    'Resolved':   issues.filter(i=>i.status==='RESOLVED').length,
  }).map(([name, value]) => ({ name, value }))

  const STAT_CARDS = [
    { n: issues.length,                                             l:'Total Issues',  b:'All time',    cls:'forest' },
    { n: issues.filter(i=>i.status==='SUSPICIOUS').length,          l:'Suspicious',    b:'AI flagged',  cls:'red'    },
    { n: issues.filter(i=>['PENDING_VERIFICATION','VERIFIED'].includes(i.status)).length, l:'Needs Action', b:'Verify/Assign', cls:'amber' },
    { n: issues.filter(i=>i.status==='RESOLVED').length,            l:'Resolved',      b:'Completed',   cls:'forest' },
    { n: issues.filter(i=>i.blockchainTxHash).length,               l:'On Blockchain', b:'Immutable',   cls:'blue'   },
    { n: issues.filter(i=>i.aiPrediction).length,                   l:'AI Validated',  b:'Scanned',     cls:'purple' },
  ]

  const doSave = async () => {
    if (!editing) return
    setSaving(true)
    await updateIssueStatus(editing.id, { status: editing.status, assignedWorker: editing.worker || undefined })
    setSaving(false)
    setEditing(null)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        .adm-page{font-family:'Jost',sans-serif;background:linear-gradient(135deg,#fefcf8 0%,#f5f0e8 100%);min-height:calc(100vh - 62px);padding:32px;}
        .adm-inner{max-width:1200px;margin:0 auto;}
        .adm-title{font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:700;color:#2d1f0e;margin-bottom:4px;}
        .adm-sub{font-size:0.85rem;color:#8a7a65;margin-bottom:28px;}
        .stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:28px;}
        .scard{background:#fefcf8;border:1px solid rgba(101,78,51,0.12);border-radius:16px;padding:16px 18px;position:relative;overflow:hidden;transition:box-shadow 0.3s;}
        .scard:hover{box-shadow:0 6px 20px rgba(50,35,15,0.08);}
        .scard::before{content:'';position:absolute;top:-16px;right:-16px;width:60px;height:60px;border-radius:50%;filter:blur(20px);opacity:0.3;}
        .scard.forest::before{background:#4a7c59;}.scard.amber::before{background:#8b6914;}.scard.blue::before{background:#2563a8;}
        .scard.red::before{background:#c0392b;}.scard.purple::before{background:#6441a5;}
        .scard-num{font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:700;line-height:1;margin-bottom:2px;}
        .scard.forest .scard-num{color:#2d5a3d;}.scard.amber .scard-num{color:#8b6914;}.scard.blue .scard-num{color:#2563a8;}
        .scard.red .scard-num{color:#c0392b;}.scard.purple .scard-num{color:#6441a5;}
        .scard-label{font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;color:#8a7a65;font-weight:600;margin-bottom:4px;}
        .scard-badge{display:inline-block;padding:1px 7px;border-radius:100px;font-size:0.63rem;font-weight:600;}
        .scard.forest .scard-badge{background:rgba(74,124,89,0.1);color:#2d5a3d;border:1px solid rgba(74,124,89,0.2);}
        .scard.amber  .scard-badge{background:rgba(139,105,20,0.1);color:#8b6914;border:1px solid rgba(139,105,20,0.2);}
        .scard.blue   .scard-badge{background:rgba(37,99,168,0.1);color:#2563a8;border:1px solid rgba(37,99,168,0.2);}
        .scard.red    .scard-badge{background:rgba(192,57,43,0.1);color:#c0392b;border:1px solid rgba(192,57,43,0.2);}
        .scard.purple .scard-badge{background:rgba(100,65,165,0.1);color:#6441a5;border:1px solid rgba(100,65,165,0.2);}
        .charts-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;}
        .chart-card{background:#fefcf8;border:1px solid rgba(101,78,51,0.12);border-radius:18px;padding:22px;}
        .chart-title{font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:700;color:#2d1f0e;margin-bottom:14px;}
        .divider{height:1px;background:linear-gradient(90deg,transparent,rgba(101,78,51,0.1),transparent);margin:20px 0;}
        .toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center;}
        .search-box{flex:1;min-width:180px;padding:8px 14px;border-radius:10px;border:1px solid rgba(101,78,51,0.2);background:rgba(255,255,255,0.8);font-family:'Jost',sans-serif;font-size:0.85rem;color:#2d1f0e;outline:none;}
        .search-box:focus{border-color:rgba(74,124,89,0.45);}
        .fchip{padding:6px 12px;border-radius:100px;border:1px solid rgba(101,78,51,0.2);background:transparent;color:#8a7a65;font-size:0.73rem;font-weight:500;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;white-space:nowrap;}
        .fchip:hover,.fchip.active{background:rgba(74,124,89,0.1);border-color:rgba(74,124,89,0.35);color:#2d5a3d;}
        .issues-grid{display:flex;flex-direction:column;gap:10px;}

        /* Inline edit modal */
        .edit-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;}
        .edit-modal{background:#fefcf8;border-radius:20px;padding:28px;width:100%;max-width:440px;box-shadow:0 16px 48px rgba(0,0,0,0.18);}
        .edit-title{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:700;color:#2d1f0e;margin-bottom:18px;}
        .edit-label{font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:#8a7a65;font-weight:600;margin-bottom:6px;}
        .edit-sel,.edit-inp{width:100%;background:rgba(255,255,255,0.9);border:1px solid rgba(101,78,51,0.2);border-radius:10px;padding:9px 13px;font-family:'Jost',sans-serif;font-size:0.88rem;color:#2d1f0e;outline:none;margin-bottom:14px;box-sizing:border-box;}
        .edit-sel:focus,.edit-inp:focus{border-color:rgba(74,124,89,0.45);}
        .edit-row{display:flex;gap:10px;margin-top:6px;}
        .edit-btn{flex:1;padding:10px;border-radius:10px;border:none;font-family:'Jost',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;}
        .edit-btn.save{background:linear-gradient(135deg,#4a7c59,#2d5a3d);color:#e8d5b0;}
        .edit-btn.save:hover{transform:translateY(-1px);}
        .edit-btn.cancel{background:rgba(101,78,51,0.08);color:#654e33;}
        .no-delete-note{font-size:0.73rem;color:#c0392b;margin-top:8px;text-align:center;}

        @media(max-width:900px){.stats-grid{grid-template-columns:repeat(3,1fr);}
        .charts-row{grid-template-columns:1fr;}.adm-page{padding:16px;}}
        @media(max-width:600px){.stats-grid{grid-template-columns:repeat(2,1fr);}}
      `}</style>

      <div className="adm-page">
        <div className="adm-inner">
          <h1 className="adm-title">Admin Dashboard 🛠️</h1>
          <p className="adm-sub">Manage complaints, verify reports, assign workers, and track blockchain records</p>

          {/* Stats */}
          <div className="stats-grid">
            {STAT_CARDS.map((s, i) => (
              <div key={i} className={`scard ${s.cls}`}>
                <div className="scard-label">{s.l}</div>
                <div className="scard-num">{s.n}</div>
                <span className="scard-badge">{s.b}</span>
              </div>
            ))}
          </div>

          {/* Charts */}
          {ChartLib && (
            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-title">Issues by Category</div>
                <ChartLib.ResponsiveContainer width="100%" height={180}>
                  <ChartLib.BarChart data={catData} barSize={26}>
                    <ChartLib.CartesianGrid strokeDasharray="3 3" stroke="rgba(101,78,51,0.08)"/>
                    <ChartLib.XAxis dataKey="name" tick={{fontFamily:'Jost',fontSize:10,fill:'#8a7a65'}} axisLine={false} tickLine={false}/>
                    <ChartLib.YAxis tick={{fontFamily:'Jost',fontSize:10,fill:'#8a7a65'}} axisLine={false} tickLine={false}/>
                    <ChartLib.Tooltip contentStyle={{fontFamily:'Jost',fontSize:11,borderRadius:'10px',border:'1px solid rgba(101,78,51,0.15)',background:'#fefcf8'}}/>
                    <ChartLib.Bar dataKey="count" fill="#4a7c59" radius={[5,5,0,0]}/>
                  </ChartLib.BarChart>
                </ChartLib.ResponsiveContainer>
              </div>
              <div className="chart-card">
                <div className="chart-title">Status Distribution</div>
                <ChartLib.ResponsiveContainer width="100%" height={180}>
                  <ChartLib.PieChart>
                    <ChartLib.Pie data={statData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({name,value})=>value>0?`${name} (${value})`:''} labelLine={false}>
                      {statData.map((_, idx) => {
                        const fills=['#c0392b','#8b6914','#2563a8','#6441a5','#2563a8','#4a7c59']
                        return <ChartLib.Cell key={idx} fill={fills[idx]}/>
                      })}
                    </ChartLib.Pie>
                    <ChartLib.Tooltip contentStyle={{fontFamily:'Jost',fontSize:11,borderRadius:'10px'}}/>
                  </ChartLib.PieChart>
                </ChartLib.ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="divider"/>

          {/* Toolbar */}
          <div className="toolbar">
            <input className="search-box" placeholder="🔍 Search complaints…" value={search} onChange={e=>setSearch(e.target.value)}/>
            {ALL_STATUSES.map(s => (
              <button key={s} className={`fchip${statusF===s?' active':''}`} onClick={()=>setStatusF(s)}>
                {s === 'all' ? 'All' : (STATUS_META[s]?.label || s)}
              </button>
            ))}
          </div>
          <div className="toolbar" style={{marginTop:-8}}>
            {CATS.map(c => (
              <button key={c.v} className={`fchip${catF===c.v?' active':''}`} onClick={()=>setCatF(c.v)}>{c.l}</button>
            ))}
          </div>

          {/* Issues list */}
          <div className="issues-grid">
            {loading
              ? Array(4).fill(0).map((_,i) => <IssueCardSkeleton key={i}/>)
              : display.length === 0
                ? <div style={{textAlign:'center',padding:'40px',color:'#8a7a65'}}>No issues found</div>
                : display.map(issue => (
                    <div key={issue._id} style={{position:'relative'}}>
                      <IssueCard issue={issue}/>
                      <button
                        onClick={()=>setEditing({id:issue._id, status:issue.status, worker:issue.assignedWorker||''})}
                        style={{position:'absolute',top:16,right:16,padding:'5px 12px',borderRadius:8,border:'1px solid rgba(101,78,51,0.2)',background:'rgba(255,255,255,0.9)',fontFamily:'Jost,sans-serif',fontSize:'0.75rem',fontWeight:600,cursor:'pointer',color:'#654e33',zIndex:5}}
                      >✏️ Update</button>
                    </div>
                  ))
            }
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="edit-overlay" onClick={e=>e.target===e.currentTarget&&setEditing(null)}>
          <div className="edit-modal">
            <div className="edit-title">Update Complaint Status</div>
            <div className="edit-label">Status</div>
            <select className="edit-sel" value={editing.status} onChange={e=>setEditing(p=>({...p,status:e.target.value}))}>
              <option value="SUSPICIOUS">⚠️ Suspicious</option>
              <option value="PENDING_VERIFICATION">🔍 Pending Verification</option>
              <option value="VERIFIED">✅ Verified (→ records to Blockchain)</option>
              <option value="ASSIGNED">👷 Assigned</option>
              <option value="IN_PROGRESS">🔧 In Progress</option>
              <option value="RESOLVED">✅ Resolved</option>
            </select>
            <div className="edit-label">Assigned Worker (optional)</div>
            <input className="edit-inp" placeholder="Worker name or ID" value={editing.worker} onChange={e=>setEditing(p=>({...p,worker:e.target.value}))}/>
            <div style={{fontSize:'0.75rem',color:'#2563a8',background:'rgba(37,99,168,0.06)',border:'1px solid rgba(37,99,168,0.2)',borderRadius:8,padding:'8px 12px',marginBottom:12}}>
              ⛓ Setting status to <strong>VERIFIED</strong> will write this complaint immutably to the blockchain.
            </div>
            <div className="no-delete-note">🚫 Complaints cannot be deleted — immutable record policy</div>
            <div className="edit-row">
              <button className="edit-btn cancel" onClick={()=>setEditing(null)}>Cancel</button>
              <button className="edit-btn save" onClick={doSave} disabled={saving}>{saving?'Saving…':'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
