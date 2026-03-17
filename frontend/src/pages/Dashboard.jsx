import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIssueStore } from '../context/store'
import { useAuthStore } from '../context/store'
import IssueCard from '../components/IssueCard'
import { IssueCardSkeleton } from '../components/Skeleton'

const CATS = [{v:'all',l:'All'},{v:'pothole',l:'Potholes'},{v:'garbage',l:'Garbage'},{v:'streetlight',l:'Streetlights'},{v:'water',l:'Water'},{v:'road',l:'Road Damage'}]
const STATS = [
  {n:'142',l:'Total Issues',b:'+12 this week',cls:'forest'},
  {n:'38', l:'In Progress', b:'26.7%',         cls:'blue'},
  {n:'67', l:'Pending',     b:'Needs action',  cls:'amber'},
  {n:'37', l:'Resolved',    b:'26% rate',      cls:'forest'},
]

export default function Dashboard() {
  const { user } = useAuthStore()
  const { issues, loading, fetchIssues } = useIssueStore()
  const [tab, setTab] = useState('all')
  const [cat, setCat] = useState('all')

  useEffect(() => {
    const p = {}; if(cat!=='all') p.category=cat; fetchIssues(p)
  }, [cat])

  const display = tab==='mine'
    ? issues.filter(i=>i.reporter?._id===user?._id||i.reporter===user?._id)
    : tab==='popular'
    ? [...issues].sort((a,b)=>b.upvotes-a.upvotes)
    : issues

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        .dash{font-family:'Jost',sans-serif;background:linear-gradient(135deg,#fefcf8 0%,#f5f0e8 100%);min-height:calc(100vh - 62px);padding:32px;}
        .dash-inner{max-width:960px;margin:0 auto;}
        .dash-hero{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;}
        .dash-title{font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:700;color:#2d1f0e;margin-bottom:4px;}
        .dash-sub{font-size:0.85rem;color:#8a7a65;font-weight:300;}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;}
        .scard{background:#fefcf8;border:1px solid rgba(101,78,51,0.12);border-radius:18px;padding:20px 22px;position:relative;overflow:hidden;transition:box-shadow 0.3s;}
        .scard:hover{box-shadow:0 8px 24px rgba(50,35,15,0.08);}
        .scard::before{content:'';position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;filter:blur(24px);opacity:0.35;}
        .scard.forest::before{background:#4a7c59;}
        .scard.blue::before{background:#2563a8;}
        .scard.amber::before{background:#8b6914;}
        .scard-num{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:700;line-height:1;margin-bottom:4px;}
        .scard.forest .scard-num{color:#2d5a3d;}
        .scard.blue .scard-num{color:#2563a8;}
        .scard.amber .scard-num{color:#8b6914;}
        .scard-label{font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:#8a7a65;font-weight:600;margin-bottom:8px;}
        .scard-badge{display:inline-block;padding:2px 9px;border-radius:100px;font-size:0.68rem;font-weight:600;}
        .scard.forest .scard-badge{background:rgba(74,124,89,0.1);color:#2d5a3d;border:1px solid rgba(74,124,89,0.2);}
        .scard.blue .scard-badge{background:rgba(37,99,168,0.1);color:#2563a8;border:1px solid rgba(37,99,168,0.2);}
        .scard.amber .scard-badge{background:rgba(139,105,20,0.1);color:#8b6914;border:1px solid rgba(139,105,20,0.2);}
        .tabs{display:flex;border-bottom:1px solid rgba(101,78,51,0.12);margin-bottom:18px;}
        .tab{padding:10px 18px;font-size:0.875rem;font-weight:500;color:#8a7a65;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all 0.2s;font-family:'Jost',sans-serif;}
        .tab.active{color:#2d5a3d;border-bottom-color:#4a7c59;}
        .tab:hover:not(.active){color:#5c4a32;}
        .cats{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;}
        .cat-btn{padding:6px 14px;border-radius:100px;border:1px solid rgba(101,78,51,0.2);background:transparent;color:#8a7a65;font-size:0.78rem;font-weight:500;cursor:pointer;transition:all 0.2s;font-family:'Jost',sans-serif;letter-spacing:0.04em;}
        .cat-btn:hover,.cat-btn.active{background:rgba(74,124,89,0.1);border-color:rgba(74,124,89,0.35);color:#2d5a3d;}
        .rpt-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#4a7c59,#2d5a3d);color:#e8d5b0;text-decoration:none;font-family:'Jost',sans-serif;font-size:0.875rem;font-weight:600;transition:all 0.25s;position:relative;overflow:hidden;}
        .rpt-btn::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,0.1);transform:translateX(-100%) skewX(-10deg);transition:transform 0.4s;}
        .rpt-btn:hover::after{transform:translateX(110%) skewX(-10deg);}
        .rpt-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(45,90,61,0.3);}
        .issues-list{display:flex;flex-direction:column;gap:12px;}
        .empty{text-align:center;padding:48px 24px;background:#fefcf8;border:1px dashed rgba(101,78,51,0.2);border-radius:18px;}
        .empty-icon{font-size:2.5rem;margin-bottom:10px;}
        .empty-text{font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:#8a7a65;}
        .section-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(101,78,51,0.1),transparent);margin:24px 0;}
        @media(max-width:768px){.stats-grid{grid-template-columns:repeat(2,1fr);}.dash{padding:20px;}.dash-hero{flex-direction:column;gap:14px;}}
      `}</style>
      <div className="dash">
        <div className="dash-inner">
          <div className="dash-hero">
            <div>
              <h1 className="dash-title">Welcome back, {user?.name?.split(' ')[0]} 🏛️</h1>
              <p className="dash-sub">Track and manage civic issues in your city</p>
            </div>
            <Link to="/report" className="rpt-btn">+ Report Issue</Link>
          </div>

          <div className="stats-grid">
            {STATS.map((s,i) => (
              <div key={i} className={`scard ${s.cls}`} style={{ animation:`fadeUp 0.4s ${i*60}ms ease both` }}>
                <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <div className="scard-num">{s.n}</div>
                <div className="scard-label">{s.l}</div>
                <span className="scard-badge">{s.b}</span>
              </div>
            ))}
          </div>

          <div className="section-divider"/>

          <div className="tabs">
            {[['all','All Issues'],['mine','My Reports'],['popular','Popular']].map(([v,l])=>(
              <button key={v} className={`tab${tab===v?' active':''}`} onClick={()=>setTab(v)}>{l}</button>
            ))}
          </div>

          <div className="cats">
            {CATS.map(c=>(
              <button key={c.v} className={`cat-btn${cat===c.v?' active':''}`} onClick={()=>setCat(c.v)}>{c.l}</button>
            ))}
          </div>

          <div className="issues-list">
            {loading
              ? Array(4).fill(0).map((_,i)=><IssueCardSkeleton key={i}/>)
              : display.length===0
              ? <div className="empty"><div className="empty-icon">🏙️</div><div className="empty-text">No issues found in this category</div></div>
              : display.map((issue,i)=><IssueCard key={issue._id} issue={issue} index={i}/>)
            }
          </div>
        </div>
      </div>
    </>
  )
}
