import { randomUUID } from "crypto";

type MintParams = {
	recipientAddress: string;
	metadata: { name: string; description?: string; image?: string; external_url?: string };
	chain: string; // e.g., "sepolia", "polygon-amoy"
	contractAddress?: string; // optional if using engine-managed contract
};

type MintResult = {
	success: boolean;
	tokenId?: string;
	txHash?: string;
	contractAddress?: string;
	metadataUrl?: string;
	error?: string;
};

// Tries Thirdweb Engine first (if configured), then Alchemy Mint (if configured)
export async function mintNft(params: MintParams): Promise<MintResult> {
	const thirdwebUrl = process.env.THIRDWEB_ENGINE_URL;
	const thirdwebAccessToken = process.env.THIRDWEB_ENGINE_ACCESS_TOKEN;
	if (thirdwebUrl && thirdwebAccessToken) {
		try {
			const res = await fetch(`${thirdwebUrl}/contract/${params.chain}/${params.contractAddress || "nft"}/erc721/mint-to`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${thirdwebAccessToken}` },
				body: JSON.stringify({
					recipient: params.recipientAddress,
					metadata: params.metadata,
				}),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json?.error || json?.message || `Engine mint failed (${res.status})`);
			return {
				success: true,
				tokenId: String(json?.id || json?.tokenId || json?.receipt?.events?.[0]?.args?.tokenId || ""),
				txHash: json?.transactionHash || json?.receipt?.transactionHash,
				contractAddress: json?.contractAddress || params.contractAddress,
				metadataUrl: json?.metadataUri || json?.uri,
			};
		} catch (err: any) {
			return { success: false, error: err?.message || String(err) };
		}
	}

	const alchemyKey = process.env.ALCHEMY_API_KEY;
	const alchemyChainHost = chainToAlchemyHost(params.chain);
	if (alchemyKey && alchemyChainHost && params.contractAddress) {
		try {
			const res = await fetch(`https://${alchemyChainHost}/nft/v3/${alchemyKey}/mint`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					contractAddress: params.contractAddress,
					recipient: params.recipientAddress,
					metadata: params.metadata,
				}),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json?.error || json?.message || `Alchemy mint failed (${res.status})`);
			return {
				success: true,
				tokenId: String(json?.tokenId || json?.mint?.tokenId || ""),
				txHash: json?.txHash || json?.transactionHash,
				contractAddress: params.contractAddress,
				metadataUrl: json?.metadataUrl,
			};
		} catch (err: any) {
			return { success: false, error: err?.message || String(err) };
		}
	}

	return { success: false, error: "No NFT provider configured" };
}

function chainToAlchemyHost(chain: string): string | null {
	switch (chain) {
		case "sepolia":
			return "eth-sepolia.g.alchemy.com";
		case "polygon-amoy":
			return "polygon-amoy.g.alchemy.com";
		default:
			return null;
	}
}


