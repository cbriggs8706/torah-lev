import { SimpleForm, Create, TextInput, required } from 'react-admin'
import { RichTextInput } from 'ra-input-rich-text'

export const GrammarLessonCreate = () => {
	return (
		<Create>
			<SimpleForm>
				<TextInput source="lessonId" validate={[required()]} label="lessonId" />
				<RichTextInput source="content" label="content" />

				<RichTextInput source="contentPlain" label="contentPlain" />

				<TextInput source="audioSrc" label="audioSrc" />
			</SimpleForm>
		</Create>
	)
}
