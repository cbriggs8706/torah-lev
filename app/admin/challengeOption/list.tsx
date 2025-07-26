import {
	Datagrid,
	List,
	TextField,
	ReferenceField,
	NumberField,
	BooleanField,
	TextInput,
	BooleanInput,
	Pagination,
} from 'react-admin'

const optionFilters = [
	<TextInput key="text" label="Search Text" source="text" alwaysOn />,
	<TextInput key="challengeId" label="Challenge ID" source="challengeId" />,
	<BooleanInput key="correct" label="Correct" source="correct" />,
]

export const ChallengeOptionList = () => (
	<List
		filters={optionFilters}
		sort={{ field: 'id', order: 'ASC' }}
		perPage={25}
		pagination={<Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
	>
		<Datagrid rowClick="edit">
			<NumberField source="id" />
			<TextField source="text" />
			<BooleanField source="correct" />
			<ReferenceField source="challengeId" reference="challenges" link="edit">
				<TextField source="question" /> {/* ✅ Force display of question */}
			</ReferenceField>{' '}
			<TextField source="imageSrc" />
			<TextField source="audioSrc" />
		</Datagrid>
	</List>
)
