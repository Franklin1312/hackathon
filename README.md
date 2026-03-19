# 🏛️ CivicConnect — Smart Civic Issue Reporting & Resolution Platform

A full-stack, production-ready civic reporting platform with AI validation, blockchain immutability, and secure evidence capture.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React + Vite, TailwindCSS, Framer Motion, Leaflet, Axios |
| Backend    | Node.js, Express.js, Multer         |
| Database   | MongoDB + Mongoose                  |
| Blockchain | Solidity, Hardhat, Ethers.js, Sepolia Testnet |
| AI Service | Python, FastAPI, YOLOv8, OpenCV     |

---

## Project Structure

```
civic-platform/
├── backend/           Node.js + Express API
├── frontend/          React + Vite UI
├── ai-service/        Python FastAPI + YOLOv8
└── blockchain/        Hardhat + Solidity
```

---

## Quick Start (Local — No Blockchain / No AI Required)

The app runs fully with mock data. You only need MongoDB + Node + React to get started.

### 1. Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Python 3.10+ (for AI service, optional)
- Git

### 2. Backend Setup

```bash
cd backend
npm install
cp .env .env.local   # already configured for local
npm run seed         # creates admin + citizen accounts
npm run dev          # starts on http://localhost:5000
```


### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env   # sets VITE_API_URL=http://localhost:5000
npm run dev            # starts on http://localhost:5173
```

### 4. AI Microservice Setup (Optional)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The service will:
- Try to load YOLOv8 (`yolov8n.pt`) — auto-downloads on first run (~6 MB)
- Fall back to OpenCV heuristic detection if model unavailable


### 5. Blockchain Setup (Optional)

**Option A — Local Hardhat Node (no wallet needed):**
```bash
cd blockchain
npm install
npx hardhat node        # starts local chain on http://127.0.0.1:8545
# In a new terminal:
npm run deploy:local    # deploys contract, prints CONTRACT_ADDRESS
```
5. Deploy:
   ```bash
   cd blockchain
   npm install
   npm run deploy:sepolia
   ```
6. Copy printed `CONTRACT_ADDRESS` into `backend/.env`
7. Restart backend: `npm run dev`

---

## Seed Accounts

| Role    | Email             | Password  |
|---------|-------------------|-----------|
| Admin   | admin@civic.com   | admin123  |
| Citizen | user@civic.com    | user123   |

Seed command: `cd backend && npm run seed`

---

## Application Pages

| Path               | Description                          | Access   |
|--------------------|--------------------------------------|----------|
| `/`                | Landing page (logged out) / Dashboard (logged in) | Public |
| `/login`           | Login page                           | Public   |
| `/register`        | Registration page                    | Public   |
| `/report`          | Report issue with live camera        | Citizen  |
| `/issues/:id`      | Issue details, AI result, blockchain | Auth     |
| `/map`             | Live map of all issues               | Auth     |
| `/admin`           | Admin dashboard with status controls | Admin    |
| `/admin/analytics` | Charts, AI accuracy, blockchain log  | Admin    |

---

## Complaint Lifecycle

```
Citizen submits (live camera + GPS watermark)
        ↓
AI validates photo (YOLOv8)
        ↓
  ┌─────────────────────┐
  │ confidence < 60% OR │ → SUSPICIOUS
  │ category mismatch   │
  └─────────────────────┘
        ↓ (if passes)
PENDING_VERIFICATION
        ↓ Admin verifies
VERIFIED → SHA-256 hash generated → recordComplaint() on blockchain
        ↓ Admin assigns
ASSIGNED → updateStatus() on blockchain
        ↓
IN_PROGRESS → updateStatus() on blockchain
        ↓
RESOLVED → updateStatus() on blockchain
```

**Admin cannot delete complaints** — enforced at route level AND smart contract level (no `deleteComplaint()` function exists).

---

## AI Detection

The FastAPI service runs YOLOv8 inference on each uploaded image:

- Detects civic categories: `pothole`, `garbage`, `streetlight`, `water`, `road`
- If YOLOv8 unavailable → falls back to OpenCV image heuristics (color/brightness analysis)
- Returns `{detectedIssue, confidence}`
- Backend compares with user-selected category; sets `SUSPICIOUS` if mismatch or confidence < 0.6

---

## Blockchain Integration

- **Hash**: `SHA256(complaintId + lat + lng + timestamp + imageUrl)`
- **Contract**: `CivicComplaintRegistry` on Sepolia (or local Hardhat)
- **Mock mode**: If no wallet configured, blockchain calls generate a fake `0x…` txHash and log to console — everything else works normally
- **Etherscan**: Verified txHashes link to `https://sepolia.etherscan.io/tx/{hash}`

---

## Running Everything Together

```bash
# Terminal 1 — MongoDB
mongod

# Terminal 2 — Backend
cd backend && npm run dev

# Terminal 3 — Frontend
cd frontend && npm run dev

# Terminal 4 — AI Service (optional)
cd ai-service && uvicorn main:app --port 8000 --reload

# Terminal 5 — Blockchain local node (optional)
cd blockchain && npx hardhat node
```



## Security Features

1. **Live camera only** — `getUserMedia()` with no file input; gallery uploads impossible
2. **GPS watermark** — Canvas-rendered timestamp + coordinates baked into photo before upload
3. **AI validation** — YOLOv8 flags mismatches; suspicious reports quarantined automatically
4. **JWT auth** — All protected routes require `Bearer` token
5. **Admin no-delete policy** — No `DELETE /issues` route exists; smart contract has no `deleteComplaint()`
6. **Immutable blockchain** — Verified complaints are SHA-256 hashed and permanently recorded
7. **Reputation system** — Citizens lose incentive to spam; valid reports earn points

