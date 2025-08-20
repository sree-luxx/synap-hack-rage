import mongoose, { Schema, model, models } from "mongoose";

const SponsorSchema = new Schema(
	{
		name: { type: String, required: true },
		tier: { type: String, enum: ["PLATINUM", "GOLD", "SILVER", "BRONZE", "COMMUNITY"], required: true },
		logoUrl: { type: String, required: true },
		websiteUrl: { type: String, required: true },
		description: { type: String },
		clicks: { type: Number, default: 0 },
		analytics: {
			lastClickedAt: { type: Date },
		},
	},
	{ timestamps: true }
);

export type SponsorDocument = mongoose.InferSchemaType<typeof SponsorSchema> & { _id: mongoose.Types.ObjectId };

export const Sponsor = models.Sponsor || model("Sponsor", SponsorSchema);


