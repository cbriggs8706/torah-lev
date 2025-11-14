import {
	pgTable,
	foreignKey,
	text,
	uuid,
	timestamp,
	integer,
	unique,
	varchar,
	boolean,
	pgPolicy,
	bigint,
	serial,
	index,
	jsonb,
	primaryKey,
	pgEnum,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const groupType = pgEnum('group_type', ['GROUP', 'SUBGROUP', 'TRIBE'])
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

export const session = pgTable(
	'session',
	{
		sessionToken: text().primaryKey().notNull(),
		userId: uuid().notNull(),
		expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'session_userId_user_id_fk',
		}).onDelete('cascade'),
	]
)

export const lessons = pgTable(
	'lessons',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		unitId: uuid('unit_id').notNull(),
		slug: text().notNull(),
		order: integer().default(0),
		lessonNumber: text('lesson_number').default('').notNull(),
		createdAt: timestamp('created_at', { mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: 'lessons_unit_id_units_id_fk',
		}).onDelete('cascade'),
	]
)

export const user = pgTable(
	'user',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		name: varchar({ length: 255 }),
		email: varchar({ length: 255 }).notNull(),
		emailVerified: timestamp({ withTimezone: true, mode: 'string' }),
		image: text(),
		username: varchar({ length: 100 }),
		passwordHash: text('password_hash'),
		role: varchar({ length: 50 }).default('user').notNull(),
	},
	(table) => [unique('user_email_unique').on(table.email)]
)

export const units = pgTable(
	'units',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		courseId: uuid('course_id').notNull(),
		slug: text().notNull(),
		order: integer().default(0),
		description: text(),
		createdAt: timestamp('created_at', { mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'units_course_id_courses_id_fk',
		}).onDelete('cascade'),
	]
)

export const courses = pgTable(
	'courses',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		slug: text().notNull(),
		imageSrc: text('image_src').notNull(),
		category: text(),
		startProficiencyLevel: text('start_proficiency_level'),
		endProficiencyLevel: text('end_proficiency_level'),
		public: boolean().default(true).notNull(),
		createdAt: timestamp('created_at', { mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [unique('courses_slug_unique').on(table.slug)]
)

export const gameResults = pgTable(
	'game_results',
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint({ mode: 'number' })
			.primaryKey()
			.generatedAlwaysAsIdentity({
				name: 'game_results_id_seq',
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036854775807,
				cache: 1,
			}),
		studyGroupId: integer('study_group_id').notNull(),
		userId: text('user_id').notNull(),
		userName: text('user_name').notNull(),
		points: integer().default(0).notNull(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
	},
	(table) => [
		pgPolicy('Enable read access for all users', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`true`,
		}),
	]
)

export const messages = pgTable(
	'messages',
	{
		id: serial().primaryKey().notNull(),
		senderId: text('sender_id').notNull(),
		studyGroupId: integer('study_group_id').notNull(),
		content: text().notNull(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
		tempId: text('temp_id'),
	},
	(table) => [
		pgPolicy('Enable read access for all users', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`true`,
		}),
	]
)

export const studyGroupSchedule = pgTable(
	'study_group_schedule',
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint({ mode: 'number' })
			.primaryKey()
			.generatedAlwaysAsIdentity({
				name: 'study_group_schedule_id_seq',
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036854775807,
				cache: 1,
			}),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		studyGroupId: bigint('study_group_id', { mode: 'number' }).notNull(),
		classDate: timestamp('class_date', {
			withTimezone: true,
			mode: 'string',
		}).notNull(),
		notes: text(),
		homeworkInstructions: text('homework_instructions'),
		homeworkLinks: text('homework_links').array(),
		isCanceled: boolean('is_canceled').default(false).notNull(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
		homeworkLinksJson: jsonb('homework_links_json'),
		recordingLink: text('recording_link'),
	},
	(table) => [
		index('idx_study_group_schedule_group').using(
			'btree',
			table.studyGroupId.asc().nullsLast().op('int8_ops')
		),
		pgPolicy('Enable read access for all users', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`true`,
		}),
	]
)

export const studyGroupScheduleLessons = pgTable(
	'study_group_schedule_lessons',
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint({ mode: 'number' })
			.primaryKey()
			.generatedAlwaysAsIdentity({
				name: 'study_group_schedule_lessons_id_seq',
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036854775807,
				cache: 1,
			}),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		scheduleId: bigint('schedule_id', { mode: 'number' }).notNull(),
		lessonId: integer('lesson_id').notNull(),
		orderIndex: integer('order_index').default(1),
		lessonTitle: text('lesson_title'),
	},
	(table) => [
		foreignKey({
			columns: [table.scheduleId],
			foreignColumns: [studyGroupSchedule.id],
			name: 'study_group_schedule_lessons_schedule_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('Enable read access for all users', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`true`,
		}),
	]
)

export const studyGroupSessions = pgTable(
	'study_group_sessions',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		studyGroupId: integer('study_group_id').notNull(),
		lessonId: integer('lesson_id'),
		lessonTitle: text('lesson_title'),
		isActive: boolean('is_active').default(false),
		startedAt: timestamp('started_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
	},
	(table) => [
		unique('study_group_sessions_study_group_id_key').on(table.studyGroupId),
		pgPolicy('Enable read access for all users', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`true`,
		}),
	]
)

export const verificationToken = pgTable(
	'verificationToken',
	{
		identifier: varchar({ length: 255 }).notNull(),
		token: text().notNull(),
		expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.identifier, table.token],
			name: 'verificationToken_identifier_token_pk',
		}),
	]
)

export const account = pgTable(
	'account',
	{
		userId: uuid().notNull(),
		type: varchar({ length: 255 }).notNull(),
		provider: varchar({ length: 255 }).notNull(),
		providerAccountId: varchar({ length: 255 }).notNull(),
		refreshToken: text('refresh_token'),
		accessToken: text('access_token'),
		expiresAt: integer('expires_at'),
		tokenType: varchar('token_type', { length: 255 }),
		scope: text(),
		idToken: text('id_token'),
		sessionState: text('session_state'),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'account_userId_user_id_fk',
		}).onDelete('cascade'),
		primaryKey({
			columns: [table.provider, table.providerAccountId],
			name: 'account_provider_providerAccountId_pk',
		}),
	]
)
