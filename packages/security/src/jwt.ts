import jwt, { type SignOptions } from "jsonwebtoken";
import type { JwtPayload } from "@ymail-mcp/shared-types";
import { AppError } from "@ymail-mcp/shared-types";

export function signToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string,
  expiresIn: string | number = "24h"
): string {
  if (!secret || secret.length < 32) {
    throw new AppError(
      "INTERNAL_ERROR",
      "JWT_SECRET must be at least 32 characters"
    );
  }
  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload as object, secret, options);
}

export function verifyToken(
  token: string,
  secret: string
): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof decoded === "string") return null;
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}

export function extractBearerToken(
  authorizationHeader: string | undefined
): string | null {
  if (!authorizationHeader) return null;
  const parts = authorizationHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  const token = parts[1];
  if (!token || token.trim() === "") return null;
  return token;
}
