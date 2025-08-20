import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { PlagiarismReport } from "../../../models/PlagiarismReport";
import { ok, badRequest, serverError } from "../../../lib/response";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { id } = req.query;
	if (typeof id !== "string") return badRequest(res, "Invalid id");
	try {
		await connectMongo();
		const report = await (PlagiarismReport as any).findById(id as any);
		return ok(res, report);
	} catch (error) {
		return serverError(res, error);
	}
}


