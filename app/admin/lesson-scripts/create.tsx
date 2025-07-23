import { SimpleForm, Create, TextInput, required } from 'react-admin'
import { RichTextInput } from 'ra-input-rich-text'

export const LessonScriptCreate = () => {
	return (
		<Create>
			<SimpleForm>
				<TextInput source="lessonId" validate={[required()]} label="lessonId" />
				<div dir="rtl">
					<RichTextInput source="content" label="content" />
				</div>
				<div dir="rtl">
					<RichTextInput source="contentPlain" label="contentPlain" />
				</div>
			</SimpleForm>
		</Create>
	)
}
