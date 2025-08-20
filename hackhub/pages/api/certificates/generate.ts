import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { Certificate } from "../../../models/Certificate";
import { ok, badRequest, serverError, unauthorized, forbidden, created } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions, getApiUser } from "../../../lib/auth";
import { generateCertificatePdfBuffer } from "../../../lib/pdf";
import { uploadBufferToBlob } from "../../../lib/blob";
import { applyCors } from "../_cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (applyCors(req, res)) return;
		const session = await getServerSession(req, res, authOptions);
		let role: string | null = session ? ((session.user as any)?.role as string) : null;
		if (!role) {
			const jwtUser = await getApiUser(req);
			role = (jwtUser?.role as any) ?? null;
		}
		if (!role) return unauthorized(res);
		if (role !== "ORGANIZER") return forbidden(res);

		if (req.method !== "POST") return badRequest(res, "Method not allowed");
		await connectMongo();

		const { eventId, userId, participantName, role: certRole } = req.body as any;
		if (!eventId || !userId || !participantName || !certRole) return badRequest(res, "Missing fields");

		const pdf = await generateCertificatePdfBuffer({ participantName, eventName: eventId, role: certRole });
		const { url, blobName } = await uploadBufferToBlob(pdf, { contentType: "application/pdf", prefix: `certificates/${eventId}` });
		const cert = await (Certificate as any).create({ eventId, userId, role: certRole, url, blobName } as any);
		return created(res, cert);
	} catch (error) {
		return serverError(res, error);
	}
}


