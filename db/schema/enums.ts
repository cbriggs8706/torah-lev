//DELTE?
//
import { pgEnum } from 'drizzle-orm/pg-core'

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
