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
							id: 'PLAY',
							name: 'PLAY',
						},
					]}
				/>
				<ReferenceField source="lessonId" reference="lessons" />
				<NumberField source="order" />
				<TextField source="video" />
				<TextField source="play" />
			</Datagrid>
		</List>
	)
}
