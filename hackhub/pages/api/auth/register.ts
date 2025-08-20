import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { badRequest, created, serverError } from "../../../lib/response";
import bcrypt from "bcryptjs";
import { applyCors } from "../_cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (applyCors(req, res)) return;
		if (req.method !== "POST") return badRequest(res, "Method not allowed");
		const { name, email, password, role } = req.body as any;
		if (!email || !password) return badRequest(res, "Email and password are required");
		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) return badRequest(res, "Email already registered");
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({ data: { name, email, passwordHash, role: role ?? "PARTICIPANT" } });
		return created(res, { id: user.id, email: user.email, role: user.role });
	} catch (error) {
		return serverError(res, error);
	}
}




