import { Datagrid, List, TextField, TextInput, Pagination } from 'react-admin'

const courseFilters = [
	<TextInput key="title" label="Search by Title" source="title" alwaysOn />,
]

export const CourseList = () => (
	<List
		filters={courseFilters}
		sort={{ field: 'id', order: 'ASC' }}
		perPage={25}
		pagination={<Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
	>
		<Datagrid rowClick="edit">
			<TextField source="id" />
			<TextField source="title" />
			<TextField source="imageSrc" />
		</Datagrid>
	</List>
)
