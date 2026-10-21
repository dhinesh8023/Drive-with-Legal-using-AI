# 🚗 DRIVE LEGAL AI

> **“See the Danger Before the Driver Does.”**  
> *From Reactive Road Safety to Predictive Road Safety.*  
> **Final Year Engineering Capstone Project (B.E. / B.Tech Computer Science & AI)**  
> **Autonomous Traffic Intelligence, Computer Vision Citation & Clearance System**

---

## 1. Project Overview & Vision

Modern traffic enforcement systems in India and worldwide suffer from a fatal flaw: **they are entirely reactive**. Cameras capture red-light crossings, speed guns record violations, and challans are dispatched *after* the safety breach has already occurred—often after catastrophic crashes have claimed innocent lives.

**Drive Legal AI** fundamentally re-engineers this paradigm by combining:
```
DRIVER BEHAVIOUR
+
VEHICLE BEHAVIOUR
+
ROAD CONDITIONS
+
TRAFFIC
+
WEATHER
+
AI CAMERA ANALYSIS
+
NEAR-MISS EVENTS
+
HISTORICAL DATA
+
VIOLATION RECORDS
        ↓
AI SAFETY & RISK ENGINE
        ↓
PREDICTIVE RISK SCORE (0 – 100)
        ↓
EARLY AUDITORY WARNING (English & Tamil)
        ↓
SAFER DRIVER DECISION
        ↓
ACCIDENT PREVENTION
```

### Critical Legal & Safety Safeguard
> [!IMPORTANT]
> **Strict Legal Workflow Compliance:**  
> Drive Legal AI does **NOT** automatically impose legally enforceable fines solely based on unverified AI detection.  
> 
> ```
> AI / Camera Detection
>         ↓
> Violation Candidate Flagged
>         ↓
> Photographic Evidence & Telemetry Captured
>         ↓
> AI Confidence Score Computed (Model Estimate)
>         ↓
> Authorized Human Police Officer Review
>         ↓
> Officer Decision: Approve / Reject / Request More Information
>         ↓
> Official Fine Generated According to Configured Statutory Rules
>         ↓
> Escalating Multi-Channel Notification (In-App → SMS → WhatsApp)
>         ↓
> Payment Clearance (UPI, FASTag, GPay, PhonePe)
>         ↓
> Automated Backend Verification & Digital Receipt
>         ↓
> Tamper-Evident Audit Trail
> ```

---

## 2. Technology Stack

### Frontend (Modern Vanilla Web Architecture)
- **HTML5, CSS3, Vanilla JavaScript (ES6+)**
- **Bootstrap 5 & Bootstrap Icons**
- **Chart.js 4.4** (Real-time telemetry, district trends, revenue analytics)
- **Leaflet.js 1.9** (CartoDB Dark Matter geospatial GIS map)
- **Web Speech API** (Voice Co-Driver in English and Tamil)
- **Design System:** Deep Charcoal (`#0a0d14`), Electric Blue (`#00f0ff`), Cyan (`#06b6d4`), Warning Orange (`#f59e0b`), Critical Red (`#ef4444`).

### Backend (MVC Modular Microservices)
- **Node.js 24 & Express.js**
- **MongoDB & Mongoose** (Relational indexes & schemas)
- **Socket.IO 4.8** (Real-time duplex risk broadcast & emergency sirens)
- **JWT (JSON Web Tokens) & BcryptJS**
- **Helmet, CORS, Express-Rate-Limit**
- **PDFKit** (Tamper-evident digital payment receipt generation)
- **Crypto AES-256-GCM** (Sensitive telemetry encryption utility)

### AI Service (Python FastAPI)
- **Python 3.10+ / 3.14 compatible**
- **FastAPI & Uvicorn**
- **NumPy & Pydantic**
- **Dual Mode Architecture:** **DEMO AI MODE** + **REAL AI READY MODE** (YOLOv8/v9, OpenCV, MediaPipe facial landmarks, Lane Hough lines).

---

## 3. Seed Demo Accounts

For instant evaluation and viva demonstration, the platform includes pre-configured credentials:

| Role | Authorized Email | Password | Primary Portal |
| :--- | :--- | :--- | :--- |
| **Public Commuter** | `user@drivelegal.demo` | `DemoPassword123!` | [dashboard.html](file:///frontend/dashboard.html) |
| **Police Officer** | `police@drivelegal.demo` | `DemoPassword123!` | [police-dashboard.html](file:///frontend/police-dashboard.html) |
| **Government Staff**| `gov@drivelegal.demo` | `DemoPassword123!` | [government-dashboard.html](file:///frontend/government-dashboard.html) |
| **Administrator** | `admin@drivelegal.demo` | `DemoPassword123!` | [admin-dashboard.html](file:///frontend/admin-dashboard.html) |

> [!NOTE]
> On the login page, you can click the **"Auto-Fill Credentials"** button under any tab to fill these credentials with one click.

---

## 4. Complete Project Structure

```
drive-legal-ai/
│
├── frontend/
│   ├── index.html                  # Landing page & platform architecture showcase
│   ├── login.html                  # Multi-role authentication & demo auto-fill
│   ├── register.html               # Commuter registration & officer verification
│   ├── forgot-password.html        # Recovery token reset workflow
│   ├── dashboard.html              # Commuter safety hub, scores & challans
│   ├── live-drive.html             # AR HUD, 13 scenario triggers & voice co-driver
│   ├── vehicles.html               # Vehicle garage, insurance & FASTag mapping
│   ├── violations.html             # AI candidate directory & review states
│   ├── fine-management.html        # Fine ticketing & dispute submission
│   ├── payments.html               # Digital checkout (UPI, GPay, PhonePe, FASTag)
│   ├── fastag.html                 # FASTag wallet top-up & toll deduction ledger
│   ├── disputes.html               # Legal dispute hearings & adjudication
│   ├── notifications.html          # Multi-tier escalation inbox (In-App, SMS, WA)
│   ├── road-map.html               # Leaflet GIS safety map with blackspots
│   ├── hazards.html                # Crowd-sourced road hazard reporting
│   ├── analytics.html              # City enforcement & repeat offender patterns
│   ├── blackspots.html             # AI-predicted accident blackspots & solutions
│   ├── route-planner.html          # Fastest vs Safest predictive route navigator
│   ├── emergency.html              # Autonomous kinetic shock SOS simulation
│   ├── fleet.html                  # Commercial fleet telematics scorecard
│   ├── police-dashboard.html       # Police officer review & evidence workbench
│   ├── government-dashboard.html   # State road safety analytics & revenue trends
│   ├── admin-dashboard.html        # Statutory fine rule config & audit trail
│   ├── settings.html               # Voice language (English/Tamil) & audio volume
│   │
│   ├── css/
│   │   ├── global.css              # Dark theme, glassmorphism, typography
│   │   ├── auth.css                # Role selection pills & credential cards
│   │   ├── dashboard.css           # Metric widgets, tables & risk gauges
│   │   ├── live-drive.css          # AR bounding boxes, HUD speedometer
│   │   └── responsive.css          # Mobile drawer & adaptive media queries
│   │
│   └── js/
│       ├── config.js               # API URLs, voice configurations
│       ├── api.js                  # Fetch client with auto JWT attachment
│       ├── auth.js                 # Session persistence & RBAC route guards
│       ├── utils.js                # Toasts, currency, speech synthesis
│       ├── dashboard.js            # Commuter metrics & Chart.js graph
│       ├── live-drive.js           # AR HUD, horizon canvas & scenario triggers
│       ├── risk-engine.js          # Explainable factor breakdown & DOM binder
│       ├── violations.js           # Candidate filtering & data loading
│       ├── fines.js                # Fine tickets, reminder dispatches
│       ├── payments.js             # Checkout sessions & PDF receipt links
│       ├── fastag.js               # Top-ups & toll ledger
│       ├── notifications.js        # Multi-channel reminder inbox
│       ├── police.js               # Officer candidate approval & search audits
│       ├── government.js           # Civic metrics & state trend charts
│       └── map.js                  # Leaflet layers, pins & blackspot filters
│
├── backend/
│   ├── server.js                   # Express, Socket.IO & API route assembly
│   ├── package.json                # Dependencies & npm scripts
│   ├── .env.example                # Configuration template
│   ├── .env                        # Active environment variables
│   │
│   ├── config/
│   │   └── db.js                   # Mongoose resilient connection
│   │
│   ├── models/
│   │   ├── User.js                 # Authentication, role & driverScore
│   │   ├── Vehicle.js              # Registration & FASTag linkage
│   │   ├── Violation.js            # AI candidates & officer review metadata
│   │   ├── Fine.js                 # Statutory fine tickets & escalation levels
│   │   ├── Payment.js              # Digital clearance & backend verification
│   │   ├── FastagAccount.js        # Wallet balance & toll transactions
│   │   ├── Hazard.js               # Crowd-sourced potholes & flood reports
│   │   ├── NearMiss.js             # Telemetry deceleration & blackspot factors
│   │   ├── Blackspot.js            # AI predicted blackspots & recommendations
│   │   ├── Notification.js         # Multi-channel reminder messages
│   │   ├── Dispute.js              # Contested fines & adjudication logs
│   │   ├── FineRule.js             # Configurable fine amounts & due periods
│   │   ├── AuditLog.js             # Immutable legal event trail
│   │   └── DrivingSession.js       # Live telemetry snapshots & events
│   │
│   ├── routes/                     # 13 REST route controllers
│   ├── controllers/                # Business logic & error handling
│   ├── middleware/                 # JWT auth, RBAC, rate-limiting, uploads
│   ├── services/                   # Risk engine, adapters, PDF receipts, audit
│   ├── utils/                      # AES-256 encryption, logger, helpers
│   └── seed/
│       └── seedData.js             # Complete mock database generator
│
├── ai-service/
│   ├── main.py                     # FastAPI entry point & CORS
│   ├── requirements.txt            # Microservice dependencies
│   ├── api/
│   │   └── routes.py               # REST endpoints for risk, driver, road AI
│   ├── models/
│   │   └── schemas.py              # Pydantic validation schemas
│   └── services/
│       ├── risk_engine.py          # Python predictive risk scoring
│       ├── driver_monitor.py       # Facial landmarks & attention analyzer
│       ├── violation_detector.py   # Candidate extractor
│       ├── collision_risk.py       # Time-to-Collision (TTC) calculator
│       └── road_analyzer.py        # Surface quality & pothole analyzer
│
├── .gitignore
└── README.md
```

---

## 5. Step-by-Step Installation & Run Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher - verified on Node v24)
- **MongoDB Community Server** (running locally on port `27017`)
- **Python** (v3.10+ - verified on Python 3.14)
- Any modern web browser (Google Chrome, Microsoft Edge, Brave)

---

### Step A: Setup & Launch Backend
1. Open a terminal in the project directory:
   ```powershell
   cd drive-legal-ai\backend
   ```
2. Install npm dependencies:
   ```powershell
   npm install
   ```
3. Seed the database with demo accounts, configured fine rules, vehicles, and blackspots:
   ```powershell
   npm run seed
   ```
4. Start the backend API & Socket.IO server:
   ```powershell
   npm run dev
   # Or for standard run:
   npm start
   ```
   *The backend will boot on `http://127.0.0.1:5000`.*

---

### Step B: Setup & Launch Python AI Microservice (Optional / Dual Mode)
The backend includes built-in internal heuristic fallbacks so the application runs even if the Python service is offline. To launch the full FastAPI AI microservice:
1. Open a second terminal:
   ```powershell
   cd drive-legal-ai\ai-service
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install requirements:
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```powershell
   uvicorn main:app --reload --port 8000
   ```
   *The AI microservice will run on `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.*

---

### Step C: Open the Frontend
1. Open the project in VS Code or any static server.
2. Serve `drive-legal-ai/frontend/index.html` using VS Code **Live Server** (typically `http://127.0.0.1:5500/frontend/index.html` or `http://localhost:5500`).
3. Alternatively, because the Express backend serves static frontend files directly, you can also view the application directly in your browser at:
   ```
   http://127.0.0.1:5000/index.html
   ```

---

## 6. Project Viva & Real-Time Live Evaluation Flow

| Step | Action | What to Showcase in Project Viva |
| :---: | :--- | :--- |
| **STEP 1** | **User Login** | Go to `login.html`, click **Public**, click **Auto-Fill Credentials**, and click **Authenticate**. |
| **STEP 2** | **User Dashboard** | Review Safe Driver Score (`92/100`), registered vehicle, FASTag balance (`₹850`), and next road hazard alert. |
| **STEP 3** | **Start Live Drive** | Click **"Start Live AI Drive"** in the top bar to enter `live-drive.html`. |
| **STEP 4** | **Real-Time Webcam & Ocular Tracking** | Turn on webcam. The in-browser Computer Vision system tracks face orientation, gaze, and ocular blink duration at 60 FPS. Close your eyes for >1.5s to trigger real-time Drowsiness Alert and auto-snapshot! |
| **STEP 5** | **Throttle & GPS Tracking** | Use the interactive accelerator slider or device GPS to modulate speed. Exceeding 80 km/h triggers Overspeeding violation candidate with live audio alarm in English or Tamil. |
| **STEP 6** | **Select Weather / Scenario** | Click **"Heavy Rain"**. Risk increases to Moderate (`40/100`). Adaptive speed limit drops to 40 km/h. Voice co-driver sounds an alert. |
| **STEP 7** | **Instant Socket.IO Push** | As soon as violation triggers, the browser captures the exact canvas frame snapshot and emits a Socket.IO event to the backend. |
| **STEP 8** | **Switch to Police Portal** | In a second tab, open `police-dashboard.html` (`police@drivelegal.demo`). The police radar chime rings instantly and the new violation candidate appears live! |
| **STEP 9** | **Police Officer Review** | Click **"Review"** to inspect the real camera frame photo, AI confidence score (`94%+`), and GPS location metadata. |
| **STEP 10** | **Officer Approves Fine** | Select configured rule (`Overspeeding - Base ₹1500` or `Drowsy Driving`), add officer notes, and click **"Approve & Issue Fine"**. |
| **STEP 11** | **Escalation Notification** | Explain the multi-tier escalation: Level 1 In-App, Level 2 SMS, Level 3 WhatsApp, Level 4 Final Overdue Alert. |
| **STEP 12** | **User Opens Fine** | Switch back to commuter tab or open `fine-management.html`. The newly issued challan appears in real time without refreshing. |
| **STEP 13** | **Select Payment Method** | Click **"Pay"** to open `payments.html`. Select from **[ UPI ]**, **[ Google Pay ]**, **[ PhonePe ]**, or **[ FASTag Auto-Debit ]**. |
| **STEP 14** | **Complete Payment** | Click **"Complete Payment Clearance"**. The backend verifies the transaction reference securely. |
| **STEP 15** | **Fine Status Updates** | Fine status updates to **PAID / CLEARED**, and driver score gains +2 merit points. |
| **STEP 16** | **Download Official Receipt** | Click **"Download Official Receipt"**. Opens the cryptographic PDF challan clearance receipt generated dynamically via PDFKit with digital verification hash. |
| **STEP 17** | **Government Dashboard** | Log into `government-dashboard.html` (`gov@drivelegal.demo`). Observe real-time fine revenue charts, collection velocity, and district breakdown. |
| **STEP 18** | **Blackspots & Near-Misses** | Open `blackspots.html` and `road-map.html`. Show how near-miss hard-braking events (>0.6g) contribute to predicting high-fatality blackspots before accidents occur. |
| **STEP 19** | **Future Architecture** | Conclude with the transition roadmap to Edge AI boxes, V2V/V2X connected highway corridors, and Smart City Digital Twins. |

---

## 7. System Architecture & Research Extensions

- **Module 1 (Real-Time Vision Edge Layer):** Browser-level 60 FPS face detector & ocular luminance closure tracking with fallback to optical flow; Python FastAPI OpenCV / YOLO integration.
- **Module 2 (Risk Prediction Engine):** Multi-factor heuristic & explainable AI breakdown calculating instant 0-100 road risk scores.
- **Module 3 (Legal Verification Workflow):** Strict human-in-the-loop statutory gate preventing arbitrary algorithmic fines.
- **Module 4 (Real-Time Bidirectional Event Bus):** Duplex Socket.IO channels bridging vehicle edge sensors, commuter terminals, and police dispatchers.
- **Module 5 (Autonomous Citation & Clearance):** Configurable fine rules, multi-channel escalation reminders, mock UPI/FASTag clearance, and cryptographically verified PDF challans.
- **Module 6 (Near-Miss Intelligence & GIS):** GeoJSON blackspot clustering mapping high-deceleration shockwaves.

---

## 8. Limitations & Academic Disclaimer

1. **Academic Project:** This software is developed as a final year engineering capstone project (B.E./B.Tech) demonstrating predictive road safety and AI-assisted law enforcement.
2. **Third-Party Integrations:** All banking, FASTag (NPCI NETC), SMS, and WhatsApp integrations are designed with modular adapter interfaces running in resilient demonstration mode.
3. **AI Verification Notice:** In compliance with statutory legal safeguards, AI detections represent probabilistic estimations and do not constitute legal proof of liability without authorized officer verification and statutory due process.

---

## 9. Contributors & License

Developed for **Final Year Engineering Capstone Project** by **Dhinesh & Team**.  
Licensed under the **MIT License**.  
Licensed under the [MIT License](LICENSE).
