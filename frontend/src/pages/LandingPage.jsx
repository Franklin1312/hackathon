import React from 'react'
import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { icon:'📷', title:'Secure Evidence Capture', desc:'Live camera with GPS+timestamp watermarks. No gallery uploads — tamper-proof by design.' },
  { icon:'🤖', title:'AI Issue Detection',       desc:'YOLOv8 validates every photo. Mismatches are flagged SUSPICIOUS automatically.' },
  { icon:'⛓',  title:'Blockchain Immutability',  desc:'Verified complaints are hashed and written to Sepolia. Admins cannot delete records.' },
  { icon:'📍', title:'Real-time Map Tracking',   desc:'See all open issues on a live Leaflet map. Know what\'s happening in your ward.' },
  { icon:'🔔', title:'Status Transparency',      desc:'6-stage workflow — from PENDING to RESOLVED — tracked immutably for every complaint.' },
  { icon:'🏆', title:'Reputation System',        desc:'Citizens earn points for valid reports. Builds trust and discourages abuse.' },
]

const STATUSES = [
  { s:'SUSPICIOUS',           c:'#c0392b', d:'AI mismatch or low confidence' },
  { s:'PENDING_VERIFICATION', c:'#8b6914', d:'Awaiting admin review' },
  { s:'VERIFIED',             c:'#2563a8', d:'Confirmed + written to blockchain' },
  { s:'ASSIGNED',             c:'#6441a5', d:'Worker assigned' },
  { s:'IN_PROGRESS',          c:'#2563a8', d:'Active remediation' },
  { s:'RESOLVED',             c:'#2d5a3d', d:'Issue fixed with proof' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        .lp{font-family:'Jost',sans-serif;background:linear-gradient(135deg,#fefcf8 0%,#f5f0e8 100%);min-height:100vh;}
        /* Nav */
        .lp-nav{display:flex;justify-content:space-between;align-items:center;padding:18px 48px;background:rgba(254,252,248,0.9);backdrop-filter:blur(10px);border-bottom:1px solid rgba(101,78,51,0.1);position:sticky;top:0;z-index:50;}
        .lp-logo{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:700;color:#2d1f0e;}
        .lp-nav-actions{display:flex;gap:10px;}
        .btn-outline{padding:8px 20px;border-radius:10px;border:1px solid rgba(74,124,89,0.4);background:transparent;color:#2d5a3d;font-family:'Jost',sans-serif;font-size:0.85rem;font-weight:500;cursor:pointer;transition:all 0.2s;}
        .btn-outline:hover{background:rgba(74,124,89,0.08);}
        .btn-primary{padding:8px 20px;border-radius:10px;border:none;background:linear-gradient(135deg,#4a7c59,#2d5a3d);color:#e8d5b0;font-family:'Jost',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(45,90,61,0.3);}
        /* Hero */
        .hero{text-align:center;padding:80px 24px 60px;max-width:800px;margin:0 auto;}
        .hero-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:100px;background:rgba(74,124,89,0.08);border:1px solid rgba(74,124,89,0.2);color:#2d5a3d;font-size:0.78rem;font-weight:600;margin-bottom:20px;}
        .hero-title{font-family:'Cormorant Garamond',serif;font-size:3.4rem;font-weight:700;color:#2d1f0e;line-height:1.15;margin-bottom:16px;}
        .hero-title span{color:#4a7c59;}
        .hero-desc{font-size:1rem;color:#8a7a65;line-height:1.65;margin-bottom:36px;max-width:560px;margin-left:auto;margin-right:auto;}
        .hero-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
        .hero-btn-lg{padding:13px 28px;border-radius:12px;border:none;font-family:'Jost',sans-serif;font-size:0.95rem;font-weight:600;cursor:pointer;transition:all 0.25s;}
        .hero-btn-lg.main{background:linear-gradient(135deg,#4a7c59,#2d5a3d);color:#e8d5b0;}
        .hero-btn-lg.main:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(45,90,61,0.3);}
        .hero-btn-lg.sec{background:rgba(101,78,51,0.06);color:#654e33;border:1px solid rgba(101,78,51,0.2);}
        .hero-btn-lg.sec:hover{background:rgba(101,78,51,0.1);}
        /* Section */
        .section{padding:60px 48px;max-width:1100px;margin:0 auto;}
        .section-head{text-align:center;margin-bottom:40px;}
        .section-title{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:700;color:#2d1f0e;margin-bottom:8px;}
        .section-sub{font-size:0.88rem;color:#8a7a65;}
        /* Feature grid */
        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
        .feat-card{background:#fefcf8;border:1px solid rgba(101,78,51,0.12);border-radius:18px;padding:24px;transition:all 0.25s;}
        .feat-card:hover{box-shadow:0 8px 28px rgba(50,35,15,0.08);transform:translateY(-2px);}
        .feat-icon{font-size:1.8rem;margin-bottom:12px;}
        .feat-title{font-family:'Cormorant Garamond',serif;font-size:1.05rem;font-weight:700;color:#2d1f0e;margin-bottom:6px;}
        .feat-desc{font-size:0.83rem;color:#8a7a65;line-height:1.55;}
        /* Workflow */
        .workflow{background:rgba(101,78,51,0.03);border-radius:20px;padding:36px;border:1px solid rgba(101,78,51,0.1);}
        .workflow-title{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:700;color:#2d1f0e;margin-bottom:24px;text-align:center;}
        .status-list{display:flex;flex-direction:column;gap:10px;}
        .status-row{display:flex;align-items:center;gap:14px;padding:12px 16px;background:#fefcf8;border-radius:12px;border:1px solid rgba(101,78,51,0.1);}
        .status-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
        .status-name{font-weight:600;font-size:0.88rem;color:#2d1f0e;min-width:180px;}
        .status-desc{font-size:0.82rem;color:#8a7a65;}
        .status-arrow{font-size:0.8rem;color:#c8b99a;margin:0 4px;}
        /* CTA */
        .cta-section{background:linear-gradient(135deg,#2d5a3d,#1a3d28);padding:60px 48px;text-align:center;}
        .cta-title{font-family:'Cormorant Garamond',serif;font-size:2.2rem;font-weight:700;color:#e8d5b0;margin-bottom:10px;}
        .cta-sub{font-size:0.9rem;color:rgba(232,213,176,0.7);margin-bottom:30px;}
        .cta-btn{padding:13px 32px;border-radius:12px;border:1px solid rgba(232,213,176,0.4);background:rgba(232,213,176,0.1);color:#e8d5b0;font-family:'Jost',sans-serif;font-size:0.95rem;font-weight:600;cursor:pointer;transition:all 0.25s;}
        .cta-btn:hover{background:rgba(232,213,176,0.2);transform:translateY(-1px);}
        .divider{height:1px;background:linear-gradient(90deg,transparent,rgba(101,78,51,0.12),transparent);margin:0 48px;}
        @media(max-width:900px){.feat-grid{grid-template-columns:repeat(2,1fr);}.hero-title{font-size:2.4rem;}.section{padding:40px 24px;}.lp-nav{padding:14px 24px;}}
        @media(max-width:600px){.feat-grid{grid-template-columns:1fr;}.hero-title{font-size:2rem;}.lp-nav{padding:12px 16px;}}
      `}</style>
      <div className="lp">
        {/* Nav */}
        <nav className="lp-nav">
          <div className="lp-logo">🏛️ CivicConnect</div>
          <div className="lp-nav-actions">
            <button className="btn-outline" onClick={()=>navigate('/login')}>Login</button>
            <button className="btn-primary"  onClick={()=>navigate('/register')}>Register</button>
          </div>
        </nav>

        {/* Hero */}
        <div className="hero">
          <div className="hero-badge">⛓ Blockchain-backed · 🤖 AI-validated · 📷 Tamper-proof</div>
          <h1 className="hero-title">Your City. Your Voice.<br/><span>Report. Track. Resolve.</span></h1>
          <p className="hero-desc">
            CivicConnect lets citizens report public infrastructure issues with AI-verified evidence
            and immutable blockchain records — so every complaint is heard and nothing gets buried.
          </p>
          <div className="hero-actions">
            <button className="hero-btn-lg main" onClick={()=>navigate('/register')}>🏚️ Report an Issue</button>
            <button className="hero-btn-lg sec"  onClick={()=>navigate('/login')}>📊 View Dashboard</button>
          </div>
        </div>

        <div className="divider"/>

        {/* Features */}
        <div className="section">
          <div className="section-head">
            <div className="section-title">Built for Transparency & Trust</div>
            <div className="section-sub">Every feature is designed to make civic reporting tamper-proof and accountable</div>
          </div>
          <div className="feat-grid">
            {FEATURES.map((f,i) => (
              <div key={i} className="feat-card">
                <div className="feat-icon">{f.icon}</div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="divider"/>

        {/* Complaint workflow */}
        <div className="section">
          <div className="section-head">
            <div className="section-title">6-Stage Complaint Workflow</div>
            <div className="section-sub">Every complaint follows a transparent, immutable lifecycle</div>
          </div>
          <div className="workflow">
            <div className="status-list">
              {STATUSES.map((s,i) => (
                <React.Fragment key={s.s}>
                  <div className="status-row">
                    <div className="status-dot" style={{background:s.c}}/>
                    <span className="status-name" style={{color:s.c}}>{s.s}</span>
                    <span className="status-desc">{s.d}</span>
                  </div>
                  {i < STATUSES.length-1 && <div style={{textAlign:'center',color:'#c8b99a',fontSize:'1rem'}}>↓</div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section">
          <div className="cta-title">Make Your City Accountable</div>
          <div className="cta-sub">Join citizens who are using technology to demand action on public issues</div>
          <button className="cta-btn" onClick={()=>navigate('/register')}>Get Started — It's Free →</button>
        </div>
      </div>
    </>
  )
}
