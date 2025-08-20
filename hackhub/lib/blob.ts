import { BlobServiceClient, StorageSharedKeyCredential, BlobSASPermissions, SASProtocol, generateBlobSASQueryParameters } from "@azure/storage-blob";
import { randomUUID } from "crypto";

const { AZURE_BLOB_CONNECTION_STRING = "", AZURE_BLOB_CONTAINER = "hackhub" } = process.env;

export async function uploadBufferToBlob(buffer: Buffer, opts?: { contentType?: string; prefix?: string }) {
	const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_BLOB_CONNECTION_STRING);
	const containerClient = blobServiceClient.getContainerClient(AZURE_BLOB_CONTAINER);
	await containerClient.createIfNotExists();
	const blobName = `${opts?.prefix ?? "uploads"}/${randomUUID()}`;
	const blockBlobClient = containerClient.getBlockBlobClient(blobName);
	await blockBlobClient.uploadData(buffer, { blobHTTPHeaders: { blobContentType: opts?.contentType ?? "application/octet-stream" } });

	// Try to generate a time-limited SAS URL for private containers
	let signedUrl = blockBlobClient.url;
	try {
		const parts = Object.fromEntries(
			AZURE_BLOB_CONNECTION_STRING.split(";")
				.map((kv) => kv.split("=") as [string, string])
				.filter((a) => a[0] && a[1])
		);
		const accountName = parts["AccountName"];
		const accountKey = parts["AccountKey"];
		if (accountName && accountKey) {
			const credential = new StorageSharedKeyCredential(accountName, accountKey);
			const ttlHours = Number(process.env.AZURE_BLOB_SAS_TTL_HOURS || 24);
			const startsOn = new Date(Date.now() - 5 * 60 * 1000);
			const expiresOn = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
			const sas = generateBlobSASQueryParameters(
				{
					containerName: AZURE_BLOB_CONTAINER,
					blobName,
					permissions: BlobSASPermissions.parse("r"),
					startsOn,
					expiresOn,
					protocol: SASProtocol.Https,
				},
				credential
			).toString();
			signedUrl = `${blockBlobClient.url}?${sas}`;
		}
	} catch {
		// ignore; fallback to unsigned URL
	}

	return { blobName, url: signedUrl };
}



