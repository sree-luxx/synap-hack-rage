import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { badRequest, ok, serverError, unauthorized, forbidden } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const session = await getServerSession(req, res, authOptions);
		if (!session) return unauthorized(res);
		if ((session.user as any)?.role !== "ORGANIZER") return forbidden(res);
		if (req.method !== "POST") return badRequest(res, "Method not allowed");

		const { userId, role } = req.body as any;
		if (!userId || !role) return badRequest(res, "Missing fields");
		const user = await prisma.user.update({ where: { id: userId }, data: { role } });
		return ok(res, { id: user.id, email: user.email, role: user.role }, "Role updated");
	} catch (error) {
		return serverError(res, error);
	}
}




