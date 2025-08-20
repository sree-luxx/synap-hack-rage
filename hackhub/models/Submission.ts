import mongoose, { Schema, model, models } from "mongoose";

const SubmissionSchema = new Schema(
	{
		eventId: { type: String, required: true },
		teamId: { type: String, required: true },
		title: { type: String, required: true },
		description: { type: String },
		repoUrl: { type: String, required: true },
		files: [
			{
				name: String,
				url: String,
				contentType: String,
				size: Number,
			},
		],
		metadata: { type: Schema.Types.Mixed },
	},
	{ timestamps: true }
);

export type SubmissionDocument = mongoose.InferSchemaType<typeof SubmissionSchema> & { _id: mongoose.Types.ObjectId };

export const Submission = models.Submission || model("Submission", SubmissionSchema);



