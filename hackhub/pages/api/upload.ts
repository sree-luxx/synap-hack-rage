import { NextApiRequest, NextApiResponse } from "next";
import { uploadBufferToBlob } from "../../lib/blob";
import { ok, badRequest, serverError, unauthorized } from "../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export const config = {
	api: {
		bodyParser: { sizeLimit: "15mb" },
	},
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const session = await getServerSession(req, res, authOptions);
		if (!session) return unauthorized(res);

		if (req.method !== "POST") return badRequest(res, "Method not allowed");

		const { base64, contentType, prefix, filename } = req.body as any;
		if (!base64) return badRequest(res, "Missing base64");
		const buffer = Buffer.from(base64, "base64");
		const { url, blobName } = await uploadBufferToBlob(buffer, { contentType, prefix });
		return ok(res, { url, blobName, filename });
	} catch (error) {
		return serverError(res, error);
	}
}




