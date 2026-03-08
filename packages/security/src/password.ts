import argon2 from "argon2";
import { ARGON2_CONFIG } from "./constants.js";

export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: ARGON2_CONFIG.memoryCost,
    timeCost: ARGON2_CONFIG.timeCost,
    parallelism: ARGON2_CONFIG.parallelism,
    hashLength: ARGON2_CONFIG.hashLength,
  });
}

export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    return false;
  }
}
