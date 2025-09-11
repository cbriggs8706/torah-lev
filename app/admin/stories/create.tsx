import {
	SimpleForm,
	Create,
	TextInput,
	required,
	BooleanInput,
} from 'react-admin'
import TinyMCEInput from '@/components/tinymceinput'

export const StoryCreate = () => {
	return (
		<Create>
			<SimpleForm>
				<TextInput source="lessonId" validate={[required()]} label="lessonId" />
				<TextInput source="title" label="title" />
				<TextInput source="hebTitle" label="hebTitle" />
				<TextInput source="titleTransliteration" label="titleTransliteration" />
				<BooleanInput source="public" label="public" />
				<TextInput source="category" label="category" />
				<TextInput source="order" label="order" />
				<TinyMCEInput source="content" label="content" dir="rtl" />

				<TinyMCEInput source="contentPlain" label="contentPlain" dir="rtl" />

				<TextInput source="audio" label="audio" />
				<TextInput source="image" label="image" />
				<TextInput source="video" label="video" />
			</SimpleForm>
		</Create>
	)
}
