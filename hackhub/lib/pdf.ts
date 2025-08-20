import PDFDocument from "pdfkit";

export async function generateCertificatePdfBuffer(params: {
	participantName: string;
	eventName: string;
	role?: string;
	issuedAt?: Date;
}): Promise<Buffer> {
	return await new Promise((resolve) => {
		const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });
		const chunks: Buffer[] = [];
		doc.on("data", (chunk) => chunks.push(chunk as Buffer));
		doc.on("end", () => resolve(Buffer.concat(chunks)));

		const pageWidth = doc.page.width;
		const pageHeight = doc.page.height;

		// Background gradient
		const bg = doc.linearGradient(0, 0, pageWidth, pageHeight);
		bg.stop(0, "#0b0f19").stop(1, "#1a1033");
		doc.save();
		doc.rect(0, 0, pageWidth, pageHeight).fill(bg as any);
		doc.restore();

		// Border
		doc.lineWidth(6).strokeColor("#8b5cf6").rect(20, 20, pageWidth - 40, pageHeight - 40).stroke();

		// Title
		doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(36).text("Certificate of Participation", 0, 90, { align: "center" });

		// Subtitle
		doc.moveDown(0.5);
		doc.fillColor("#cbd5e1").font("Helvetica").fontSize(16).text("This certifies that", { align: "center" });

		// Participant name
		doc.moveDown(0.5);
		doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(42).text(params.participantName, { align: "center" });

		// Body
		doc.moveDown(0.5);
		doc.fillColor("#cbd5e1").font("Helvetica").fontSize(16).text(`has participated in ${params.eventName}${params.role ? ` as ${params.role}` : ""}.`, { align: "center" });

		// Signature line and issued date
		doc.moveDown(3);
		doc.strokeColor("#64748b").lineWidth(1).moveTo(pageWidth / 2 - 150, pageHeight - 160).lineTo(pageWidth / 2 + 150, pageHeight - 160).stroke();
		doc.fillColor("#cbd5e1").fontSize(12).text("Organizer", 0, pageHeight - 150, { align: "center" });
		doc.fillColor("#94a3b8").fontSize(12).text(`Issued: ${(params.issuedAt ?? new Date()).toDateString()}`, 0, pageHeight - 110, { align: "center" });

		doc.end();
	});
}



