import mongoose, { Schema, model, models } from "mongoose";

const CertificateSchema = new Schema(
	{
		eventId: { type: String, required: true },
		userId: { type: String, required: true },
		role: { type: String, required: true },
		url: { type: String, required: true },
		blobName: { type: String, required: true },
		issuedAt: { type: Date, default: () => new Date() },
		metadata: { type: Schema.Types.Mixed },
	},
	{ timestamps: true }
);

export type CertificateDocument = mongoose.InferSchemaType<typeof CertificateSchema> & { _id: mongoose.Types.ObjectId };

export const Certificate = models.Certificate || model("Certificate", CertificateSchema);


