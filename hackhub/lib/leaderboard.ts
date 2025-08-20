import { connectMongo } from "./mongoose";
import { Score } from "../models/Score";

export interface LeaderboardRow {
	teamId: string;
	total: number;
	judges: number;
}

export async function getLeaderboard(eventId: string): Promise<LeaderboardRow[]> {
	await connectMongo();
	const rows = await Score.aggregate([
		{ $match: { eventId } },
		{ $group: { _id: "$teamId", total: { $sum: "$total" }, judges: { $addToSet: "$judgeId" } } },
		{ $project: { _id: 0, teamId: "$_id", total: 1, judges: { $size: "$judges" } } },
		{ $sort: { total: -1 } },
	]);
	return rows as LeaderboardRow[];
}




