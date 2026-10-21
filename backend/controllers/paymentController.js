const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Fine = require('../models/Fine');
const User = require('../models/User');
const mockDataStore = require('../services/mockDataStore');
const paymentAdapter = require('../services/paymentAdapter');
const fastagService = require('../services/fastagService');
const fraudService = require('../services/fraudDetectionService');
const { generateFineReceiptPdf } = require('../services/pdfReceiptService');
const { recordAudit } = require('../services/auditService');
const { generateId } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Initiate a digital payment checkout session
 * @route   POST /api/payments/create
 */
const initiatePayment = async (req, res, next) => {
  try {
    const { fineId, paymentMethod } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const mockFine = mockDataStore.fines.find((f) => f._id === fineId || f.fineId === fineId) || mockDataStore.fines[0];
      return res.status(200).json({
        success: true,
        message: 'Payment session created (Demo Gateway)',
        data: {
          paymentId: 'PAY-' + Date.now(),
          amount: mockFine.fineAmount,
          fineId: mockFine.fineId,
          gatewayOrderId: 'ORDER-' + Date.now(),
          qrCodeData: 'upi://pay?pa=trafficpolice@sbi&pn=DriveLegalAI&am=' + mockFine.fineAmount,
        },
      });
    }

    const fine = await Fine.findById(fineId);
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine record not found' });
    }

    if (fine.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'This fine has already been settled and verified.',
      });
    }

    // Fraud & Anomaly Pre-check
    const anomalyCheck = await fraudService.checkPaymentAnomaly({
      fineId: fine._id,
      userId: req.user._id,
      amount: fine.fineAmount,
    });

    if (anomalyCheck.isAnomaly) {
      return res.status(400).json({
        success: false,
        message: anomalyCheck.message,
        recommendedAction: anomalyCheck.recommendedAction,
      });
    }

    const session = await paymentAdapter.createPaymentSession({
      fineId: fine.fineId,
      amount: fine.fineAmount,
      method: paymentMethod || 'UPI',
      userEmail: req.user.email,
      phone: req.user.phone,
    });

    const payment = await Payment.create({
      paymentId: generateId('PAY'),
      fine: fine._id,
      user: req.user._id,
      amount: fine.fineAmount,
      paymentMethod: paymentMethod || 'UPI',
      transactionReference: session.transactionReference,
      status: 'INITIATED',
      verificationStatus: 'PENDING',
    });

    res.status(200).json({
      success: true,
      message: 'Payment intent session initialized',
      data: {
        paymentId: payment.paymentId,
        transactionReference: session.transactionReference,
        amount: fine.fineAmount,
        method: paymentMethod,
        checkoutToken: session.checkoutToken,
        upiIntentUrl: session.upiIntentUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify and settle digital fine payment
 * @route   POST /api/payments/verify
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { transactionReference, paymentId } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const mockFine = mockDataStore.fines.find((f) => f.status === 'PENDING') || mockDataStore.fines[0];
      mockFine.status = 'PAID';
      mockFine.paidAt = new Date().toISOString();
      return res.status(200).json({
        success: true,
        message: 'Payment successfully verified and fine settled.',
        data: {
          paymentId: paymentId || 'PAY-' + Date.now(),
          fineId: mockFine.fineId,
          amount: mockFine.fineAmount,
          status: 'SUCCESS',
          receiptUrl: `/api/payments/receipt/${mockFine._id}`,
        },
      });
    }

    let payment;
    if (paymentId) {
      payment = await Payment.findOne({ paymentId });
    } else {
      payment = await Payment.findOne({ transactionReference });
    }

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment transaction record not found' });
    }

    const fine = await Fine.findById(payment.fine).populate('issuedByOfficer');
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Associated fine not found' });
    }

    // Verify through backend payment adapter (NEVER trust frontend alone)
    const verification = await paymentAdapter.verifyPayment({
      transactionReference: payment.transactionReference,
      amount: payment.amount,
      method: payment.paymentMethod,
    });

    if (!verification.verified) {
      payment.status = 'FAILED';
      payment.verificationStatus = 'REJECTED';
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed at banking switch: ' + verification.reason,
      });
    }

    // If FASTag method, debit wallet balance
    if (payment.paymentMethod === 'FASTag') {
      try {
        await fastagService.debitAccount({
          userId: payment.user,
          amount: payment.amount,
          description: `E-Challan Settlement: ${fine.fineId}`,
          type: 'FINE_PAYMENT',
        });
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'FASTag debit failed: ' + err.message,
        });
      }
    }

    // Mark payment verified
    payment.status = 'SUCCESS';
    payment.verificationStatus = 'VERIFIED';
    payment.verifiedBy = 'GOVT_SETTLEMENT_GATEWAY';
    payment.verifiedAt = new Date();

    // Mark Fine as Paid
    fine.status = 'PAID';
    fine.paymentStatus = 'PAID';
    fine.payment = payment._id;
    await fine.save();

    // Generate Official Digital PDF Receipt
    try {
      const receipt = await generateFineReceiptPdf(payment, fine);
      payment.receiptGenerated = true;
      payment.receiptUrl = receipt.url;
    } catch (pdfErr) {
      console.warn('PDF Receipt generation warning:', pdfErr.message);
    }
    await payment.save();

    // Restore Driver Score incentive (+2 for prompt compliance)
    await User.findByIdAndUpdate(payment.user, {
      $inc: { driverScore: 2 },
    });

    // Record Immutable Audit Log
    await recordAudit({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'PAYMENT_VERIFIED',
      targetType: 'PAYMENT',
      targetId: payment.paymentId,
      details: {
        fineId: fine.fineId,
        amount: payment.amount,
        method: payment.paymentMethod,
        transactionReference: payment.transactionReference,
      },
      req,
    });

    // Socket.IO Broadcast
    const io = req.app.get('socketio');
    if (io) {
      io.emit('payment_completed', {
        paymentId: payment.paymentId,
        fineId: fine.fineId,
        amount: payment.amount,
        vehicleNumber: fine.vehicleNumber,
        status: 'PAID',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment successfully verified and fine settled.',
      data: {
        paymentId: payment.paymentId,
        fineId: fine.fineId,
        amount: payment.amount,
        status: payment.status,
        receiptUrl: payment.receiptUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payments list
 * @route   GET /api/payments
 */
const getPayments = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'USER') {
      query.user = req.user._id;
    }

    const payments = await Payment.find(query)
      .populate('fine')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single payment
 * @route   GET /api/payments/:id
 */
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('fine')
      .populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download / stream official fine receipt PDF
 * @route   GET /api/receipts/:fineId or /api/payments/receipt/:fineId
 */
const downloadReceipt = async (req, res, next) => {
  try {
    const { fineId } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const fine = mockDataStore.fines.find((f) => f._id === fineId || f.fineId === fineId) || mockDataStore.fines[1];
      const mockPayment = {
        paymentId: 'PAY-SETTLED-' + (fine.fineId || '2026-0045'),
        amount: fine.fineAmount || 1000,
        paymentMethod: 'UPI',
        createdAt: new Date(),
      };
      const newReceipt = await generateFineReceiptPdf(mockPayment, fine);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="DriveLegalAI_Receipt_${fine.fineId}.pdf"`);
      return fs.createReadStream(newReceipt.filePath).pipe(res);
    }

    const fine = await Fine.findOne({
      $or: [{ _id: fineId.length === 24 ? fineId : null }, { fineId: fineId }],
    }).populate('payment');

    if (!fine || !fine.payment) {
      return res.status(404).json({
        success: false,
        message: 'No settled payment receipt found for this fine reference.',
      });
    }

    // Authorization check
    if (req.user.role === 'USER' && fine.user && fine.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to fine receipt.',
      });
    }

    const payment = await Payment.findById(fine.payment);
    const receiptPath = path.join(__dirname, `../public/receipts/receipt_${payment.paymentId}.pdf`);

    if (fs.existsSync(receiptPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="DriveLegalAI_Receipt_${fine.fineId}.pdf"`);
      return fs.createReadStream(receiptPath).pipe(res);
    } else {
      // Regenerate on the fly if missing
      const newReceipt = await generateFineReceiptPdf(payment, fine);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="DriveLegalAI_Receipt_${fine.fineId}.pdf"`);
      return fs.createReadStream(newReceipt.filePath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  getPayments,
  getPaymentById,
  downloadReceipt,
};
