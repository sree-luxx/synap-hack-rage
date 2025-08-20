import { exec as execCb } from "child_process";
import { promisify } from "util";
import { mkdtemp, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { createHash } from "crypto";

const exec = promisify(execCb);

export async function cloneAndHashRepo(repoUrl: string): Promise<{ fileCount: number; hash: string }> {
	const tempRoot = await mkdtemp(join(tmpdir(), "hackhub-"));
	try {
		await exec(`git clone --depth 1 ${repoUrl} .`, { cwd: tempRoot });
		const { stdout: files } = await exec("git ls-files", { cwd: tempRoot });
		const fileList = files.split("\n").filter(Boolean);
		const hash = createHash("sha256");
		for (const file of fileList) {
			try {
				const buf = await readFile(join(tempRoot, file));
				hash.update(buf);
			} catch {
				// ignore
			}
		}
		return { fileCount: fileList.length, hash: hash.digest("hex") };
	} finally {
		await rm(tempRoot, { recursive: true, force: true });
	}
}

export function cosineSimilarity(a: number[], b: number[]): number {
	const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] ?? 0), 0);
	const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
	const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
	if (!magA || !magB) return 0;
	return dot / (magA * magB);
}

// Placeholder: map hash to simple numeric vector for comparison
export function hashToVector(hashHex: string, dims = 64): number[] {
	const bytes = Buffer.from(hashHex, "hex");
	const vec = new Array(dims).fill(0);
	for (let i = 0; i < bytes.length; i++) {
		const byteValue = bytes[i] ?? 0;
		vec[i % dims] += byteValue / 255;
	}
	return vec.map((x) => x / (bytes.length / dims || 1));
}


