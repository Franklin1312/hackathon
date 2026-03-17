import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/store'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pwd,   setPwd]   = useState('')
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()

  const submit = async e => {
    e.preventDefault()
    const r = await login(email, pwd)
    if (r.success) navigate(r.role==='admin' ? '/admin' : '/')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap');
        .auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:linear-gradient(135deg,#fefcf8 0%,#f5f0e8 60%,#eee8d8 100%);position:relative;overflow:hidden;}
        .auth-orb1{position:absolute;width:320px;height:320px;border-radius:50%;background:rgba(74,124,89,0.07);filter:blur(60px);top:-80px;right:-60px;pointer-events:none;}
        .auth-orb2{position:absolute;width:260px;height:260px;border-radius:50%;background:rgba(139,105,20,0.06);filter:blur(50px);bottom:-60px;left:-40px;pointer-events:none;}
        .auth-card{background:rgba(254,252,248,0.9);backdrop-filter:blur(16px);border:1px solid rgba(101,78,51,0.14);border-radius:24px;padding:44px 40px;width:100%;max-width:420px;position:relative;z-index:1;box-shadow:0 16px 48px rgba(50,35,15,0.09);}
        .auth-icon{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#4a7c59,#2d5a3d);display:flex;align-items:center;justify-content:center;font-size:22px;color:#e8d5b0;margin:0 auto 12px;box-shadow:0 6px 20px rgba(45,90,61,0.25);}
        .auth-title{font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:700;color:#2d1f0e;text-align:center;margin-bottom:4px;}
        .auth-sub{font-size:0.83rem;color:#8a7a65;text-align:center;margin-bottom:28px;font-weight:300;}
        .hint-box{background:rgba(74,124,89,0.06);border:1px solid rgba(74,124,89,0.18);border-radius:12px;padding:12px 14px;margin-bottom:22px;}
        .hint-box b{display:block;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;color:#4a7c59;font-weight:600;margin-bottom:6px;}
        .hint-row{display:flex;gap:8px;}
        .hint-btn{flex:1;padding:6px 10px;border-radius:9px;font-family:'Jost',sans-serif;font-size:0.78rem;font-weight:500;cursor:pointer;border:none;transition:all 0.2s;}
        .hint-btn.green{background:rgba(74,124,89,0.12);color:#2d5a3d;border:1px solid rgba(74,124,89,0.22);}
        .hint-btn.green:hover{background:rgba(74,124,89,0.2);}
        .hint-btn.blue{background:rgba(37,99,168,0.1);color:#2563a8;border:1px solid rgba(37,99,168,0.2);}
        .hint-btn.blue:hover{background:rgba(37,99,168,0.16);}
        .fl{margin-bottom:16px;}
        .fl label{display:block;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;color:#8a7a65;font-weight:600;margin-bottom:6px;}
        .fi{width:100%;background:rgba(255,255,255,0.8);border:1px solid rgba(101,78,51,0.18);border-radius:11px;padding:10px 14px;font-family:'Jost',sans-serif;font-size:0.9rem;color:#2d1f0e;outline:none;transition:all 0.2s;}
        .fi:focus{border-color:rgba(74,124,89,0.45);background:white;box-shadow:0 0 0 3px rgba(74,124,89,0.08);}
        .fi::placeholder{color:#c8b99a;}
        .submit-btn{width:100%;padding:12px;background:linear-gradient(135deg,#4a7c59,#2d5a3d);color:#e8d5b0;border:none;border-radius:12px;font-family:'Jost',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.25s;margin-top:6px;position:relative;overflow:hidden;}
        .submit-btn::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,0.1);transform:translateX(-100%) skewX(-10deg);transition:transform 0.4s;}
        .submit-btn:hover::after{transform:translateX(110%) skewX(-10deg);}
        .submit-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(45,90,61,0.3);}
        .submit-btn:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
        .auth-switch{text-align:center;margin-top:18px;font-size:0.83rem;color:#8a7a65;}
        .auth-switch a{color:#4a7c59;font-weight:500;text-decoration:none;}
        .auth-switch a:hover{text-decoration:underline;}
      `}</style>
      <div className="auth-wrap">
        <div className="auth-orb1"/><div className="auth-orb2"/>
        <div className="auth-card">
          <div className="auth-icon">🏛️</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-sub">Sign in to CivicConnect</p>
          <div className="hint-box">
            <b>Demo Credentials</b>
            <div className="hint-row">
              <button className="hint-btn blue" onClick={()=>{setEmail('admin@civic.com');setPwd('admin123')}}>Fill Admin</button>
              <button className="hint-btn green" onClick={()=>{setEmail('user@civic.com');setPwd('user123')}}>Fill Citizen</button>
            </div>
          </div>
          <form onSubmit={submit}>
            <div className="fl"><label>Email</label><input className="fi" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
            <div className="fl"><label>Password</label><input className="fi" type="password" placeholder="••••••••" value={pwd} onChange={e=>setPwd(e.target.value)} required/></div>
            <button className="submit-btn" type="submit" disabled={loading}>{loading?'Signing in…':'Sign In'}</button>
          </form>
          <p className="auth-switch">No account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </>
  )
}
