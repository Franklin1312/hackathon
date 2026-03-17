import React, { useEffect, useState } from 'react'
import { useIssueStore } from '../context/store'
import IssueCard from '../components/IssueCard'

export default function MapView() {
  const { issues, fetchIssues, loading } = useIssueStore()
  const [MapComp, setMapComp] = useState(null)

  useEffect(() => {
    fetchIssues()
    import('../components/MapComponent').then(m => setMapComp(()=>m.default))
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        .map-page{font-family:'Jost',sans-serif;background:linear-gradient(135deg,#fefcf8 0%,#f5f0e8 100%);min-height:calc(100vh - 62px);padding:32px;}
        .map-inner{max-width:1100px;margin:0 auto;}
        .map-title{font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:700;color:#2d1f0e;margin-bottom:4px;}
        .map-sub{font-size:0.85rem;color:#8a7a65;font-weight:300;margin-bottom:24px;}
        .map-wrap{border-radius:20px;overflow:hidden;border:1px solid rgba(101,78,51,0.14);box-shadow:0 4px 24px rgba(50,35,15,0.08);margin-bottom:28px;}
        .legend{display:flex;gap:16px;margin-top:12px;flex-wrap:wrap;}
        .leg-item{display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#8a7a65;}
        .leg-dot{width:10px;height:10px;border-radius:50%;}
        .divider{height:1px;background:linear-gradient(90deg,transparent,rgba(101,78,51,0.1),transparent);margin:24px 0;}
        .nearby-title{font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-weight:700;color:#2d1f0e;margin-bottom:14px;}
        .nearby-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
        @media(max-width:640px){.nearby-grid{grid-template-columns:1fr;}}
      `}</style>
      <div className="map-page">
        <div className="map-inner">
          <h1 className="map-title">City Issue Map 🗺️</h1>
          <p className="map-sub">Live map of all reported civic issues — click pins to view details</p>
          <div className="map-wrap">
            {MapComp
              ? <MapComp issues={issues} height="440px"/>
              : <div style={{height:'440px',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(101,78,51,0.03)'}}><div className="loader"/></div>
            }
          </div>
          <div className="legend">
            {[['#c0392b','High Priority'],['#8b6914','Medium Priority'],['#4a7c59','Low / Resolved']].map(([c,l])=>(
              <div key={l} className="leg-item"><div className="leg-dot" style={{background:c}}/>{l}</div>
            ))}
          </div>
          <div className="divider"/>
          <div className="nearby-title">All Issues ({issues.length})</div>
          {loading
            ? <div style={{textAlign:'center',padding:'24px'}}><div className="loader" style={{margin:'0 auto'}}/></div>
            : <div className="nearby-grid">
                {issues.map((issue,i)=><IssueCard key={issue._id} issue={issue} index={i}/>)}
              </div>
          }
        </div>
      </div>
    </>
  )
}
