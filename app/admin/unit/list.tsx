import {
	Datagrid,
	List,
	TextField,
	ReferenceField,
	TextInput,
	Pagination,
} from 'react-admin'

const unitFilters = [
	<TextInput key="title" label="Search by Title" source="title" alwaysOn />,
	<TextInput key="courseId" label="Course ID" source="courseId" />,
]

export const UnitList = () => (
	<List
		filters={unitFilters}
		sort={{ field: 'order', order: 'ASC' }}
		perPage={25}
		pagination={<Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
	>
		<Datagrid rowClick="edit">
			<TextField source="id" />
			<TextField source="title" />
			<TextField source="description" />
			<ReferenceField source="courseId" reference="curriculum" link="edit">
				<TextField source="title" /> {/* ✅ show the course title */}
			</ReferenceField>
			<TextField source="order" />
		</Datagrid>
	</List>
)
