import { SimpleForm, Edit, TextInput, required } from 'react-admin'
import { RichTextInput } from 'ra-input-rich-text'

export const LessonScriptEdit = () => {
	return (
		<Edit>
			<SimpleForm>
				<TextInput
					source="lessonId"
					validate={[required()]}
					label="Lesson ID"
				/>
				<div dir="rtl">
					<RichTextInput source="content" label="content" />
				</div>
				<div dir="rtl">
					<RichTextInput source="contentPlain" label="contentPlain" />
				</div>
			</SimpleForm>
		</Edit>
	)
}
