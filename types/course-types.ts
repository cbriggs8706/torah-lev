import { courseType, proficiencyLevel } from '@/db/schema/enums'

export type CourseType = (typeof courseType.enumValues)[number]
export type Level = (typeof proficiencyLevel.enumValues)[number]
