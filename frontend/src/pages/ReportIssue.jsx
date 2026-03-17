import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIssueStore } from '../context/store'
import toast from 'react-hot-toast'

const CATS = [
  {v:'pothole',     l:'🕳️ Pothole'},
  {v:'garbage',     l:'🗑️ Garbage / Waste'},
  {v:'streetlight', l:'💡 Streetlight'},
  {v:'water',       l:'💧 Water Leakage'},
  {v:'road',        l:'🚧 Road Damage'}
]
const PRIORITY_MAP = {pothole:'high',road:'high',garbage:'medium',water:'medium',streetlight:'low'}

/* ── Watermark helper ─────────────────────────────────────────────────────── */
function applyWatermark(imgDataUrl, lat, lng) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const now = new Date()
      const pad = n => String(n).padStart(2,'0')
      const dateStr = `${pad(now.getDate())}-${pad(now.getMonth()+1)}-${now.getFullYear()}`
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`
      const lines = [
        `Captured: ${dateStr} ${timeStr}`,
        `Lat: ${lat.toFixed(6)}`,
        `Lng: ${lng.toFixed(6)}`,
        `CivicConnect`
      ]
      const fontSize = Math.max(14, Math.round(img.width * 0.022))
      const padding  = 10
      const lineH    = fontSize + 4
      const boxW     = 220
      const boxH     = lines.length * lineH + padding * 2
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.beginPath()
      ctx.roundRect(padding, img.height - boxH - padding, boxW, boxH, 8)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font      = `bold ${fontSize}px monospace`
      lines.forEach((line, i) => {
        ctx.fillText(line, padding * 2, img.height - boxH - padding + padding + lineH * (i + 1) - 2)
      })
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.src = imgDataUrl
  })
}

function dataURLtoFile(dataUrl, filename) {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const binary = atob(data)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return new File([arr], filename, { type: mime })
}

export default function ReportIssue() {
  const navigate  = useNavigate()
  const { createIssue, submitting } = useIssueStore()

  // ── Refs ─────────────────────────────────────────────────────────────────
  const videoRef    = useRef(null)   // always in DOM — just hidden/shown
  const streamRef   = useRef(null)
  const mediaRecRef = useRef(null)
  const chunksRef   = useRef([])
  const canvasRef   = useRef(null)
  const recTimerRef = useRef(null)

  // ── State ─────────────────────────────────────────────────────────────────
  const [form, setForm]             = useState({ title:'', category:'', priority:'auto', description:'' })
  const [location, setLocation]     = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [camOpen, setCamOpen]       = useState(false)
  const [snapshot, setSnapshot]     = useState(null)
  const [snapshotFile, setSnapshotFile] = useState(null)
  const [recording, setRecording]   = useState(false)
  const [videoBlob, setVideoBlob]   = useState(null)
  const [videoURL, setVideoURL]     = useState(null)
  const [recSeconds, setRecSeconds] = useState(0)
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiResult, setAiResult]     = useState(null)

  const ch = e => setForm(p => ({...p, [e.target.name]: e.target.value}))

  /* ── GPS ──────────────────────────────────────────────────────────────────*/
  const getGPS = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: 'GPS Location' })
        toast.success('📍 Location captured')
        setLocLoading(false)
      },
      () => { toast.error('Could not get location — using default'); setLocLoading(false) }
    )
  }

  /* ── Camera ───────────────────────────────────────────────────────────────
     KEY FIX: setCamOpen(true) FIRST so React renders the <video> element,
     then assign srcObject in a setTimeout so the ref is guaranteed to exist.
  ──────────────────────────────────────────────────────────────────────────*/
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      })
      streamRef.current = stream

      // Show camera UI first — this makes React render the <video> element
      setCamOpen(true)
      if (!location) getGPS()

      // Then assign stream in next tick (after React re-renders with video visible)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      }, 50)

    } catch (e) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        toast.error('📷 Camera permission denied. Allow camera access in browser settings.')
      } else if (e.name === 'NotFoundError') {
        toast.error('📷 No camera found on this device.')
      } else if (e.name === 'NotReadableError') {
        toast.error('📷 Camera is already in use by another app.')
      } else {
        toast.error('📷 Camera error: ' + e.message)
      }
    }
  }

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setCamOpen(false)
  }

  /* ── Snapshot + watermark ─────────────────────────────────────────────────*/
  const takeSnapshot = async () => {
    const canvas = canvasRef.current
    const video  = videoRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0)
    const raw = canvas.toDataURL('image/jpeg', 0.9)
    const lat = location?.lat ?? 28.6139
    const lng = location?.lng ?? 77.2090
    const watermarked = await applyWatermark(raw, lat, lng)
    setSnapshot(watermarked)
    setSnapshotFile(dataURLtoFile(watermarked, `civic-photo-${Date.now()}.jpg`))
    toast.success('📸 Photo captured with watermark')

    // Mock AI preview
    setAiLoading(true)
    setAiResult(null)
    setTimeout(() => {
      const cats = ['pothole','garbage','streetlight','water','road']
      const detected = cats[Math.floor(Math.random() * cats.length)]
      const conf     = parseFloat((0.70 + Math.random() * 0.25).toFixed(2))
      const matched  = form.category ? detected === form.category : true
      setAiResult({ detectedIssue: detected, confidence: conf, matched })
      if (!form.category) setForm(p => ({ ...p, category: detected, priority: PRIORITY_MAP[detected] || 'medium' }))
      toast.success(`🤖 AI detected: ${detected} (${Math.round(conf * 100)}%)`)
      setAiLoading(false)
    }, 1800)
  }

  /* ── Video recording ──────────────────────────────────────────────────────*/
  const startRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    const mr = new MediaRecorder(streamRef.current)
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setVideoBlob(blob)
      setVideoURL(URL.createObjectURL(blob))
      toast.success('🎥 Video clip saved')
    }
    mr.start()
    mediaRecRef.current = mr
    setRecording(true)
    setRecSeconds(0)
    recTimerRef.current = setInterval(() => {
      setRecSeconds(s => {
        if (s >= 5) { stopRecording(); return s }
        return s + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    clearInterval(recTimerRef.current)
    if (mediaRecRef.current?.state !== 'inactive') mediaRecRef.current?.stop()
    setRecording(false)
  }

  /* ── Submit ───────────────────────────────────────────────────────────────*/
  const submit = async e => {
    e.preventDefault()
    if (!form.title || !form.category || !form.description) { toast.error('Please fill all required fields'); return }
    if (!snapshotFile) { toast.error('📸 Please capture a photo first'); return }
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.append('image', snapshotFile)
    if (videoBlob) fd.append('video', new File([videoBlob], `civic-video-${Date.now()}.webm`, { type: 'video/webm' }))
    const lat = location?.lat ?? 28.6139
    const lng = location?.lng ?? 77.2090
    fd.append('lat', lat)
    fd.append('lng', lng)
    fd.append('address', location?.address || 'New Delhi, India')
    const r = await createIssue(fd)
    if (r.success) navigate('/')
  }

  const aiColor = aiResult ? (aiResult.confidence < 0.6 || !aiResult.matched ? '#c0392b' : '#2d5a3d') : '#8a7a65'
  const aiIcon  = aiResult ? (aiResult.confidence < 0.6 || !aiResult.matched ? '⚠️' : '✅') : '🤖'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        .rpt-page{font-family:'Jost',sans-serif;background:linear-gradient(135deg,#fefcf8 0%,#f5f0e8 100%);min-height:calc(100vh - 62px);padding:32px;}
        .rpt-inner{max-width:760px;margin:0 auto;}
        .rpt-title{font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:700;color:#2d1f0e;margin-bottom:4px;}
        .rpt-sub{font-size:0.85rem;color:#8a7a65;margin-bottom:28px;}
        .rpt-card{background:#fefcf8;border:1px solid rgba(101,78,51,0.14);border-radius:22px;padding:32px;box-shadow:0 4px 24px rgba(50,35,15,0.06);}
        .section-label{font-family:'Cormorant Garamond',serif;font-size:1.05rem;font-weight:700;color:#2d1f0e;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid rgba(101,78,51,0.1);}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px;}
        .form-full{margin-bottom:18px;}
        .fl label{display:block;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:#8a7a65;font-weight:600;margin-bottom:7px;}
        .fi,.fsel,.fta{width:100%;background:rgba(255,255,255,0.8);border:1px solid rgba(101,78,51,0.18);border-radius:11px;padding:10px 14px;font-family:'Jost',sans-serif;font-size:0.88rem;color:#2d1f0e;outline:none;transition:all 0.2s;box-sizing:border-box;}
        .fi:focus,.fsel:focus,.fta:focus{border-color:rgba(74,124,89,0.45);background:white;box-shadow:0 0 0 3px rgba(74,124,89,0.08);}
        .fta{resize:vertical;min-height:100px;}
        .fsel{appearance:none;}
        .divider{height:1px;background:linear-gradient(90deg,transparent,rgba(101,78,51,0.1),transparent);margin:22px 0;}
        .cam-zone{background:#0a0a0a;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:4/3;max-height:340px;}
        .cam-zone video{width:100%;height:100%;object-fit:cover;display:block;}
        .cam-controls{display:flex;gap:10px;margin-top:10px;align-items:center;flex-wrap:wrap;}
        .cam-btn{padding:9px 16px;border-radius:10px;border:none;font-family:'Jost',sans-serif;font-size:0.83rem;font-weight:600;cursor:pointer;transition:all 0.2s;}
        .cam-btn.primary{background:linear-gradient(135deg,#4a7c59,#2d5a3d);color:#e8d5b0;}
        .cam-btn.primary:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(45,90,61,0.3);}
        .cam-btn.danger{background:rgba(192,57,43,0.1);color:#c0392b;border:1px solid rgba(192,57,43,0.3);}
        .cam-btn.danger:hover{background:rgba(192,57,43,0.18);}
        .cam-btn.neutral{background:rgba(101,78,51,0.08);color:#654e33;border:1px solid rgba(101,78,51,0.2);}
        .cam-btn.neutral:hover{background:rgba(101,78,51,0.14);}
        .cam-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
        .cam-btn.rec{background:rgba(192,57,43,0.9);color:white;animation:recPulse 1s infinite;}
        @keyframes recPulse{0%,100%{opacity:1}50%{opacity:0.7}}
        .open-cam-btn{width:100%;padding:20px;border:2px dashed rgba(74,124,89,0.4);border-radius:16px;background:rgba(74,124,89,0.04);color:#2d5a3d;font-family:'Jost',sans-serif;font-size:0.9rem;font-weight:500;cursor:pointer;transition:all 0.25s;display:flex;align-items:center;justify-content:center;gap:10px;}
        .open-cam-btn:hover{background:rgba(74,124,89,0.08);border-color:rgba(74,124,89,0.6);}
        .snapshot-preview img{width:100%;display:block;border-radius:12px;}
        .video-preview{margin-top:10px;}
        .video-preview video{width:100%;border-radius:12px;max-height:180px;}
        .ai-box{border-radius:11px;padding:11px 14px;margin-top:10px;display:flex;align-items:flex-start;gap:10px;border:1px solid;transition:all 0.3s;}
        .ai-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px;}
        @keyframes aiPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:0.6}}
        .loc-row{display:flex;gap:10px;align-items:stretch;}
        .loc-display{flex:1;background:rgba(74,124,89,0.06);border:1px solid rgba(74,124,89,0.2);border-radius:11px;padding:10px 14px;font-size:0.83rem;color:#2d5a3d;}
        .gps-btn{padding:10px 16px;border-radius:11px;background:rgba(74,124,89,0.1);border:1px solid rgba(74,124,89,0.25);color:#2d5a3d;font-family:'Jost',sans-serif;font-size:0.83rem;font-weight:500;cursor:pointer;white-space:nowrap;transition:all 0.2s;}
        .gps-btn:hover{background:rgba(74,124,89,0.16);}
        .gps-btn:disabled{opacity:0.5;cursor:not-allowed;}
        .sub-btn{width:100%;padding:13px;background:linear-gradient(135deg,#4a7c59,#2d5a3d);color:#e8d5b0;border:none;border-radius:12px;font-family:'Jost',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.25s;}
        .sub-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(45,90,61,0.3);}
        .sub-btn:disabled{opacity:0.6;cursor:not-allowed;}
        .info-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:100px;font-size:0.73rem;font-weight:600;background:rgba(74,124,89,0.1);color:#2d5a3d;border:1px solid rgba(74,124,89,0.2);margin-bottom:10px;}
        @media(max-width:640px){.form-row{grid-template-columns:1fr;}.rpt-page{padding:16px;}}
      `}</style>

      {/* Hidden canvas for snapshot — always in DOM */}
      <canvas ref={canvasRef} style={{display:'none'}}/>

      {/*
        KEY FIX: <video> is ALWAYS rendered in the DOM (never conditionally removed).
        When camOpen=false it is hidden via display:none.
        This ensures videoRef.current is never null when openCamera() runs.
      */}
      <video
        ref={videoRef}
        muted
        playsInline
        style={{ display: 'none', position: 'absolute', pointerEvents: 'none' }}
      />

      <div className="rpt-page">
        <div className="rpt-inner">
          <h1 className="rpt-title">Report a Civic Issue 🏚️</h1>
          <p className="rpt-sub">Help keep your city safe. Use the live camera to capture secure evidence.</p>

          <div className="rpt-card">
            <form onSubmit={submit}>

              {/* Camera Section */}
              <div className="form-full">
                <div className="section-label">📷 Secure Evidence Capture</div>
                <div className="info-badge">🔒 Live camera only — gallery uploads disabled</div>

                {/* Camera is CLOSED — show open button + previews */}
                {!camOpen && (
                  <div>
                    <button type="button" className="open-cam-btn" onClick={openCamera}>
                      <span style={{fontSize:'1.4rem'}}>📷</span>
                      <span>Open Live Camera</span>
                    </button>
                    {snapshot && (
                      <div className="snapshot-preview" style={{marginTop:12}}>
                        <img src={snapshot} alt="Captured"/>
                        <div style={{fontSize:'0.75rem',color:'#4a7c59',marginTop:4}}>✅ Watermarked photo attached</div>
                      </div>
                    )}
                    {videoURL && (
                      <div className="video-preview">
                        <video src={videoURL} controls/>
                        <div style={{fontSize:'0.75rem',color:'#4a7c59',marginTop:4}}>✅ Video clip attached ({recSeconds}s)</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Camera is OPEN — show live viewfinder using the always-rendered video ref */}
                {camOpen && (
                  <div>
                    <div className="cam-zone">
                      {/* Clone the stream into a visible inline video element */}
                      <video
                        ref={el => {
                          if (el && streamRef.current && el.srcObject !== streamRef.current) {
                            el.srcObject = streamRef.current
                            el.play().catch(() => {})
                          }
                        }}
                        muted
                        playsInline
                        style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                      />
                    </div>
                    <div className="cam-controls">
                      <button type="button" className="cam-btn primary" onClick={takeSnapshot}>📸 Capture Photo</button>
                      {!recording
                        ? <button type="button" className="cam-btn neutral" onClick={startRecording}>⏺ Record Video (3-5s)</button>
                        : <button type="button" className="cam-btn rec"     onClick={stopRecording}>⏹ Stop ({recSeconds}s)</button>
                      }
                      <button type="button" className="cam-btn danger" onClick={closeCamera}>✕ Close Camera</button>
                    </div>
                    {snapshot && (
                      <div style={{marginTop:10,display:'flex',gap:10,alignItems:'center'}}>
                        <img src={snapshot} alt="snap" style={{width:80,height:60,objectFit:'cover',borderRadius:8}}/>
                        <span style={{fontSize:'0.8rem',color:'#4a7c59'}}>✅ Photo with GPS watermark captured</span>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Result */}
                {(aiLoading || aiResult) && (
                  <div className="ai-box" style={{
                    background:  aiResult ? (aiResult.confidence < 0.6 || !aiResult.matched ? 'rgba(192,57,43,0.05)' : 'rgba(74,124,89,0.06)') : 'rgba(74,124,89,0.06)',
                    borderColor: aiResult ? (aiResult.confidence < 0.6 || !aiResult.matched ? 'rgba(192,57,43,0.25)' : 'rgba(74,124,89,0.25)') : 'rgba(74,124,89,0.2)',
                  }}>
                    <div className="ai-dot" style={{ background: aiLoading ? '#4a7c59' : aiColor, animation: aiLoading ? 'aiPulse 1s infinite' : 'none' }}/>
                    <div>
                      {aiLoading
                        ? <span style={{fontSize:'0.83rem',color:'#2d5a3d',fontWeight:500}}>🤖 AI analysing image…</span>
                        : <div>
                            <div style={{fontSize:'0.85rem',fontWeight:600,color:aiColor}}>
                              {aiIcon} AI detected: <strong>{aiResult.detectedIssue}</strong> — {Math.round(aiResult.confidence*100)}% confidence
                            </div>
                            <div style={{fontSize:'0.75rem',color:'#8a7a65',marginTop:2}}>
                              {aiResult.confidence < 0.6
                                ? '⚠️ Low confidence — report may be flagged SUSPICIOUS'
                                : !aiResult.matched && form.category
                                  ? '⚠️ Category mismatch — report may be flagged SUSPICIOUS'
                                  : '✓ Matches selected category — report will be PENDING_VERIFICATION'}
                            </div>
                          </div>
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="divider"/>

              {/* Issue Details */}
              <div className="section-label">📋 Issue Details</div>
              <div className="form-row">
                <div className="fl">
                  <label>Category *</label>
                  <select className="fsel" name="category" value={form.category} onChange={ch} required>
                    <option value="">Select category</option>
                    {CATS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                  </select>
                </div>
                <div className="fl">
                  <label>Priority</label>
                  <select className="fsel" name="priority" value={form.priority} onChange={ch}>
                    <option value="auto">Auto-detect</option>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              <div className="form-full fl">
                <label>Title *</label>
                <input className="fi" name="title" placeholder="Brief description of the issue" value={form.title} onChange={ch} required/>
              </div>
              <div className="form-full fl">
                <label>Description *</label>
                <textarea className="fta" name="description" placeholder="How long has this been here? Safety risks? Area affected?" value={form.description} onChange={ch} required/>
              </div>

              <div className="divider"/>

              {/* Location */}
              <div className="section-label">📍 Location</div>
              <div className="form-full">
                <div className="loc-row">
                  {location
                    ? <div className="loc-display">📍 {location.address} ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</div>
                    : <div className="loc-display" style={{color:'#c8b99a'}}>{locLoading ? '⏳ Getting GPS…' : 'No location — tap to capture'}</div>
                  }
                  <button type="button" className="gps-btn" onClick={getGPS} disabled={locLoading}>
                    {locLoading ? '⏳' : '📡'} GPS
                  </button>
                </div>
                <div style={{fontSize:'0.73rem',color:'#c8b99a',marginTop:6}}>
                  GPS coordinates are embedded as a watermark on the captured photo.
                </div>
              </div>

              <div className="divider"/>
              <button className="sub-btn" type="submit" disabled={submitting}>
                {submitting ? '⏳ Submitting…' : '🏛️ Submit Secure Report'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
