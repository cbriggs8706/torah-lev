'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import db from '@/db/drizzle'
import { studyGroups, users } from '@/db/schema'
import { getUserOrThrow } from '@/lib/auth'
import { hasRole } from '@/lib/roles'

const createStudyGroupSchema = z.object({
	name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
	startDate: z.string().trim().min(1, 'Start date is required.'),
	time: z.string().trim().min(1, 'Time is required.'),
	groupType: z.enum(['Public', 'Private', 'Self-paced']),
	level: z.string().trim().min(1, 'Level is required.'),
	organization: z
		.string()
		.trim()
		.min(1, 'Organization is required.'),
	section: z.string().trim().min(1, 'Section is required.'),
	zoomLink: z
		.string()
		.trim()
		.optional()
		.transform((value) => value || null)
		.refine(
			(value) => value === null || /^https?:\/\/\S+$/i.test(value),
			'Zoom link must be a valid URL.'
		),
	current: z.boolean().default(true),
})

export async function createStudyGroup(input: {
	name: string
	startDate: string
	time: string
	groupType: 'Public' | 'Private' | 'Self-paced'
	level: string
	organization: string
	section: string
	zoomLink?: string
	current?: boolean
}) {
	const userId = await getUserOrThrow()

	const leaderRow = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: {
			roles: true,
		},
	})

	if (!hasRole(leaderRow?.roles, 'leader')) {
		throw new Error('Only leaders can create study groups.')
	}

	const parsed = createStudyGroupSchema.parse({
		...input,
		current: input.current ?? true,
	})

	const [group] = await db
		.insert(studyGroups)
		.values({
			name: parsed.name,
			startDate: new Date(parsed.startDate),
			time: parsed.time,
			groupType: parsed.groupType,
			level: parsed.level,
			organization: parsed.organization,
			section: parsed.section,
			zoomLink: parsed.zoomLink,
			current: parsed.current,
			teacherId: userId,
		})
		.returning({
			id: studyGroups.id,
		})

	revalidatePath('/he/dashboard')

	return group
}
