import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useIssueStore } from '../context/store'

const ICONS   = { pothole:'🕳️', garbage:'🗑️', streetlight:'💡', water:'💧', road:'🚧' }
const PCOLORS = { high:'#c0392b', medium:'#8b6914', low:'#4a7c59' }

export const STATUS_META = {
  SUSPICIOUS:            { label:'Suspicious',           bg:'rgba(192,57,43,0.1)',  color:'#c0392b',  border:'rgba(192,57,43,0.3)'  },
  PENDING_VERIFICATION:  { label:'Pending Verification', bg:'rgba(139,105,20,0.1)', color:'#8b6914',  border:'rgba(139,105,20,0.3)' },
  VERIFIED:              { label:'Verified',             bg:'rgba(37,99,168,0.1)',  color:'#2563a8',  border:'rgba(37,99,168,0.3)'  },
  ASSIGNED:              { label:'Assigned',             bg:'rgba(100,65,165,0.1)', color:'#6441a5',  border:'rgba(100,65,165,0.3)' },
  IN_PROGRESS:           { label:'In Progress',          bg:'rgba(37,99,168,0.1)',  color:'#2563a8',  border:'rgba(37,99,168,0.3)'  },
  RESOLVED:              { label:'Resolved',             bg:'rgba(74,124,89,0.1)',  color:'#2d5a3d',  border:'rgba(74,124,89,0.3)'  },
  // Legacy lowercase (fallback)
  pending:     { label:'Pending',     bg:'rgba(139,105,20,0.1)', color:'#8b6914', border:'rgba(139,105,20,0.3)' },
  'in-progress':{ label:'In Progress',bg:'rgba(37,99,168,0.1)',  color:'#2563a8', border:'rgba(37,99,168,0.3)'  },
  resolved:    { label:'Resolved',    bg:'rgba(74,124,89,0.1)',  color:'#2d5a3d', border:'rgba(74,124,89,0.3)'  },
}

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function IssueCard({ issue, compact = false }) {
  const navigate = useNavigate()
  const { upvote, votedIds } = useIssueStore()
  const voted  = votedIds.has(issue._id)
  const sm     = STATUS_META[issue.status] || STATUS_META.PENDING_VERIFICATION
  const pcolor = PCOLORS[issue.priority] || '#8a7a65'

  return (
    <>
      <style>{`
        .icard{background:#fefcf8;border:1px solid rgba(101,78,51,0.12);border-radius:18px;padding:20px 22px;cursor:pointer;transition:all 0.25s;position:relative;overflow:hidden;}
        .icard:hover{box-shadow:0 8px 28px rgba(50,35,15,0.09);transform:translateY(-2px);}
        .icard-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px;}
        .icard-cat{display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#8a7a65;font-weight:500;text-transform:capitalize;}
        .icard-cat-icon{font-size:1rem;}
        .icard-badges{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}
        .badge{padding:3px 9px;border-radius:100px;font-size:0.69rem;font-weight:600;border:1px solid;white-space:nowrap;}
        .icard-title{font-family:'Cormorant Garamond',serif;font-size:1.08rem;font-weight:700;color:#2d1f0e;margin-bottom:6px;line-height:1.3;}
        .icard-desc{font-size:0.82rem;color:#8a7a65;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .icard-meta{display:flex;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap;gap:6px;}
        .icard-reporter{font-size:0.75rem;color:#a89880;}
        .icard-actions{display:flex;gap:8px;align-items:center;}
        .vote-btn{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:100px;border:1px solid rgba(101,78,51,0.2);background:transparent;font-family:'Jost',sans-serif;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.2s;color:#654e33;}
        .vote-btn:hover,.vote-btn.voted{background:rgba(74,124,89,0.1);border-color:rgba(74,124,89,0.35);color:#2d5a3d;}
        .chain-badge{font-size:0.65rem;padding:2px 7px;border-radius:100px;background:rgba(37,99,168,0.08);color:#2563a8;border:1px solid rgba(37,99,168,0.2);font-weight:600;}
        .ai-badge{font-size:0.65rem;padding:2px 7px;border-radius:100px;background:rgba(74,124,89,0.08);color:#2d5a3d;border:1px solid rgba(74,124,89,0.2);font-weight:600;}
      `}</style>
      <div className="icard" onClick={() => navigate(`/issues/${issue._id}`)}>
        <div className="icard-top">
          <div className="icard-cat">
            <span className="icard-cat-icon">{ICONS[issue.category] || '📋'}</span>
            <span>{issue.category}</span>
          </div>
          <div className="icard-badges">
            <span className="badge" style={{background:sm.bg, color:sm.color, borderColor:sm.border}}>{sm.label}</span>
            <span className="badge" style={{background:`${pcolor}18`, color:pcolor, borderColor:`${pcolor}40`}}>{issue.priority}</span>
          </div>
        </div>

        <div className="icard-title">{issue.title}</div>
        {!compact && <div className="icard-desc">{issue.description}</div>}

        <div className="icard-meta">
          <span className="icard-reporter">
            👤 {issue.reporter?.name || 'Anonymous'} · {timeAgo(issue.createdAt)}
          </span>
          <div className="icard-actions">
            {issue.blockchainTxHash && <span className="chain-badge">⛓ On-chain</span>}
            {issue.aiPrediction    && <span className="ai-badge">🤖 {Math.round(issue.aiConfidence * 100)}%</span>}
            <button
              className={`vote-btn${voted ? ' voted' : ''}`}
              onClick={e => { e.stopPropagation(); upvote(issue._id) }}
            >
              ▲ {issue.upvotes}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
