import { z } from "zod";

export const itemStatusEnum = z.enum(["to_watch", "watching"]);

export const createItemSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  channel: z.string().optional(),
  duration: z.number().int().positive().optional(),
  source: z.string().default("youtube"),
  sourceId: z.string().min(1),
});

export const updateItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  channel: z.string().optional(),
  duration: z.number().int().positive().optional(),
  status: itemStatusEnum.optional(),
  lastPositionSeconds: z.number().int().nonnegative().optional(),
});

export const searchItemsSchema = z.object({
  query: z.string().optional(),
  status: itemStatusEnum.optional(),
  tagIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
});

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
});

export const youtubeUrlSchema = z.string().url().refine(
  (url) => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];
    return patterns.some((pattern) => pattern.test(url));
  },
  { message: "Invalid YouTube URL" }
);

export type ItemStatus = z.infer<typeof itemStatusEnum>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type SearchItemsInput = z.infer<typeof searchItemsSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
