import { NextApiRequest, NextApiResponse } from "next";

const { FRONTEND_ORIGIN = "http://localhost:5173", FRONTEND_ORIGINS, NODE_ENV } = process.env as Record<string, string | undefined>;

export function applyCors(req: NextApiRequest, res: NextApiResponse) {
  const allowedOrigins = (FRONTEND_ORIGINS || FRONTEND_ORIGIN)
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const requestOrigin = (req.headers.origin as string) || "";

  // For browsers, echo back the caller's Origin if it is allowed. In dev, be permissive.
  const isAllowed = !requestOrigin
    ? false
    : allowedOrigins.includes(requestOrigin) || NODE_ENV !== "production";

  if (isAllowed && requestOrigin) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Max-Age", "600");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}


