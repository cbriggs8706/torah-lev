import {
	SimpleForm,
	Create,
	TextInput,
	required,
	BooleanInput,
} from 'react-admin'
import { RichTextInput } from 'ra-input-rich-text'

export const StoryCreate = () => {
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
				<TextInput source="audio" label="audio" />
				<TextInput source="image" label="image" />
				<TextInput source="video" label="video" />
				<TextInput source="title" label="title" />
				<TextInput source="hebTitle" label="hebTitle" />
				<TextInput source="titleTransliteration" label="titleTransliteration" />
				<TextInput source="order" label="order" />
				<BooleanInput source="public" label="public" />
				<TextInput source="category" label="category" />
			</SimpleForm>
		</Create>
	)
}
