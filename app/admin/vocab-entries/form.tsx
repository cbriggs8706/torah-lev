import { Box } from '@mui/material'
import {
	BooleanInput,
	NumberInput,
	SelectInput,
	SimpleForm,
	TextInput,
	required,
} from 'react-admin'
import {
	vocabBinyanChoices,
	vocabLanguageChoices,
	vocabSourceChoices,
	vocabStateChoices,
	vocabTenseAspectChoices,
} from '@/lib/admin-vocab'
import { VocabMediaUploadInput } from '@/components/admin/vocab-media-upload-input'

const longTextSx = { width: '100%' }
const metadataRowSx = {
	display: 'grid',
	gap: 2,
	width: '100%',
	gridTemplateColumns: {
		xs: '1fr',
		sm: 'repeat(2, minmax(0, 1fr))',
		lg: 'repeat(4, minmax(0, 1fr))',
	},
}

type VocabEntryFormProps = {
	includeEntryId?: boolean
}

export function VocabEntryForm({
	includeEntryId = true,
}: VocabEntryFormProps = {}) {
	return (
		<SimpleForm>
			<Box sx={metadataRowSx}>
				<SelectInput
					source="language"
					label="Language"
					choices={[...vocabLanguageChoices]}
					validate={[required()]}
					fullWidth
				/>
				<SelectInput
					source="sourceKey"
					label="Source"
					choices={[...vocabSourceChoices]}
					validate={[required()]}
					fullWidth
				/>
				<NumberInput source="courseId" label="Course ID" fullWidth />
				<TextInput
					source="lessonsText"
					label="Lessons"
					multiline
					minRows={1}
					sx={longTextSx}
				/>
			</Box>
			{includeEntryId ? (
				<NumberInput source="entryId" label="Entry ID" />
			) : null}
			<Box
				sx={{
					display: 'grid',
					gap: 2,
					width: '100%',
					gridTemplateColumns: {
						xs: '1fr',
						sm: 'repeat(2, minmax(0, 1fr))',
						md: 'repeat(3, minmax(0, 1fr))',
					},
				}}
			>
				<TextInput source="type" label="Type" fullWidth />
				<TextInput
					source="partOfSpeechText"
					label="Part of Speech"
					multiline
					minRows={1}
					sx={longTextSx}
				/>
				<TextInput source="category" label="Category" fullWidth />
			</Box>
			<Box
				sx={{
					display: 'grid',
					gap: 2,
					width: '100%',
					alignItems: 'center',
					gridTemplateColumns: {
						xs: '1fr',
						sm: 'auto minmax(0, 1fr)',
					},
				}}
			>
				<BooleanInput source="definite" label="Definite" />
				<TextInput
					source="rootId"
					label="Root"
					InputLabelProps={{ shrink: true }}
					placeholder="Root id"
					fullWidth
				/>
			</Box>

			<TextInput
				source="hebDefinition"
				label="Hebrew Definition"
				multiline
				sx={longTextSx}
			/>
			<Box
				sx={{
					display: 'grid',
					gap: 2,
					width: '100%',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'repeat(2, minmax(0, 1fr))',
					},
				}}
			>
				<TextInput source="lemma" label="Lemma" sx={longTextSx} />
				<TextInput source="heb" label="Hebrew" sx={longTextSx} />
			</Box>
			<Box
				sx={{
					display: 'grid',
					gap: 2,
					width: '100%',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'repeat(2, minmax(0, 1fr))',
					},
				}}
			>
				<TextInput source="gloss" label="Gloss" sx={longTextSx} />
				<TextInput
					source="engTransliteration"
					label="English Transliteration"
					sx={longTextSx}
				/>
			</Box>
			<Box
				sx={{
					display: 'grid',
					gap: 2,
					width: '100%',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'repeat(2, minmax(0, 1fr))',
					},
				}}
			>
				<TextInput source="spa" label="Spanish" sx={longTextSx} />
				<TextInput
					source="spaTransliteration"
					label="Spanish Transliteration"
					sx={longTextSx}
				/>
			</Box>
			<Box
				sx={{
					display: 'grid',
					gap: 2,
					width: '100%',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'repeat(2, minmax(0, 1fr))',
					},
				}}
			>
				<TextInput source="por" label="Portuguese" sx={longTextSx} />
				<TextInput
					source="porTransliteration"
					label="Portuguese Transliteration"
					sx={longTextSx}
				/>
			</Box>
			<TextInput source="grk" label="Greek" sx={longTextSx} />
			<TextInput source="ipa" label="IPA" />
			<Box
				sx={{
					display: 'grid',
					gap: 2,
					width: '100%',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'repeat(2, minmax(0, 1fr))',
						lg: 'repeat(4, minmax(0, 1fr))',
					},
				}}
			>
				<TextInput
					source="rootVerb"
					label="Root Verb"
					helperText="Enter the 3 Hebrew consonants."
					sx={longTextSx}
				/>
				<SelectInput
					source="binyan"
					label="Binyan"
					choices={[...vocabBinyanChoices]}
					emptyText="None"
					fullWidth
				/>
				<SelectInput
					source="tenseAspect"
					label="Tense / Aspect"
					choices={[...vocabTenseAspectChoices]}
					emptyText="None"
					fullWidth
				/>
				<SelectInput
					source="state"
					label="State"
					choices={[...vocabStateChoices]}
					emptyText="None"
					fullWidth
				/>
			</Box>
			<Box
				sx={{
					display: 'grid',
					gap: 2,
					width: '100%',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'repeat(3, minmax(0, 1fr))',
					},
				}}
			>
				<TextInput source="rootPerson" label="Root Person" fullWidth />
				<TextInput source="rootGender" label="Root Gender" fullWidth />
				<TextInput source="rootNumber" label="Root Number" fullWidth />
			</Box>
			<Box
				sx={{
					display: 'grid',
					gap: 2,
					width: '100%',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'repeat(3, minmax(0, 1fr))',
					},
				}}
			>
				<TextInput source="suffixPerson" label="Suffix Person" fullWidth />
				<TextInput source="suffixGender" label="Suffix Gender" fullWidth />
				<TextInput source="suffixNumber" label="Suffix Number" fullWidth />
			</Box>
			<Box
				sx={{
					display: 'grid',
					gap: 2,
					width: '100%',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'repeat(2, minmax(0, 1fr))',
					},
				}}
			>
				<TextInput
					source="dictionaryUrl"
					label="Dictionary URL"
					sx={longTextSx}
				/>
				<TextInput source="strongs" label="Strongs" fullWidth />
			</Box>

			<Box
				sx={{
					display: 'grid',
					gap: 2,
					width: '100%',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'repeat(2, minmax(0, 1fr))',
					},
				}}
			>
				<TextInput
					source="synonymsText"
					label="Synonyms"
					multiline
					sx={longTextSx}
				/>
				<TextInput
					source="antonymsText"
					label="Antonyms"
					multiline
					sx={longTextSx}
				/>
			</Box>
			<TextInput
				source="scripturesText"
				label="Scriptures"
				multiline
				sx={longTextSx}
			/>
			<TextInput
				source="introduction"
				label="Introduction / Video"
				multiline
				sx={longTextSx}
			/>

			<TextInput source="imagesText" label="Images" multiline sx={longTextSx} />
			<VocabMediaUploadInput
				source="imagesText"
				label="Image"
				accept="image/*"
				mode="append"
			/>

			<Box
				sx={{
					display: 'grid',
					gap: 2,
					width: '100%',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'repeat(3, minmax(0, 1fr))',
					},
				}}
			>
				<TextInput source="hebAudio" label="Hebrew Audio" sx={longTextSx} />
				<TextInput source="engAudio" label="English Audio" sx={longTextSx} />
				<TextInput source="grkAudio" label="Greek Audio" sx={longTextSx} />
			</Box>
			<VocabMediaUploadInput
				source="hebAudio"
				label="Hebrew Audio"
				accept="audio/*"
				mode="replace"
			/>
			<VocabMediaUploadInput
				source="engAudio"
				label="English Audio"
				accept="audio/*"
				mode="replace"
			/>
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
