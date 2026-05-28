import {
	List,
	Datagrid,
	TextField,
	ReferenceField,
	NumberField,
	TextInput,
	Pagination,
} from 'react-admin'

const lessonFilters = [
	<TextInput key="title" label="Search by Title" source="title" alwaysOn />,
]

export const LessonList = () => (
	<List
		filters={lessonFilters}
		sort={{ field: 'order', order: 'ASC' }}
		perPage={25}
		pagination={<Pagination rowsPerPageOptions={[10, 25, 50, 100]} />} // ✅ Allow user to pick
	>
		<Datagrid rowClick="edit">
			<TextField source="id" />
			<TextField source="title" sortable />
			<ReferenceField source="courseId" reference="curriculum" />
			<NumberField source="order" sortable />
			<TextField source="lessonNumber" sortable />
		</Datagrid>
	</List>
)
