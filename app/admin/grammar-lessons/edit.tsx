import { SimpleForm, Edit, TextInput, required } from 'react-admin'
import TinyMCEInput from '@/components/tinymceinput'

export const GrammarLessonEdit = () => {
	return (
		<Edit>
			<SimpleForm>
				<TextInput
					source="lessonId"
					validate={[required()]}
					label="Lesson ID"
				/>
				<TinyMCEInput source="content" label="content" />

				<TinyMCEInput source="contentPlain" label="contentPlain" />

				<TextInput source="audioSrc" label="audioSrc" />
			</SimpleForm>
		</Edit>
	)
}
