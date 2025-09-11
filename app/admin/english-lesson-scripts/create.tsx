import { SimpleForm, Create, TextInput, required } from 'react-admin'
import TinyMCEInput from '@/components/tinymceinput'

export const EnglishLessonScriptCreate = () => {
	return (
		<Create>
			<SimpleForm>
				<TextInput source="lessonId" validate={[required()]} label="lessonId" />
				<TinyMCEInput source="content" label="content" dir="ltr" />
				<TextInput source="audioSrc" label="audioSrc" />
			</SimpleForm>
		</Create>
	)
}
