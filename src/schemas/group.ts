import { z } from 'zod'

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, 'Group name must be at least 2 characters'),
  participantIds: z
    .array(z.string())
    .min(2, 'Pick at least 2 other people for a group'),
})

export type CreateGroupFormValues = z.infer<typeof createGroupSchema>
