import { SimpleForm, Edit, TextInput, required } from 'react-admin'
import TinyMCEInput from '@/components/tinymceinput'

export const HebrewLessonScriptEdit = () => {
	return (
		<Edit>
			<SimpleForm>
				<TextInput
					source="lessonId"
					validate={[required()]}
					label="Lesson ID"
				/>
				<TextInput source="courseId" label="courseId" />
				<TinyMCEInput source="content" label="content" dir="rtl" />
				<TinyMCEInput source="contentPlain" label="contentPlain" dir="rtl" />
				<TextInput source="audioSrc" label="audioSrc" />
			</SimpleForm>
		</Edit>
	)
}
