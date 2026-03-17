import React, { useState } from 'react'
import { useIssueStore } from '../context/store'

function timeAgo(d) {
  const m = Math.floor((Date.now()-new Date(d))/60000)
  if(m<1) return 'just now'; if(m<60) return `${m}m ago`
  const h=Math.floor(m/60); if(h<24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function CommentSection({ issueId, comments=[] }) {
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const { addComment } = useIssueStore()

  const post = async () => {
    if (!text.trim()) return
    setPosting(true)
    const ok = await addComment(issueId, text.trim())
    if (ok) setText('')
    setPosting(false)
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
        <span style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1.05rem', fontWeight:700, color:'#2d1f0e' }}>
          Comments
        </span>
        <span style={{ background:'rgba(74,124,89,0.1)', color:'#2d5a3d', border:'1px solid rgba(74,124,89,0.2)', borderRadius:'100px', padding:'2px 9px', fontSize:'0.72rem', fontWeight:600 }}>
          {comments.length}
        </span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'14px' }}>
        {comments.length === 0 && (
          <div style={{ textAlign:'center', color:'#8a7a65', fontSize:'0.83rem', padding:'20px', background:'rgba(101,78,51,0.03)', borderRadius:'12px', border:'1px dashed rgba(101,78,51,0.12)' }}>
            No comments yet — be the first to add context.
          </div>
        )}
        {comments.map((c,i) => (
          <div key={c._id||i} style={{ background:'rgba(101,78,51,0.03)', border:'1px solid rgba(101,78,51,0.09)', borderRadius:'12px', padding:'11px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
              <div style={{ width:'24px', height:'24px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, color:'#e8d5b0', background: c.author?.role==='admin' ? 'linear-gradient(135deg,#4a7c59,#2d5a3d)' : 'linear-gradient(135deg,hsl(120,40%,38%),hsl(120,36%,26%))' }}>
                {(c.author?.name||'U')[0].toUpperCase()}
              </div>
              <span style={{ fontSize:'0.83rem', fontWeight:600, color:'#2d1f0e' }}>{c.author?.name||'User'}</span>
              {c.author?.role==='admin' && (
                <span style={{ fontSize:'0.65rem', background:'rgba(74,124,89,0.1)', color:'#2d5a3d', border:'1px solid rgba(74,124,89,0.2)', borderRadius:'100px', padding:'1px 7px', fontWeight:600 }}>Admin</span>
              )}
              <span style={{ marginLeft:'auto', fontSize:'0.7rem', color:'#8a7a65' }}>{timeAgo(c.createdAt)}</span>
            </div>
            <p style={{ fontSize:'0.83rem', color:'#5c4a32', lineHeight:1.55, margin:0 }}>{c.text}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:'8px' }}>
        <input
          value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&post()}
          placeholder="Add a comment…"
          style={{ flex:1, background:'rgba(255,255,255,0.8)', border:'1px solid rgba(101,78,51,0.18)', borderRadius:'11px', padding:'9px 14px', fontFamily:'Jost,sans-serif', fontSize:'0.85rem', color:'#2d1f0e', outline:'none' }}
        />
        <button onClick={post} disabled={posting}
          style={{ padding:'9px 16px', borderRadius:'11px', background:'linear-gradient(135deg,#4a7c59,#2d5a3d)', color:'#e8d5b0', border:'none', fontFamily:'Jost,sans-serif', fontSize:'0.83rem', fontWeight:600, cursor:'pointer', opacity:posting?0.6:1 }}>
          {posting ? '…' : 'Post'}
        </button>
      </div>
    </div>
  )
}
