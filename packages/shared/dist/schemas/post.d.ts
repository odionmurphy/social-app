import { z } from 'zod';
export declare const CreatePostSchema: z.ZodObject<{
    caption: z.ZodOptional<z.ZodString>;
    mediaType: z.ZodEnum<{
        IMAGE: "IMAGE";
        VIDEO: "VIDEO";
    }>;
}, z.core.$strip>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
