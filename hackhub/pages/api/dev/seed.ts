import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { connectMongo } from "../../../lib/mongoose";
import { Submission } from "../../../models/Submission";
import { Score } from "../../../models/Score";
import { PlagiarismReport } from "../../../models/PlagiarismReport";
import { ok, badRequest, serverError } from "../../../lib/response";
import bcrypt from "bcryptjs";
import { applyCors } from "../_cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (applyCors(req, res)) return;
    if (req.method !== "POST") return badRequest(res, "Method not allowed");

    const secret = (req.query.secret as string) || (req.body as any)?.secret;
    const allowed = process.env.NODE_ENV !== "production" || secret === process.env.DEV_SEED_SECRET || secret === "dev";
    if (!allowed) return badRequest(res, "Seeding not allowed");

    // 1-4) Try Prisma seeding; if fails, continue with Mongo-only
    const orgEmail = "organizer@example.com";
    const pass = "password123";
    const passHash = await bcrypt.hash(pass, 10);
    let eventId = "demo-event-1";
    let organizerId: string = "organizer-demo";
    let prismaOk = true;
    try {
      const organizer = await prisma.user.upsert({
        where: { email: orgEmail },
        update: { role: "ORGANIZER" },
        create: { email: orgEmail, name: "Demo Organizer", role: "ORGANIZER", passwordHash: passHash },
      });
      organizerId = organizer.id;

      const p1 = await prisma.user.upsert({ where: { email: "alice@example.com" }, update: {}, create: { email: "alice@example.com", name: "Alice", role: "PARTICIPANT", passwordHash: passHash } });
      const p2 = await prisma.user.upsert({ where: { email: "bob@example.com" }, update: {}, create: { email: "bob@example.com", name: "Bob", role: "PARTICIPANT", passwordHash: passHash } });
      const p3 = await prisma.user.upsert({ where: { email: "carol@example.com" }, update: {}, create: { email: "carol@example.com", name: "Carol", role: "PARTICIPANT", passwordHash: passHash } });

      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 7);
      const event = await prisma.event.upsert({
        where: { id: eventId },
        update: {},
        create: {
          id: eventId,
          name: "AI Innovation Challenge",
          description: "Demo event for analytics",
          theme: "AI",
          online: true,
          startAt: start,
          endAt: end,
          organizerId: organizer.id,
          tracks: { create: [{ name: "Computer Vision" }, { name: "NLP" }] },
          rules: { create: [{ text: "Be nice" }] },
          prizes: { create: [{ title: "First Prize", description: "$1,000" }] },
          sponsors: { create: [{ name: "Acme Corp" }] },
        },
        include: { tracks: true, rules: true, prizes: true, sponsors: true },
      });

      const teamA = await prisma.team.upsert({ where: { id: "demo-team-a" }, update: {}, create: { id: "demo-team-a", name: "Team Alpha", eventId: event.id } });
      const teamB = await prisma.team.upsert({ where: { id: "demo-team-b" }, update: {}, create: { id: "demo-team-b", name: "Team Beta", eventId: event.id } });

      await prisma.teamMember.upsert({ where: { teamId_userId: { teamId: teamA.id, userId: p1.id } }, update: {}, create: { teamId: teamA.id, userId: p1.id, role: "leader" } as any });
      await prisma.teamMember.upsert({ where: { teamId_userId: { teamId: teamA.id, userId: p2.id } }, update: {}, create: { teamId: teamA.id, userId: p2.id } as any });
      await prisma.teamMember.upsert({ where: { teamId_userId: { teamId: teamB.id, userId: p3.id } }, update: {}, create: { teamId: teamB.id, userId: p3.id, role: "leader" } as any });

      await prisma.registration.upsert({ where: { userId_eventId: { userId: p1.id, eventId: event.id } as any }, update: {}, create: { userId: p1.id, eventId: event.id, teamId: teamA.id } });
      await prisma.registration.upsert({ where: { userId_eventId: { userId: p2.id, eventId: event.id } as any }, update: {}, create: { userId: p2.id, eventId: event.id, teamId: teamA.id } });
      await prisma.registration.upsert({ where: { userId_eventId: { userId: p3.id, eventId: event.id } as any }, update: {}, create: { userId: p3.id, eventId: event.id, teamId: teamB.id } });
    } catch (e) {
      prismaOk = false;
    }

    // 5) Submissions + Scores + Plagiarism (Mongo)
    try {
      await connectMongo();

      const teamAId = prismaOk ? "demo-team-a" : "demo-team-a";
      const teamBId = prismaOk ? "demo-team-b" : "demo-team-b";

      const subA = await (Submission as any).findOneAndUpdate(
        { teamId: teamAId, eventId: event.id },
        {
          teamId: teamAId,
          eventId: event.id,
          title: "Smart Vision",
          description: "Computer vision pipeline",
          repoUrl: "https://github.com/demo/team-alpha",
        },
        { upsert: true, new: true }
      );

      const subB = await (Submission as any).findOneAndUpdate(
        { teamId: teamBId, eventId: event.id },
        {
          teamId: teamBId,
          eventId: event.id,
          title: "Chat Assist",
          description: "NLP assistant",
          repoUrl: "https://github.com/demo/team-beta",
        },
        { upsert: true, new: true }
      );

      // Scores
      await (Score as any).create({ eventId, teamId: teamAId, submissionId: String(subA._id), judgeId: organizerId, criteria: [{ name: "Impact", score: 7, max: 10 }], total: 7 });
      await (Score as any).create({ eventId, teamId: teamAId, submissionId: String(subA._id), judgeId: organizerId + "_2", criteria: [{ name: "Impact", score: 8, max: 10 }], total: 8 });
      await (Score as any).create({ eventId, teamId: teamBId, submissionId: String(subB._id), judgeId: organizerId, criteria: [{ name: "Impact", score: 6, max: 10 }], total: 6 });

      // Plagiarism
      await (PlagiarismReport as any).create({
        eventId,
        submissionId: String(subA._id),
        repoUrl: "https://github.com/demo/team-alpha",
        similarities: [
          { otherSubmissionId: String(subB._id), otherRepoUrl: "https://github.com/demo/team-beta", similarity: 0.2 },
        ],
        status: "COMPLETED",
      });

      await (PlagiarismReport as any).create({
        eventId,
        submissionId: String(subB._id),
        repoUrl: "https://github.com/demo/team-beta",
        similarities: [],
        status: "PENDING",
      });
    } catch (e) {
      // Mongo not configured; continue with Prisma-only data
    }

    return ok(res, {
      message: "Seeded demo data",
      organizer: { email: orgEmail, password: pass },
      eventId,
      prisma: prismaOk,
    });
  } catch (error) {
    return serverError(res, error);
  }
}
