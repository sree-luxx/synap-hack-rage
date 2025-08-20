import mongoose, { Schema, model, models } from "mongoose";

const NftMintSchema = new Schema(
	{
		eventId: { type: String, required: true },
		userId: { type: String, required: true },
		recipient: { type: String, required: true },
		chain: { type: String, required: true },
		contractAddress: { type: String, required: true },
		tokenId: { type: String },
		txHash: { type: String },
		metadataUrl: { type: String },
		status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
		error: { type: String },
	},
	{ timestamps: true }
);

export type NftMintDocument = mongoose.InferSchemaType<typeof NftMintSchema> & { _id: mongoose.Types.ObjectId };

export const NftMint = models.NftMint || model("NftMint", NftMintSchema);


