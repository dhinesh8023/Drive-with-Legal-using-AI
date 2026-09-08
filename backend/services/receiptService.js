const PDFDocument = require("pdfkit");

/**
 * Streams a digital payment receipt PDF directly to the HTTP response.
 * Called from controllers/paymentController.js on GET /api/receipts/:fineId
 */
function streamFineReceipt(res, { fine, payment, user, vehicleNumber, violationType }) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=receipt-${fine.fineCode}.pdf`);

  doc.pipe(res);

  doc.fontSize(20).fillColor("#0b2545").text("DRIVE LEGAL AI", { align: "center" });
  doc.fontSize(12).fillColor("#444").text("DIGITAL PAYMENT RECEIPT", { align: "center" });
  doc.moveDown(1.5);

  doc.fontSize(10).fillColor("#000");
  const rows = [
    ["Fine ID", fine.fineCode],
    ["Violation", violationType],
    ["Vehicle Number", vehicleNumber || "N/A"],
    ["User", user.name],
    ["Amount", `Rs. ${fine.amount}`],
    ["Payment ID", payment.transactionReference],
    ["Payment Method", payment.method],
    ["Date", new Date(payment.verifiedAt || payment.createdAt).toLocaleString()],
    ["Status", "PAID"],
  ];

  rows.forEach(([label, value]) => {
    doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
    doc.font("Helvetica").text(String(value));
  });

  doc.moveDown(1.5);
  doc
    .fontSize(8)
    .fillColor("#888")
    .text(
      payment.isDemo
        ? "This is a DEMO transaction generated for prototype/demonstration purposes only. No real payment was processed."
        : "This receipt is auto-generated and does not require a signature.",
      { align: "center" }
    );

  doc.end();
}

module.exports = { streamFineReceipt };
