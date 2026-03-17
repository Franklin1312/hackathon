import React, { useEffect, useState } from 'react'
import { useIssueStore } from '../../context/store'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AdminAnalytics() {
  const { issues, stats, fetchIssues, fetchStats } = useIssueStore()
  const [ChartLib, setChartLib] = useState(null)

  useEffect(() => {
    fetchIssues({ limit: 200 })
    fetchStats()
    import('recharts').then(m => setChartLib(m))
  }, [])

  // Resolution rate %
  const resRate = issues.length ? Math.round((issues.filter(i=>i.status==='RESOLVED').length / issues.length) * 100) : 0

  // AI accuracy
  const withAI  = issues.filter(i => i.aiPrediction)
  const aiMatch = withAI.filter(i => i.aiMatchedCategory).length
  const aiAcc   = withAI.length ? Math.round((aiMatch / withAI.length) * 100) : 0

  // Blockchain coverage
  const onChain = issues.filter(i => i.blockchainTxHash).length
  const chainPct= issues.length ? Math.round((onChain / issues.length) * 100) : 0

  // Priority breakdown
  const prioData = ['high','medium','low'].map(p => ({
    name: p.charAt(0).toUpperCase()+p.slice(1),
    count: issues.filter(i => i.priority === p).length,
    fill: p==='high'?'#c0392b':p==='medium'?'#8b6914':'#4a7c59'
  }))

  // Category + resolution rate
  const catResData = ['pothole','garbage','streetlight','water','road'].map(c => {
    const all     = issues.filter(i => i.category === c)
    const resolved= all.filter(i => i.status === 'RESOLVED').length
    return { name: c.charAt(0).toUpperCase()+c.slice(1), total: all.length, resolved, rate: all.length ? Math.round(resolved/all.length*100) : 0 }
  })

  // Monthly trend from mock
  const months = {}
  issues.forEach(i => {
    const d = new Date(i.createdAt)
    const k = `${d.getFullYear()}-${d.getMonth()}`
    if (!months[k]) months[k] = { name: MONTHS[d.getMonth()], submitted: 0, resolved: 0 }
    months[k].submitted++
    if (i.status === 'RESOLVED') months[k].resolved++
  })
  const trendData = Object.values(months).slice(-6)

  // AI confidence buckets
  const aiConfBuckets = [
    { name:'<60%', count: withAI.filter(i=>i.aiConfidence<0.6).length,  fill:'#c0392b' },
    { name:'60-75%',count:withAI.filter(i=>i.aiConfidence>=0.6&&i.aiConfidence<0.75).length, fill:'#8b6914' },
    { name:'75-90%',count:withAI.filter(i=>i.aiConfidence>=0.75&&i.aiConfidence<0.9).length, fill:'#2563a8' },
    { name:'≥90%', count: withAI.filter(i=>i.aiConfidence>=0.9).length, fill:'#4a7c59' },
  ]

  const KPI = [
    { value:`${resRate}%`,  label:'Resolution Rate',   sub:`${issues.filter(i=>i.status==='RESOLVED').length} / ${issues.length}`, cls:'forest' },
    { value:`${aiAcc}%`,   label:'AI Accuracy',        sub:`${aiMatch} / ${withAI.length} matched`,  cls:'blue'   },
    { value:`${chainPct}%`,label:'Blockchain Coverage', sub:`${onChain} of ${issues.length} on-chain`, cls:'purple' },
    { value:stats?.avgResolutionDays ?? '—', label:'Avg Resolution', sub:'days to resolve', cls:'amber' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        .ana-page{font-family:'Jost',sans-serif;background:linear-gradient(135deg,#fefcf8,#f5f0e8);min-height:calc(100vh - 62px);padding:32px;}
        .ana-inner{max-width:1200px;margin:0 auto;}
        .ana-title{font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:700;color:#2d1f0e;margin-bottom:4px;}
        .ana-sub{font-size:0.85rem;color:#8a7a65;margin-bottom:28px;}
        .kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;}
        .kpi{background:#fefcf8;border:1px solid rgba(101,78,51,0.12);border-radius:18px;padding:20px 22px;position:relative;overflow:hidden;}
        .kpi::before{content:'';position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;filter:blur(22px);opacity:0.3;}
        .kpi.forest::before{background:#4a7c59;}.kpi.blue::before{background:#2563a8;}.kpi.purple::before{background:#6441a5;}.kpi.amber::before{background:#8b6914;}
        .kpi-val{font-family:'Cormorant Garamond',serif;font-size:2.4rem;font-weight:700;line-height:1;}
        .kpi.forest .kpi-val{color:#2d5a3d;}.kpi.blue .kpi-val{color:#2563a8;}.kpi.purple .kpi-val{color:#6441a5;}.kpi.amber .kpi-val{color:#8b6914;}
        .kpi-lbl{font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:#8a7a65;font-weight:600;margin-top:6px;}
        .kpi-sub{font-size:0.73rem;color:#c8b99a;margin-top:2px;}
        .charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}
        .chart-card{background:#fefcf8;border:1px solid rgba(101,78,51,0.12);border-radius:18px;padding:22px;}
        .chart-title{font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:700;color:#2d1f0e;margin-bottom:14px;}
        .full-chart{grid-column:1/-1;}
        .table-card{background:#fefcf8;border:1px solid rgba(101,78,51,0.12);border-radius:18px;padding:22px;margin-bottom:24px;}
        table{width:100%;border-collapse:collapse;}
        th{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;color:#8a7a65;font-weight:600;padding:8px 14px;text-align:left;border-bottom:1px solid rgba(101,78,51,0.1);}
        td{padding:10px 14px;font-size:0.85rem;color:#2d1f0e;border-bottom:1px solid rgba(101,78,51,0.06);}
        tr:last-child td{border-bottom:none;}
        .rate-bar{height:6px;border-radius:3px;background:rgba(101,78,51,0.1);overflow:hidden;margin-top:4px;}
        .rate-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#4a7c59,#2d5a3d);transition:width 0.6s;}
        @media(max-width:900px){.kpi-row{grid-template-columns:repeat(2,1fr);}.charts-grid{grid-template-columns:1fr;}.full-chart{grid-column:1;}.ana-page{padding:16px;}}
      `}</style>
      <div className="ana-page">
        <div className="ana-inner">
          <h1 className="ana-title">Analytics & Insights 📊</h1>
          <p className="ana-sub">Platform performance, AI accuracy, and blockchain transparency metrics</p>

          <div className="kpi-row">
            {KPI.map((k,i) => (
              <div key={i} className={`kpi ${k.cls}`}>
                <div className="kpi-val">{k.value}</div>
                <div className="kpi-lbl">{k.label}</div>
                <div className="kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          {ChartLib && (
            <div className="charts-grid">
              {/* Monthly trend */}
              <div className="chart-card full-chart">
                <div className="chart-title">Monthly Submission & Resolution Trend</div>
                <ChartLib.ResponsiveContainer width="100%" height={200}>
                  <ChartLib.LineChart data={trendData}>
                    <ChartLib.CartesianGrid strokeDasharray="3 3" stroke="rgba(101,78,51,0.08)"/>
                    <ChartLib.XAxis dataKey="name" tick={{fontFamily:'Jost',fontSize:11,fill:'#8a7a65'}} axisLine={false} tickLine={false}/>
                    <ChartLib.YAxis tick={{fontFamily:'Jost',fontSize:11,fill:'#8a7a65'}} axisLine={false} tickLine={false}/>
                    <ChartLib.Tooltip contentStyle={{fontFamily:'Jost',fontSize:12,borderRadius:'10px',border:'1px solid rgba(101,78,51,0.15)',background:'#fefcf8'}}/>
                    <ChartLib.Legend wrapperStyle={{fontFamily:'Jost',fontSize:12}}/>
                    <ChartLib.Line type="monotone" dataKey="submitted" stroke="#2563a8" strokeWidth={2} dot={{r:4}} name="Submitted"/>
                    <ChartLib.Line type="monotone" dataKey="resolved"  stroke="#4a7c59" strokeWidth={2} dot={{r:4}} name="Resolved"/>
                  </ChartLib.LineChart>
                </ChartLib.ResponsiveContainer>
              </div>

              {/* Priority breakdown */}
              <div className="chart-card">
                <div className="chart-title">Priority Breakdown</div>
                <ChartLib.ResponsiveContainer width="100%" height={180}>
                  <ChartLib.BarChart data={prioData} barSize={40}>
                    <ChartLib.CartesianGrid strokeDasharray="3 3" stroke="rgba(101,78,51,0.08)"/>
                    <ChartLib.XAxis dataKey="name" tick={{fontFamily:'Jost',fontSize:11,fill:'#8a7a65'}} axisLine={false} tickLine={false}/>
                    <ChartLib.YAxis tick={{fontFamily:'Jost',fontSize:11,fill:'#8a7a65'}} axisLine={false} tickLine={false}/>
                    <ChartLib.Tooltip contentStyle={{fontFamily:'Jost',fontSize:12,borderRadius:'10px',background:'#fefcf8'}}/>
                    <ChartLib.Bar dataKey="count" radius={[6,6,0,0]}>
                      {prioData.map((e,i) => <ChartLib.Cell key={i} fill={e.fill}/>)}
                    </ChartLib.Bar>
                  </ChartLib.BarChart>
                </ChartLib.ResponsiveContainer>
              </div>

              {/* AI confidence distribution */}
              <div className="chart-card">
                <div className="chart-title">AI Confidence Distribution</div>
                <ChartLib.ResponsiveContainer width="100%" height={180}>
                  <ChartLib.BarChart data={aiConfBuckets} barSize={40}>
                    <ChartLib.CartesianGrid strokeDasharray="3 3" stroke="rgba(101,78,51,0.08)"/>
                    <ChartLib.XAxis dataKey="name" tick={{fontFamily:'Jost',fontSize:11,fill:'#8a7a65'}} axisLine={false} tickLine={false}/>
                    <ChartLib.YAxis tick={{fontFamily:'Jost',fontSize:11,fill:'#8a7a65'}} axisLine={false} tickLine={false}/>
                    <ChartLib.Tooltip contentStyle={{fontFamily:'Jost',fontSize:12,borderRadius:'10px',background:'#fefcf8'}}/>
                    <ChartLib.Bar dataKey="count" radius={[6,6,0,0]}>
                      {aiConfBuckets.map((e,i) => <ChartLib.Cell key={i} fill={e.fill}/>)}
                    </ChartLib.Bar>
                  </ChartLib.BarChart>
                </ChartLib.ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Category resolution table */}
          <div className="table-card">
            <div className="chart-title">Category Resolution Rates</div>
            <table>
              <thead>
                <tr>
                  <th>Category</th><th>Total</th><th>Resolved</th><th>Resolution Rate</th><th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {catResData.map(r => (
                  <tr key={r.name}>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.total}</td>
                    <td style={{color:'#2d5a3d',fontWeight:600}}>{r.resolved}</td>
                    <td style={{fontWeight:600,color:r.rate>=60?'#2d5a3d':r.rate>=30?'#8b6914':'#c0392b'}}>{r.rate}%</td>
                    <td style={{minWidth:120}}>
                      <div className="rate-bar"><div className="rate-fill" style={{width:`${r.rate}%`}}/></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Blockchain summary */}
          <div className="table-card">
            <div className="chart-title">⛓ Blockchain Transparency Log</div>
            <table>
              <thead><tr><th>Issue</th><th>Category</th><th>Tx Hash</th><th>Status</th></tr></thead>
              <tbody>
                {issues.filter(i=>i.blockchainTxHash).slice(0,10).map(i=>(
                  <tr key={i._id}>
                    <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.title}</td>
                    <td>{i.category}</td>
                    <td style={{fontFamily:'monospace',fontSize:'0.72rem',color:'#2563a8'}}>
                      {i.blockchainTxHash.startsWith('0x') ? `${i.blockchainTxHash.slice(0,14)}…${i.blockchainTxHash.slice(-6)}` : i.blockchainTxHash}
                    </td>
                    <td><span style={{padding:'2px 8px',borderRadius:'100px',fontSize:'0.7rem',fontWeight:600,background:'rgba(74,124,89,0.1)',color:'#2d5a3d',border:'1px solid rgba(74,124,89,0.2)'}}>{i.status}</span></td>
                  </tr>
                ))}
                {issues.filter(i=>i.blockchainTxHash).length === 0 && (
                  <tr><td colSpan={4} style={{textAlign:'center',color:'#c8b99a',padding:'24px'}}>No blockchain records yet — verify a complaint to record it on-chain</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
