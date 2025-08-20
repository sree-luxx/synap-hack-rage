import mongoose, { Schema, model, models } from "mongoose";

const PlagiarismReportSchema = new Schema(
	{
		eventId: { type: String, required: true },
		submissionId: { type: String, required: true },
		repoUrl: { type: String, required: true },
		similarities: [
			{
				otherSubmissionId: String,
				otherRepoUrl: String,
				similarity: Number,
				details: Schema.Types.Mixed,
			},
		],
		status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "PENDING" },
		error: { type: String },
	},
	{ timestamps: true }
);

export type PlagiarismReportDocument = mongoose.InferSchemaType<typeof PlagiarismReportSchema> & { _id: mongoose.Types.ObjectId };

export const PlagiarismReport = models.PlagiarismReport || model("PlagiarismReport", PlagiarismReportSchema);



