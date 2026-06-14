import { z } from 'zod'

export const CreatePostSchema = z.object({
  caption:   z.string().max(500).optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
})

export type CreatePostInput = z.infer<typeof CreatePostSchema>
