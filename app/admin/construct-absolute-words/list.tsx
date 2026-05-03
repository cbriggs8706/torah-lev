'use client'

import {
	Datagrid,
	List,
	Pagination,
	TextField,
	TextInput,
} from 'react-admin'

const filters = [
	<TextInput key="q" source="q" label="Search" alwaysOn />,
	<TextInput key="lessonId" source="lessonId" label="Lesson ID" />,
]

export const ConstructAbsoluteWordList = () => (
	<List
		filters={filters}
		sort={{ field: 'lessonSort', order: 'ASC' }}
		perPage={25}
		pagination={<Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
	>
		<Datagrid rowClick="edit" bulkActionButtons={false}>
			<TextField source="id" />
			<TextField source="lessonLabel" label="Lesson" />
			<TextField source="absolute" />
			<TextField source="construct" />
		</Datagrid>
	</List>
)
