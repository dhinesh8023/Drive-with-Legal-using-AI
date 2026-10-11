const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const FineRule = require('../models/FineRule');
const Violation = require('../models/Violation');
const Fine = require('../models/Fine');
const Payment = require('../models/Payment');
const FastagAccount = require('../models/FastagAccount');
const Hazard = require('../models/Hazard');
const NearMiss = require('../models/NearMiss');
const Blackspot = require('../models/Blackspot');
const Notification = require('../models/Notification');
const Dispute = require('../models/Dispute');
const DrivingSession = require('../models/DrivingSession');
const AuditLog = require('../models/AuditLog');

const { generateId, getDueDate } = require('../utils/helpers');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/drive_legal_ai';
    console.log(`[Seed Engine] Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed Engine] Dropping stale database and clearing indexes...');
    try {
      await mongoose.connection.db.dropDatabase();
    } catch (e) {
      console.log('[Seed Engine] Initial database clean notice:', e.message);
    }

    console.log('[Seed Engine] Seeding Configured Fine Rules...');
    const fineRulesData = [
      {
        violationType: 'Overspeeding',
        code: 'VIO-SPD',
        baseFine: 1500,
        description: 'Exceeding zone speed limit by >15 km/h',
        severity: 'HIGH',
        pointsDeduction: 2,
        duePeriodDays: 15,
      },
      {
        violationType: 'Wrong-Side Driving',
        code: 'VIO-WSD',
        baseFine: 2500,
        description: 'Driving against designated flow of traffic corridor',
        severity: 'CRITICAL',
        pointsDeduction: 4,
        duePeriodDays: 15,
      },
      {
        violationType: 'Red-Light Violation',
        code: 'VIO-RLV',
        baseFine: 1000,
        description: 'Breaching stop line during red phase signal',
        severity: 'HIGH',
        pointsDeduction: 3,
        duePeriodDays: 15,
      },
      {
        violationType: 'Illegal Parking',
        code: 'VIO-ILP',
        baseFine: 500,
        description: 'Stationary vehicle in tow-away or emergency corridor',
        severity: 'LOW',
        pointsDeduction: 1,
        duePeriodDays: 15,
      },
      {
        violationType: 'Dangerous Driving',
        code: 'VIO-DND',
        baseFine: 3000,
        description: 'Reckless swerving or hazard endangerment',
        severity: 'CRITICAL',
        pointsDeduction: 5,
        duePeriodDays: 15,
      },
      {
        violationType: 'Lane Violation',
        code: 'VIO-LNV',
        baseFine: 800,
        description: 'Continuous lane straddling without indicator signaling',
        severity: 'MEDIUM',
        pointsDeduction: 1,
        duePeriodDays: 15,
      },
      {
        violationType: 'Helmet Violation',
        code: 'VIO-HLM',
        baseFine: 1000,
        description: 'Rider or pillion without certified safety helmet',
        severity: 'MEDIUM',
        pointsDeduction: 2,
        duePeriodDays: 15,
      },
      {
        violationType: 'Seatbelt Violation',
        code: 'VIO-SBT',
        baseFine: 1000,
        description: 'Driver or front passenger unbelted',
        severity: 'MEDIUM',
        pointsDeduction: 1,
        duePeriodDays: 15,
      },
      {
        violationType: 'Mobile Phone Usage',
        code: 'VIO-MPU',
        baseFine: 1500,
        description: 'Handheld phone usage while driving',
        severity: 'HIGH',
        pointsDeduction: 3,
        duePeriodDays: 15,
      },
      {
        violationType: 'Unauthorized Road Entry',
        code: 'VIO-URE',
        baseFine: 2000,
        description: 'Unauthorized access on restricted access expressway',
        severity: 'HIGH',
        pointsDeduction: 2,
        duePeriodDays: 15,
      },
      {
        violationType: 'Repeated Unsafe Driving',
        code: 'VIO-RUD',
        baseFine: 5000,
        description: 'Pattern of continuous erratic near-misses and infractions',
        severity: 'CRITICAL',
        pointsDeduction: 6,
        duePeriodDays: 10,
      },
    ];

    const fineRules = await FineRule.insertMany(fineRulesData);
    const ruleMap = {};
    fineRules.forEach((r) => (ruleMap[r.violationType] = r));

    console.log('[Seed Engine] Seeding Core Demo Accounts...');
    // Demo accounts requested in Prompt Section 47
    const primaryUsers = [
      {
        name: 'Arun Kumar (Demo Commuter)',
        email: 'user@drivelegal.demo',
        password: 'DemoPassword123!',
        role: 'USER',
        phone: '+91-9840112233',
        driverScore: 92,
        emergencyContacts: [{ name: 'Priya Kumar', relation: 'Spouse', phone: '+91-9840112244' }],
      },
      {
        name: 'Inspector Vikram Rathore',
        email: 'police@drivelegal.demo',
        password: 'DemoPassword123!',
        role: 'POLICE',
        phone: '+91-9876543201',
        officerId: 'POLICE-TN-8492',
        organizationId: 'TAMIL_NADU_TRAFFIC_POLICE',
        badgeNumber: 'TN-TP-409',
        department: 'Traffic Intelligence Unit',
      },
      {
        name: 'Dr. Shalini Venkat (Transport Commissioner)',
        email: 'gov@drivelegal.demo',
        password: 'DemoPassword123!',
        role: 'GOVERNMENT_STAFF',
        phone: '+91-9876543202',
        officerId: 'GOV-TN-1029',
        organizationId: 'MINISTRY_OF_ROAD_TRANSPORT',
        badgeNumber: 'MORT-HQ-88',
        department: 'Road Safety Analysis Division',
      },
      {
        name: 'System Super Administrator',
        email: 'admin@drivelegal.demo',
        password: 'DemoPassword123!',
        role: 'ADMIN',
        phone: '+91-9876543200',
        officerId: 'ADMIN-ROOT-001',
        organizationId: 'DRIVE_LEGAL_AI_CORE',
      },
    ];

    // 9 additional commuter users for 10 users total
    const additionalUsers = [
      { name: 'Karthik Raja', email: 'karthik.r@demo.com', phone: '+91-9840001001', driverScore: 84 },
      { name: 'Sneha Mohan', email: 'sneha.m@demo.com', phone: '+91-9840001002', driverScore: 95 },
      { name: 'Rajesh Sharma', email: 'rajesh.s@demo.com', phone: '+91-9840001003', driverScore: 68 },
      { name: 'Ananya Pillai', email: 'ananya.p@demo.com', phone: '+91-9840001004', driverScore: 89 },
      { name: 'Deepak Verma', email: 'deepak.v@demo.com', phone: '+91-9840001005', driverScore: 72 },
      { name: 'Meera Nambiar', email: 'meera.n@demo.com', phone: '+91-9840001006', driverScore: 91 },
      { name: 'Ganesh Iyer', email: 'ganesh.i@demo.com', phone: '+91-9840001007', driverScore: 79 },
      { name: 'Pooja Sundaram', email: 'pooja.s@demo.com', phone: '+91-9840001008', driverScore: 88 },
      { name: 'Vimal Chandran', email: 'vimal.c@demo.com', phone: '+91-9840001009', driverScore: 64 },
    ].map((u) => ({
      ...u,
      password: 'DemoPassword123!',
      role: 'USER',
      emergencyContacts: [{ name: 'Family Contact', relation: 'Family', phone: '+91-9840009999' }],
    }));

    // 2 additional police officers for 3 police total
    const additionalPolice = [
      {
        name: 'Sub-Inspector Anbarasu',
        email: 'officer.anbu@drivelegal.demo',
        password: 'DemoPassword123!',
        role: 'POLICE',
        phone: '+91-9876543215',
        officerId: 'POLICE-TN-8495',
        organizationId: 'TAMIL_NADU_TRAFFIC_POLICE',
        badgeNumber: 'TN-TP-412',
        department: 'Highway Patrol Division',
      },
      {
        name: 'Inspector Meenakshi',
        email: 'officer.meena@drivelegal.demo',
        password: 'DemoPassword123!',
        role: 'POLICE',
        phone: '+91-9876543216',
        officerId: 'POLICE-TN-8496',
        organizationId: 'TAMIL_NADU_TRAFFIC_POLICE',
        badgeNumber: 'TN-TP-415',
        department: 'CCTV Command Center',
      },
    ];

    // 1 additional government staff for 2 govt staff total
    const additionalGovt = [
      {
        name: 'Ramesh Krishnan (State Traffic Analyst)',
        email: 'analyst.ramesh@drivelegal.demo',
        password: 'DemoPassword123!',
        role: 'GOVERNMENT_STAFF',
        phone: '+91-9876543217',
        officerId: 'GOV-TN-1035',
        organizationId: 'SMART_CITY_URBAN_MOBILITY',
        badgeNumber: 'SCUM-STAFF-21',
        department: 'Blackspot Mitigation Cell',
      },
    ];

    const allUsersToCreate = [
      ...primaryUsers,
      ...additionalUsers,
      ...additionalPolice,
      ...additionalGovt,
    ];

    const createdUsers = [];
    for (const u of allUsersToCreate) {
      const created = await User.create(u);
      createdUsers.push(created);
    }

    const demoCommuter = createdUsers.find((u) => u.email === 'user@drivelegal.demo');
    const demoPolice = createdUsers.find((u) => u.email === 'police@drivelegal.demo');

    console.log('[Seed Engine] Seeding 15 Vehicles & FASTag Accounts...');
    const vehicleNumbers = [
      'TN09AB1234', 'TN07CD5678', 'KA01EF9012', 'KA03GH3456', 'DL01JK7890',
      'MH02LM1234', 'KL07NP5678', 'TN10QR9012', 'TN22ST3456', 'KA05UV7890',
      'TN02WX1234', 'TN01YZ5678', 'AP09AB9012', 'TS08CD3456', 'TN14EF7890',
    ];

    const vehicleBrands = [
      { brand: 'Hyundai', model: 'Creta', type: 'SUV' },
      { brand: 'Tata', model: 'Nexon EV', type: 'Electric Vehicle' },
      { brand: 'Honda', model: 'City', type: 'Car' },
      { brand: 'Maruti', model: 'Swift', type: 'Car' },
      { brand: 'Royal Enfield', model: 'Hunter 350', type: 'Two-Wheeler' },
      { brand: 'Kia', model: 'Seltos', type: 'SUV' },
      { brand: 'Toyota', model: 'Innova Crysta', type: 'Commercial' },
      { brand: 'Mahindra', model: 'XUV700', type: 'SUV' },
      { brand: 'Yamaha', model: 'FZ-S', type: 'Two-Wheeler' },
      { brand: 'Volkswagen', model: 'Taigun', type: 'SUV' },
      { brand: 'Tata', model: 'Harrier', type: 'SUV' },
      { brand: 'Honda', model: 'Activa 6G', type: 'Two-Wheeler' },
      { brand: 'Ashok Leyland', model: 'Transit Bus', type: 'Bus' },
      { brand: 'Tata', model: 'Prima 4028', type: 'Truck' },
      { brand: 'Skoda', model: 'Slavia', type: 'Car' },
    ];

    const createdVehicles = [];
    for (let i = 0; i < 15; i++) {
      const assignedUser = i < 2 ? demoCommuter : createdUsers[i % createdUsers.length];
      const vNum = vehicleNumbers[i];
      const meta = vehicleBrands[i];

      const v = await Vehicle.create({
        user: assignedUser._id,
        vehicleNumber: vNum,
        vehicleType: meta.type,
        brand: meta.brand,
        model: meta.model,
        year: 2022 + (i % 3),
        color: ['Polar White', 'Metallic Grey', 'Midnight Blue', 'Crimson Red'][i % 4],
        fastagId: `NETC-${vNum.replace(/\s+/g, '')}`,
        currentRiskScore: 12 + (i * 4) % 60,
      });

      createdVehicles.push(v);

      // FASTag Account
      await FastagAccount.create({
        fastagId: v.fastagId,
        user: assignedUser._id,
        vehicle: v._id,
        vehicleNumber: v.vehicleNumber,
        currentBalance: 1200 + (i * 250),
        transactions: [
          {
            transactionId: generateId('FTX'),
            type: 'WALLET_RECHARGE',
            amount: 2000,
            description: 'Monthly FASTag Auto-Topup',
            plazaName: 'Electronic City Toll Plaza',
            balanceAfter: 2000,
          },
          {
            transactionId: generateId('FTX'),
            type: 'TOLL_DEDUCTION',
            amount: 95,
            description: 'Toll plaza automated clearance',
            plazaName: 'OMR Navalur Toll Plaza',
            balanceAfter: 1905,
          },
        ],
      });
    }

    console.log('[Seed Engine] Seeding 20 Violations...');
    const violationTypes = [
      'Overspeeding', 'Wrong-Side Driving', 'Red-Light Violation', 'Mobile Phone Usage',
      'Lane Violation', 'Helmet Violation', 'Seatbelt Violation', 'Illegal Parking',
      'Dangerous Driving', 'Unauthorized Road Entry',
    ];

    const locations = [
      { name: 'Anna Salai / Guindy Junction', lat: 13.0067, lon: 80.2023 },
      { name: 'OMR Express Highway Km 14', lat: 12.8954, lon: 80.2272 },
      { name: 'Bengaluru Silk Board Flyover', lat: 12.9176, lon: 77.6238 },
      { name: 'Hosur Road Electronic City Phase 1', lat: 12.8452, lon: 77.6602 },
      { name: 'GST Road Kathipara Grade Separator', lat: 13.0094, lon: 80.2036 },
      { name: 'Chennai Bypass Porur Toll Gateway', lat: 13.0382, lon: 80.1565 },
      { name: 'Hebbal Flyover Airport Expressway', lat: 13.0358, lon: 77.5970 },
      { name: 'Coimbatore Avinashi Road Flyover', lat: 11.0168, lon: 76.9558 },
    ];

    const createdViolations = [];
    for (let i = 0; i < 20; i++) {
      const v = createdVehicles[i % createdVehicles.length];
      const vType = violationTypes[i % violationTypes.length];
      const loc = locations[i % locations.length];
      const vioId = `VIO-2026-${String(1000 + i).slice(1)}`;

      let reviewStatus = 'PENDING';
      let reviewedBy = null;
      let reviewedAt = null;

      if (i < 12) {
        reviewStatus = 'APPROVED';
        reviewedBy = demoPolice._id;
        reviewedAt = new Date(Date.now() - (20 - i) * 3600000 * 6);
      } else if (i === 12 || i === 13) {
        reviewStatus = 'REJECTED';
        reviewedBy = demoPolice._id;
        reviewedAt = new Date();
      }

      const vio = await Violation.create({
        violationId: vioId,
        user: v.user,
        vehicle: v._id,
        vehicleNumber: v.vehicleNumber,
        violationType: vType,
        location: loc.name,
        latitude: loc.lat,
        longitude: loc.lon,
        timestamp: new Date(Date.now() - (20 - i) * 86400000),
        aiConfidence: 86 + (i % 12),
        riskScore: 65 + (i % 30),
        detectionSource: i % 2 === 0 ? 'AI Smart Camera' : 'Highway Speed Sensor',
        aiAnalysisDetails: {
          speedRecorded: 78 + (i * 2),
          speedLimit: 60,
          weatherCondition: i % 3 === 0 ? 'Heavy Rain' : 'Clear Day',
          reasons: ['Sensor Velocity Spike', 'Lane Crossing Algorithm Trigger'],
        },
        reviewStatus,
        reviewedBy,
        reviewedAt,
        officerNotes: reviewStatus === 'APPROVED' ? 'Evidence verified. ANPR plate match 100%.' : '',
        isAiAssisted: true,
      });

      createdViolations.push(vio);
    }

    console.log('[Seed Engine] Seeding 15 Fines & 10 Payments...');
    const createdFines = [];
    for (let i = 0; i < 15; i++) {
      const vio = createdViolations[i];
      const rule = ruleMap[vio.violationType] || fineRules[0];
      const fineId = `DL-2026-${String(100 + i).slice(1)}`;

      let status = 'PENDING';
      if (i < 8) status = 'PAID';
      else if (i === 8 || i === 9) status = 'OVERDUE';
      else if (i === 10) status = 'DISPUTED';

      const fine = await Fine.create({
        fineId,
        violation: vio._id,
        user: vio.user,
        vehicle: vio.vehicle,
        vehicleNumber: vio.vehicleNumber,
        violationType: vio.violationType,
        fineRule: rule._id,
        fineAmount: rule.baseFine,
        dueDate: getDueDate(i < 8 ? -5 : 12),
        status,
        paymentStatus: status === 'PAID' ? 'PAID' : 'UNPAID',
        issuedByOfficer: demoPolice._id,
        notificationLevel: status === 'OVERDUE' ? 4 : status === 'PAID' ? 2 : 1,
      });

      vio.fine = fine._id;
      await vio.save();
      createdFines.push(fine);

      // Seed 10 payments for paid or recent fines
      if (i < 10) {
        const payMethods = ['UPI', 'Google Pay', 'PhonePe', 'FASTag'];
        const payMethod = payMethods[i % payMethods.length];
        const payId = generateId('PAY');

        const payment = await Payment.create({
          paymentId: payId,
          fine: fine._id,
          user: vio.user,
          amount: fine.fineAmount,
          paymentMethod: payMethod,
          transactionReference: `TXN_${Date.now()}_${payId.slice(-6)}`,
          status: 'SUCCESS',
          verificationStatus: 'VERIFIED',
          verifiedBy: 'GOVT_SETTLEMENT_GATEWAY',
          verifiedAt: new Date(),
        });

        fine.payment = payment._id;
        await fine.save();
      }
    }

    console.log('[Seed Engine] Seeding 10 Road Hazards...');
    const hazardTypes = [
      'Pothole', 'Construction Zone', 'Road Damage', 'Dangerous Blind Curve',
      'Flooding / Waterlogging', 'Faulty Traffic Light', 'Pothole',
      'Poor Visibility / Heavy Fog', 'Fallen Obstacle / Tree', 'Accident',
    ];

    for (let i = 0; i < 10; i++) {
      const loc = locations[i % locations.length];
      await Hazard.create({
        hazardId: `HAZ-2026-0${i + 1}`,
        reporter: demoCommuter._id,
        reporterName: demoCommuter.name,
        hazardType: hazardTypes[i],
        description: `Hazard detected on lane ${1 + (i % 3)}. Commuters advised to reduce speed.`,
        latitude: loc.lat + ((i - 5) * 0.003),
        longitude: loc.lon + ((i - 5) * 0.003),
        locationName: `${loc.name} - Segment ${i + 1}`,
        severity: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'][i % 4],
        reportCount: 1 + (i % 4),
        aiConfidence: 82 + (i % 15),
        status: 'ACTIVE',
      });
    }

    console.log('[Seed Engine] Seeding 10 Near-Miss Telemetry Records...');
    const nearMissEvents = [
      'Sudden Emergency Braking', 'Near Collision (Frontal)', 'Unsafe Blind Overtaking',
      'Pedestrian Jaywalking Risk', 'Abrupt Lane Departure', 'Wrong-Side Vehicle Avoidance',
      'Sudden Emergency Braking', 'Near Collision (Frontal)', 'Abrupt Lane Departure',
      'Pedestrian Jaywalking Risk',
    ];

    for (let i = 0; i < 10; i++) {
      const loc = locations[i % locations.length];
      await NearMiss.create({
        nearMissId: `NM-2026-${100 + i}`,
        user: createdVehicles[i].user,
        vehicleNumber: createdVehicles[i].vehicleNumber,
        eventType: nearMissEvents[i],
        severity: i % 2 === 0 ? 'HIGH' : 'CRITICAL',
        speedRecordedKmH: 62 + (i * 3),
        decelerationGForce: parseFloat((0.65 + (i * 0.04)).toFixed(2)),
        distanceToObstacleMeters: parseFloat((1.8 + (i * 0.2)).toFixed(1)),
        locationName: loc.name,
        latitude: loc.lat + 0.001,
        longitude: loc.lon + 0.001,
        weather: i % 2 === 0 ? 'Rain' : 'Clear',
        blackspotContributionScore: 12 + i,
      });
    }

    console.log('[Seed Engine] Seeding 5 Predictive Blackspots...');
    const blackspotsData = [
      {
        blackspotId: 'BLK-2026-01',
        roadName: 'Silk Board Junction Flyover Descent',
        district: 'Bengaluru South',
        state: 'Karnataka',
        latitude: 12.9176,
        longitude: 77.6238,
        riskScore: 89,
        riskLevel: 'CRITICAL',
        historicalAccidentsCount: 28,
        nearMissCount: 142,
        hazardReportsCount: 18,
        violationDensityScore: 92,
        primaryRiskFactors: ['Abrupt lane merging', 'Heavy traffic congestion', 'Blind descending curve'],
        recommendations: [
          'Improve Lane Markings and Rumble Strips',
          'Install Dynamic Electronic Warning Signs',
          'Deploy Smart Variable Speed Limits',
        ],
        aiConfidence: 94,
        status: 'SAFETY_AUDIT_RECOMMENDED',
      },
      {
        blackspotId: 'BLK-2026-02',
        roadName: 'Kathipara Grade Separator (Airport Merge Ramp)',
        district: 'Chennai Central',
        state: 'Tamil Nadu',
        latitude: 13.0094,
        longitude: 80.2036,
        riskScore: 82,
        riskLevel: 'CRITICAL',
        historicalAccidentsCount: 19,
        nearMissCount: 98,
        hazardReportsCount: 12,
        violationDensityScore: 84,
        primaryRiskFactors: ['High-speed merging', 'Low nighttime illumination', 'Blind cloverleaf entrance'],
        recommendations: [
          'Install High-Intensity LED Highway Illumination',
          'Deploy Smart Radar Speed Feedback Signs',
          'Review Speed Limit to 50 km/h on Cloverleaf',
        ],
        aiConfidence: 91,
        status: 'ACTIVE_WATCH',
      },
      {
        blackspotId: 'BLK-2026-03',
        roadName: 'OMR Sholinganallur Junction',
        district: 'Chennai IT Corridor',
        state: 'Tamil Nadu',
        latitude: 12.9010,
        longitude: 80.2279,
        riskScore: 76,
        riskLevel: 'HIGH',
        historicalAccidentsCount: 14,
        nearMissCount: 77,
        hazardReportsCount: 15,
        violationDensityScore: 79,
        primaryRiskFactors: ['Pedestrian crossing jaywalking', 'U-turn queue spillover', 'Two-wheeler wrong-side lane cuts'],
        recommendations: [
          'Construct Grade-Separated Pedestrian Foot Overbridge',
          'Re-align U-turn bay with physical concrete medians',
          'Increase AI CCTV surveillance on wrong-side entry',
        ],
        aiConfidence: 88,
        status: 'CIVIC_INTERVENTION_PLANNED',
      },
      {
        blackspotId: 'BLK-2026-04',
        roadName: 'Hosur Road Bommasandra Industrial Exit',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        latitude: 12.8184,
        longitude: 77.6912,
        riskScore: 73,
        riskLevel: 'HIGH',
        historicalAccidentsCount: 11,
        nearMissCount: 65,
        hazardReportsCount: 9,
        violationDensityScore: 71,
        primaryRiskFactors: ['Heavy commercial truck blind spots', 'Unpaved shoulder edge', 'Rain waterlogging'],
        recommendations: [
          'Inspect Road Surface and Shoulder Drainage',
          'Install Solar Raised Pavement Reflectors (Cat-eyes)',
          'Designate Exclusive Commercial Vehicle Lane',
        ],
        aiConfidence: 86,
        status: 'ACTIVE_WATCH',
      },
      {
        blackspotId: 'BLK-2026-05',
        roadName: 'Porur - Maduravoyal Bypass Service Lane Junction',
        district: 'Chennai West',
        state: 'Tamil Nadu',
        latitude: 13.0421,
        longitude: 80.1582,
        riskScore: 68,
        riskLevel: 'HIGH',
        historicalAccidentsCount: 8,
        nearMissCount: 52,
        hazardReportsCount: 11,
        violationDensityScore: 65,
        primaryRiskFactors: ['Unregulated service lane entry', 'Speed disparity between heavy and light vehicles'],
        recommendations: [
          'Install Acceleration Slip Lane',
          'Add Automated Warning Signage',
          'Increase Highway Patrol Presence',
        ],
        aiConfidence: 85,
        status: 'ACTIVE_WATCH',
      },
    ];

    await Blackspot.insertMany(blackspotsData);

    console.log('[Seed Engine] Seeding Notifications & Audit Logs...');
    await Notification.create({
      notificationId: generateId('NOTIF'),
      user: demoCommuter._id,
      fine: createdFines[0]._id,
      channel: 'IN_APP',
      title: 'Welcome to Drive Legal AI Platform',
      message: 'Your vehicle TN09AB1234 has been enrolled in predictive road safety surveillance.',
      reminderLevel: 1,
      status: 'DELIVERED',
      isRead: false,
    });

    await Dispute.create({
      disputeId: 'DSP-2026-001',
      fine: createdFines[10]._id,
      user: demoCommuter._id,
      reason: 'Traffic Police Manual Direction Override',
      description: 'Traffic constable on site manually signaled vehicles to bypass red light due to VIP motorcade.',
      status: 'PENDING',
      decisionHistory: [
        {
          action: 'DISPUTE_SUBMITTED',
          timestamp: new Date(),
          note: 'Commuter submitted dashcam evidence ref.',
        },
      ],
    });

    await AuditLog.create({
      actorId: demoPolice._id,
      actorName: demoPolice.name,
      actorRole: 'POLICE',
      action: 'SYSTEM_INITIALIZATION_SEED',
      targetType: 'SYSTEM',
      targetId: 'SEED_RUN_V1',
      details: { environment: 'Development / SIH 2026 Seed', recordsCreated: 100 },
      ipAddress: '127.0.0.1',
    });

    console.log(`
=====================================================
✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!
=====================================================
• Users created:           ${allUsersToCreate.length}
• Configured Fine Rules:   ${fineRulesData.length}
• Vehicles registered:     ${createdVehicles.length}
• Violations created:      ${createdViolations.length}
• Fines generated:         ${createdFines.length}
• Payments recorded:       10
• Road Hazards mapped:     10
• Near-Miss events logged: 10
• Blackspots predicted:    5

-----------------------------------------------------
DEMO LOGIN CREDENTIALS:
1. USER:        user@drivelegal.demo   | DemoPassword123!
2. POLICE:      police@drivelegal.demo | DemoPassword123!
3. GOVERNMENT:  gov@drivelegal.demo    | DemoPassword123!
4. ADMIN:       admin@drivelegal.demo  | DemoPassword123!
=====================================================
    `);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Engine Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
