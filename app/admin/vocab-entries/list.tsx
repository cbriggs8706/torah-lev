import {
	BooleanField,
	BooleanInput,
	Datagrid,
	FunctionField,
	List,
	Pagination,
	SelectInput,
	TextField,
	TextInput,
} from 'react-admin'
import { vocabLanguageChoices, vocabSourceChoices } from '@/lib/admin-vocab'

const filters = [
	<TextInput key="q" source="q" label="Search" alwaysOn />,
	<SelectInput
		key="language"
		source="language"
		label="Language"
		choices={[...vocabLanguageChoices]}
		emptyText="All"
	/>,
	<SelectInput
		key="sourceKey"
		source="sourceKey"
		label="Source"
		choices={[...vocabSourceChoices]}
		emptyText="All"
	/>,
	<TextInput key="category" source="category" label="Category" />,
	<TextInput key="type" source="type" label="Type" />,
	<TextInput key="lesson" source="lesson" label="Lesson" />,
	<BooleanInput key="missingImage" source="missingImage" label="Missing image" />,
	<BooleanInput key="missingAudio" source="missingAudio" label="Missing audio" />,
]

export const VocabEntryList = () => (
	<List
		filters={filters}
		sort={{ field: 'lessonSort', order: 'ASC' }}
		perPage={25}
		pagination={<Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
	>
		<Datagrid rowClick="edit" bulkActionButtons={false}>
			<TextField source="id" label="ID" />
			<TextField source="rootId" label="Root" />
			<TextField source="firstLesson" label="First Lesson" />
			<FunctionField
				label="Word"
				render={(record: any) =>
					record.lemma ||
					record.heb ||
					record.grk ||
					record.gloss ||
					'(untitled)'
				}
			/>
			<TextField source="gloss" />
			<TextField source="antonymsDisplay" label="Antonyms" />
			<TextField source="confusedWithDisplay" label="Confused With" />
			<TextField source="type" />
			<TextField source="partOfSpeechText" label="Part of Speech" />
			<TextField source="category" />
			<BooleanField source="missingImage" />
			<BooleanField source="missingAudio" />
			<FunctionField
				label="Images"
				render={(record: any) => record.images?.length ?? 0}
			/>
		</Datagrid>
	</List>
)
