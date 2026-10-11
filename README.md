# 🚗 DRIVE LEGAL AI

> **“See the Danger Before the Driver Does.”**  
> *From Reactive Road Safety to Predictive Road Safety.*  
> **Smart India Hackathon 2026 Grand Finalist Architecture**

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

For instant Smart India Hackathon evaluation, the database includes pre-configured demo credentials:

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
│   ├── index.html                  # Landing page & SIH concept showcase
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

## 6. Official Smart India Hackathon (SIH 2026) 5-10 Minute Demo Flow

| Step | Action | What to Showcase to Judges |
| :---: | :--- | :--- |
| **STEP 1** | **User Login** | Go to `login.html`, click **Public**, click **Auto-Fill Credentials**, and click **Authenticate**. |
| **STEP 2** | **User Dashboard** | Review Safe Driver Score (`92/100`), registered vehicle, FASTag balance (`₹2,500`), and next road hazard alert. |
| **STEP 3** | **Start Live Drive** | Click **"Start Live AI Drive"** in the top bar to enter `live-drive.html`. |
| **STEP 4** | **Normal Driving** | Point out the Horizon perspective road animation, AR HUD telemetry, and risk status = **SAFE (15/100)**. |
| **STEP 5** | **Select Heavy Rain** | Click **"Heavy Rain"**. Risk increases to Moderate (`40/100`). Adaptive speed limit drops to 40 km/h. Voice co-driver sounds an alert. |
| **STEP 6** | **Select Drowsiness / Distraction** | Click **"Drowsiness"**. Driver attention score plunges to 25%. Explainable AI breakdown shows `+35 Driver Drowsiness`. Voice co-driver warns driver to pull over. |
| **STEP 7** | **Select Overspeeding** | Click **"Overspeeding"**. Speed increases to 92 km/h. Risk skyrockets to Critical (`85/100`). Voice warning plays in English or Tamil. |
| **STEP 8** | **AI Detects Violation Candidate** | Point out the toast: *"AI Violation Candidate Captured: Overspeeding candidate forwarded to Police Portal for Officer Review"*. |
| **STEP 9** | **Switch to Police Portal** | Log out, select **Police** tab, click **Auto-Fill Credentials** (`police@drivelegal.demo`), and log in to `police-dashboard.html`. |
| **STEP 10** | **Police Officer Review** | Point out the new candidate in the table. Click **"Review"** to inspect photographic frame, AI confidence (`94%`), and detection metadata. |
| **STEP 11** | **Officer Approves Fine** | Select configured rule (`Overspeeding - Base ₹1500`), add officer notes, and click **"Approve & Issue Fine"**. |
| **STEP 12** | **Escalation Notification** | Explain the multi-tier escalation: Level 1 In-App, Level 2 SMS, Level 3 WhatsApp, Level 4 Final Overdue Alert. |
| **STEP 13** | **User Opens Fine** | Switch back to commuter login or open `fine-management.html`. See the newly generated official fine ticket. |
| **STEP 14** | **Select Payment Method** | Click **"Pay"** to open `payments.html`. Show payment methods: **[ UPI ]**, **[ Google Pay ]**, **[ PhonePe ]**, **[ FASTag Auto ]**. |
| **STEP 15** | **Complete Payment** | Click **"Complete Payment Clearance"**. |
| **STEP 16** | **Backend Verification** | The banking switch verifies transaction reference `TXN_...` on the backend (never trusting frontend client alone). |
| **STEP 17** | **Fine Status Updates** | Fine status updates to **PAID / CLEARED**, and driver score gains +2 merit points. |
| **STEP 18** | **Download Official Receipt** | Click **"Download Official Receipt"**. Opens the tamper-evident PDF digital receipt generated via PDFKit with digital verification hash. |
| **STEP 19** | **Government Dashboard** | Log into `government-dashboard.html` (`gov@drivelegal.demo`). Observe real-time fine revenue charts, collection velocity, and district breakdown. |
| **STEP 20** | **Blackspots & Near-Misses** | Open `blackspots.html` and `road-map.html`. Show how near-miss hard-braking events (>0.6g) contribute to predicting high-fatality blackspots before accidents occur. |
| **STEP 21** | **Future Vision** | Conclude with the transition roadmap to Edge AI, V2V/V2X connected highway corridors, and Smart City Digital Twins. |

---

## 7. Future Development Roadmap

- **Phase 1 (Current SIH Prototype):** HTML5/CSS3/Vanilla JS, Node.js Express, MongoDB, FastAPI microservice, explainable risk engine, officer verification, digital receipts, mock FASTag & payments.
- **Phase 2 (Real AI Integration):** Edge YOLOv9 model inference, MediaPipe facial landmarks for eye-aspect ratio (EAR) drowsiness detection, and OpenCV Hough lane departure tracking.
- **Phase 3 (Mobile Application):** Cross-platform Flutter / React Native application leveraging phone gyroscopes, accelerometers, GPS, and dashcam mounting.
- **Phase 4 (Edge AI Box):** Microcontroller / Raspberry Pi / NVIDIA Jetson onboard compute box eliminating cellular latency.
- **Phase 5 (V2V - Vehicle-to-Vehicle):** Dedicated Short-Range Communications (DSRC) broadcasting sudden braking events to trailing vehicles within 300 meters.
- **Phase 6 (V2X - Vehicle-to-Infrastructure):** Smart traffic light priority signaling for ambulances and emergency responders.
- **Phase 7 (Digital Twin Cities):** Comprehensive simulation model predicting road fatigue, monsoon waterlogging, and traffic signal timings.

---

## 8. Limitations & Legal Disclaimer

1. **Prototype Disclaimer:** This software is developed as an academic and engineering prototype for the Smart India Hackathon 2026.
2. **Non-Official Branding:** All banking, FASTag (NPCI NETC), SMS, and WhatsApp integrations are mock adapters running in demonstration mode. No real monetary transactions or government legal summons are dispatched.
3. **AI Assistance Notice:** AI detections represent probabilistic estimations and do not constitute legal proof of liability without authorized officer verification and statutory due process.

---

## 9. Contributors & License

Developed with passion for **Smart India Hackathon 2026** by the **Drive Legal AI Team**.  
Licensed under the [MIT License](LICENSE).
