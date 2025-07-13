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
					validate={[required()]}
				/>
				<ReferenceInput source="lessonId" reference="lessons" />
				<NumberInput source="order" validate={[required()]} label="Order" />
				<TextInput source="video" label="Video Url" />
				<TextInput source="image" label="image" />
				<TextInput source="audio" label="audio" />
				<TextInput source="hebNiqqud" label="hebNiqqud" />
			</SimpleForm>
		</Create>
	)
}
