import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { PlagiarismReport } from "../../../models/PlagiarismReport";
import { ok, badRequest, serverError, unauthorized, forbidden } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions, getApiUser } from "../../../lib/auth";
import { applyCors } from "../_cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (applyCors(req, res)) return;
    const session = await getServerSession(req, res, authOptions);
    let role: string | null = session ? ((session.user as any).role as string) : null;
    if (!role) {
      const jwtUser = await getApiUser(req);
      role = (jwtUser?.role as any) ?? null;
    }
    if (!role) return unauthorized(res);
    if (!( ["ORGANIZER", "JUDGE"].includes(role) )) return forbidden(res);
    await connectMongo();

    if (req.method === "GET") {
      const { eventId, submissionId, status } = req.query as any;
      const filter: any = {};
      if (eventId) filter.eventId = eventId;
      if (submissionId) filter.submissionId = submissionId;
      if (status) filter.status = status;
      const reports = await (PlagiarismReport as any).find(filter as any).sort({ createdAt: -1 });
      return ok(res, reports);
    }

    return badRequest(res, "Method not allowed");
  } catch (error) {
    return serverError(res, error);
  }
}


