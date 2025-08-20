import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { ok, badRequest, serverError, unauthorized, forbidden, created } from "../../../lib/response";
import { connectMongo } from "../../../lib/mongoose";
import { NftMint } from "../../../models/NftMint";
import { mintNft } from "../../../lib/nft";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return unauthorized(res);
    const role = (session.user as any)?.role;
    if (role !== "ORGANIZER") return forbidden(res);
    if (req.method !== "POST") return badRequest(res, "Method not allowed");

    await connectMongo();
    const { eventId, userId, recipient, chain, contractAddress, metadata } = req.body as any;
    if (!eventId || !userId || !recipient || !chain || !metadata) return badRequest(res, "Missing fields");

    const record = await (NftMint as any).create({ eventId, userId, recipient, chain, contractAddress, status: "PENDING" } as any);
    try {
      const result = await mintNft({ recipientAddress: recipient, metadata, chain, contractAddress });
      if (!result.success) throw new Error(result.error || "Mint failed");
      await (NftMint as any).findByIdAndUpdate((record as any)._id, {
        status: "SUCCESS",
        tokenId: result.tokenId,
        txHash: result.txHash,
        contractAddress: result.contractAddress,
        metadataUrl: result.metadataUrl,
      } as any);
      return created(res, { id: String((record as any)._id), ...result });
    } catch (err: any) {
      await (NftMint as any).findByIdAndUpdate((record as any)._id, { status: "FAILED", error: String(err?.message || err) } as any);
      throw err;
    }
  } catch (error) {
    return serverError(res, error);
  }
}


