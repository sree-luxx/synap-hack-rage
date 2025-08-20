import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { Sponsor } from "../../../models/Sponsor";
import { ok, badRequest, serverError, unauthorized, forbidden, created } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions, getApiUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { applyCors } from "../_cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (applyCors(req, res)) return;
    const { eventId } = req.query as any;

    if (req.method === "GET") {
      // Prefer Prisma when eventId is provided; otherwise use Mongo global sponsors
      if (eventId) {
        try {
          const list = await prisma.sponsor.findMany({ where: { eventId }, orderBy: { name: "asc" } });
          return ok(res, list);
        } catch (dbErr) {
          // Fall through to Mongo if Prisma unavailable
        }
      }
      try {
        await connectMongo();
        const list = await (Sponsor as any).find({} as any).sort({ tier: 1, name: 1 });
        return ok(res, list);
      } catch (mongoErr) {
        return ok(res, []);
      }
    }

    const session = await getServerSession(req, res, authOptions);
    let role: string | null = session ? ((session.user as any).role as string) : null;
    if (!role) {
      const jwtUser = await getApiUser(req);
      role = (jwtUser?.role as any) ?? null;
    }
    if (!role) return unauthorized(res);
    if (role !== "ORGANIZER") return forbidden(res);

    if (req.method === "POST") {
      const { name, tier, logoUrl, websiteUrl, description, eventId: bodyEventId } = req.body as any;
      if (!name || !tier || !logoUrl || !websiteUrl) return badRequest(res, "Missing fields");
      if (bodyEventId) {
        try {
          const createdSponsor = await prisma.sponsor.create({ data: { name, logoUrl, eventId: bodyEventId } as any });
          // Store tier/website/description in Mongo analytics doc as well (optional)
          try {
            await connectMongo();
            await (Sponsor as any).create({ name, tier, logoUrl, websiteUrl, description } as any);
          } catch {}
          return created(res, createdSponsor);
        } catch (dbErr) {
          // Fall back to Mongo if Prisma unavailable
        }
      }
      try {
        await connectMongo();
        const createdSponsor = await (Sponsor as any).create({ name, tier, logoUrl, websiteUrl, description } as any);
        return created(res, createdSponsor);
      } catch (mongoErr) {
        return serverError(res, mongoErr);
      }
    }

    if (req.method === "PUT") {
      const { id, eventId: bodyEventId, ...updates } = req.body as any;
      if (!id) return badRequest(res, "Missing id");
      if (bodyEventId) {
        try {
          const updated = await prisma.sponsor.update({ where: { id }, data: updates as any });
          return ok(res, updated);
        } catch {}
      }
      try {
        await connectMongo();
        const updated = await (Sponsor as any).findByIdAndUpdate(id as any, updates as any, { new: true } as any);
        return ok(res, updated);
      } catch (mongoErr) {
        return serverError(res, mongoErr);
      }
    }

    if (req.method === "DELETE") {
      const { id, eventId: queryEventId } = req.query as any;
      if (!id) return badRequest(res, "Missing id");
      if (queryEventId) {
        try {
          await prisma.sponsor.delete({ where: { id } });
          return ok(res, { deleted: true });
        } catch {}
      }
      try {
        await connectMongo();
        await (Sponsor as any).findByIdAndDelete(id as any);
        return ok(res, { deleted: true });
      } catch (mongoErr) {
        return serverError(res, mongoErr);
      }
    }

    return badRequest(res, "Method not allowed");
  } catch (error) {
    return serverError(res, error);
  }
}


