const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const Issue    = require('../models/Issue');
const User     = require('../models/User');
const Comment  = require('../models/Comment');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  generateComplaintHash,
  recordComplaintOnChain,
  updateStatusOnChain
} = require('../blockchain/blockchainService');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `after-${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const total        = await Issue.countDocuments();
    const suspicious   = await Issue.countDocuments({ status: 'SUSPICIOUS' });
    const pending      = await Issue.countDocuments({ status: 'PENDING_VERIFICATION' });
    const verified     = await Issue.countDocuments({ status: 'VERIFIED' });
    const assigned     = await Issue.countDocuments({ status: 'ASSIGNED' });
    const inProgress   = await Issue.countDocuments({ status: 'IN_PROGRESS' });
    const resolved     = await Issue.countDocuments({ status: 'RESOLVED' });
    const onChain      = await Issue.countDocuments({ blockchainTxHash: { $ne: '' } });

    const byCategory   = await Issue.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);

    const resolvedIssues = await Issue.find({ status: 'RESOLVED', resolvedAt: { $exists: true } });
    const avgMs = resolvedIssues.reduce((s, i) => s + (i.resolvedAt - i.createdAt), 0) / (resolvedIssues.length || 1);
    const avgResolutionDays = Math.round(avgMs / (1000 * 60 * 60 * 24));

    const monthlyTrend = await Issue.aggregate([
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status','RESOLVED'] }, 1, 0] } } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    res.json({ success: true, data: { total, suspicious, pending, verified, assigned, inProgress, resolved, onChain, byCategory, avgResolutionDays, monthlyTrend } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/issues — paginated with filters
router.get('/issues', async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all')   filter.status   = status;
    if (category && category !== 'all') filter.category = category;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const issues = await Issue.find(filter)
      .populate('reporter', 'name email reputationScore')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Issue.countDocuments(filter);
    res.json({ success: true, data: issues, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/issues/:id — update status, assign worker (NO delete)
router.put('/issues/:id', async (req, res) => {
  try {
    const { status, assignedWorker, priority } = req.body;
    const update = {};
    if (priority) update.priority = priority;
    if (assignedWorker) update.assignedWorker = assignedWorker;

    const issue = await Issue.findById(req.params.id).populate('reporter', 'name email');
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    // Status-specific blockchain logic
    if (status && status !== issue.status) {
      update.status = status;
      if (status === 'RESOLVED') update.resolvedAt = new Date();

      // When admin VERIFIES → record on blockchain
      if (status === 'VERIFIED') {
        const [lng, lat] = issue.location.coordinates;
        const hash = generateComplaintHash({
          complaintId: issue._id.toString(),
          latitude:    lat,
          longitude:   lng,
          timestamp:   issue.createdAt.toISOString(),
          imageUrl:    issue.images.before
        });
        try {
          const { txHash } = await recordComplaintOnChain(issue._id.toString(), hash, 'VERIFIED');
          update.blockchainTxHash    = txHash;
          update.blockchainRecordedAt = new Date();
          update.complaintHash        = hash;
        } catch (e) {
          console.error('Blockchain record failed:', e.message);
        }
      }

      // For ASSIGNED / IN_PROGRESS / RESOLVED — update status on chain
      if (['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].includes(status) && issue.blockchainTxHash) {
        try {
          await updateStatusOnChain(issue._id.toString(), status);
        } catch (e) {
          console.error('Blockchain status update failed:', e.message);
        }
      }
    }

    const updated = await Issue.findByIdAndUpdate(req.params.id, update, { new: true }).populate('reporter', 'name email reputationScore');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/issues/:id/after-image
router.post('/issues/:id/after-image', upload.single('afterImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image required' });
    const issue = await Issue.findByIdAndUpdate(req.params.id, { 'images.after': `/uploads/${req.file.filename}` }, { new: true });
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    res.json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
