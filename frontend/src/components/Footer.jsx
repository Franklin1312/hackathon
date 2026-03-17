import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500&display=swap');
        .cc-footer{font-family:'Jost',sans-serif;background:#1e2a1f;color:#c8b99a;padding:56px 0 0;position:relative;overflow:hidden;}
        .cc-footer::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#4a7c59,#8b6914,#4a7c59);}
        .cc-ftex{position:absolute;inset:0;background-image:radial-gradient(circle at 20% 50%,rgba(74,124,89,0.06) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(139,105,20,0.06) 0%,transparent 40%);pointer-events:none;}
        .cc-finner{max-width:1200px;margin:0 auto;padding:0 2rem;position:relative;}
        .cc-fgrid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:3.5rem;padding-bottom:48px;border-bottom:1px solid rgba(200,185,154,0.1);}
        .cc-flogo{display:flex;align-items:center;gap:10px;text-decoration:none;margin-bottom:1rem;}
        .cc-flogo-icon{width:36px;height:36px;background:linear-gradient(135deg,#4a7c59,#2d5a3d);border-radius:9px;display:flex;align-items:center;justify-content:center;color:#e8d5b0;font-size:15px;}
        .cc-fname{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:700;color:#e8d5b0;}
        .cc-ftagline{font-size:0.85rem;color:#8a7a65;line-height:1.7;font-weight:300;}
        .cc-fhead{font-family:'Cormorant Garamond',serif;font-size:1.05rem;font-weight:600;color:#e8d5b0;margin-bottom:1rem;padding-bottom:0.6rem;border-bottom:1px solid rgba(200,185,154,0.12);letter-spacing:0.04em;}
        .cc-flinks{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:9px;}
        .cc-flink{text-decoration:none;color:#8a7a65;font-size:0.85rem;font-weight:300;transition:color 0.2s,padding-left 0.2s;display:block;}
        .cc-flink:hover{color:#c8b99a;padding-left:4px;}
        .cc-fbot{padding:24px 0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
        .cc-fcopy{font-size:0.78rem;color:#5a4f42;font-weight:300;}
        .cc-fcopy span{color:#7db894;}
        @media(max-width:768px){.cc-fgrid{grid-template-columns:1fr;gap:2rem;}}
      `}</style>
      <footer className="cc-footer">
        <div className="cc-ftex" />
        <div className="cc-finner">
          <div className="cc-fgrid">
            <div>
              <Link to="/" className="cc-flogo">
                <div className="cc-flogo-icon">🏛️</div>
                <span className="cc-fname">CivicConnect</span>
              </Link>
              <p className="cc-ftagline">
                Empowering citizens to report, track, and resolve civic issues in their communities. Together we build a better city.
              </p>
            </div>
            <div>
              <h3 className="cc-fhead">Navigate</h3>
              <ul className="cc-flinks">
                {[['Dashboard','/'],['Map View','/map'],['Report Issue','/report']].map(([l,p]) => (
                  <li key={p}><Link to={p} className="cc-flink">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="cc-fhead">Categories</h3>
              <ul className="cc-flinks">
                {['Potholes','Garbage','Streetlights','Water Leakage','Road Damage'].map(c => (
                  <li key={c}><span className="cc-flink" style={{cursor:'default'}}>🔸 {c}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="cc-fbot">
            <p className="cc-fcopy">© {new Date().getFullYear()} CivicConnect. Built for better cities. <span>♥</span></p>
            <p className="cc-fcopy" style={{color:'#3d5c45'}}>Making civic reporting smarter.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
