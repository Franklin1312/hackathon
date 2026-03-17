import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useIssueStore, useAuthStore } from '../context/store'
import { uploadAfterImageAPI } from '../services/api'
import CommentSection from '../components/CommentSection'
import { STATUS_META } from '../components/IssueCard'

const ICONS = { pothole:'🕳️', garbage:'🗑️', streetlight:'💡', water:'💧', road:'🚧' }
const PCOL  = { high:'#c0392b', medium:'#8b6914', low:'#4a7c59' }

function timeAgo(d) {
  const m = Math.floor((Date.now()-new Date(d))/60000)
  if (m<1) return 'just now'
  if (m<60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h<24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function IssueDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentIssue, fetchIssue, loading, upvote, votedIds, updateIssueStatus } = useIssueStore()
  const { user } = useAuthStore()
  const [statusVal, setStatusVal] = useState('')
  const [workerVal, setWorkerVal] = useState('')
  const [updating, setUpdating]   = useState(false)
  const [afterUploading, setAfterUploading] = useState(false)

  useEffect(() => { fetchIssue(id) }, [id])
  useEffect(() => { if (currentIssue) { setStatusVal(currentIssue.status); setWorkerVal(currentIssue.assignedWorker||'') } }, [currentIssue])

  const doUpdate = async () => {
    setUpdating(true)
    await updateIssueStatus(id, { status: statusVal, assignedWorker: workerVal || undefined })
    setUpdating(false)
  }

  const handleAfterImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAfterUploading(true)
    try {
      const fd = new FormData()
      fd.append('afterImage', file)
      const token = localStorage.getItem('civic_token')
      if (token && token !== 'mock-token') {
        await uploadAfterImageAPI(id, fd)
      }
      // Update local state to show the image immediately
      const url = URL.createObjectURL(file)
      useIssueStore.setState(s => ({
        currentIssue: s.currentIssue ? { ...s.currentIssue, images: { ...s.currentIssue.images, after: url } } : s.currentIssue,
        issues: s.issues.map(iss => iss._id === id ? { ...iss, images: { ...iss.images, after: url } } : iss)
      }))
    } catch (err) {
      console.error('After image upload failed:', err)
    }
    setAfterUploading(false)
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div className="loader"/></div>
  if (!currentIssue) return <div style={{textAlign:'center',padding:'60px',fontFamily:'Jost,sans-serif',color:'#8a7a65'}}>Issue not found</div>

  const i = currentIssue
  const voted = votedIds.has(i._id)
  const sm = STATUS_META[i.status] || STATUS_META.PENDING_VERIFICATION
  const pcolor = PCOL[i.priority] || '#8a7a65'
  const imageUrl = i.images?.before ? (i.images.before.startsWith('http') ? i.images.before : `${API_BASE}${i.images.before}`) : null
  const videoUrl = i.videoUrl ? (i.videoUrl.startsWith('http') ? i.videoUrl : `${API_BASE}${i.videoUrl}`) : null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        .det-page{font-family:'Jost',sans-serif;background:linear-gradient(135deg,#fefcf8,#f5f0e8);min-height:calc(100vh - 62px);padding:32px;}
        .det-inner{max-width:800px;margin:0 auto;}
        .back-btn{display:inline-flex;align-items:center;gap:6px;font-size:0.83rem;color:#8a7a65;cursor:pointer;margin-bottom:20px;border:none;background:none;font-family:'Jost',sans-serif;transition:color 0.2s;padding:0;}
        .back-btn:hover{color:#2d5a3d;}
        .det-card{background:#fefcf8;border:1px solid rgba(101,78,51,0.14);border-radius:22px;padding:28px;box-shadow:0 4px 24px rgba(50,35,15,0.06);margin-bottom:16px;}
        .det-title{font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:700;color:#2d1f0e;margin-bottom:10px;line-height:1.25;}
        .pill{display:inline-flex;align-items:center;padding:3px 10px;border-radius:100px;font-size:0.7rem;font-weight:600;border:1px solid;}
        .pills-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;}
        .det-desc{font-size:0.9rem;color:#5c4a32;line-height:1.65;margin-bottom:20px;}
        .meta-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px;}
        .meta-item{background:rgba(101,78,51,0.04);border:1px solid rgba(101,78,51,0.1);border-radius:12px;padding:12px 14px;}
        .meta-label{font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;color:#8a7a65;font-weight:600;margin-bottom:4px;}
        .meta-value{font-size:0.88rem;color:#2d1f0e;font-weight:500;}
        .divider{height:1px;background:linear-gradient(90deg,transparent,rgba(101,78,51,0.1),transparent);margin:16px 0;}
        .upvote-btn{display:flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:rgba(101,78,51,0.06);border:1px solid rgba(101,78,51,0.15);color:#5c4a32;font-family:'Jost',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.2s;}
        .upvote-btn:hover,.upvote-btn.voted{background:rgba(74,124,89,0.1);border-color:rgba(74,124,89,0.3);color:#2d5a3d;}
        /* AI & Blockchain boxes */
        .ai-block{border-radius:13px;padding:14px 16px;margin-bottom:12px;border:1px solid;}
        .chain-block{background:rgba(37,99,168,0.04);border:1px solid rgba(37,99,168,0.2);border-radius:13px;padding:14px 16px;margin-bottom:12px;}
        .chain-hash{font-family:monospace;font-size:0.75rem;color:#2563a8;word-break:break-all;margin-top:4px;}
        .sec-title{font-family:'Cormorant Garamond',serif;font-size:1.05rem;font-weight:700;color:#2d1f0e;margin-bottom:12px;}
        /* Evidence */
        .ev-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .ev-box{border-radius:12px;overflow:hidden;border:1px solid rgba(101,78,51,0.12);}
        .ev-box img{width:100%;height:160px;object-fit:cover;display:block;}
        .ev-box video{width:100%;height:160px;object-fit:cover;display:block;}
        .ev-label{padding:8px 12px;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#8a7a65;background:rgba(101,78,51,0.04);}
        /* Admin */
        .admin-box{background:rgba(37,99,168,0.04);border:1px solid rgba(37,99,168,0.15);border-radius:14px;padding:18px;}
        .admin-title{font-size:0.73rem;text-transform:uppercase;letter-spacing:0.06em;color:#2563a8;font-weight:600;margin-bottom:12px;}
        .adm-sel,.adm-inp{background:rgba(255,255,255,0.9);border:1px solid rgba(101,78,51,0.2);border-radius:10px;padding:8px 12px;font-family:'Jost',sans-serif;font-size:0.85rem;color:#2d1f0e;outline:none;appearance:none;}
        .adm-sel:focus,.adm-inp:focus{border-color:rgba(74,124,89,0.4);}
        .adm-upd{padding:8px 18px;border-radius:10px;background:linear-gradient(135deg,#4a7c59,#2d5a3d);color:#e8d5b0;border:none;font-family:'Jost',sans-serif;font-size:0.83rem;font-weight:600;cursor:pointer;transition:all 0.2s;}
        .adm-upd:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 12px rgba(45,90,61,0.3);}
        .adm-upd:disabled{opacity:0.6;cursor:not-allowed;}
        .no-del{font-size:0.72rem;color:#c0392b;margin-top:8px;padding:6px 10px;background:rgba(192,57,43,0.05);border-radius:7px;border:1px solid rgba(192,57,43,0.15);}
        @media(max-width:640px){.meta-grid,.ev-grid{grid-template-columns:1fr;}.det-page{padding:16px;}}
      `}</style>

      <div className="det-page">
        <div className="det-inner">
          <button className="back-btn" onClick={()=>navigate(-1)}>← Back</button>

          {/* Main card */}
          <div className="det-card">
            <h1 className="det-title">{ICONS[i.category]} {i.title}</h1>
            <div className="pills-row">
              <span className="pill" style={{background:sm.bg, color:sm.color, borderColor:sm.border}}>{sm.label}</span>
              <span className="pill" style={{background:`${pcolor}18`, color:pcolor, borderColor:`${pcolor}40`}}>▲ {i.priority}</span>
              <span className="pill" style={{background:'rgba(101,78,51,0.07)',color:'#5c4a32',borderColor:'rgba(101,78,51,0.15)'}}>{i.category}</span>
              {i.blockchainTxHash && <span className="pill" style={{background:'rgba(37,99,168,0.08)',color:'#2563a8',borderColor:'rgba(37,99,168,0.2)'}}>⛓ On-chain</span>}
            </div>
            <p className="det-desc">{i.description}</p>

            <div className="meta-grid">
              <div className="meta-item"><div className="meta-label">Reporter</div><div className="meta-value">👤 {i.reporter?.name||'Anonymous'} {i.reporter?.reputationScore>0?`(⭐ ${i.reporter.reputationScore} pts)`:''}</div></div>
              <div className="meta-item"><div className="meta-label">Location</div><div className="meta-value">📍 {i.location?.address||'Unknown'}</div></div>
              <div className="meta-item"><div className="meta-label">Reported</div><div className="meta-value">🕐 {timeAgo(i.createdAt)}</div></div>
              <div className="meta-item"><div className="meta-label">Upvotes</div><div className="meta-value">👍 {i.upvotes} votes</div></div>
              {i.assignedWorker && <div className="meta-item" style={{gridColumn:'1/-1'}}><div className="meta-label">Assigned Worker</div><div className="meta-value">👷 {i.assignedWorker}</div></div>}
            </div>

            <button className={`upvote-btn${voted?' voted':''}`} onClick={()=>upvote(i._id)}>
              👍 {voted?'Voted':'Support this issue'} · {i.upvotes}
            </button>
          </div>

          {/* AI Detection */}
          {i.aiPrediction && (
            <div className="det-card">
              <div className="sec-title">🤖 AI Detection Result</div>
              <div className="ai-block" style={{
                background: i.aiMatchedCategory && i.aiConfidence>=0.6 ? 'rgba(74,124,89,0.05)' : 'rgba(192,57,43,0.05)',
                borderColor: i.aiMatchedCategory && i.aiConfidence>=0.6 ? 'rgba(74,124,89,0.25)' : 'rgba(192,57,43,0.25)',
              }}>
                <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                  <div>
                    <div style={{fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'#8a7a65',fontWeight:600,marginBottom:3}}>Detected Category</div>
                    <div style={{fontSize:'1rem',fontWeight:700,color:i.aiMatchedCategory?'#2d5a3d':'#c0392b'}}>{i.aiPrediction}</div>
                  </div>
                  <div>
                    <div style={{fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'#8a7a65',fontWeight:600,marginBottom:3}}>Confidence</div>
                    <div style={{fontSize:'1rem',fontWeight:700,color:i.aiConfidence>=0.6?'#2d5a3d':'#c0392b'}}>{Math.round(i.aiConfidence*100)}%</div>
                  </div>
                  <div>
                    <div style={{fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'#8a7a65',fontWeight:600,marginBottom:3}}>Validation</div>
                    <div style={{fontSize:'1rem',fontWeight:700,color:i.aiMatchedCategory?'#2d5a3d':'#c0392b'}}>
                      {i.aiMatchedCategory && i.aiConfidence>=0.6 ? '✅ Passed' : '⚠️ Failed'}
                    </div>
                  </div>
                </div>
                <div style={{fontSize:'0.78rem',color:'#8a7a65',marginTop:8}}>
                  {i.aiMatchedCategory && i.aiConfidence>=0.6
                    ? 'AI confirmed the reported category with sufficient confidence.'
                    : 'AI detected a mismatch or low confidence — complaint is flagged SUSPICIOUS pending manual review.'}
                </div>
              </div>
            </div>
          )}

          {/* Blockchain */}
          {i.blockchainTxHash && (
            <div className="det-card">
              <div className="sec-title">⛓ Blockchain Record</div>
              <div className="chain-block">
                <div style={{fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'#2563a8',fontWeight:600,marginBottom:4}}>Transaction Hash</div>
                <div className="chain-hash">{i.blockchainTxHash}</div>
                {i.complaintHash && <>
                  <div style={{fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'#2563a8',fontWeight:600,margin:'10px 0 4px'}}>SHA-256 Complaint Hash</div>
                  <div className="chain-hash">{i.complaintHash}</div>
                </>}
                <div style={{fontSize:'0.75rem',color:'#8a7a65',marginTop:8}}>
                  🔒 This complaint is permanently recorded on the Sepolia blockchain. It cannot be deleted or altered.
                </div>
                {i.blockchainTxHash.startsWith('0x') && !i.blockchainTxHash.includes('mock') && (
                  <a href={`https://sepolia.etherscan.io/tx/${i.blockchainTxHash}`} target="_blank" rel="noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:8,fontSize:'0.78rem',color:'#2563a8',textDecoration:'none',fontWeight:600}}>
                    View on Etherscan ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Evidence */}
          <div className="det-card">
            <div className="sec-title">📸 Evidence</div>
            <div className="ev-grid">
              <div className="ev-box">
                {imageUrl
                  ? <img src={imageUrl} alt="Before"/>
                  : <div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(101,78,51,0.04)',fontSize:'2rem'}}>📷</div>
                }
                <div className="ev-label">Before — Reported</div>
              </div>
              <div className="ev-box">
                {videoUrl
                  ? <video src={videoUrl} controls/>
                  : <div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(101,78,51,0.04)',fontSize:'2rem'}}>🎥</div>
                }
                <div className="ev-label">Video Evidence</div>
              </div>
            </div>
            {i.images?.after && (
              <div className="ev-box" style={{marginTop:10}}>
                <img src={i.images.after.startsWith('http')?i.images.after:`${API_BASE}${i.images.after}`} alt="After"/>
                <div className="ev-label" style={{color:'#2d5a3d'}}>✅ After — Resolved</div>
              </div>
            )}
          </div>

          {/* Admin controls */}
          {user?.role==='admin' && (
            <div className="det-card">
            <div className="admin-box">
                <div className="admin-title">🛠 Admin Controls — No Delete Policy</div>
                <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                  <select className="adm-sel" value={statusVal} onChange={e=>setStatusVal(e.target.value)}>
                    <option value="SUSPICIOUS">⚠️ Suspicious</option>
                    <option value="PENDING_VERIFICATION">🔍 Pending Verification</option>
                    <option value="VERIFIED">✅ Verified (→ Blockchain)</option>
                    <option value="ASSIGNED">👷 Assigned</option>
                    <option value="IN_PROGRESS">🔧 In Progress</option>
                    <option value="RESOLVED">✅ Resolved</option>
                  </select>
                  <input className="adm-inp" placeholder="Assign worker…" value={workerVal} onChange={e=>setWorkerVal(e.target.value)} style={{width:160}}/>
                  <button className="adm-upd" onClick={doUpdate} disabled={updating}>{updating?'Saving…':'Update'}</button>
                </div>
                <div style={{marginTop:14}}>
                  <div style={{fontSize:'0.73rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'#2563a8',fontWeight:600,marginBottom:6}}>📸 Upload After Image (Proof of Resolution)</div>
                  <label style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:10,background:'rgba(74,124,89,0.08)',border:'1px solid rgba(74,124,89,0.25)',color:'#2d5a3d',fontFamily:'Jost,sans-serif',fontSize:'0.83rem',fontWeight:600,cursor:'pointer',transition:'all 0.2s'}}>
                    {afterUploading ? '⏳ Uploading…' : '📷 Choose After Photo'}
                    <input type="file" accept="image/*" onChange={handleAfterImage} disabled={afterUploading} style={{display:'none'}}/>
                  </label>
                  {i.images?.after && <span style={{marginLeft:10,fontSize:'0.78rem',color:'#4a7c59'}}>✅ After image attached</span>}
                </div>
                <div className="no-del">🚫 Admins cannot delete complaints. All status changes are recorded on-chain.</div>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="det-card">
            <CommentSection issueId={i._id} comments={i.comments||[]}/>
          </div>
        </div>
      </div>
    </>
  )
}
