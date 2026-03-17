import React from 'react'

export function IssueCardSkeleton() {
  return (
    <div style={{ background:'#fefcf8', border:'1px solid rgba(101,78,51,0.1)', borderRadius:'18px', padding:'18px 20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
        <div className="shimmer" style={{ width:'55%', height:'18px', borderRadius:'8px' }} />
        <div className="shimmer" style={{ width:'70px', height:'20px', borderRadius:'100px' }} />
      </div>
      <div className="shimmer" style={{ width:'90%', height:'12px', borderRadius:'6px', marginBottom:'6px' }} />
      <div className="shimmer" style={{ width:'75%', height:'12px', borderRadius:'6px', marginBottom:'12px' }} />
      <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
        <div className="shimmer" style={{ width:'60px', height:'20px', borderRadius:'100px' }} />
        <div className="shimmer" style={{ width:'80px', height:'20px', borderRadius:'100px' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'10px', borderTop:'1px solid rgba(101,78,51,0.08)' }}>
        <div className="shimmer" style={{ width:'130px', height:'12px', borderRadius:'6px' }} />
        <div className="shimmer" style={{ width:'48px', height:'26px', borderRadius:'9px' }} />
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div style={{ background:'#fefcf8', border:'1px solid rgba(101,78,51,0.1)', borderRadius:'18px', padding:'20px 22px' }}>
      <div className="shimmer" style={{ width:'50px', height:'32px', borderRadius:'8px', marginBottom:'8px' }} />
      <div className="shimmer" style={{ width:'80px', height:'11px', borderRadius:'6px', marginBottom:'10px' }} />
      <div className="shimmer" style={{ width:'60px', height:'18px', borderRadius:'100px' }} />
    </div>
  )
}
