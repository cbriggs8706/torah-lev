import {
	SimpleForm,
	Create,
	TextInput,
	ReferenceInput,
	NumberInput,
	required,
	SelectInput,
} from 'react-admin'

export const ChallengeCreate = () => {
	return (
		<Create>
			<SimpleForm>
				<TextInput source="question" validate={[required()]} label="Question" />
				<SelectInput
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
					validate={[required()]}
				/>
				<ReferenceInput source="lessonId" reference="lessons" />
				<NumberInput source="order" validate={[required()]} label="Order" />
				<TextInput source="video" label="Video Url" />
				<TextInput source="play" label="Play Url" />
			</SimpleForm>
		</Create>
	)
}
