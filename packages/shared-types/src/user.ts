import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserInputSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const UserPublicSchema = UserSchema.omit({ updatedAt: true });
export type UserPublic = z.infer<typeof UserPublicSchema>;
