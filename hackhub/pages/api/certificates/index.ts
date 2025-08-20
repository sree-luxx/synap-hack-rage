import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { Certificate } from "../../../models/Certificate";
import { ok, badRequest, serverError, unauthorized } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return unauthorized(res);
    await connectMongo();

    const { eventId, userId } = req.query as any;
    const filter: any = {};
    if (eventId) filter.eventId = eventId;
    if (userId) filter.userId = userId;

    if (req.method === "GET") {
      const certs = await (Certificate as any).find(filter as any).sort({ createdAt: -1 });
      return ok(res, certs);
    }

    return badRequest(res, "Method not allowed");
  } catch (error) {
    return serverError(res, error);
  }
}


