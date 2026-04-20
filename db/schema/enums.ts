// db/schema/enums.ts
import { pgEnum } from 'drizzle-orm/pg-core'

export const language = pgEnum('language', [
	'BIBLICAL-HEBREW',
	'BIBLICAL-GREEK',
	'MODERN-HEBREW',
	'MODERN-ENGLISH',
	'MODERN-SPANISH',
])
export const groupType = pgEnum('group_type', ['GROUP', 'SUBGROUP', 'TRIBE'])
export const courseType = pgEnum('course_type', [
	'INPERSON',
	'VIRTUAL',
	'HYBRID',
	'SELFPACED',
])
export const bookType = pgEnum('book_type', [
	'SCRIPTURE',
	'STORY',
	'LESSON-SCRIPT',
	'SONG',
	'PRAYER',
])
export const proficiencyLevel = pgEnum('proficiency_level', [
	'A1',
	'A2',
	'B1',
	'B2',
	'C1',
	'C2',
])
export const dayOfWeek = pgEnum('day_of_week', [
	'MON',
	'TUE',
	'WED',
	'THU',
	'FRI',
	'SAT',
	'SUN',
])
export const courseMemberRole = pgEnum('course_member_role', [
	'organizer',
	'teacher',
	'ta',
	'student',
])
export const assignmentSourceType = pgEnum('assignment_source_type', [
	'existing_lesson',
	'existing_chapter',
	'custom',
])
export const attendanceStatus = pgEnum('attendance_status', [
	'present',
	'absent',
	'late',
])
export const threadType = pgEnum('thread_type', ['course', 'dm', 'group'])
export const threadMemberRole = pgEnum('thread_member_role', ['owner', 'member'])
export const lesson = pgEnum('lesson', [
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'10',
	'11',
	'12',
	'13',
	'14',
	'15',
	'16',
	'17',
	'18',
	'19',
	'20',
])
export const locationType = pgEnum('location_type', [
	'in_person',
	'zoom',
	'hybrid',
])
export const type = pgEnum('type', [
	'SELECT',
	'ASSIST',
	'HEAR',
	'WATCH',
	'PLAY',
	'AUDIO-VISUAL',
	'AUDIO-TEXT',
	'VISUAL-AUDIO',
	'VISUAL-TEXT',
	'TEXT-AUDIO',
	'TEXT-VISUAL',
])

export const mediaKind = pgEnum('media_kind', [
	'image',
	'audio',
	'video',
	'document',
	'other',
])
