const PDFDocument = require("pdfkit");

function generateComplaintPdf(complaint, user, statusLabel) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const content = Buffer.concat(chunks);
      const complaintId = complaint.id || "report";
      resolve({
        filename: `urbanresolve-complaint-${complaintId}.pdf`,
        content,
        contentType: "application/pdf",
      });
    });
    doc.on("error", reject);

    doc
      .fontSize(18)
      .fillColor("#1f2937")
      .text("URBANRESOLVE Complaint Report", {
        align: "center",
      });

    doc.moveDown();
    doc.fontSize(12).fillColor("#374151").text(`Status: ${statusLabel}`);
    doc.moveDown();

    doc
      .fontSize(14)
      .fillColor("#111827")
      .text("Citizen Information", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#1f2937").text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    if (complaint.userId) {
      doc.text(`User ID: ${complaint.userId}`);
    }
    doc.moveDown();

    doc
      .fontSize(14)
      .fillColor("#111827")
      .text("Complaint Details", { underline: true });
    doc.moveDown(0.5);
    if (complaint.id) {
      doc.fontSize(11).fillColor("#1f2937").text(`Complaint ID: ${complaint.id}`);
    }
    doc
      .fontSize(11)
      .fillColor("#1f2937")
      .text(`Category: ${complaint.category}`);
    doc.text(`City: ${complaint.location?.city || "N/A"}`);
    doc.text(`District: ${complaint.location?.district || "N/A"}`);
    doc.text(`Address: ${complaint.address || "N/A"}`);
    doc.moveDown(0.5);
    doc.text("Description:");
    doc
      .fontSize(11)
      .fillColor("#374151")
      .text(complaint.description || "N/A", {
        indent: 20,
        lineGap: 4,
      });

    if (complaint.status) {
      doc.moveDown();
      doc
        .fontSize(14)
        .fillColor("#111827")
        .text("Complaint Status", { underline: true });
      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .fillColor("#1f2937")
        .text(`Current status: ${complaint.status}`);
      if (complaint.resolvedAt) {
        doc.text(
          `Resolved at: ${new Date(complaint.resolvedAt).toLocaleString()}`,
        );
      }
    }

    doc.moveDown();
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(
        "This PDF contains official URBANRESOLVE complaint data. Keep it for your records.",
        { align: "center" },
      );

    doc.end();
  });
}

module.exports = {
  generateComplaintPdf,
};
