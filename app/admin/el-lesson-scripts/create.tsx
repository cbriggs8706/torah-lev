import { SimpleForm, Create, TextInput, required } from 'react-admin'
import TinyMCEInput from '@/components/tinymceinput'

export const GreekLessonScriptCreate = () => {
	return (
		<Create>
			<SimpleForm>
				<TextInput source="lessonId" validate={[required()]} label="lessonId" />
				<TextInput source="courseId" label="courseId" />
				<TinyMCEInput source="content" label="content" />
				<TextInput source="audioSrc" label="audioSrc" />
			</SimpleForm>
		</Create>
	)
}
