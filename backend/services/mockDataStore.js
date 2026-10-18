/**
 * DRIVE LEGAL AI — IN-MEMORY DEMO DATA STORE
 * Ensures 100% functionality on serverless (Vercel) & offline environments
 * without requiring an external MongoDB database instance.
 */

const DEMO_USERS = [
  {
    _id: '6ac8f3d710484a3e71b2146b',
    name: 'Arun Kumar (Demo Commuter)',
    email: 'user@drivelegal.demo',
    password: 'DemoPassword123!',
    role: 'USER',
    phone: '+91-9840112233',
    driverScore: 92,
    badgeNumber: null,
    officerId: null,
    organizationId: null,
    isActive: true,
    isApproved: true,
  },
  {
    _id: '6ac8f3d810484a3e71b2147d',
    name: 'Inspector Vikram Rathore',
    email: 'police@drivelegal.demo',
    password: 'DemoPassword123!',
    role: 'POLICE',
    phone: '+91-9876543201',
    officerId: 'POLICE-TN-8492',
    organizationId: 'TAMIL_NADU_TRAFFIC_POLICE',
    badgeNumber: 'TN-TP-409',
    department: 'Traffic Intelligence Unit',
    driverScore: 98,
    isActive: true,
    isApproved: true,
  },
  {
    _id: '6ac8f3d910484a3e71b2148a',
    name: 'Dr. Shalini Venkat (Transport Commissioner)',
    email: 'gov@drivelegal.demo',
    password: 'DemoPassword123!',
    role: 'GOVERNMENT_STAFF',
    phone: '+91-9876543202',
    officerId: 'GOV-TN-1029',
    organizationId: 'MINISTRY_OF_ROAD_TRANSPORT',
    badgeNumber: 'MORT-HQ-88',
    department: 'Road Safety Analysis Division',
    driverScore: 95,
    isActive: true,
    isApproved: true,
  },
  {
    _id: '6ac8f3da10484a3e71b2149c',
    name: 'System Super Administrator',
    email: 'admin@drivelegal.demo',
    password: 'DemoPassword123!',
    role: 'ADMIN',
    phone: '+91-9876543200',
    officerId: 'ADMIN-ROOT-001',
    organizationId: 'DRIVE_LEGAL_AI_CORE',
    badgeNumber: 'ADM-SYS-001',
    driverScore: 100,
    isActive: true,
    isApproved: true,
  },
];

const DEMO_VEHICLES = [
  {
    _id: 'veh_001',
    userId: '6ac8f3d710484a3e71b2146b',
    vehicleNumber: 'TN-09-CB-1234',
    vehicleType: 'Car',
    brand: 'Tata',
    model: 'Nexon EV',
    year: 2024,
    color: 'Daytona Grey',
    fastagId: 'FTAG-8829-1092',
    insurancePolicyNumber: 'POL-ICICI-99281',
    insuranceExpiryDate: '2027-05-15',
    pollutionCertExpiryDate: '2026-12-30',
    isPrimary: true,
  },
  {
    _id: 'veh_002',
    userId: '6ac8f3d710484a3e71b2146b',
    vehicleNumber: 'TN-07-BQ-5678',
    vehicleType: 'Two-Wheeler',
    brand: 'Ather',
    model: '450X',
    year: 2023,
    color: 'Space Grey',
    fastagId: 'FTAG-3312-9844',
    insurancePolicyNumber: 'POL-HDFC-33219',
    insuranceExpiryDate: '2027-01-20',
    pollutionCertExpiryDate: '2026-11-15',
    isPrimary: false,
  },
];

const DEMO_FINES = [
  {
    _id: 'fine_001',
    fineId: 'FN-2026-0081',
    violationId: 'VIO-2026-901',
    userId: '6ac8f3d710484a3e71b2146b',
    vehicleNumber: 'TN-09-CB-1234',
    violationType: 'Overspeeding',
    fineAmount: 1500,
    status: 'PENDING',
    dueDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    location: 'OMR Expressway - Sholinganallur Junction',
    issuedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    description: 'Vehicle recorded at 88 km/h in a 60 km/h corridor by AI Radar.',
  },
  {
    _id: 'fine_002',
    fineId: 'FN-2026-0045',
    violationId: 'VIO-2026-872',
    userId: '6ac8f3d710484a3e71b2146b',
    vehicleNumber: 'TN-09-CB-1234',
    violationType: 'Seatbelt Violation',
    fineAmount: 1000,
    status: 'PAID',
    dueDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    location: 'Anna Salai Near Guindy Overpass',
    issuedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    paymentMethod: 'UPI',
    transactionId: 'TXN-UPI-9928172',
    description: 'Driver observed without safety restraint via optical AI node.',
  },
];

const DEMO_VIOLATIONS = [
  {
    _id: 'vio_001',
    violationId: 'VIO-2026-901',
    vehicleNumber: 'TN-09-CB-1234',
    violationType: 'Overspeeding',
    speedRecorded: 88,
    speedLimit: 60,
    location: 'OMR Expressway - Sholinganallur Junction',
    aiConfidence: 96,
    riskScore: 78,
    status: 'APPROVED',
    fineIssued: true,
    fineAmount: 1500,
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    evidenceImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80',
  },
  {
    _id: 'vio_002',
    violationId: 'VIO-2026-902',
    vehicleNumber: 'TN-01-AL-9988',
    violationType: 'Red-Light Violation',
    speedRecorded: 42,
    speedLimit: 50,
    location: 'T. Nagar Panagal Park Intersection',
    aiConfidence: 93,
    riskScore: 84,
    status: 'PENDING_REVIEW',
    fineIssued: false,
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    evidenceImage: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80',
  },
  {
    _id: 'vio_003',
    violationId: 'VIO-2026-903',
    vehicleNumber: 'TN-22-CY-4411',
    violationType: 'Mobile Phone Usage',
    location: 'GST Road Airport Flyover Approach',
    aiConfidence: 89,
    riskScore: 82,
    status: 'PENDING_REVIEW',
    fineIssued: false,
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    evidenceImage: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=600&q=80',
  },
  {
    _id: 'vio_004',
    violationId: 'VIO-2026-904',
    vehicleNumber: 'TN-05-MK-7722',
    violationType: 'Wrong-Side Driving',
    location: 'Mount-Poonamallee Road Medavakkam Cut',
    aiConfidence: 98,
    riskScore: 95,
    status: 'APPROVED',
    fineIssued: true,
    fineAmount: 2500,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    evidenceImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80',
  },
];

const DEMO_HAZARDS = [
  {
    _id: 'haz_001',
    hazardType: 'Pothole Cluster',
    severity: 'HIGH',
    locationName: 'OMR Karapakkam Lane 2',
    latitude: 12.9152,
    longitude: 80.2295,
    description: 'Deep road depression detected by crowd-sourced vehicular gyro sensors.',
    status: 'ACTIVE',
    reportedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    _id: 'haz_002',
    hazardType: 'Water Logging',
    severity: 'MEDIUM',
    locationName: 'Velachery Bypass Road Service Lane',
    latitude: 12.9784,
    longitude: 80.2201,
    description: 'Water accumulation following local convective rainfall.',
    status: 'ACTIVE',
    reportedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    _id: 'haz_003',
    hazardType: 'Oil Spill / Slick',
    severity: 'CRITICAL',
    locationName: 'Maduravoyal Cloverleaf Ramp B',
    latitude: 13.0642,
    longitude: 80.1654,
    description: 'Slippery diesel slick on curved deceleration ramp.',
    status: 'ACTIVE',
    reportedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

const DEMO_FASTAG = {
  walletId: 'FT-WLT-992182',
  userId: '6ac8f3d710484a3e71b2146b',
  currentBalance: 850.0,
  thresholdLimit: 200.0,
  autoDebitFineAllowed: false,
  linkedTag: 'FTAG-8829-1092',
  transactions: [
    {
      tollPlaza: 'Perungudi OMR Toll Plaza',
      amount: 45.0,
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      status: 'SUCCESS',
    },
    {
      tollPlaza: 'Navalur Toll Plaza',
      amount: 35.0,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'SUCCESS',
    },
  ],
};

const mockDataStore = {
  users: [...DEMO_USERS],
  vehicles: [...DEMO_VEHICLES],
  fines: [...DEMO_FINES],
  violations: [...DEMO_VIOLATIONS],
  hazards: [...DEMO_HAZARDS],
  fastag: { ...DEMO_FASTAG },

  findUserByEmail(email) {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    return this.users.find((u) => u.email.toLowerCase() === clean) || null;
  },

  findUserById(id) {
    if (!id) return null;
    const strId = id.toString();
    return this.users.find((u) => u._id.toString() === strId) || null;
  },

  createUser(userData) {
    const newUser = {
      _id: 'user_' + Date.now().toString(16),
      name: userData.name || 'Commuter',
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: userData.role || 'USER',
      phone: userData.phone || '+91-9800000000',
      driverScore: 90,
      badgeNumber: userData.badgeNumber || null,
      officerId: userData.officerId || null,
      organizationId: userData.organizationId || null,
      isActive: true,
      isApproved: true,
    };
    this.users.push(newUser);
    return newUser;
  },
};

module.exports = mockDataStore;
