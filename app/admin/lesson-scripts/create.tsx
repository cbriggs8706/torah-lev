import { SimpleForm, Create, TextInput, required } from 'react-admin'

export const LessonScriptCreate = () => {
	return (
		<Create>
			<SimpleForm>
				<TextInput source="lessonId" validate={[required()]} label="lessonId" />
				<TextInput source="content" label="content" />
				<TextInput source="contentPlain" label="contentPlain" />
			</SimpleForm>
		</Create>
	)
}
