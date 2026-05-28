//app/admin/app.tsx
'use client'

import { Admin, CustomRoutes, Layout, Resource } from 'react-admin'
import { createTheme } from '@mui/material/styles'
import simpleRestProvider from 'ra-data-simple-rest'
import { BrowserRouter, Route } from 'react-router-dom'

import { CourseList } from './course/list'
import { CourseEdit } from './course/edit'
import { CourseCreate } from './course/create'

import { LessonList } from './lesson/list'
import { LessonEdit } from './lesson/edit'
import { LessonCreate } from './lesson/create'

import { ChallengeList } from './challenge/list'
import { ChallengeEdit } from './challenge/edit'
import { ChallengeCreate } from './challenge/create'

import { ChallengeOptionList } from './challengeOption/list'
import { ChallengeOptionEdit } from './challengeOption/edit'
import { ChallengeOptionCreate } from './challengeOption/create'

import GenerateChallengesPage from './generate-challenges/view'
import VocabIntroPage from './vocab-intros/view'
import VocabRelationsPage from './vocab-relations/view'
import PublicCoursesAdminPage from './public-courses/view'

import { AdminMenu } from '@/components/admin-menu'

import { GreekLessonScriptList } from './el-lesson-scripts/list'
import { GreekLessonScriptCreate } from './el-lesson-scripts/create'
import { GreekLessonScriptEdit } from './el-lesson-scripts/edit'

import { GrammarLessonList } from './grammar-lessons/list'
import { GrammarLessonEdit } from './grammar-lessons/edit'
import { GrammarLessonCreate } from './grammar-lessons/create'

import { VideoList } from './videos/list'
import { VideoCreate } from './videos/create'
import { VideoEdit } from './videos/edit'

import { VocabEntryList } from './vocab-entries/list'
import { VocabEntryCreate } from './vocab-entries/create'
import { VocabEntryEdit } from './vocab-entries/edit'
import { ConstructAbsoluteWordList } from './construct-absolute-words/list'
import { ConstructAbsoluteWordCreate } from './construct-absolute-words/create'
import { ConstructAbsoluteWordEdit } from './construct-absolute-words/edit'

const dataProvider = simpleRestProvider('/api', undefined, 'X-Total-Count')

const adminTheme = createTheme({
	components: {
		RaDatagrid: {
			styleOverrides: {
				root: {
					display: 'block',
					width: '100%',
					maxWidth: '100%',
					overflowX: 'auto',
					overflowY: 'hidden',
					scrollbarGutter: 'stable',
					WebkitOverflowScrolling: 'touch',
					'& .RaDatagrid-tableWrapper': {
						maxHeight: 'calc(100vh - 260px)',
						overflowX: 'auto',
						overflowY: 'auto',
						WebkitOverflowScrolling: 'touch',
					},
					'& .RaDatagrid-table': {
						width: 'max-content',
						minWidth: '100%',
						tableLayout: 'auto',
					},
					'& .RaDatagrid-headerCell, & .RaDatagrid-rowCell': {
						whiteSpace: 'nowrap',
					},
				},
			},
		},
		RaDataTable: {
			styleOverrides: {
				root: {
					display: 'block',
					width: '100%',
					maxWidth: '100%',
					overflowX: 'auto',
					overflowY: 'hidden',
					scrollbarGutter: 'stable',
					WebkitOverflowScrolling: 'touch',
					'& .RaDataTable-tableWrapper': {
						maxHeight: 'calc(100vh - 260px)',
						overflowX: 'auto',
						overflowY: 'auto',
						WebkitOverflowScrolling: 'touch',
					},
					'& .RaDataTable-table': {
						width: 'max-content',
						minWidth: '100%',
						tableLayout: 'auto',
					},
					'& .RaDataTable-headerCell, & .RaDataTable-rowCell': {
						whiteSpace: 'nowrap',
					},
				},
			},
		},
	},
})

const adminLayoutSx = {
	'& .RaLayout-content': {
		minWidth: 0,
		overflowX: 'auto',
	},
	'& .RaList-main': {
		minWidth: 0,
	},
	'& .RaList-content': {
		minWidth: 0,
		overflowX: 'auto',
	},
} as const

const AdminLayout = (props: any) => (
	<Layout {...props} menu={AdminMenu} sx={adminLayoutSx} />
)

const App = () => {
	return (
		<BrowserRouter basename="/admin">
			<Admin
				dataProvider={dataProvider}
				layout={AdminLayout}
				theme={adminTheme}
			>
				<Resource
					name="curriculum"
					list={CourseList}
					create={CourseCreate}
					edit={CourseEdit}
					recordRepresentation="title"
					options={{ label: 'Curriculum' }}
				/>
				<Resource
					name="lessons"
					list={LessonList}
					create={LessonCreate}
					edit={LessonEdit}
					recordRepresentation="title"
				/>
				<Resource
					name="challenges"
					list={ChallengeList}
					create={ChallengeCreate}
					edit={ChallengeEdit}
					recordRepresentation="question"
				/>
				<Resource
					name="challengeOptions"
					list={ChallengeOptionList}
					create={ChallengeOptionCreate}
					edit={ChallengeOptionEdit}
					recordRepresentation="text"
					options={{ label: 'Challenge Options' }}
				/>
				<Resource
					name="el-lesson-scripts"
					list={GreekLessonScriptList}
					create={GreekLessonScriptCreate}
					edit={GreekLessonScriptEdit}
					recordRepresentation="text"
					options={{ label: 'Grk Lesson Scripts' }}
				/>
				<Resource
					name="grammar-lessons"
					list={GrammarLessonList}
					create={GrammarLessonCreate}
					edit={GrammarLessonEdit}
					recordRepresentation="text"
					options={{ label: 'Grammar Lessons' }}
				/>
				<Resource
					name="videos"
					list={VideoList}
					create={VideoCreate}
					edit={VideoEdit}
					recordRepresentation="title"
					options={{ label: 'Videos' }}
				/>
				<Resource
					name="vocab-entries"
					list={VocabEntryList}
					create={VocabEntryCreate}
					edit={VocabEntryEdit}
					recordRepresentation="gloss"
					options={{ label: 'Vocab' }}
				/>
				<Resource
					name="construct-absolute-words"
					list={ConstructAbsoluteWordList}
					create={ConstructAbsoluteWordCreate}
					edit={ConstructAbsoluteWordEdit}
					recordRepresentation="absolute"
					options={{ label: 'Construct / Absolute Words' }}
				/>
				<CustomRoutes>
					<Route
						path="/generate-challenges"
						element={<GenerateChallengesPage />}
					/>
					<Route path="/public-courses" element={<PublicCoursesAdminPage />} />
					<Route path="/vocab-intros" element={<VocabIntroPage />} />
					<Route path="/vocab-relations" element={<VocabRelationsPage />} />
				</CustomRoutes>
				<hr />
			</Admin>
		</BrowserRouter>
	)
}

export default App
