import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { Submission } from "../../../models/Submission";
import { PlagiarismReport } from "../../../models/PlagiarismReport";
import {
	ok,
	badRequest,
	serverError,
	unauthorized,
	forbidden,
	created,
} from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import {
	cloneAndHashRepo,
	hashToVector,
	cosineSimilarity,
} from "../../../lib/plagiarism";

// ✅ Define a reusable type for similarity results
type SimilarityResult = {
	otherSubmissionId: string;
	otherRepoUrl: string;
	similarity: number;
	details?: any; // optional details from external API
};

async function externalSimilarity(
	repoA: string,
	repoB: string
): Promise<{ score: number; details?: any } | null> {
	const url = process.env.SIMILARITY_API_URL;
	const key = process.env.SIMILARITY_API_KEY;
	if (!url) return null;
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(key ? { Authorization: `Bearer ${key}` } : {}),
			},
			body: JSON.stringify({ repoA, repoB }),
		});
		const json = await res.json().catch(() => ({}));
		if (!res.ok)
			throw new Error(
				json?.message || `Similarity API failed (${res.status})`
			);
		return {
			score: Number(json?.score ?? json?.similarity ?? 0),
			details: json?.details,
		};
	} catch {
		return null;
	}
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	try {
		const session = await getServerSession(req, res, authOptions);
		if (!session) return unauthorized(res);
		const role = (session.user as any)?.role;
		if (role !== "ORGANIZER") return forbidden(res);
		await connectMongo();

		if (req.method !== "POST") return badRequest(res, "Method not allowed");

		const { eventId, submissionId } = req.body as any;
		if (!eventId || !submissionId)
			return badRequest(res, "Missing fields");

		const sub = await (Submission as any).findById(submissionId as any);
		if (!sub) return badRequest(res, "Submission not found");

		const report = await (PlagiarismReport as any).create({
			eventId,
			submissionId,
			repoUrl: (sub as any).repoUrl,
			status: "PENDING",
		} as any);

		try {
			const { hash } = await cloneAndHashRepo(sub.repoUrl);
			const targetVec = hashToVector(hash);
			const others = await (Submission as any).find({
				eventId,
				_id: { $ne: (sub as any)._id },
			} as any);

			// ✅ use our type here
			const results: SimilarityResult[] = [];

			for (const other of others) {
				try {
					const ext = await externalSimilarity(
						sub.repoUrl,
						other.repoUrl
					);
					if (ext) {
						results.push({
							otherSubmissionId: String((other as any)._id),
							otherRepoUrl: (other as any).repoUrl,
							similarity: ext.score,
							details: ext.details,
						});
						continue;
					}
					const { hash: otherHash } = await cloneAndHashRepo(
						other.repoUrl
					);
					const sim = cosineSimilarity(
						targetVec,
						hashToVector(otherHash)
					);
					results.push({
						otherSubmissionId: String((other as any)._id),
						otherRepoUrl: (other as any).repoUrl,
						similarity: sim,
					});
				} catch {
					results.push({
						otherSubmissionId: String((other as any)._id),
						otherRepoUrl: (other as any).repoUrl,
						similarity: 0,
					});
				}
			}

			await (PlagiarismReport as any).findByIdAndUpdate(
				(report as any)._id,
				{
					status: "COMPLETED",
					similarities: results.sort(
						(a, b) => (b.similarity || 0) - (a.similarity || 0)
					),
				} as any
			);

			return created(res, { reportId: String(report._id) });
		} catch (err: any) {
			await (PlagiarismReport as any).findByIdAndUpdate(
				(report as any)._id,
				{
					status: "FAILED",
					error: String((err as any)?.message || err),
				} as any
			);
			throw err;
		}
	} catch (error) {
		return serverError(res, error);
	}
}
