import TinyMCEInput from '@/components/tinymceinput'
import { SimpleForm, Create, TextInput, required } from 'react-admin'

export const GrammarLessonCreate = () => {
	return (
		<Create>
			<SimpleForm>
				<TextInput source="lessonId" validate={[required()]} label="lessonId" />
				<TinyMCEInput source="content" label="content" />

				<TinyMCEInput source="contentPlain" label="contentPlain" />

				<TextInput source="audioSrc" label="audioSrc" />
			</SimpleForm>
		</Create>
	)
}
