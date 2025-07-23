import { Datagrid, List, TextField } from 'react-admin'

export const LessonScriptList = () => {
	return (
		<List>
			<Datagrid rowClick="edit">
				<TextField source="id" />
				<TextField source="lessonId" />
				<TextField source="content" />
				<TextField source="contentPlain" />
			</Datagrid>
		</List>
	)
}
