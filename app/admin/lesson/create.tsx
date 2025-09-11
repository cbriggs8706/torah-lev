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
					source="unitId"
					reference="units"
					perPage={200}
					sort={{ field: 'order', order: 'ASC' }}
				>
					<SelectInput optionText="title" optionValue="id" label="Unit" />
				</ReferenceInput>
				<NumberInput source="order" validate={[required()]} label="Order" />
			</SimpleForm>
		</Create>
	)
}
