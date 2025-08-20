import mongoose, { Schema, model, models } from "mongoose";

const ScoreSchema = new Schema(
	{
		eventId: { type: String, required: true },
		submissionId: { type: String, required: true },
		teamId: { type: String, required: true },
		judgeId: { type: String, required: true },
		criteria: [
			{
				name: String,
				score: Number,
				max: Number,
			},
		],
		total: { type: Number, required: true },
		notes: { type: String },
	},
	{ timestamps: true }
);

export type ScoreDocument = mongoose.InferSchemaType<typeof ScoreSchema> & { _id: mongoose.Types.ObjectId };

export const Score = models.Score || model("Score", ScoreSchema);



