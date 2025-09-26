import { Datagrid, List, TextField, TextInput, Pagination } from 'react-admin'

const TruncatedTextField = ({ source }: { source: string }) => (
	<TextField
		source={source}
		sx={{
			maxWidth: 150,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
			display: 'block',
		}}
	/>
)

const scriptFilters = [
	<TextInput key="lessonId" label="Lesson ID" source="lessonId" />,
	<TextInput key="content" label="Search Content" source="content" />,
]

export const HebrewStoryList = () => (
	<List
		filters={scriptFilters}
		sort={{ field: 'id', order: 'ASC' }}
		perPage={25}
		pagination={<Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
	>
		<Datagrid rowClick="edit">
			<TextField source="id" />
			<TextField source="order" />
			<TextField source="lessonId" />
			<TextField source="courseId" />
			<TextField source="title" />
			{/* <TruncatedTextField source="content" />
			<TruncatedTextField source="contentPlain" /> */}
			<TruncatedTextField source="video" />
			<TruncatedTextField source="audio" />
		</Datagrid>
	</List>
)
