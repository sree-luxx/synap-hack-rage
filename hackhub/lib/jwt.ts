import jwt from "jsonwebtoken";

const { NEXTAUTH_SECRET = "dev-secret" } = process.env;

export type JwtUser = { id: string; email: string; name?: string | null; role?: string | null };

export function signUserToken(user: JwtUser): string {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role }, NEXTAUTH_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyUserToken(token: string): JwtUser | null {
  try {
    const decoded = jwt.verify(token, NEXTAUTH_SECRET) as any;
    return { id: decoded.sub, email: decoded.email, name: decoded.name, role: decoded.role };
  } catch {
    return null;
  }
}


