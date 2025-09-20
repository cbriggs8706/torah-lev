//app/admin/stories/edit.tsx
import {
	SimpleForm,
	Edit,
	TextInput,
	required,
	BooleanInput,
} from 'react-admin'
import { RichTextInput, DefaultEditorOptions } from 'ra-input-rich-text'
import WysiwygInput from '@/components/wysiwyginput'
import TinyMCEInput from '@/components/tinymceinput'

const rtlEditorOptions = {
	...DefaultEditorOptions,
	editorProps: {
		...DefaultEditorOptions.editorProps,
		attributes: {
			...(DefaultEditorOptions.editorProps?.attributes ?? {}),
			dir: 'rtl',
			spellcheck: 'false',
		},
	},
}

export const HebrewStoryEdit = () => {
	return (
		<Edit>
			<SimpleForm>
				<TextInput source="lessonId" validate={[required()]} label="lessonId" />
				<TextInput source="courseId" label="courseIds" />
				<TextInput source="title" label="title" />
				<TextInput source="hebTitle" label="hebTitle" />
				<TextInput source="titleTransliteration" label="titleTransliteration" />
				<BooleanInput source="public" label="public" />
				<TextInput source="category" label="category" />
				<TextInput source="order" label="order" />

				{/* <RichTextInput
					source="content"
					label="content"
					editorOptions={rtlEditorOptions}
				/> */}

				<TinyMCEInput source="content" label="content" dir="rtl" />

				<TextInput source="audio" label="audio" />
				<TextInput source="image" label="image" />
				<TextInput source="video" label="video" />
			</SimpleForm>
		</Edit>
	)
}
