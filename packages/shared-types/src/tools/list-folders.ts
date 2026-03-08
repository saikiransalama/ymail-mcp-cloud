import { z } from "zod";
import { FolderInfoSchema } from "../message.js";

export const ListFoldersInputSchema = z.object({}).describe("List all mailbox folders");

export type ListFoldersInput = z.infer<typeof ListFoldersInputSchema>;

export const ListFoldersOutputSchema = z.object({
  folders: z.array(FolderInfoSchema),
});

export type ListFoldersOutput = z.infer<typeof ListFoldersOutputSchema>;
