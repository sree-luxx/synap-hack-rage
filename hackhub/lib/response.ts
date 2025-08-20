import { NextApiResponse } from "next";

type JsonBody = Record<string, unknown> | Array<unknown> | null;

export function ok(res: NextApiResponse, data: JsonBody = null, message?: string) {
	return res.status(200).json({ success: true, message, data });
}

export function created(res: NextApiResponse, data: JsonBody = null, message?: string) {
	return res.status(201).json({ success: true, message, data });
}

export function badRequest(res: NextApiResponse, message = "Bad request", details?: JsonBody) {
	return res.status(400).json({ success: false, message, details });
}

export function unauthorized(res: NextApiResponse, message = "Unauthorized") {
	return res.status(401).json({ success: false, message });
}

export function forbidden(res: NextApiResponse, message = "Forbidden") {
	return res.status(403).json({ success: false, message });
}

export function notFound(res: NextApiResponse, message = "Not found") {
	return res.status(404).json({ success: false, message });
}

export function serverError(res: NextApiResponse, error: unknown, message = "Internal server error") {
	// eslint-disable-next-line no-console
	console.error(message, error);
	return res.status(500).json({ success: false, message });
}



