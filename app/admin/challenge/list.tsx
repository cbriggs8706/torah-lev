import {
	Datagrid,
	List,
	TextField,
	ReferenceField,
	NumberField,
	SelectField,
} from 'react-admin'

export const ChallengeList = () => {
	return (
		<List>
			<Datagrid rowClick="edit">
				<TextField source="id" />
				<TextField source="question" />
				<SelectField
					source="type"
					choices={[
						{
							id: 'SELECT',
							name: 'SELECT',
						},
						{
							id: 'ASSIST',
							name: 'ASSIST',
						},
						{
							id: 'WATCH',
							name: 'WATCH',
						},
						{
							id: 'AUDIO-VISUAL',
							name: 'AUDIO-VISUAL',
						},
						{
							id: 'AUDIO-TEXT',
							name: 'AUDIO-TEXT',
						},

						{
							id: 'VISUAL-AUDIO',
							name: 'VISUAL-AUDIO',
						},
						{
							id: 'VISUAL-TEXT',
							name: 'VISUAL-TEXT',
						},
						{
							id: 'TEXT-AUDIO',
							name: 'TEXT-AUDIO',
						},
						{
							id: 'TEXT-VISUAL',
							name: 'TEXT-VISUAL',
						},
					]}
				/>
				<ReferenceField source="lessonId" reference="lessons" />
				<NumberField source="order" />
				<TextField source="video" />
			</Datagrid>
		</List>
	)
}
