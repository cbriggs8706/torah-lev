import { Edit, SimpleForm, TextInput, required } from 'react-admin'
import TinyMCEInput from '@/components/tinymceinput'

export const GreekLessonScriptEdit = () => {
	return (
		<Edit>
			<SimpleForm>
				<TextInput
					source="lessonId"
					validate={[required()]}
					label="Lesson ID"
				/>
				<TextInput source="courseId" label="courseId" />
				<TinyMCEInput source="content" label="content" />
				<TextInput source="audioSrc" label="audioSrc" />
			</SimpleForm>
		</Edit>
	)
}
