import { NextApiRequest, NextApiResponse } from "next";
import { ok, badRequest, serverError } from "../../../lib/response";
import { getLeaderboard } from "../../../lib/leaderboard";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { eventId } = req.query;
	if (typeof eventId !== "string") return badRequest(res, "Invalid eventId");
	try {
		const rows = await getLeaderboard(eventId);
		return ok(res, rows);
	} catch (error) {
		return serverError(res, error);
	}
}




