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

import { LessonScriptList } from './lesson-scripts/list'
import { LessonScriptCreate } from './lesson-scripts/create'
import { LessonScriptEdit } from './lesson-scripts/edit'
import { GrammarLessonList } from './grammar-lessons/list'
import { GrammarLessonEdit } from './grammar-lessons/edit'
import { GrammarLessonCreate } from './grammar-lessons/create'

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
				name="lesson-scripts"
				list={LessonScriptList}
				create={LessonScriptCreate}
				edit={LessonScriptEdit}
				recordRepresentation="text"
				options={{ label: 'Lesson Scripts' }}
			/>
			<Resource
				name="grammar-lessons"
				list={GrammarLessonList}
				create={GrammarLessonCreate}
				edit={GrammarLessonEdit}
				recordRepresentation="text"
				options={{ label: 'Grammar Lessons' }}
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
