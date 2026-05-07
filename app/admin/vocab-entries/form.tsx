import {
	BooleanInput,
	NumberInput,
	SelectInput,
	SimpleForm,
	TextInput,
	required,
} from 'react-admin'
import { vocabLanguageChoices, vocabSourceChoices } from '@/lib/admin-vocab'
import { VocabMediaUploadInput } from '@/components/admin/vocab-media-upload-input'

const longTextSx = { width: '100%' }

type VocabEntryFormProps = {
	includeEntryId?: boolean
}

export function VocabEntryForm({
	includeEntryId = true,
}: VocabEntryFormProps = {}) {
	return (
		<SimpleForm>
			<SelectInput
				source="language"
				label="Language"
				choices={[...vocabLanguageChoices]}
				validate={[required()]}
			/>
			<SelectInput
				source="sourceKey"
				label="Source"
				choices={[...vocabSourceChoices]}
				validate={[required()]}
			/>
			<NumberInput source="courseId" label="Course ID" />
			{includeEntryId ? <NumberInput source="entryId" label="Entry ID" /> : null}
			<TextInput source="lessonsText" label="Lessons" multiline sx={longTextSx} />
			<TextInput source="type" label="Type" />
			<BooleanInput source="definite" label="Definite" />
			<TextInput source="category" label="Category" />
			<NumberInput
				source="absoluteEntryId"
				label="Absolute Entry ID"
				helperText="Required when category is construct."
			/>

			<TextInput source="eng" label="English" sx={longTextSx} />
			<TextInput source="engDefinition" label="Definition" multiline sx={longTextSx} />
			<TextInput source="hebNiqqud" label="Hebrew With Niqqud" sx={longTextSx} />
			<TextInput source="heb" label="Hebrew" sx={longTextSx} />
			<TextInput source="grk" label="Greek" sx={longTextSx} />
			<TextInput source="spa" label="Spanish" sx={longTextSx} />
			<TextInput source="por" label="Portuguese" sx={longTextSx} />

			<TextInput source="engTransliteration" label="English Transliteration" />
			<TextInput source="spaTransliteration" label="Spanish Transliteration" />
			<TextInput source="porTransliteration" label="Portuguese Transliteration" />
			<TextInput source="genderPerson" label="Gender / Person" />
			<TextInput source="person" label="Person" />
			<TextInput source="gender" label="Gender" />
			<TextInput source="number" label="Number" />
			<TextInput source="ipa" label="IPA" />
			<TextInput source="dictionaryUrl" label="Dictionary URL" sx={longTextSx} />
			<TextInput source="strongs" label="Strongs" />

			<TextInput source="partOfSpeechText" label="Part of Speech" multiline sx={longTextSx} />
			<TextInput source="synonymsText" label="Synonyms" multiline sx={longTextSx} />
			<TextInput source="antonymsText" label="Antonyms" multiline sx={longTextSx} />
			<TextInput source="scripturesText" label="Scriptures" multiline sx={longTextSx} />
			<TextInput source="introduction" label="Introduction / Video" multiline sx={longTextSx} />

			<TextInput source="imagesText" label="Images" multiline sx={longTextSx} />
			<VocabMediaUploadInput
				source="imagesText"
				label="Image"
				accept="image/*"
				mode="append"
			/>

			<TextInput source="hebAudio" label="Hebrew Audio" sx={longTextSx} />
			<VocabMediaUploadInput
				source="hebAudio"
				label="Hebrew Audio"
				accept="audio/*"
				mode="replace"
			/>

			<TextInput source="engAudio" label="English Audio" sx={longTextSx} />
			<VocabMediaUploadInput
				source="engAudio"
				label="English Audio"
				accept="audio/*"
				mode="replace"
			/>

			<TextInput source="grkAudio" label="Greek Audio" sx={longTextSx} />
			<VocabMediaUploadInput
				source="grkAudio"
				label="Greek Audio"
				accept="audio/*"
				mode="replace"
			/>

			<BooleanInput source="missingImage" label="Missing Image" disabled />
			<BooleanInput source="missingAudio" label="Missing Audio" disabled />
		</SimpleForm>
	)
}
