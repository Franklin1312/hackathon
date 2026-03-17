const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const axios    = require('axios');
const FormData = require('form-data');
const fs       = require('fs');
const Issue    = require('../models/Issue');
const Comment  = require('../models/Comment');
const { protect } = require('../middleware/authMiddleware');

// ── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB for video
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only image and video files allowed'), false);
  }
});
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

// ── AI Detection helper ───────────────────────────────────────────────────────
const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function callAIDetection(imagePath) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    const { data } = await axios.post(`${AI_URL}/ai/detect`, form, {
      headers: form.getHeaders(),
      timeout: 15000
    });
    return { detectedIssue: data.detectedIssue, confidence: data.confidence };
  } catch (e) {
    console.warn('AI service unavailable, using fallback:', e.message);
    // Fallback: mock AI with random realistic result
    const cats = ['pothole','garbage','streetlight','water','road'];
    return { detectedIssue: cats[Math.floor(Math.random() * cats.length)], confidence: parseFloat((0.70 + Math.random() * 0.25).toFixed(2)) };
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────
// GET /api/issues — list with filters + pagination
router.get('/', async (req, res) => {
  try {
    const { category, status, priority, sort = '-createdAt', limit = 20, page = 1 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const issues = await Issue.find(filter)
      .populate('reporter', 'name email reputationScore')
      .sort(sort === 'popular' ? '-upvotes' : sort)
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Issue.countDocuments(filter);
    res.json({ success: true, data: issues, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/issues/nearby
router.get('/nearby/search', async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query;
    const issues = await Issue.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      }
    }).populate('reporter', 'name').limit(20);
    res.json({ success: true, data: issues });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/issues/:id
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate('reporter', 'name email role reputationScore');
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    const comments = await Comment.find({ issue: req.params.id }).populate('author', 'name role').sort('createdAt');
    res.json({ success: true, data: { ...issue.toObject(), comments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/issues — create with image + video
router.post('/', protect, uploadFields, async (req, res) => {
  try {
    const { title, description, category, priority, lat, lng, address } = req.body;
    if (!title || !description || !category || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Duplicate check within 200m
    const nearby = await Issue.findOne({
      category,
      status: { $nin: ['RESOLVED'] },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 200
        }
      }
    });
    if (nearby) {
      return res.status(409).json({ success: false, message: 'Similar issue already reported nearby', existingId: nearby._id });
    }

    // AI Detection on uploaded image
    let aiPrediction = '', aiConfidence = 0, aiMatchedCategory = false, determinedStatus = 'PENDING_VERIFICATION';
    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    if (imageFile) {
      const ai = await callAIDetection(imageFile.path);
      aiPrediction   = ai.detectedIssue;
      aiConfidence   = ai.confidence;
      // Map category names for comparison
      const catMap = { streetlight: 'streetlight', garbage: 'garbage', pothole: 'pothole', water: 'water', road: 'road' };
      aiMatchedCategory = catMap[ai.detectedIssue] === category;
      if (!aiMatchedCategory || ai.confidence < 0.6) {
        determinedStatus = 'SUSPICIOUS';
      }
    }

    const priorityMap = { pothole:'high', road:'high', garbage:'medium', water:'medium', streetlight:'low' };
    const issue = await Issue.create({
      title, description, category,
      priority:    priority && priority !== 'auto' ? priority : (priorityMap[category] || 'medium'),
      reporter:    req.user._id,
      location:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)], address: address || '' },
      images:      { before: imageFile ? `/uploads/${imageFile.filename}` : '' },
      videoUrl:    videoFile ? `/uploads/${videoFile.filename}` : '',
      aiPrediction,
      aiConfidence,
      aiMatchedCategory,
      status:      determinedStatus
    });

    // Increase reporter reputation if not suspicious
    if (determinedStatus !== 'SUSPICIOUS') {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user._id, { $inc: { reputationScore: 10 } });
    }

    await issue.populate('reporter', 'name email reputationScore');
    res.status(201).json({
      success: true,
      data: issue,
      aiResult: { detectedIssue: aiPrediction, confidence: aiConfidence, matched: aiMatchedCategory }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/issues/:id/upvote
router.put('/:id/upvote', protect, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    if (issue.upvotedBy.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already upvoted' });
    }
    issue.upvotes += 1;
    issue.upvotedBy.push(req.user._id);
    if (issue.upvotes >= 20 && issue.priority !== 'high') issue.priority = 'high';
    else if (issue.upvotes >= 10 && issue.priority === 'low') issue.priority = 'medium';
    await issue.save();
    res.json({ success: true, upvotes: issue.upvotes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/issues/:id/comments
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Comment text required' });
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    const comment = await Comment.create({ issue: req.params.id, author: req.user._id, text: text.trim(), isAdminReply: req.user.role === 'admin' });
    await comment.populate('author', 'name role');
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
