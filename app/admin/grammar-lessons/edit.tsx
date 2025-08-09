import { SimpleForm, Edit, TextInput, required } from 'react-admin'
import { RichTextInput } from 'ra-input-rich-text'

export const GrammarLessonEdit = () => {
	return (
		<Edit>
			<SimpleForm>
				<TextInput
					source="lessonId"
					validate={[required()]}
					label="Lesson ID"
				/>
				<RichTextInput source="content" label="content" />

				<RichTextInput source="contentPlain" label="contentPlain" />

				<TextInput source="audioSrc" label="audioSrc" />
			</SimpleForm>
		</Edit>
	)
}
