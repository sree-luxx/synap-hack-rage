import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { NftMint } from "../../../models/NftMint";
import { ok, badRequest, serverError, unauthorized } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return unauthorized(res);
    await connectMongo();

    if (req.method === "GET") {
      const { userId, eventId, status } = req.query as any;
      const filter: any = {};
      if (userId) filter.userId = userId;
      if (eventId) filter.eventId = eventId;
      if (status) filter.status = status;
      const list = await (NftMint as any).find(filter as any).sort({ createdAt: -1 });
      return ok(res, list);
    }

    return badRequest(res, "Method not allowed");
  } catch (error) {
    return serverError(res, error);
  }
}


