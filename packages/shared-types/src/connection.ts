import { z } from "zod";

export const AuthMode = {
  APP_PASSWORD: "app_password",
  OAUTH: "oauth",
} as const;

export type AuthMode = (typeof AuthMode)[keyof typeof AuthMode];

export const ConnectionStatus = {
  ACTIVE: "active",
  ERROR: "error",
  DISCONNECTED: "disconnected",
} as const;

export type ConnectionStatus =
  (typeof ConnectionStatus)[keyof typeof ConnectionStatus];

export const MailConnectionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  provider: z.literal("yahoo"),
  authMode: z.enum(["app_password", "oauth"]),
  status: z.enum(["active", "error", "disconnected"]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type MailConnection = z.infer<typeof MailConnectionSchema>;

export const CreateYahooConnectionInputSchema = z.object({
  yahooEmail: z
    .string()
    .email("Must be a valid Yahoo email address")
    .refine(
      (e) => e.endsWith("@yahoo.com") || e.endsWith("@ymail.com") || e.endsWith("@yahoo.co.uk") || e.endsWith("@yahoo.com.au"),
      "Must be a Yahoo email address (@yahoo.com, @ymail.com, etc.)"
    ),
  appPassword: z
    .string()
    .min(8, "App password is too short")
    .max(64, "App password is too long")
    .regex(/^[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{4}$|^[a-zA-Z0-9 ]{8,}$/, "Invalid app password format"),
});

export type CreateYahooConnectionInput = z.infer<
  typeof CreateYahooConnectionInputSchema
>;

export const ConnectionPublicSchema = MailConnectionSchema.omit({
  userId: true,
});
export type ConnectionPublic = z.infer<typeof ConnectionPublicSchema>;

export const EncryptedSecretBlob = z.object({
  email: z.string().email(),
  appPassword: z.string(),
});

export type EncryptedSecretBlob = z.infer<typeof EncryptedSecretBlob>;
