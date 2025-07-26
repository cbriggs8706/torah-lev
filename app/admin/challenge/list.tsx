import {
	Datagrid,
	List,
	TextField,
	ReferenceField,
	NumberField,
	SelectField,
	TextInput,
	SelectInput,
	Pagination,
} from 'react-admin'

const challengeFilters = [
	<TextInput
		key="question"
		label="Search by Question"
		source="question"
		alwaysOn
	/>,
	<SelectInput
		key="type"
		label="Type"
		source="type"
		choices={[
			{ id: 'SELECT', name: 'SELECT' },
			{ id: 'ASSIST', name: 'ASSIST' },
			{ id: 'WATCH', name: 'WATCH' },
			{ id: 'AUDIO-VISUAL', name: 'AUDIO-VISUAL' },
			{ id: 'AUDIO-TEXT', name: 'AUDIO-TEXT' },
			{ id: 'VISUAL-AUDIO', name: 'VISUAL-AUDIO' },
			{ id: 'VISUAL-TEXT', name: 'VISUAL-TEXT' },
			{ id: 'TEXT-AUDIO', name: 'TEXT-AUDIO' },
			{ id: 'TEXT-VISUAL', name: 'TEXT-VISUAL' },
		]}
	/>,
]

export const ChallengeList = () => (
	<List
		filters={challengeFilters}
		sort={{ field: 'order', order: 'ASC' }}
		perPage={25}
		pagination={<Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
	>
		<Datagrid rowClick="edit">
			<TextField source="id" />
			<TextField source="question" />
			<SelectField
				source="type"
				choices={[
					{ id: 'SELECT', name: 'SELECT' },
					{ id: 'ASSIST', name: 'ASSIST' },
					{ id: 'WATCH', name: 'WATCH' },
					{ id: 'AUDIO-VISUAL', name: 'AUDIO-VISUAL' },
					{ id: 'AUDIO-TEXT', name: 'AUDIO-TEXT' },
					{ id: 'VISUAL-AUDIO', name: 'VISUAL-AUDIO' },
					{ id: 'VISUAL-TEXT', name: 'VISUAL-TEXT' },
					{ id: 'TEXT-AUDIO', name: 'TEXT-AUDIO' },
					{ id: 'TEXT-VISUAL', name: 'TEXT-VISUAL' },
				]}
			/>
			<ReferenceField source="lessonId" reference="lessons" />
			<NumberField source="order" />
			<TextField source="video" />
			<TextField source="image" />
			<TextField source="audio" />
			<TextField source="hebNiqqud" />
		</Datagrid>
	</List>
)
