/**
 * Seed script for Drive Legal AI (SIH 2026 prototype).
 * Populates realistic but FICTIONAL demo data — no real personal data.
 * Run with: npm run seed
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const FineRule = require("../models/FineRule");
const Violation = require("../models/Violation");
const Fine = require("../models/Fine");
const Payment = require("../models/Payment");
const FastagAccount = require("../models/FastagAccount");
const Hazard = require("../models/Hazard");
const NearMiss = require("../models/NearMiss");
const Blackspot = require("../models/Blackspot");

const { ROLES, VIOLATION_TYPES, VIOLATION_REVIEW_STATUS, FINE_STATUS, PAYMENT_STATUS, PAYMENT_METHODS, HAZARD_TYPES, HAZARD_SEVERITY, NEAR_MISS_TYPES, DETECTION_SOURCE } = require("../config/constants");

const COIMBATORE = { lat: 11.0168, lng: 76.9558 };

function jitter(base, spread = 0.05) {
  return base + (Math.random() - 0.5) * spread;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function clearCollections() {
  await Promise.all([
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    FineRule.deleteMany({}),
    Violation.deleteMany({}),
    Fine.deleteMany({}),
    Payment.deleteMany({}),
    FastagAccount.deleteMany({}),
    Hazard.deleteMany({}),
    NearMiss.deleteMany({}),
    Blackspot.deleteMany({}),
  ]);
  console.log("[SEED] Cleared existing demo collections.");
}

async function seedFineRules(adminUser) {
  const rules = [
    { violationType: VIOLATION_TYPES.OVERSPEEDING, baseFineAmount: 1000, description: "Exceeding posted speed limit (DEMO configured amount).", duePeriodDays: 15 },
    { violationType: VIOLATION_TYPES.WRONG_SIDE_DRIVING, baseFineAmount: 1500, description: "Driving against designated traffic direction (DEMO amount).", duePeriodDays: 15 },
    { violationType: VIOLATION_TYPES.RED_LIGHT_VIOLATION, baseFineAmount: 1200, description: "Crossing signal during red light (DEMO amount).", duePeriodDays: 15 },
    { violationType: VIOLATION_TYPES.ILLEGAL_PARKING, baseFineAmount: 500, description: "Parking in a no-parking zone (DEMO amount).", duePeriodDays: 10 },
    { violationType: VIOLATION_TYPES.DANGEROUS_DRIVING, baseFineAmount: 2000, description: "Rash or dangerous driving endangering others (DEMO amount).", duePeriodDays: 15 },
    { violationType: VIOLATION_TYPES.LANE_VIOLATION, baseFineAmount: 700, description: "Improper lane discipline (DEMO amount).", duePeriodDays: 10 },
    { violationType: VIOLATION_TYPES.HELMET_VIOLATION, baseFineAmount: 500, description: "Riding without a helmet (DEMO amount).", duePeriodDays: 10 },
    { violationType: VIOLATION_TYPES.SEATBELT_VIOLATION, baseFineAmount: 500, description: "Driving without a seatbelt (DEMO amount).", duePeriodDays: 10 },
    { violationType: VIOLATION_TYPES.MOBILE_PHONE_USAGE, baseFineAmount: 1000, description: "Using a mobile phone while driving (DEMO amount).", duePeriodDays: 15 },
    { violationType: VIOLATION_TYPES.UNAUTHORIZED_ROAD_ENTRY, baseFineAmount: 1500, description: "Entering a restricted/unauthorized road segment (DEMO amount).", duePeriodDays: 15 },
    { violationType: VIOLATION_TYPES.REPEATED_UNSAFE_DRIVING, baseFineAmount: 2500, description: "Pattern of repeated unsafe driving behaviour (DEMO amount).", duePeriodDays: 20 },
  ];

  const created = [];
  for (const r of rules) {
    const doc = await FineRule.create({ ...r, createdBy: adminUser._id, isActive: true });
    created.push(doc);
  }
  console.log(`[SEED] Created ${created.length} fine rules (DEMO configured amounts).`);
  return created;
}

async function seedUsers() {
  const demoPassword = "DemoPassword123!";

  const admin = await User.create({
    name: "System Administrator",
    email: "admin@drivelegal.demo",
    phone: "9000000001",
    passwordHash: demoPassword,
    role: ROLES.ADMIN,
    isStaffApproved: true,
  });

  const policeOfficers = [];
  const policeNames = ["Officer Arun Kumar", "Officer Priya Ramesh", "Officer Suresh Babu"];
  for (let i = 0; i < policeNames.length; i++) {
    const officer = await User.create({
      name: policeNames[i],
      email: i === 0 ? "police@drivelegal.demo" : `police${i + 1}@drivelegal.demo`,
      phone: `900000001${i}`,
      passwordHash: demoPassword,
      role: ROLES.POLICE,
      officerId: `PO-DEMO-${1000 + i}`,
      organizationId: "TN-TRAFFIC-POLICE-DEMO",
      department: "Traffic Enforcement",
      designation: "Sub Inspector",
      isStaffApproved: true,
    });
    policeOfficers.push(officer);
  }

  const govStaff = [];
  const govNames = ["Staff Lakshmi Narayanan", "Staff Karthik Subramaniam"];
  for (let i = 0; i < govNames.length; i++) {
    const staff = await User.create({
      name: govNames[i],
      email: i === 0 ? "gov@drivelegal.demo" : `gov${i + 1}@drivelegal.demo`,
      phone: `900000002${i}`,
      passwordHash: demoPassword,
      role: ROLES.GOVERNMENT_STAFF,
      officerId: `GS-DEMO-${2000 + i}`,
      organizationId: "TN-ROAD-SAFETY-DEPT-DEMO",
      department: "Road Safety & Analytics",
      designation: "Road Safety Analyst",
      isStaffApproved: true,
    });
    govStaff.push(staff);
  }

  const users = [];
  const userNames = [
    "Aarav Sharma", "Divya Krishnan", "Rahul Menon", "Sneha Iyer", "Vignesh Raj",
    "Ananya Pillai", "Karthikeyan S", "Meera Nair", "Rohit Varma", "Kavya Reddy",
  ];
  for (let i = 0; i < userNames.length; i++) {
    const user = await User.create({
      name: userNames[i],
      email: i === 0 ? "user@drivelegal.demo" : `user${i + 1}@drivelegal.demo`,
      phone: `90000003${String(i).padStart(2, "0")}`,
      passwordHash: demoPassword,
      role: ROLES.USER,
      licenseNumber: `TN-DL-${100000 + i}`,
      safeDriverScore: Math.floor(60 + Math.random() * 40),
    });
    users.push(user);
  }

  console.log(`[SEED] Created 1 admin, ${policeOfficers.length} police officers, ${govStaff.length} government staff, ${users.length} public users.`);
  return { admin, policeOfficers, govStaff, users };
}

async function seedVehicles(users) {
  const vehicleTypes = ["TWO_WHEELER", "FOUR_WHEELER", "COMMERCIAL"];
  const brands = ["Maruti Suzuki", "Hyundai", "Tata", "Honda", "TVS", "Bajaj", "Mahindra"];
  const vehicles = [];

  for (let i = 0; i < 15; i++) {
    const owner = randomFrom(users);
    const vehicle = await Vehicle.create({
      owner: owner._id,
      vehicleNumber: `TN37${String.fromCharCode(65 + (i % 26))}${String(1000 + i)}`,
      vehicleType: randomFrom(vehicleTypes),
      brand: randomFrom(brands),
      model: `Model-${i + 1}`,
      year: 2018 + (i % 7),
      fastagId: `FASTAG-DEMO-${5000 + i}`,
      insurance: { provider: "Demo General Insurance", policyNumber: `POL-DEMO-${9000 + i}`, validTill: new Date(Date.now() + 200 * 86400000) },
      registration: { rtoCode: "TN-37", registeredOn: new Date(2018 + (i % 7), 0, 1), validTill: new Date(2033, 0, 1) },
    });
    vehicles.push(vehicle);

    await FastagAccount.create({
      user: owner._id,
      vehicle: vehicle._id,
      fastagId: vehicle.fastagId,
      demoBalance: 300 + Math.floor(Math.random() * 700),
      transactions: [
        { type: "RECHARGE", amount: 500, description: "Initial demo recharge", balanceAfter: 500 },
      ],
    });
  }

  console.log(`[SEED] Created ${vehicles.length} vehicles with linked FASTag demo accounts.`);
  return vehicles;
}

async function seedViolationsAndFines(users, vehicles, policeOfficers, fineRules) {
  const violationTypes = Object.values(VIOLATION_TYPES);
  const districts = ["Coimbatore", "Salem", "Erode", "Tiruppur"];
  const violations = [];
  const fines = [];
  const payments = [];
  let fineCounter = 1;

  for (let i = 0; i < 20; i++) {
    const user = randomFrom(users);
    const vehicle = randomFrom(vehicles.filter((v) => v.owner.toString() === user._id.toString())) || randomFrom(vehicles);
    const violationType = randomFrom(violationTypes);
    const daysAgo = Math.floor(Math.random() * 30);

    const violation = await Violation.create({
      user: user._id,
      vehicle: vehicle._id,
      vehicleNumber: vehicle.vehicleNumber,
      violationType,
      location: {
        address: `${randomFrom(districts)} Highway Stretch ${i + 1}`,
        latitude: jitter(COIMBATORE.lat),
        longitude: jitter(COIMBATORE.lng),
        roadName: `NH-${44 + (i % 5)}`,
        district: randomFrom(districts),
      },
      occurredAt: new Date(Date.now() - daysAgo * 86400000),
      evidence: { imageUrl: `/demo-evidence/violation-${i + 1}.jpg` },
      aiConfidence: Number((0.75 + Math.random() * 0.24).toFixed(2)),
      riskScoreAtDetection: Math.floor(40 + Math.random() * 60),
      detectionSource: DETECTION_SOURCE.AI_CAMERA,
      reviewStatus: VIOLATION_REVIEW_STATUS.PENDING_REVIEW,
    });
    violations.push(violation);

    // Roughly 15 of 20 get reviewed & fined (leaving some PENDING_REVIEW for the police demo)
    if (i < 15) {
      const officer = randomFrom(policeOfficers);
      violation.reviewStatus = VIOLATION_REVIEW_STATUS.APPROVED;
      violation.reviewedBy = officer._id;
      violation.reviewedAt = new Date(violation.occurredAt.getTime() + 3600000);
      violation.officerNotes = "Evidence reviewed and confirmed. Approved for fine generation.";

      const rule = fineRules.find((r) => r.violationType === violationType);
      const dueDate = new Date(Date.now() + rule.duePeriodDays * 86400000);

      const fine = await Fine.create({
        fineCode: `DL-2026-${String(fineCounter).padStart(4, "0")}`,
        violation: violation._id,
        fineRule: rule._id,
        user: user._id,
        vehicle: vehicle._id,
        amount: rule.baseFineAmount,
        dueDate,
        status: i < 10 ? FINE_STATUS.PAID : FINE_STATUS.PENDING,
        generatedBy: officer._id,
      });
      fineCounter++;

      violation.fine = fine._id;
      violation.fineGenerated = true;
      fines.push(fine);

      if (fine.status === FINE_STATUS.PAID) {
        const payment = await Payment.create({
          fine: fine._id,
          user: user._id,
          amount: fine.amount,
          method: randomFrom(Object.values(PAYMENT_METHODS)),
          transactionReference: `DEMO-TXN-${8000 + fineCounter}`,
          status: PAYMENT_STATUS.SUCCESS,
          verifiedAt: new Date(),
          verifiedBy: "SYSTEM",
          isDemo: true,
        });
        fine.payment = payment._id;
        await fine.save();
        payments.push(payment);
      }
    }

    await violation.save();
  }

  console.log(`[SEED] Created ${violations.length} violations, ${fines.length} fines, ${payments.length} payments.`);
  return { violations, fines, payments };
}

async function seedHazardsNearMissesBlackspots(users) {
  const hazardTypes = Object.values(HAZARD_TYPES);
  const hazards = [];
  for (let i = 0; i < 10; i++) {
    hazards.push(
      await Hazard.create({
        reportedBy: randomFrom(users)._id,
        hazardType: randomFrom(hazardTypes),
        severity: randomFrom(Object.values(HAZARD_SEVERITY)),
        description: `Demo-reported hazard near stretch ${i + 1}.`,
        location: { latitude: jitter(COIMBATORE.lat, 0.1), longitude: jitter(COIMBATORE.lng, 0.1), address: `Demo Road Segment ${i + 1}` },
        confidenceScore: Number((0.5 + Math.random() * 0.4).toFixed(2)),
      })
    );
  }

  const nearMissTypes = Object.values(NEAR_MISS_TYPES);
  const nearMisses = [];
  for (let i = 0; i < 10; i++) {
    nearMisses.push(
      await NearMiss.create({
        user: randomFrom(users)._id,
        eventType: randomFrom(nearMissTypes),
        location: { latitude: jitter(COIMBATORE.lat, 0.1), longitude: jitter(COIMBATORE.lng, 0.1), roadName: `NH-${44 + (i % 5)}` },
        context: {
          trafficDensity: randomFrom(["LOW", "MODERATE", "HIGH"]),
          roadCondition: randomFrom(["DRY", "WET", "DAMAGED"]),
          weather: randomFrom(["CLEAR", "RAIN", "FOG"]),
          speedAtEvent: Math.floor(40 + Math.random() * 60),
        },
        occurredAt: new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000),
      })
    );
  }

  const blackspots = [];
  for (let i = 0; i < 5; i++) {
    const riskPct = Math.floor(50 + Math.random() * 50);
    blackspots.push(
      await Blackspot.create({
        location: { latitude: jitter(COIMBATORE.lat, 0.15), longitude: jitter(COIMBATORE.lng, 0.15), roadName: `NH-${44 + i}`, district: "Coimbatore" },
        riskPercentage: riskPct,
        riskLevel: riskPct >= 80 ? "CRITICAL" : riskPct >= 60 ? "HIGH" : "MODERATE",
        contributingFactors: {
          historicalAccidentCount: Math.floor(Math.random() * 10),
          nearMissCount: Math.floor(Math.random() * 15),
          hazardReportCount: Math.floor(Math.random() * 8),
          violationDensity: Math.floor(Math.random() * 20),
          trafficFactor: Math.floor(Math.random() * 10),
          weatherFactor: Math.floor(Math.random() * 10),
        },
        recommendations: [
          "Improve lane markings",
          "Install warning signs",
          "Inspect road surface",
          "Review speed limit",
        ],
      })
    );
  }

  console.log(`[SEED] Created ${hazards.length} hazards, ${nearMisses.length} near-misses, ${blackspots.length} blackspot predictions.`);
}

async function run() {
  await connectDB();
  console.log("\n=== DRIVE LEGAL AI — SEEDING DEMO DATA ===\n");

  await clearCollections();

  const { admin, policeOfficers, govStaff, users } = await seedUsers();
  const fineRules = await seedFineRules(admin);
  const vehicles = await seedVehicles(users);
  await seedViolationsAndFines(users, vehicles, policeOfficers, fineRules);
  await seedHazardsNearMissesBlackspots(users);

  console.log("\n=== SEEDING COMPLETE ===");
  console.log("\nDemo accounts (development/demo only — change before any production use):");
  console.log("  USER       user@drivelegal.demo       DemoPassword123!");
  console.log("  POLICE     police@drivelegal.demo     DemoPassword123!");
  console.log("  GOVERNMENT gov@drivelegal.demo         DemoPassword123!");
  console.log("  ADMIN      admin@drivelegal.demo       DemoPassword123!\n");

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("[SEED] Failed:", err);
  process.exit(1);
});
