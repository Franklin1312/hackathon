import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/store'

export default function Register() {
  const [f, setF] = useState({ name:'', email:'', password:'' })
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()
  const ch = e => setF(p=>({...p,[e.target.name]:e.target.value}))
  const submit = async e => { e.preventDefault(); const r=await register(f.name,f.email,f.password); if(r.success) navigate('/') }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        .auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:linear-gradient(135deg,#fefcf8 0%,#f5f0e8 60%,#eee8d8 100%);position:relative;overflow:hidden;}
        .auth-orb1{position:absolute;width:300px;height:300px;border-radius:50%;background:rgba(139,105,20,0.06);filter:blur(55px);top:-60px;right:-50px;pointer-events:none;}
        .auth-orb2{position:absolute;width:260px;height:260px;border-radius:50%;background:rgba(74,124,89,0.07);filter:blur(50px);bottom:-60px;left:-40px;pointer-events:none;}
        .auth-card{background:rgba(254,252,248,0.9);backdrop-filter:blur(16px);border:1px solid rgba(101,78,51,0.14);border-radius:24px;padding:44px 40px;width:100%;max-width:420px;position:relative;z-index:1;box-shadow:0 16px 48px rgba(50,35,15,0.09);}
        .auth-icon{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#2d5a3d,#4a7c59);display:flex;align-items:center;justify-content:center;font-size:22px;color:#e8d5b0;margin:0 auto 12px;box-shadow:0 6px 20px rgba(45,90,61,0.25);}
        .auth-title{font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:700;color:#2d1f0e;text-align:center;margin-bottom:4px;}
        .auth-sub{font-size:0.83rem;color:#8a7a65;text-align:center;margin-bottom:28px;font-weight:300;}
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
          <h1 className="auth-title">Join CivicConnect</h1>
          <p className="auth-sub">Create your citizen account</p>
          <form onSubmit={submit}>
            {[{n:'name',l:'Full Name',t:'text',ph:'Your name'},{n:'email',l:'Email',t:'email',ph:'you@example.com'},{n:'password',l:'Password',t:'password',ph:'Min 6 characters'}].map(fd=>(
              <div key={fd.n} className="fl">
                <label>{fd.l}</label>
                <input className="fi" type={fd.t} name={fd.n} placeholder={fd.ph} value={f[fd.n]} onChange={ch} required minLength={fd.n==='password'?6:undefined}/>
              </div>
            ))}
            <button className="submit-btn" type="submit" disabled={loading}>{loading?'Creating…':'Create Account'}</button>
          </form>
          <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </>
  )
}
