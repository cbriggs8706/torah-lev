import {
	SimpleForm,
	Create,
	TextInput,
	ReferenceInput,
	NumberInput,
	required,
	SelectInput,
} from 'react-admin'

export const LessonCreate = () => {
	return (
		<Create>
			<SimpleForm>
				<TextInput source="title" validate={[required()]} label="Title" />
				<ReferenceInput
					source="courseId"
					reference="curriculum"
					perPage={200}
					sort={{ field: 'title', order: 'ASC' }}
				>
					<SelectInput optionText="title" optionValue="id" label="Curriculum" />
				</ReferenceInput>
				<NumberInput source="order" validate={[required()]} label="Order" />
				<TextInput source="lessonNumber" label="Lesson Number" />
			</SimpleForm>
		</Create>
	)
}
