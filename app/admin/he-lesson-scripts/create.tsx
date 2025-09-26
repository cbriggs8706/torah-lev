import { SimpleForm, Create, TextInput, required } from 'react-admin'
import TinyMCEInput from '@/components/tinymceinput'

export const HebrewLessonScriptCreate = () => {
	return (
		<Create>
			<SimpleForm>
				<TextInput source="lessonId" validate={[required()]} label="lessonId" />
				<TextInput source="courseId" label="courseId" />
				<TinyMCEInput source="content" label="content" dir="rtl" />
				<TinyMCEInput source="contentPlain" label="contentPlain" dir="rtl" />
				<TextInput source="audioSrc" label="audioSrc" />
			</SimpleForm>
		</Create>
	)
}
