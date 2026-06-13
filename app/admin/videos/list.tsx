'use client'

import {
	BooleanField,
	Datagrid,
	FunctionField,
	List,
	Pagination,
	ReferenceField,
	SelectField,
	SelectInput,
	TextField,
	TextInput,
} from 'react-admin'

const VIDEO_TYPE_CHOICES = [
	{ id: 'lesson', name: 'Lesson' },
	{ id: 'review', name: 'Review' },
	{ id: 'story', name: 'Story' },
	{ id: 'song', name: 'Song' },
	{ id: 'scripture', name: 'Scripture' },
]

const TruncatedTextField = ({ source }: { source: string }) => (
	<TextField
		source={source}
		sx={{
			maxWidth: 180,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
			display: 'block',
		}}
	/>
)

const videoFilters = [
	<TextInput key="q" source="q" label="Search" alwaysOn />,
	<SelectInput
		key="type"
		source="type"
		label="Type"
		choices={VIDEO_TYPE_CHOICES}
		emptyText="All"
	/>,
	<TextInput key="category" source="category" label="Category" />,
]

export const VideoList = () => (
	<List
		filters={videoFilters}
		sort={{ field: 'id', order: 'ASC' }}
		perPage={25}
		pagination={<Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
	>
		<Datagrid rowClick="edit">
			<TextField source="id" />
			<SelectField source="type" choices={VIDEO_TYPE_CHOICES} />
			<ReferenceField
				source="lessonId"
				reference="lessons"
				label="Lesson"
				link={false}
			>
				<FunctionField
					render={(record: { lessonNumber?: string | null; title?: string | null }) =>
						`${record.lessonNumber || 'No. ?'} - ${record.title || 'Untitled'}`
					}
				/>
			</ReferenceField>
			<TextField source="courseTitles" label="Curriculum" />
			<TextField source="title" />
			<TextField source="hebTitle" />
			<TextField source="category" />
			<TextField source="scriptureBook" label="Book" />
			<TextField source="scriptureChapter" label="Chapter" />
			<TextField source="scriptureVerses" label="Verses" />
			<TextField source="part" />
			<TextField source="order" />
			<BooleanField source="public" />
			<TruncatedTextField source="videoUrl" />
			<TruncatedTextField source="audio" />
			<TruncatedTextField source="audioSrc" />
		</Datagrid>
	</List>
)
