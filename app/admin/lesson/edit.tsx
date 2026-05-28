import {
	SimpleForm,
	Edit,
	TextInput,
	ReferenceInput,
	NumberInput,
	required,
} from 'react-admin'

export const LessonEdit = () => {
	return (
		<Edit>
			<SimpleForm>
				<TextInput source="title" validate={[required()]} label="Title" />
				<ReferenceInput source="courseId" reference="curriculum" />
				<NumberInput source="order" validate={[required()]} label="Order" />
				<TextInput source="lessonNumber" label="Lesson Number" />
			</SimpleForm>
		</Edit>
	)
}
