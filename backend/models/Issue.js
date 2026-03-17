const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
  description: { type: String, required: [true, 'Description is required'], maxlength: 2000 },
  category: { type: String, required: true, enum: ['pothole', 'garbage', 'streetlight', 'water', 'road'] },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  status: {
    type: String,
    enum: ['SUSPICIOUS', 'PENDING_VERIFICATION', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
    default: 'PENDING_VERIFICATION'
  },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true },
    address: { type: String, default: '' }
  },
  images: {
    before: { type: String, default: '' },
    after:  { type: String, default: '' }
  },
  videoUrl:        { type: String, default: '' },
  reporter:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedWorker:  { type: String, default: '' },
  upvotes:         { type: Number, default: 0 },
  upvotedBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  resolvedAt:      { type: Date },
  // AI Detection
  aiPrediction:    { type: String, default: '' },
  aiConfidence:    { type: Number, default: 0 },
  aiMatchedCategory: { type: Boolean, default: false },
  // Blockchain
  blockchainTxHash:   { type: String, default: '' },
  blockchainRecordedAt: { type: Date },
  complaintHash:      { type: String, default: '' }
}, { timestamps: true });

issueSchema.index({ location: '2dsphere' });

issueSchema.pre('save', function (next) {
  if (this.isModified('category') || this.isNew) {
    const pm = { pothole:'high', road:'high', garbage:'medium', water:'medium', streetlight:'low' };
    if (!this.priority || this.priority === 'medium') this.priority = pm[this.category] || 'medium';
  }
  if (this.isModified('status') && this.status === 'RESOLVED' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
