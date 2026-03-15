//app/admin/app.tsx
'use client'

import { Admin, CustomRoutes, Resource } from 'react-admin'
import simpleRestProvider from 'ra-data-simple-rest'
import { Route } from 'react-router-dom'

import { CourseList } from './course/list'
import { CourseEdit } from './course/edit'
import { CourseCreate } from './course/create'

import { UnitList } from './unit/list'
import { UnitEdit } from './unit/edit'
import { UnitCreate } from './unit/create'

import { LessonList } from './lesson/list'
import { LessonEdit } from './lesson/edit'
import { LessonCreate } from './lesson/create'

import { ChallengeList } from './challenge/list'
import { ChallengeEdit } from './challenge/edit'
import { ChallengeCreate } from './challenge/create'

import { ChallengeOptionList } from './challengeOption/list'
import { ChallengeOptionEdit } from './challengeOption/edit'
import { ChallengeOptionCreate } from './challengeOption/create'

import GenerateChallengesPage from './generate-challenges/page'

import { AdminMenu } from '@/components/admin-menu'

import { HebrewLessonScriptList } from './he-lesson-scripts/list'
import { HebrewLessonScriptCreate } from './he-lesson-scripts/create'
import { HebrewLessonScriptEdit } from './he-lesson-scripts/edit'

import { GreekLessonScriptList } from './el-lesson-scripts/list'
import { GreekLessonScriptCreate } from './el-lesson-scripts/create'
import { GreekLessonScriptEdit } from './el-lesson-scripts/edit'

import { GrammarLessonList } from './grammar-lessons/list'
import { GrammarLessonEdit } from './grammar-lessons/edit'
import { GrammarLessonCreate } from './grammar-lessons/create'

import { HebrewStoryList } from './he-stories/list'
import { HebrewStoryEdit } from './he-stories/edit'
import { HebrewStoryCreate } from './he-stories/create'

import { EnglishLessonScriptList } from './english-lesson-scripts/list'
import { EnglishLessonScriptCreate } from './english-lesson-scripts/create'
import { EnglishLessonScriptEdit } from './english-lesson-scripts/edit'
import { VocabEntryList } from './vocab-entries/list'
import { VocabEntryCreate } from './vocab-entries/create'
import { VocabEntryEdit } from './vocab-entries/edit'

const dataProvider = simpleRestProvider('/api')

const App = () => {
	return (
		<Admin dataProvider={dataProvider} menu={AdminMenu}>
			<Resource
				name="courses"
				list={CourseList}
				create={CourseCreate}
				edit={CourseEdit}
				recordRepresentation="title"
			/>
			<Resource
				name="units"
				list={UnitList}
				create={UnitCreate}
				edit={UnitEdit}
				recordRepresentation="title"
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
				name="he-lesson-scripts"
				list={HebrewLessonScriptList}
				create={HebrewLessonScriptCreate}
				edit={HebrewLessonScriptEdit}
				recordRepresentation="text"
				options={{ label: 'Heb Lesson Scripts' }}
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
				name="english-lesson-scripts"
				list={EnglishLessonScriptList}
				create={EnglishLessonScriptCreate}
				edit={EnglishLessonScriptEdit}
				recordRepresentation="text"
				options={{ label: 'Eng Lesson Scripts' }}
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
				name="he-stories"
				list={HebrewStoryList}
				create={HebrewStoryCreate}
				edit={HebrewStoryEdit}
				recordRepresentation="text"
				options={{ label: 'Heb Stories' }}
			/>
			<Resource
				name="vocab-entries"
				list={VocabEntryList}
				create={VocabEntryCreate}
				edit={VocabEntryEdit}
				recordRepresentation="eng"
				options={{ label: 'Vocab' }}
			/>
			<CustomRoutes>
				<Route
					path="/generate-challenges"
					element={<GenerateChallengesPage />}
				/>
			</CustomRoutes>
			<hr />
		</Admin>
	)
}

export default App
