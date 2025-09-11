import { SimpleForm, Edit, TextInput, required } from 'react-admin'
import { RichTextInput } from 'ra-input-rich-text'
import TinyMCEInput from '@/components/tinymceinput'

export const EnglishLessonScriptEdit = () => {
	return (
		<Edit>
			<SimpleForm>
				<TextInput
					source="lessonId"
					validate={[required()]}
					label="Lesson ID"
				/>
				<TinyMCEInput source="content" label="content" dir="ltr" />
				<TextInput source="audioSrc" label="audioSrc" />
			</SimpleForm>
		</Edit>
	)
}
