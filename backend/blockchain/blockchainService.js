const crypto = require('crypto');

// ── Blockchain service ────────────────────────────────────────────────────────
// Uses ethers.js when CONTRACT_ADDRESS + PRIVATE_KEY + SEPOLIA_RPC_URL are set.
// Falls back to "mock" mode (logs + returns a fake txHash) when not configured,
// so the rest of the app works locally without a wallet.

let ethers, provider, wallet, contract;
let BLOCKCHAIN_READY = false;

async function initBlockchain() {
  const { PRIVATE_KEY, SEPOLIA_RPC_URL, CONTRACT_ADDRESS } = process.env;
  if (!PRIVATE_KEY || !SEPOLIA_RPC_URL || !CONTRACT_ADDRESS ||
      PRIVATE_KEY === 'your_wallet_private_key') {
    console.log('⚠️  Blockchain: running in MOCK mode (set PRIVATE_KEY / SEPOLIA_RPC_URL / CONTRACT_ADDRESS to enable)');
    return;
  }
  try {
    ethers   = require('ethers');
    const ABI = require('./contractABI');
    provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
    BLOCKCHAIN_READY = true;
    console.log('✅  Blockchain service ready (Sepolia)');
  } catch (e) {
    console.warn('⚠️  Blockchain init failed:', e.message, '— running in mock mode');
  }
}

// SHA-256 hash of complaint data
function generateComplaintHash({ complaintId, latitude, longitude, timestamp, imageUrl = '' }) {
  const data = `${complaintId}|${latitude}|${longitude}|${timestamp}|${imageUrl}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Record verified complaint on-chain
async function recordComplaintOnChain(complaintId, hash, status = 'VERIFIED') {
  if (!BLOCKCHAIN_READY) {
    const fakeTx = '0x' + crypto.randomBytes(32).toString('hex');
    console.log(`[MOCK BLOCKCHAIN] recordComplaint(${complaintId}) → ${fakeTx}`);
    return { txHash: fakeTx, mock: true };
  }
  const tx  = await contract.recordComplaint(complaintId, hash, status);
  const rec = await tx.wait();
  return { txHash: rec.hash, mock: false };
}

// Update status on-chain
async function updateStatusOnChain(complaintId, newStatus) {
  if (!BLOCKCHAIN_READY) {
    const fakeTx = '0x' + crypto.randomBytes(32).toString('hex');
    console.log(`[MOCK BLOCKCHAIN] updateStatus(${complaintId}, ${newStatus}) → ${fakeTx}`);
    return { txHash: fakeTx, mock: true };
  }
  const tx  = await contract.updateStatus(complaintId, newStatus);
  const rec = await tx.wait();
  return { txHash: rec.hash, mock: false };
}

// Read complaint from chain
async function getComplaintFromChain(complaintId) {
  if (!BLOCKCHAIN_READY) return null;
  try {
    const [id, hash, ts, status] = await contract.getComplaint(complaintId);
    return { id, hash, timestamp: Number(ts), status };
  } catch {
    return null;
  }
}

module.exports = {
  initBlockchain,
  generateComplaintHash,
  recordComplaintOnChain,
  updateStatusOnChain,
  getComplaintFromChain,
};
