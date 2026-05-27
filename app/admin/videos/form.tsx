'use client'

import TinyMCEInput from '@/components/tinymceinput'
import {
	AutocompleteArrayInput,
	AutocompleteInput,
	BooleanInput,
	NumberInput,
	ReferenceArrayInput,
	ReferenceInput,
	SelectInput,
	SimpleForm,
	TextInput,
} from 'react-admin'

const VIDEO_TYPE_CHOICES = [
	{ id: 'lesson', name: 'Lesson' },
	{ id: 'review', name: 'Review' },
	{ id: 'story', name: 'Story' },
	{ id: 'song', name: 'Song' },
]

export function VideoForm() {
	return (
		<SimpleForm>
			<SelectInput source="type" label="Type" choices={VIDEO_TYPE_CHOICES} />
			<ReferenceInput
				source="lessonId"
				reference="lessons"
				perPage={200}
				sort={{ field: 'lessonSort', order: 'ASC' }}
			>
				<AutocompleteInput
					label="Lesson"
					optionText={(choice: { lessonNumber?: string | null; title?: string | null }) =>
						`${choice.lessonNumber || 'No. ?'} - ${choice.title || 'Untitled'}`
					}
					optionValue="id"
					fullWidth
				/>
			</ReferenceInput>
			<ReferenceArrayInput
				source="courseId"
				reference="curriculum"
				perPage={200}
				sort={{ field: 'title', order: 'ASC' }}
			>
				<AutocompleteArrayInput
					label="Curriculum"
					optionText="title"
					optionValue="id"
					fullWidth
				/>
			</ReferenceArrayInput>
			<TextInput source="title" label="Title" fullWidth />
			<TextInput source="hebTitle" label="Hebrew Title" fullWidth />
			<TextInput
				source="titleTransliteration"
				label="Title Transliteration"
				fullWidth
			/>
			<NumberInput source="part" label="Part" />
			<NumberInput source="order" label="Order" />
			<TextInput source="category" label="Category" fullWidth />
			<TextInput source="videoUrl" label="Video URL" fullWidth />
			<TextInput source="image" label="Image" fullWidth />
			<TextInput source="audio" label="Audio" fullWidth />
			<TextInput source="audioSrc" label="Audio Embed URL" fullWidth />
			<BooleanInput source="public" label="Public" />
			<NumberInput source="hebrewLessonScriptId" label="Legacy Lesson Script ID" />
			<NumberInput source="hebrewStoryId" label="Legacy Story ID" />
			<TinyMCEInput source="content" label="Content" dir="rtl" />
			<TinyMCEInput source="contentPlain" label="Content Plain" dir="rtl" />
		</SimpleForm>
	)
}
