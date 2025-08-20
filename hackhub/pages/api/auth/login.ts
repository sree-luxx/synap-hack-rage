import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { badRequest, ok, serverError } from "../../../lib/response";
import bcrypt from "bcryptjs";
import { signUserToken } from "../../../lib/jwt";
import { applyCors } from "../_cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (applyCors(req, res)) return;
    if (req.method !== "POST") return badRequest(res, "Method not allowed");
    const { email, password } = req.body as any;
    if (!email || !password) return badRequest(res, "Email and password are required");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return badRequest(res, "Invalid credentials");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return badRequest(res, "Invalid credentials");

    const token = signUserToken({ id: user.id, email: user.email, name: user.name, role: (user as any).role });
    return ok(res, { token, user: { id: user.id, email: user.email, name: user.name, role: (user as any).role } });
  } catch (error) {
    return serverError(res, error);
  }
}


