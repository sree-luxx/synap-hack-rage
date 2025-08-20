import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials.password) return null;
				const user = await prisma.user.findUnique({ where: { email: credentials.email } });
				if (!user || !user.passwordHash) return null;
				const valid = await bcrypt.compare(credentials.password, user.passwordHash);
				if (!valid) return null;
				return { id: user.id, email: user.email, name: user.name, image: user.image, role: (user as any).role } as any;
			},
		}),
		process.env.GITHUB_ID && process.env.GITHUB_SECRET
			? GitHubProvider({ clientId: process.env.GITHUB_ID, clientSecret: process.env.GITHUB_SECRET })
			: (null as any),
		process.env.GOOGLE_ID && process.env.GOOGLE_SECRET
			? GoogleProvider({ clientId: process.env.GOOGLE_ID, clientSecret: process.env.GOOGLE_SECRET })
			: (null as any),
	].filter(Boolean) as any,
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		async session({ session, token, user }) {
			if (session.user) {
				(session.user as any).id = user?.id ?? token?.sub;
				(session.user as any).role = (user as any)?.role;
			}
			return session;
		},
	},
};

export async function requireSession(req: any, res: any) {
	const session = await getServerSession(req, res, authOptions);
	return session;
}

export function requireRole(session: any, roles: Array<"PARTICIPANT" | "ORGANIZER" | "JUDGE">): boolean {
	const userRole = (session?.user as any)?.role;
	return roles.includes(userRole);
}

// Helper to read user from Authorization: Bearer <token> for non-NextAuth clients
import type { NextApiRequest } from "next";
import { verifyUserToken } from "./jwt";

export async function getApiUser(req: NextApiRequest, _res?: any) {
  const authHeader = req.headers["authorization"] || (req.headers as any)["Authorization"];
  let bearer: string | undefined;
  if (typeof authHeader === "string") bearer = authHeader;
  if (Array.isArray(authHeader)) bearer = authHeader[0];
  const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : undefined;
  if (!token) return null;
  return verifyUserToken(token);
}

