import { create } from 'zustand'
import {
  loginAPI, registerAPI,
  getIssuesAPI, getIssueAPI, createIssueAPI,
  upvoteIssueAPI, addCommentAPI, getAdminStatsAPI,
  updateIssueAdminAPI, getAdminIssuesAPI
} from '../services/api'
import toast from 'react-hot-toast'

// ─── Mock data (fallback when backend not running) ────────────────────────────
const MOCK_ISSUES = [
  {
    _id:'m1', title:'Large pothole on MG Road', category:'pothole', priority:'high',
    status:'PENDING_VERIFICATION',
    description:'Dangerous 30cm deep pothole causing accidents near the bus stop.',
    upvotes:24, location:{ coordinates:[77.2090,28.6139], address:'MG Road, Sector 5' },
    reporter:{ _id:'u2', name:'Priya Sharma', role:'citizen', reputationScore:40 },
    comments:[
      { _id:'c1', author:{name:'Raj Kumar',role:'citizen'}, text:'Same issue near the junction too.', createdAt:new Date(Date.now()-3600000).toISOString() },
      { _id:'c2', author:{name:'Admin',role:'admin'},       text:'Team assigned. Will fix by Thursday.', createdAt:new Date(Date.now()-1800000).toISOString() }
    ],
    images:{ before:'', after:'' }, videoUrl:'',
    aiPrediction:'pothole', aiConfidence:0.91, aiMatchedCategory:true,
    blockchainTxHash:'', complaintHash:'', createdAt:new Date(Date.now()-7200000).toISOString()
  },
  {
    _id:'m2', title:'Overflowing garbage bin at City Park', category:'garbage', priority:'medium',
    status:'IN_PROGRESS',
    description:'Public bin overflowing since 3 days. Serious health hazard for children.',
    upvotes:18, location:{ coordinates:[77.2150,28.6200], address:'City Park, Block B' },
    reporter:{ _id:'u3', name:'Amit Singh', role:'citizen', reputationScore:30 },
    comments:[
      { _id:'c3', author:{name:'Admin',role:'admin'}, text:'Sanitation team dispatched.', createdAt:new Date(Date.now()-14400000).toISOString() }
    ],
    images:{ before:'', after:'' }, videoUrl:'',
    aiPrediction:'garbage', aiConfidence:0.85, aiMatchedCategory:true,
    blockchainTxHash:'0xabc123mock', complaintHash:'sha256mock',
    createdAt:new Date(Date.now()-86400000).toISOString()
  },
  {
    _id:'m3', title:'Streetlights out on 5th Avenue', category:'streetlight', priority:'low',
    status:'RESOLVED',
    description:'Three consecutive streetlights non-functional for 2 weeks.',
    upvotes:9, location:{ coordinates:[77.2000,28.6080], address:'5th Avenue, Block C' },
    reporter:{ _id:'u4', name:'Meera Nair', role:'citizen', reputationScore:60 },
    comments:[ { _id:'c4', author:{name:'Admin',role:'admin'}, text:'All lights fixed!', createdAt:new Date(Date.now()-172800000).toISOString() } ],
    images:{ before:'', after:'resolved.jpg' }, videoUrl:'',
    aiPrediction:'streetlight', aiConfidence:0.78, aiMatchedCategory:true,
    blockchainTxHash:'0xdef456mock', complaintHash:'sha256mock2',
    createdAt:new Date(Date.now()-432000000).toISOString()
  },
  {
    _id:'m4', title:'Water pipe burst near Metro Station', category:'water', priority:'high',
    status:'ASSIGNED',
    description:'Major pipe burst causing flooding. Road completely disrupted.',
    upvotes:41, location:{ coordinates:[77.1950,28.6100], address:'Station Road, Near Metro' },
    reporter:{ _id:'u3', name:'Amit Singh', role:'citizen', reputationScore:30 },
    comments:[], images:{ before:'', after:'' }, videoUrl:'',
    aiPrediction:'water', aiConfidence:0.88, aiMatchedCategory:true,
    blockchainTxHash:'0xghi789mock', createdAt:new Date(Date.now()-10800000).toISOString()
  },
  {
    _id:'m5', title:'Road damage after monsoon — Ring Road', category:'road', priority:'high',
    status:'SUSPICIOUS',
    description:'Entire stretch has cracks and subsidence. Several falls reported.',
    upvotes:32, location:{ coordinates:[77.2200,28.6050], address:'Ring Road, Section 12' },
    reporter:{ _id:'u2', name:'Priya Sharma', role:'citizen', reputationScore:40 },
    comments:[], images:{ before:'', after:'' }, videoUrl:'',
    aiPrediction:'garbage', aiConfidence:0.42, aiMatchedCategory:false,
    blockchainTxHash:'', createdAt:new Date(Date.now()-172800000).toISOString()
  },
  {
    _id:'m6', title:'Drainage blockage causing street flooding', category:'water', priority:'medium',
    status:'VERIFIED',
    description:'Storm drain blocked. Rainwater backing into residential area.',
    upvotes:15, location:{ coordinates:[77.2050,28.6180], address:'Civil Lines, Pocket 3' },
    reporter:{ _id:'u4', name:'Meera Nair', role:'citizen', reputationScore:60 },
    comments:[], images:{ before:'', after:'' }, videoUrl:'',
    aiPrediction:'water', aiConfidence:0.80, aiMatchedCategory:true,
    blockchainTxHash:'0xjkl012mock', createdAt:new Date(Date.now()-345600000).toISOString()
  },
]

const MOCK_USERS = [
  { _id:'u1', email:'admin@civic.com', password:'admin123', name:'Admin User',   role:'admin',   reputationScore:0  },
  { _id:'u2', email:'user@civic.com',  password:'user123',  name:'Priya Sharma', role:'citizen', reputationScore:40 },
]

// ─── Auth Store ───────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user:    JSON.parse(localStorage.getItem('civic_user')  || 'null'),
  token:   localStorage.getItem('civic_token') || null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await loginAPI({ email, password })
      localStorage.setItem('civic_token', data.token)
      localStorage.setItem('civic_user',  JSON.stringify(data.data))
      set({ user: data.data, token: data.token, loading: false })
      toast.success(`Welcome back, ${data.data.name}!`)
      return { success: true, role: data.data.role }
    } catch {
      const u = MOCK_USERS.find(u => u.email === email && u.password === password)
      if (u) {
        const { password: _, ...safe } = u
        localStorage.setItem('civic_token', 'mock-token')
        localStorage.setItem('civic_user',  JSON.stringify(safe))
        set({ user: safe, token: 'mock-token', loading: false })
        toast.success(`Welcome back, ${safe.name}!`)
        return { success: true, role: safe.role }
      }
      set({ loading: false })
      toast.error('Invalid email or password')
      return { success: false }
    }
  },

  register: async (name, email, password) => {
    set({ loading: true })
    try {
      const { data } = await registerAPI({ name, email, password })
      localStorage.setItem('civic_token', data.token)
      localStorage.setItem('civic_user',  JSON.stringify(data.data))
      set({ user: data.data, token: data.token, loading: false })
      toast.success('Account created!')
      return { success: true }
    } catch {
      const newUser = { _id:`u${Date.now()}`, name, email, role:'citizen', reputationScore:0 }
      localStorage.setItem('civic_token', 'mock-token')
      localStorage.setItem('civic_user',  JSON.stringify(newUser))
      set({ user: newUser, token: 'mock-token', loading: false })
      toast.success('Account created!')
      return { success: true }
    }
  },

  logout: () => {
    localStorage.removeItem('civic_token')
    localStorage.removeItem('civic_user')
    set({ user: null, token: null })
    toast.success('Logged out successfully')
  },

  isAdmin: () => get().user?.role === 'admin',
}))

// ─── Issues Store ─────────────────────────────────────────────────────────────
export const useIssueStore = create((set, get) => ({
  issues:       [...MOCK_ISSUES],
  currentIssue: null,
  loading:      false,
  submitting:   false,
  total:        MOCK_ISSUES.length,
  stats:        null,
  votedIds:     new Set(JSON.parse(localStorage.getItem('civic_voted') || '[]')),
  lastAiResult: null,

  fetchIssues: async (params = {}) => {
    set({ loading: true })
    const token = localStorage.getItem('civic_token')
    if (token === 'mock-token') {
      let list = [...MOCK_ISSUES]
      if (params.category) list = list.filter(i => i.category === params.category)
      if (params.status)   list = list.filter(i => i.status   === params.status)
      if (params.sort === 'popular') list = [...list].sort((a,b) => b.upvotes - a.upvotes)
      set({ issues: list, total: list.length, loading: false })
      return
    }
    try {
      const { data } = await getIssuesAPI(params)
      let list = data.data
      if (params.category) list = list.filter(i => i.category === params.category)
      set({ issues: list, total: data.total, loading: false })
    } catch {
      let list = [...MOCK_ISSUES]
      if (params.category) list = list.filter(i => i.category === params.category)
      if (params.status)   list = list.filter(i => i.status   === params.status)
      if (params.sort === 'popular') list = [...list].sort((a,b) => b.upvotes - a.upvotes)
      set({ issues: list, total: list.length, loading: false })
    }
  },

  fetchIssue: async (id) => {
    set({ loading: true })
    const token = localStorage.getItem('civic_token')
    if (token === 'mock-token') {
      const issue = MOCK_ISSUES.find(i => i._id === id)
      set({ currentIssue: issue || null, loading: false })
      return
    }
    try {
      const { data } = await getIssueAPI(id)
      set({ currentIssue: data.data, loading: false })
    } catch {
      const issue = MOCK_ISSUES.find(i => i._id === id)
      set({ currentIssue: issue || null, loading: false })
    }
  },

  createIssue: async (formData) => {
    set({ submitting: true })
    try {
      const { data } = await createIssueAPI(formData)
      set(s => ({ issues: [data.data, ...s.issues], submitting: false, lastAiResult: data.aiResult || null }))
      const statusMsg = data.data.status === 'SUSPICIOUS'
        ? '⚠️ Report submitted but flagged as suspicious by AI'
        : '✅ Issue reported successfully!'
      toast.success(statusMsg)
      return { success: true, id: data.data._id, status: data.data.status, aiResult: data.aiResult }
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('⚠️ Similar issue already reported nearby!')
        set({ submitting: false })
        return { success: false }
      }
      // Mock fallback
      const user = JSON.parse(localStorage.getItem('civic_user') || '{}')
      const PMAP = { pothole:'high', road:'high', garbage:'medium', water:'medium', streetlight:'low' }
      const cat  = formData.get?.('category') || 'pothole'
      const mockAI = { detectedIssue: cat, confidence: parseFloat((0.70+Math.random()*0.25).toFixed(2)), matched: true }
      const newIssue = {
        _id: `new-${Date.now()}`, title: formData.get?.('title') || 'New Issue',
        description: formData.get?.('description') || '', category: cat,
        priority: PMAP[cat] || 'medium', status: 'PENDING_VERIFICATION',
        upvotes: 0,
        location: { coordinates:[77.2090,28.6139], address: formData.get?.('address') || 'New Delhi, India' },
        reporter: { _id: user._id, name: user.name, role: user.role, reputationScore: user.reputationScore || 0 },
        comments: [], images: { before:'', after:'' }, videoUrl:'',
        aiPrediction: mockAI.detectedIssue, aiConfidence: mockAI.confidence, aiMatchedCategory: true,
        blockchainTxHash: '', createdAt: new Date().toISOString(),
      }
      MOCK_ISSUES.unshift(newIssue)
      set(s => ({ issues: [newIssue, ...s.issues], submitting: false, lastAiResult: mockAI }))
      toast.success('Issue reported successfully!')
      return { success: true, id: newIssue._id, status: 'PENDING_VERIFICATION', aiResult: mockAI }
    }
  },

  upvote: async (id) => {
    const voted = get().votedIds
    if (voted.has(id)) { toast.error('Already voted on this issue'); return }
    try {
      const { data } = await upvoteIssueAPI(id)
      const newVoted = new Set([...voted, id])
      localStorage.setItem('civic_voted', JSON.stringify([...newVoted]))
      set(s => ({
        votedIds: newVoted,
        issues: s.issues.map(i => i._id === id ? { ...i, upvotes: data.upvotes } : i),
        currentIssue: s.currentIssue?._id === id ? { ...s.currentIssue, upvotes: data.upvotes } : s.currentIssue,
      }))
      toast.success('Vote recorded!')
    } catch {
      const newVoted = new Set([...voted, id])
      localStorage.setItem('civic_voted', JSON.stringify([...newVoted]))
      const mi = MOCK_ISSUES.find(i => i._id === id)
      if (mi) mi.upvotes += 1
      set(s => ({
        votedIds: newVoted,
        issues: s.issues.map(i => i._id === id ? { ...i, upvotes: i.upvotes + 1 } : i),
        currentIssue: s.currentIssue?._id === id ? { ...s.currentIssue, upvotes: s.currentIssue.upvotes + 1 } : s.currentIssue,
      }))
      toast.success('Vote recorded!')
    }
  },

  addComment: async (issueId, text) => {
    const user = JSON.parse(localStorage.getItem('civic_user') || '{}')
    try {
      const { data } = await addCommentAPI(issueId, { text })
      set(s => ({ currentIssue: s.currentIssue ? { ...s.currentIssue, comments: [...(s.currentIssue.comments||[]), data.data] } : s.currentIssue }))
      toast.success('Comment posted!')
      return true
    } catch {
      const newCmt = { _id:`cmt-${Date.now()}`, author:{ name:user.name||'User', role:user.role||'citizen' }, text, createdAt:new Date().toISOString() }
      const mi = MOCK_ISSUES.find(i => i._id === issueId)
      if (mi) mi.comments.push(newCmt)
      set(s => ({ currentIssue: s.currentIssue ? { ...s.currentIssue, comments: [...(s.currentIssue.comments||[]), newCmt] } : s.currentIssue }))
      toast.success('Comment posted!')
      return true
    }
  },

  fetchStats: async () => {
    const token = localStorage.getItem('civic_token')
    const buildMockStats = () => {
      const list = MOCK_ISSUES
      return {
        total: list.length,
        suspicious:  list.filter(i=>i.status==='SUSPICIOUS').length,
        pending:     list.filter(i=>i.status==='PENDING_VERIFICATION').length,
        verified:    list.filter(i=>i.status==='VERIFIED').length,
        assigned:    list.filter(i=>i.status==='ASSIGNED').length,
        inProgress:  list.filter(i=>i.status==='IN_PROGRESS').length,
        resolved:    list.filter(i=>i.status==='RESOLVED').length,
        onChain:     list.filter(i=>i.blockchainTxHash).length,
        byCategory:  ['pothole','garbage','streetlight','water','road'].map(c=>({ _id:c, count:list.filter(i=>i.category===c).length })),
      }
    }
    if (token === 'mock-token') {
      set({ stats: buildMockStats() })
      return
    }
    try {
      const { data } = await getAdminStatsAPI()
      set({ stats: data.data })
    } catch {
      set({ stats: buildMockStats() })
    }
  },

  updateIssueStatus: async (id, updateData) => {
    try {
      const { data } = await updateIssueAdminAPI(id, updateData)
      set(s => ({ issues: s.issues.map(i => i._id === id ? data.data : i), currentIssue: s.currentIssue?._id === id ? data.data : s.currentIssue }))
      toast.success('Issue updated!')
      return true
    } catch {
      const mi = MOCK_ISSUES.find(i => i._id === id)
      if (mi) {
        if (updateData.status)         mi.status = updateData.status
        if (updateData.assignedWorker) mi.assignedWorker = updateData.assignedWorker
        // Mock blockchain hash when verified
        if (updateData.status === 'VERIFIED') mi.blockchainTxHash = '0x' + Math.random().toString(16).slice(2).padEnd(64,'0')
      }
      set(s => ({
        issues: s.issues.map(i => i._id === id ? { ...i, ...updateData, blockchainTxHash: updateData.status==='VERIFIED'?'0xmockhash':i.blockchainTxHash } : i),
        currentIssue: s.currentIssue?._id === id ? { ...s.currentIssue, ...updateData } : s.currentIssue,
      }))
      toast.success('Issue updated!')
      return true
    }
  },
}))
