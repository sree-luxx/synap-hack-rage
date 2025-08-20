import { NextApiRequest, NextApiResponse } from "next";
import { ok, unauthorized } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions, getApiUser } from "../../../lib/auth";
import { applyCors } from "../_cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (applyCors(req, res)) return;
	const session = await getServerSession(req, res, authOptions);
	if (session) return ok(res, session.user);
	const jwtUser = await getApiUser(req);
	if (!jwtUser) return unauthorized(res);
	return ok(res, { id: jwtUser.id, email: jwtUser.email, name: jwtUser.name, role: jwtUser.role });
}




