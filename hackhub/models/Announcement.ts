import mongoose, { Schema, model, models } from "mongoose";

const AnnouncementSchema = new Schema(
	{
		eventId: { type: String, required: true },
		title: { type: String, required: true },
		message: { type: String, required: true },
		createdBy: { type: String, required: true },
		audience: { type: String, enum: ["participants", "judges", "all"], default: "participants" },
	},
	{ timestamps: true }
);

export type AnnouncementDocument = mongoose.InferSchemaType<typeof AnnouncementSchema> & { _id: mongoose.Types.ObjectId };

export const Announcement = models.Announcement || model("Announcement", AnnouncementSchema);



