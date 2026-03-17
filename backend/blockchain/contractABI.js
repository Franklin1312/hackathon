// ABI for CivicComplaintRegistry — update CONTRACT_ADDRESS in .env after deployment
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "name": "complaintId",   "type": "string" },
      { "indexed": false, "name": "complaintHash", "type": "string" },
      { "indexed": false, "name": "timestamp",     "type": "uint256" }
    ],
    "name": "ComplaintRecorded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "name": "complaintId", "type": "string" },
      { "indexed": false, "name": "newStatus",   "type": "string" },
      { "indexed": false, "name": "updatedAt",   "type": "uint256" }
    ],
    "name": "StatusUpdated",
    "type": "event"
  },
  {
    "inputs": [
      { "name": "_complaintId",   "type": "string" },
      { "name": "_complaintHash", "type": "string" },
      { "name": "_status",        "type": "string" }
    ],
    "name": "recordComplaint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_complaintId", "type": "string" },
      { "name": "_newStatus",   "type": "string" }
    ],
    "name": "updateStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_complaintId", "type": "string" }],
    "name": "getComplaint",
    "outputs": [
      { "name": "", "type": "string" },
      { "name": "", "type": "string" },
      { "name": "", "type": "uint256" },
      { "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalComplaints",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

module.exports = CONTRACT_ABI;
