import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { Sponsor } from "../../../models/Sponsor";
import { ok, badRequest, serverError, notFound } from "../../../lib/response";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return badRequest(res, "Method not allowed");
    await connectMongo();
    const { id } = req.body as any;
    if (!id) return badRequest(res, "Missing id");
    const sponsor = await (Sponsor as any).findById(id as any);
    if (!sponsor) return notFound(res, "Sponsor not found");
    sponsor.clicks = (sponsor.clicks || 0) + 1;
    sponsor.analytics = { ...(sponsor.analytics || {}), lastClickedAt: new Date() };
    await sponsor.save();
    return ok(res, { clicks: sponsor.clicks });
  } catch (error) {
    return serverError(res, error);
  }
}


