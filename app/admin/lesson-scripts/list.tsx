import { Datagrid, List, TextField } from 'react-admin'

const TruncatedTextField = ({ source }: { source: string }) => (
	<TextField
		source={source}
		sx={{
			maxWidth: 100,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
			display: 'block',
		}}
	/>
)

export const LessonScriptList = () => {
	return (
		<List>
			<Datagrid rowClick="edit">
				<TextField source="id" />
				<TextField source="lessonId" />
				<TruncatedTextField source="content" />
				<TruncatedTextField source="contentPlain" />
				<TextField source="audioSrc" />
			</Datagrid>
		</List>
	)
}
