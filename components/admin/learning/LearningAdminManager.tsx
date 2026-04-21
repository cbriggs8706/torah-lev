'use client'

import { useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

type OrganizationItem = {
	id: string
	title: string
}

type TargetLanguageItem = {
	id: string
	name: string
}

type CourseItem = {
	id: string
	title: string
}

type ModuleItem = {
	id: string
	title: string
	type: 'video' | 'audio' | 'document' | 'quiz'
	mediaAssetId: string | null
	externalUrl: string | null
	quizId: string | null
}

type LessonItem = {
	id: string
	title: string
	number: number
	part: string
	sortOrder: number
	courseId: string
	organizationId: string | null
	targetLanguageId: string
	moduleIds: string[]
}

type StudyGroupItem = {
	id: string
	title: string
	activeCourseId: string | null
	courseIds: string[]
}

type AssetItem = {
	id: string
	title: string | null
	fileName: string
	kind: 'image' | 'audio' | 'video' | 'document' | 'other'
}

type QuizAnswerItem = {
	id?: string
	answerText: string | null
	answerAssetId: string | null
	isCorrect: boolean
	sortOrder: number
}

type QuizQuestionItem = {
	id: string
	title: string
	type:
		| 'image_to_audio'
		| 'audio_to_image'
		| 'text_to_audio'
		| 'audio_to_text'
		| 'text_to_image'
		| 'image_to_text'
	promptText: string | null
	promptAssetId: string | null
	answers: QuizAnswerItem[]
}

type QuizItem = {
	id: string
	title: string
	questionIds: string[]
}

interface Props {
	organizations: OrganizationItem[]
	targetLanguages: TargetLanguageItem[]
	courses: CourseItem[]
	lessons: LessonItem[]
	studyGroups: StudyGroupItem[]
	modules: ModuleItem[]
	quizQuestions: QuizQuestionItem[]
	quizzes: QuizItem[]
	mediaAssets: AssetItem[]
}

const quizTypeOptions: Array<{
	value: QuizQuestionItem['type']
	label: string
	promptMode: 'text' | 'asset'
	promptKind?: AssetItem['kind']
	answerMode: 'text' | 'asset'
	answerKind?: AssetItem['kind']
}> = [
	{
		value: 'image_to_audio',
		label: 'Image to Audio',
		promptMode: 'asset',
		promptKind: 'image',
		answerMode: 'asset',
		answerKind: 'audio',
	},
	{
		value: 'audio_to_image',
		label: 'Audio to Image',
		promptMode: 'asset',
		promptKind: 'audio',
		answerMode: 'asset',
		answerKind: 'image',
	},
	{
		value: 'text_to_audio',
		label: 'Text to Audio',
		promptMode: 'text',
		answerMode: 'asset',
		answerKind: 'audio',
	},
	{
		value: 'audio_to_text',
		label: 'Audio to Text',
		promptMode: 'asset',
		promptKind: 'audio',
		answerMode: 'text',
	},
	{
		value: 'text_to_image',
		label: 'Text to Image',
		promptMode: 'text',
		answerMode: 'asset',
		answerKind: 'image',
	},
	{
		value: 'image_to_text',
		label: 'Image to Text',
		promptMode: 'asset',
		promptKind: 'image',
		answerMode: 'text',
	},
]

function getQuizTypeConfig(type: QuizQuestionItem['type']) {
	return quizTypeOptions.find((option) => option.value === type) ?? quizTypeOptions[0]
}

function assetLabel(asset: AssetItem) {
	return `${asset.title?.trim() || asset.fileName} (${asset.kind})`
}

function makeAnswer(sortOrder: number, isCorrect = false): QuizAnswerItem {
	return {
		answerText: '',
		answerAssetId: null,
		isCorrect,
		sortOrder,
	}
}

async function parseJson<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const body = await res.json().catch(() => null)
		throw new Error(body?.error || 'Request failed')
	}

	return res.json()
}

function SectionHeader({
	title,
	description,
}: {
	title: string
	description: string
}) {
	return (
		<div className="space-y-1">
			<h2 className="text-lg font-semibold">{title}</h2>
			<p className="text-sm text-muted-foreground">{description}</p>
		</div>
	)
}

function ItemChecklist({
	items,
	selectedIds,
	onToggle,
}: {
	items: Array<{ id: string; label: string }>
	selectedIds: string[]
	onToggle: (id: string, checked: boolean) => void
}) {
	const safeSelectedIds = selectedIds ?? []

	return (
		<div className="grid gap-2 rounded-lg border border-dashed p-3 md:grid-cols-2">
			{items.map((item) => (
				<label
					key={item.id}
					className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm hover:border-border hover:bg-muted/40"
				>
					<Checkbox
						checked={safeSelectedIds.includes(item.id)}
						onCheckedChange={(checked) => onToggle(item.id, checked === true)}
					/>
					<span>{item.label}</span>
				</label>
			))}
		</div>
	)
}

function AnswerEditor({
	answer,
	index,
	config,
	assets,
	onChange,
	onRemove,
}: {
	answer: QuizAnswerItem
	index: number
	config: ReturnType<typeof getQuizTypeConfig>
	assets: AssetItem[]
	onChange: (next: QuizAnswerItem) => void
	onRemove: () => void
}) {
	const filteredAssets =
		config.answerMode === 'asset' && config.answerKind
			? assets.filter((asset) => asset.kind === config.answerKind)
			: []

	return (
		<div className="grid gap-3 rounded-lg border p-3">
			<div className="flex items-center justify-between">
				<p className="text-sm font-medium">Answer {index + 1}</p>
				<div className="flex items-center gap-3">
					<label className="flex items-center gap-2 text-sm">
						<Checkbox
							checked={answer.isCorrect}
							onCheckedChange={(checked) =>
								onChange({ ...answer, isCorrect: checked === true })
							}
						/>
						Correct
					</label>
					<Button size="sm" variant="ghost" onClick={onRemove}>
						<Trash2 />
					</Button>
				</div>
			</div>
			{config.answerMode === 'text' ? (
				<Input
					placeholder="Answer text"
					value={answer.answerText ?? ''}
					onChange={(e) =>
						onChange({
							...answer,
							answerText: e.target.value,
							answerAssetId: null,
						})
					}
				/>
			) : (
				<Select
					value={answer.answerAssetId ?? 'none'}
					onValueChange={(value) =>
						onChange({
							...answer,
							answerText: null,
							answerAssetId: value === 'none' ? null : value,
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder={`Select ${config.answerKind} answer`} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">No asset selected</SelectItem>
						{filteredAssets.map((asset) => (
							<SelectItem key={asset.id} value={asset.id}>
								{assetLabel(asset)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		</div>
	)
}

export function LearningAdminManager({
	organizations: initialOrganizations,
	targetLanguages: initialTargetLanguages,
	courses: initialCourses,
	lessons: initialLessons,
	studyGroups: initialStudyGroups,
	modules: initialModules,
	quizQuestions: initialQuizQuestions,
	quizzes: initialQuizzes,
	mediaAssets,
}: Props) {
	const [organizations, setOrganizations] = useState(initialOrganizations)
	const [targetLanguages, setTargetLanguages] = useState(initialTargetLanguages)
	const [courses, setCourses] = useState(initialCourses)
	const [modules, setModules] = useState(initialModules)
	const [lessons, setLessons] = useState(initialLessons)
	const [quizQuestions, setQuizQuestions] = useState(initialQuizQuestions)
	const [quizzes, setQuizzes] = useState(initialQuizzes)
	const [studyGroups, setStudyGroups] = useState(initialStudyGroups)
	const [status, setStatus] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [busyKey, setBusyKey] = useState<string | null>(null)

	const [newOrganizationTitle, setNewOrganizationTitle] = useState('')
	const [newTargetLanguageName, setNewTargetLanguageName] = useState('')
	const [newCourseTitle, setNewCourseTitle] = useState('')
	const [newModule, setNewModule] = useState({
		title: '',
		type: 'audio' as ModuleItem['type'],
		mediaAssetId: 'none',
		externalUrl: '',
		quizId: 'none',
	})
	const [newLesson, setNewLesson] = useState({
		title: '',
		number: 1,
		part: '',
		sortOrder: 0,
		courseId: initialCourses[0]?.id ?? '',
		organizationId: 'none',
		targetLanguageId: initialTargetLanguages[0]?.id ?? '',
		moduleIds: [] as string[],
	})
	const [newQuizQuestion, setNewQuizQuestion] = useState({
		title: '',
		type: 'text_to_audio' as QuizQuestionItem['type'],
		promptText: '',
		promptAssetId: 'none',
		answers: [makeAnswer(0, true), makeAnswer(1, false)],
	})
	const [newQuiz, setNewQuiz] = useState({
		title: '',
		questionIds: [] as string[],
	})
	const [newStudyGroup, setNewStudyGroup] = useState({
		title: '',
		activeCourseId: 'none',
		courseIds: [] as string[],
	})

	function begin(key: string) {
		setBusyKey(key)
		setStatus(null)
		setError(null)
	}

	function finish(message: string) {
		setBusyKey(null)
		setStatus(message)
	}

	function fail(err: unknown) {
		setBusyKey(null)
		setError(err instanceof Error ? err.message : 'Something went wrong')
	}

	function mediaAssetsForModuleType(type: ModuleItem['type']) {
		if (type === 'audio') return mediaAssets.filter((asset) => asset.kind === 'audio')
		if (type === 'document')
			return mediaAssets.filter((asset) => asset.kind === 'document')
		if (type === 'video') return mediaAssets.filter((asset) => asset.kind === 'video')
		return []
	}

	async function createOrganization() {
		begin('create-organization')
		try {
			const created = await parseJson<OrganizationItem>(
				await fetch('/api/admin/learning/organizations', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title: newOrganizationTitle }),
				})
			)
			setOrganizations((current) =>
				[...current, created].sort((a, b) => a.title.localeCompare(b.title))
			)
			setNewOrganizationTitle('')
			finish('Organization created')
		} catch (err) {
			fail(err)
		}
	}

	async function saveOrganization(item: OrganizationItem) {
		begin(`organization-${item.id}`)
		try {
			const updated = await parseJson<OrganizationItem>(
				await fetch(`/api/admin/learning/organizations/${item.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title: item.title }),
				})
			)
			setOrganizations((current) =>
				current.map((row) => (row.id === updated.id ? updated : row))
			)
			finish('Organization saved')
		} catch (err) {
			fail(err)
		}
	}

	async function deleteOrganization(id: string) {
		begin(`organization-delete-${id}`)
		try {
			await parseJson(
				await fetch(`/api/admin/learning/organizations/${id}`, {
					method: 'DELETE',
				})
			)
			setOrganizations((current) => current.filter((row) => row.id !== id))
			setLessons((current) =>
				current.map((lesson) =>
					lesson.organizationId === id
						? { ...lesson, organizationId: null }
						: lesson
				)
			)
			finish('Organization deleted')
		} catch (err) {
			fail(err)
		}
	}

	async function createTargetLanguage() {
		begin('create-target-language')
		try {
			const created = await parseJson<TargetLanguageItem>(
				await fetch('/api/admin/learning/target-languages', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newTargetLanguageName }),
				})
			)
			setTargetLanguages((current) =>
				[...current, created].sort((a, b) => a.name.localeCompare(b.name))
			)
			setNewTargetLanguageName('')
			finish('Target language created')
		} catch (err) {
			fail(err)
		}
	}

	async function saveTargetLanguage(item: TargetLanguageItem) {
		begin(`target-language-${item.id}`)
		try {
			const updated = await parseJson<TargetLanguageItem>(
				await fetch(`/api/admin/learning/target-languages/${item.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: item.name }),
				})
			)
			setTargetLanguages((current) =>
				current.map((row) => (row.id === updated.id ? updated : row))
			)
			finish('Target language saved')
		} catch (err) {
			fail(err)
		}
	}

	async function deleteTargetLanguage(id: string) {
		begin(`target-language-delete-${id}`)
		try {
			await parseJson(
				await fetch(`/api/admin/learning/target-languages/${id}`, {
					method: 'DELETE',
				})
			)
			setTargetLanguages((current) => current.filter((row) => row.id !== id))
			finish('Target language deleted')
		} catch (err) {
			fail(err)
		}
	}

	async function createCourse() {
		begin('create-course')
		try {
			const created = await parseJson<CourseItem>(
				await fetch('/api/admin/learning/courses', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title: newCourseTitle }),
				})
			)
			setCourses((current) =>
				[...current, created].sort((a, b) => a.title.localeCompare(b.title))
			)
			setNewCourseTitle('')
			finish('Course created')
		} catch (err) {
			fail(err)
		}
	}

	async function saveCourse(item: CourseItem) {
		begin(`course-${item.id}`)
		try {
			const updated = await parseJson<CourseItem>(
				await fetch(`/api/admin/learning/courses/${item.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title: item.title }),
				})
			)
			setCourses((current) =>
				current.map((row) => (row.id === updated.id ? updated : row))
			)
			finish('Course saved')
		} catch (err) {
			fail(err)
		}
	}

	async function deleteCourse(id: string) {
		begin(`course-delete-${id}`)
		try {
			await parseJson(
				await fetch(`/api/admin/learning/courses/${id}`, {
					method: 'DELETE',
				})
			)
			setCourses((current) => current.filter((row) => row.id !== id))
			setLessons((current) => current.filter((row) => row.courseId !== id))
			setStudyGroups((current) =>
				current.map((group) => ({
					...group,
					activeCourseId:
						group.activeCourseId === id ? null : group.activeCourseId,
					courseIds: group.courseIds.filter((courseId) => courseId !== id),
				}))
			)
			finish('Course deleted')
		} catch (err) {
			fail(err)
		}
	}

	async function createModule() {
		begin('create-module')
		try {
			const created = await parseJson<ModuleItem>(
				await fetch('/api/admin/learning/modules', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title: newModule.title,
						type: newModule.type,
						mediaAssetId:
							newModule.mediaAssetId === 'none' ? null : newModule.mediaAssetId,
						externalUrl: newModule.externalUrl || null,
						quizId: newModule.quizId === 'none' ? null : newModule.quizId,
					}),
				})
			)
			setModules((current) =>
				[...current, created].sort((a, b) => a.title.localeCompare(b.title))
			)
			setNewModule({
				title: '',
				type: 'audio',
				mediaAssetId: 'none',
				externalUrl: '',
				quizId: 'none',
			})
			finish('Module created')
		} catch (err) {
			fail(err)
		}
	}

	async function saveModule(item: ModuleItem) {
		begin(`module-${item.id}`)
		try {
			const updated = await parseJson<ModuleItem>(
				await fetch(`/api/admin/learning/modules/${item.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(item),
				})
			)
			setModules((current) =>
				current.map((row) => (row.id === updated.id ? updated : row))
			)
			finish('Module saved')
		} catch (err) {
			fail(err)
		}
	}

	async function deleteModule(id: string) {
		begin(`module-delete-${id}`)
		try {
			await parseJson(
				await fetch(`/api/admin/learning/modules/${id}`, {
					method: 'DELETE',
				})
			)
			setModules((current) => current.filter((row) => row.id !== id))
			setLessons((current) =>
				current.map((lesson) => ({
					...lesson,
					moduleIds: lesson.moduleIds.filter((moduleId) => moduleId !== id),
				}))
			)
			finish('Module deleted')
		} catch (err) {
			fail(err)
		}
	}

	async function createLesson() {
		begin('create-lesson')
		try {
			const created = await parseJson<LessonItem>(
				await fetch('/api/admin/learning/lessons', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...newLesson,
						organizationId:
							newLesson.organizationId === 'none'
								? null
								: newLesson.organizationId,
					}),
				})
			)
			setLessons((current) =>
				[
					...current,
					{
						...created,
						moduleIds: newLesson.moduleIds,
					},
				].sort(
					(a, b) =>
						a.sortOrder - b.sortOrder ||
						a.number - b.number ||
						a.title.localeCompare(b.title)
				)
			)
			setNewLesson((current) => ({
				...current,
				title: '',
				part: '',
				moduleIds: [],
				number: current.number + 1,
				sortOrder: current.sortOrder + 1,
			}))
			finish('Lesson created')
		} catch (err) {
			fail(err)
		}
	}

	async function saveLesson(item: LessonItem) {
		begin(`lesson-${item.id}`)
		try {
			const updated = await parseJson<LessonItem>(
				await fetch(`/api/admin/learning/lessons/${item.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(item),
				})
			)
			setLessons((current) =>
				current.map((row) =>
					row.id === updated.id
						? {
								...updated,
								moduleIds: item.moduleIds,
						  }
						: row
				)
			)
			finish('Lesson saved')
		} catch (err) {
			fail(err)
		}
	}

	async function deleteLesson(id: string) {
		begin(`lesson-delete-${id}`)
		try {
			await parseJson(
				await fetch(`/api/admin/learning/lessons/${id}`, {
					method: 'DELETE',
				})
			)
			setLessons((current) => current.filter((row) => row.id !== id))
			finish('Lesson deleted')
		} catch (err) {
			fail(err)
		}
	}

	async function createQuizQuestion() {
		begin('create-quiz-question')
		try {
			const created = await parseJson<QuizQuestionItem>(
				await fetch('/api/admin/learning/quiz-questions', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...newQuizQuestion,
						promptText:
							getQuizTypeConfig(newQuizQuestion.type).promptMode === 'text'
								? newQuizQuestion.promptText
								: null,
						promptAssetId:
							getQuizTypeConfig(newQuizQuestion.type).promptMode === 'asset' &&
							newQuizQuestion.promptAssetId !== 'none'
								? newQuizQuestion.promptAssetId
								: null,
					}),
				})
			)
			setQuizQuestions((current) =>
				[...current, { ...created, answers: created.answers ?? [] }].sort((a, b) =>
					a.title.localeCompare(b.title)
				)
			)
			setNewQuizQuestion({
				title: '',
				type: 'text_to_audio',
				promptText: '',
				promptAssetId: 'none',
				answers: [makeAnswer(0, true), makeAnswer(1, false)],
			})
			finish('Quiz question created')
		} catch (err) {
			fail(err)
		}
	}

	async function saveQuizQuestion(item: QuizQuestionItem) {
		begin(`quiz-question-${item.id}`)
		try {
			const updated = await parseJson<QuizQuestionItem>(
				await fetch(`/api/admin/learning/quiz-questions/${item.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(item),
				})
			)
			setQuizQuestions((current) =>
				current.map((row) => (row.id === updated.id ? { ...row, ...updated } : row))
			)
			finish('Quiz question saved')
		} catch (err) {
			fail(err)
		}
	}

	async function deleteQuizQuestion(id: string) {
		begin(`quiz-question-delete-${id}`)
		try {
			await parseJson(
				await fetch(`/api/admin/learning/quiz-questions/${id}`, {
					method: 'DELETE',
				})
			)
			setQuizQuestions((current) => current.filter((row) => row.id !== id))
			setQuizzes((current) =>
				current.map((quiz) => ({
					...quiz,
					questionIds: quiz.questionIds.filter((questionId) => questionId !== id),
				}))
			)
			finish('Quiz question deleted')
		} catch (err) {
			fail(err)
		}
	}

	async function createQuiz() {
		begin('create-quiz')
		try {
			const created = await parseJson<QuizItem>(
				await fetch('/api/admin/learning/quizzes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(newQuiz),
				})
			)
			setQuizzes((current) =>
				[...current, { ...created, questionIds: newQuiz.questionIds }].sort((a, b) =>
					a.title.localeCompare(b.title)
				)
			)
			setNewQuiz({ title: '', questionIds: [] })
			finish('Quiz created')
		} catch (err) {
			fail(err)
		}
	}

	async function saveQuiz(item: QuizItem) {
		begin(`quiz-${item.id}`)
		try {
			const updated = await parseJson<QuizItem>(
				await fetch(`/api/admin/learning/quizzes/${item.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(item),
				})
			)
			setQuizzes((current) =>
				current.map((row) =>
					row.id === updated.id ? { ...row, ...updated, questionIds: item.questionIds } : row
				)
			)
			finish('Quiz saved')
		} catch (err) {
			fail(err)
		}
	}

	async function deleteQuiz(id: string) {
		begin(`quiz-delete-${id}`)
		try {
			await parseJson(
				await fetch(`/api/admin/learning/quizzes/${id}`, {
					method: 'DELETE',
				})
			)
			setQuizzes((current) => current.filter((row) => row.id !== id))
			setModules((current) =>
				current.map((module) =>
					module.quizId === id ? { ...module, quizId: null } : module
				)
			)
			finish('Quiz deleted')
		} catch (err) {
			fail(err)
		}
	}

	async function createStudyGroup() {
		begin('create-study-group')
		try {
			const created = await parseJson<StudyGroupItem>(
				await fetch('/api/admin/learning/study-groups', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title: newStudyGroup.title,
						activeCourseId:
							newStudyGroup.activeCourseId === 'none'
								? null
								: newStudyGroup.activeCourseId,
						courseIds: newStudyGroup.courseIds,
					}),
				})
			)
			setStudyGroups((current) =>
				[...current, created].sort((a, b) => a.title.localeCompare(b.title))
			)
			setNewStudyGroup({ title: '', activeCourseId: 'none', courseIds: [] })
			finish('Study group created')
		} catch (err) {
			fail(err)
		}
	}

	async function saveStudyGroup(item: StudyGroupItem) {
		begin(`study-group-${item.id}`)
		try {
			const updated = await parseJson<StudyGroupItem>(
				await fetch(`/api/admin/learning/study-groups/${item.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(item),
				})
			)
			setStudyGroups((current) =>
				current.map((row) =>
					row.id === updated.id
						? { ...row, ...updated, courseIds: item.courseIds }
						: row
				)
			)
			finish('Study group saved')
		} catch (err) {
			fail(err)
		}
	}

	async function deleteStudyGroup(id: string) {
		begin(`study-group-delete-${id}`)
		try {
			await parseJson(
				await fetch(`/api/admin/learning/study-groups/${id}`, {
					method: 'DELETE',
				})
			)
			setStudyGroups((current) => current.filter((row) => row.id !== id))
			finish('Study group deleted')
		} catch (err) {
			fail(err)
		}
	}

	return (
		<div className="space-y-6">
			<div className="rounded-3xl border border-border/60 bg-gradient-to-br from-sky-50 via-background to-emerald-50 p-6 shadow-sm">
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Admin Workspace
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl text-balance">
					Learning Model
				</h1>
				<p className="mt-3 max-w-3xl text-sm text-muted-foreground">
					Manage core learning entities, reusable modules, reusable quiz
					questions, quizzes, and lesson curation from one place.
				</p>
				{status ? <p className="mt-3 text-sm text-emerald-700">{status}</p> : null}
				{error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
			</div>

			<div className="grid gap-6 xl:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Organizations</CardTitle>
						<CardDescription>Optional lesson affiliations.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-3">
							<Input
								placeholder="New organization"
								value={newOrganizationTitle}
								onChange={(e) => setNewOrganizationTitle(e.target.value)}
							/>
							<Button onClick={createOrganization} disabled={!newOrganizationTitle.trim() || !!busyKey}>
								<Plus />
								Add
							</Button>
						</div>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Title</TableHead>
									<TableHead className="w-[160px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{organizations.map((item) => (
									<TableRow key={item.id}>
										<TableCell>
											<Input
												value={item.title}
												onChange={(e) =>
													setOrganizations((current) =>
														current.map((row) =>
															row.id === item.id ? { ...row, title: e.target.value } : row
														)
													)
												}
											/>
										</TableCell>
										<TableCell className="flex gap-2">
											<Button size="sm" variant="outline" onClick={() => saveOrganization(item)} disabled={!!busyKey}>
												<Save />
											</Button>
											<Button size="sm" variant="destructive" onClick={() => deleteOrganization(item.id)} disabled={!!busyKey}>
												<Trash2 />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Target Languages</CardTitle>
						<CardDescription>Every lesson must have exactly one.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-3">
							<Input
								placeholder="New target language"
								value={newTargetLanguageName}
								onChange={(e) => setNewTargetLanguageName(e.target.value)}
							/>
							<Button onClick={createTargetLanguage} disabled={!newTargetLanguageName.trim() || !!busyKey}>
								<Plus />
								Add
							</Button>
						</div>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead className="w-[160px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{targetLanguages.map((item) => (
									<TableRow key={item.id}>
										<TableCell>
											<Input
												value={item.name}
												onChange={(e) =>
													setTargetLanguages((current) =>
														current.map((row) =>
															row.id === item.id ? { ...row, name: e.target.value } : row
														)
													)
												}
											/>
										</TableCell>
										<TableCell className="flex gap-2">
											<Button size="sm" variant="outline" onClick={() => saveTargetLanguage(item)} disabled={!!busyKey}>
												<Save />
											</Button>
											<Button size="sm" variant="destructive" onClick={() => deleteTargetLanguage(item.id)} disabled={!!busyKey}>
												<Trash2 />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Courses</CardTitle>
					<CardDescription>Reusable containers for multiple lessons.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex gap-3">
						<Input placeholder="New course title" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} />
						<Button onClick={createCourse} disabled={!newCourseTitle.trim() || !!busyKey}>
							<Plus />
							Add
						</Button>
					</div>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Title</TableHead>
								<TableHead className="w-[160px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{courses.map((item) => (
								<TableRow key={item.id}>
									<TableCell>
										<Input
											value={item.title}
											onChange={(e) =>
												setCourses((current) =>
													current.map((row) =>
														row.id === item.id ? { ...row, title: e.target.value } : row
													)
												)
											}
										/>
									</TableCell>
									<TableCell className="flex gap-2">
										<Button size="sm" variant="outline" onClick={() => saveCourse(item)} disabled={!!busyKey}>
											<Save />
										</Button>
										<Button size="sm" variant="destructive" onClick={() => deleteCourse(item.id)} disabled={!!busyKey}>
											<Trash2 />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Modules</CardTitle>
					<CardDescription>
						Reusable lesson building blocks backed by media assets, video links,
						or quizzes.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<SectionHeader title="Create Module" description="Video modules can use either a media-library video asset or an external URL." />
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<Input placeholder="Module title" value={newModule.title} onChange={(e) => setNewModule((current) => ({ ...current, title: e.target.value }))} />
						<Select value={newModule.type} onValueChange={(value) => setNewModule((current) => ({ ...current, type: value as ModuleItem['type'], mediaAssetId: 'none', quizId: 'none', externalUrl: '' }))}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="audio">Audio</SelectItem>
								<SelectItem value="video">Video</SelectItem>
								<SelectItem value="document">Document</SelectItem>
								<SelectItem value="quiz">Quiz</SelectItem>
							</SelectContent>
						</Select>
						{newModule.type === 'quiz' ? (
							<Select value={newModule.quizId} onValueChange={(value) => setNewModule((current) => ({ ...current, quizId: value }))}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select quiz" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">No quiz selected</SelectItem>
									{quizzes.map((quiz) => (
										<SelectItem key={quiz.id} value={quiz.id}>
											{quiz.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<Select value={newModule.mediaAssetId} onValueChange={(value) => setNewModule((current) => ({ ...current, mediaAssetId: value }))}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select media asset" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">No asset selected</SelectItem>
									{mediaAssetsForModuleType(newModule.type).map((asset) => (
										<SelectItem key={asset.id} value={asset.id}>
											{assetLabel(asset)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						{newModule.type === 'video' ? (
							<Input placeholder="Optional external video URL" value={newModule.externalUrl} onChange={(e) => setNewModule((current) => ({ ...current, externalUrl: e.target.value }))} />
						) : (
							<div />
						)}
					</div>
					<Button onClick={createModule} disabled={!newModule.title.trim() || !!busyKey}>
						<Plus />
						Create Module
					</Button>

					<div className="grid gap-4">
						{modules.map((item) => (
							<Card key={item.id} className="border-dashed">
								<CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-5">
									<Input value={item.title} onChange={(e) => setModules((current) => current.map((row) => row.id === item.id ? { ...row, title: e.target.value } : row))} />
									<Select value={item.type} onValueChange={(value) => setModules((current) => current.map((row) => row.id === item.id ? { ...row, type: value as ModuleItem['type'], mediaAssetId: null, externalUrl: null, quizId: null } : row))}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="audio">Audio</SelectItem>
											<SelectItem value="video">Video</SelectItem>
											<SelectItem value="document">Document</SelectItem>
											<SelectItem value="quiz">Quiz</SelectItem>
										</SelectContent>
									</Select>
									{item.type === 'quiz' ? (
										<Select value={item.quizId ?? 'none'} onValueChange={(value) => setModules((current) => current.map((row) => row.id === item.id ? { ...row, quizId: value === 'none' ? null : value } : row))}>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">No quiz selected</SelectItem>
												{quizzes.map((quiz) => (
													<SelectItem key={quiz.id} value={quiz.id}>
														{quiz.title}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : (
										<Select value={item.mediaAssetId ?? 'none'} onValueChange={(value) => setModules((current) => current.map((row) => row.id === item.id ? { ...row, mediaAssetId: value === 'none' ? null : value } : row))}>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">No asset selected</SelectItem>
												{mediaAssetsForModuleType(item.type).map((asset) => (
													<SelectItem key={asset.id} value={asset.id}>
														{assetLabel(asset)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
									{item.type === 'video' ? (
										<Input value={item.externalUrl ?? ''} placeholder="Optional external URL" onChange={(e) => setModules((current) => current.map((row) => row.id === item.id ? { ...row, externalUrl: e.target.value } : row))} />
									) : (
										<div />
									)}
									<div className="flex gap-2">
										<Button size="sm" variant="outline" onClick={() => saveModule(item)} disabled={!!busyKey}>
											<Save />
										</Button>
										<Button size="sm" variant="destructive" onClick={() => deleteModule(item.id)} disabled={!!busyKey}>
											<Trash2 />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Lessons</CardTitle>
					<CardDescription>
						Curate lessons by assigning reusable modules directly to each one.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<SectionHeader title="Create Lesson" description="Each lesson belongs to one course, one target language, and any number of modules." />
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<Input placeholder="Lesson title" value={newLesson.title} onChange={(e) => setNewLesson((current) => ({ ...current, title: e.target.value }))} />
						<Input type="number" placeholder="Number" value={newLesson.number} onChange={(e) => setNewLesson((current) => ({ ...current, number: Number(e.target.value) }))} />
						<Input placeholder="Part" value={newLesson.part} onChange={(e) => setNewLesson((current) => ({ ...current, part: e.target.value }))} />
						<Input type="number" placeholder="Sort order" value={newLesson.sortOrder} onChange={(e) => setNewLesson((current) => ({ ...current, sortOrder: Number(e.target.value) }))} />
						<Select value={newLesson.courseId} onValueChange={(value) => setNewLesson((current) => ({ ...current, courseId: value }))}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select course" />
							</SelectTrigger>
							<SelectContent>
								{courses.map((course) => (
									<SelectItem key={course.id} value={course.id}>
										{course.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={newLesson.targetLanguageId} onValueChange={(value) => setNewLesson((current) => ({ ...current, targetLanguageId: value }))}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select target language" />
							</SelectTrigger>
							<SelectContent>
								{targetLanguages.map((language) => (
									<SelectItem key={language.id} value={language.id}>
										{language.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={newLesson.organizationId} onValueChange={(value) => setNewLesson((current) => ({ ...current, organizationId: value }))}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Optional organization" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">No organization</SelectItem>
								{organizations.map((organization) => (
									<SelectItem key={organization.id} value={organization.id}>
										{organization.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<ItemChecklist
						items={modules.map((module) => ({ id: module.id, label: `${module.title} (${module.type})` }))}
						selectedIds={newLesson.moduleIds}
						onToggle={(id, checked) =>
							setNewLesson((current) => ({
								...current,
								moduleIds: checked
									? [...current.moduleIds, id]
									: current.moduleIds.filter((moduleId) => moduleId !== id),
							}))
						}
					/>
					<Button onClick={createLesson} disabled={!newLesson.title.trim() || !newLesson.courseId || !newLesson.targetLanguageId || !!busyKey}>
						<Plus />
						Create Lesson
					</Button>

					<div className="grid gap-4">
						{lessons.map((item) => (
							<Card key={item.id} className="border-dashed">
								<CardContent className="space-y-4 pt-6">
									<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
										<Input value={item.title} onChange={(e) => setLessons((current) => current.map((row) => row.id === item.id ? { ...row, title: e.target.value } : row))} />
										<Input type="number" value={item.number} onChange={(e) => setLessons((current) => current.map((row) => row.id === item.id ? { ...row, number: Number(e.target.value) } : row))} />
										<Input value={item.part} onChange={(e) => setLessons((current) => current.map((row) => row.id === item.id ? { ...row, part: e.target.value } : row))} />
										<Input type="number" value={item.sortOrder} onChange={(e) => setLessons((current) => current.map((row) => row.id === item.id ? { ...row, sortOrder: Number(e.target.value) } : row))} />
										<Select value={item.courseId} onValueChange={(value) => setLessons((current) => current.map((row) => row.id === item.id ? { ...row, courseId: value } : row))}>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{courses.map((course) => (
													<SelectItem key={course.id} value={course.id}>
														{course.title}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Select value={item.targetLanguageId} onValueChange={(value) => setLessons((current) => current.map((row) => row.id === item.id ? { ...row, targetLanguageId: value } : row))}>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{targetLanguages.map((language) => (
													<SelectItem key={language.id} value={language.id}>
														{language.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Select value={item.organizationId ?? 'none'} onValueChange={(value) => setLessons((current) => current.map((row) => row.id === item.id ? { ...row, organizationId: value === 'none' ? null : value } : row))}>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">No organization</SelectItem>
												{organizations.map((organization) => (
													<SelectItem key={organization.id} value={organization.id}>
														{organization.title}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<ItemChecklist
										items={modules.map((module) => ({
											id: module.id,
											label: `${module.title} (${module.type})`,
										}))}
										selectedIds={item.moduleIds}
										onToggle={(id, checked) =>
											setLessons((current) =>
												current.map((row) =>
													row.id === item.id
														? {
																...row,
																moduleIds: checked
																	? [...row.moduleIds, id]
																	: row.moduleIds.filter((moduleId) => moduleId !== id),
														  }
														: row
												)
											)
										}
									/>
									<div className="flex gap-2">
										<Button size="sm" variant="outline" onClick={() => saveLesson(item)} disabled={!!busyKey}>
											<Save />
											Save
										</Button>
										<Button size="sm" variant="destructive" onClick={() => deleteLesson(item.id)} disabled={!!busyKey}>
											<Trash2 />
											Delete
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Quiz Questions</CardTitle>
					<CardDescription>
						Reusable questions that can appear in many quizzes, with one
						correct answer and up to five distractors.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<SectionHeader title="Create Quiz Question" description="Quiz type controls whether the prompt and answers use text or filtered media assets." />
					<div className="grid gap-4">
						<Input placeholder="Question title" value={newQuizQuestion.title} onChange={(e) => setNewQuizQuestion((current) => ({ ...current, title: e.target.value }))} />
						<Select value={newQuizQuestion.type} onValueChange={(value) => setNewQuizQuestion((current) => ({ ...current, type: value as QuizQuestionItem['type'], promptText: '', promptAssetId: 'none', answers: current.answers.map((answer) => ({ ...answer, answerText: '', answerAssetId: null })) }))}>
							<SelectTrigger className="w-full max-w-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{quizTypeOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{getQuizTypeConfig(newQuizQuestion.type).promptMode === 'text' ? (
							<Input placeholder="Prompt text" value={newQuizQuestion.promptText} onChange={(e) => setNewQuizQuestion((current) => ({ ...current, promptText: e.target.value, promptAssetId: 'none' }))} />
						) : (
							<Select value={newQuizQuestion.promptAssetId} onValueChange={(value) => setNewQuizQuestion((current) => ({ ...current, promptText: '', promptAssetId: value }))}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select prompt asset" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">No asset selected</SelectItem>
									{mediaAssets
										.filter(
											(asset) =>
												asset.kind === getQuizTypeConfig(newQuizQuestion.type).promptKind
										)
										.map((asset) => (
											<SelectItem key={asset.id} value={asset.id}>
												{assetLabel(asset)}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						)}
						<div className="grid gap-3">
							{newQuizQuestion.answers.map((answer, index) => (
								<AnswerEditor
									key={index}
									answer={answer}
									index={index}
									config={getQuizTypeConfig(newQuizQuestion.type)}
									assets={mediaAssets}
									onChange={(next) =>
										setNewQuizQuestion((current) => ({
											...current,
											answers: current.answers.map((row, rowIndex) =>
												rowIndex === index
													? next.isCorrect
														? { ...next, isCorrect: true }
														: next
													: next.isCorrect
														? { ...row, isCorrect: false }
														: row
											),
										}))
									}
									onRemove={() =>
										setNewQuizQuestion((current) => ({
											...current,
											answers: current.answers.filter((_, rowIndex) => rowIndex !== index),
										}))
									}
								/>
							))}
						</div>
						<Button
							variant="outline"
							onClick={() =>
								setNewQuizQuestion((current) => ({
									...current,
									answers:
										current.answers.length >= 6
											? current.answers
											: [...current.answers, makeAnswer(current.answers.length)],
								}))
							}
							disabled={newQuizQuestion.answers.length >= 6}
						>
							<Plus />
							Add Answer
						</Button>
						<Button onClick={createQuizQuestion} disabled={!newQuizQuestion.title.trim() || !!busyKey}>
							<Plus />
							Create Quiz Question
						</Button>
					</div>

					<div className="grid gap-4">
						{quizQuestions.map((question) => {
							const config = getQuizTypeConfig(question.type)
							return (
								<Card key={question.id} className="border-dashed">
									<CardContent className="space-y-4 pt-6">
										<Input value={question.title} onChange={(e) => setQuizQuestions((current) => current.map((row) => row.id === question.id ? { ...row, title: e.target.value } : row))} />
										<Select value={question.type} onValueChange={(value) => setQuizQuestions((current) => current.map((row) => row.id === question.id ? { ...row, type: value as QuizQuestionItem['type'], promptText: null, promptAssetId: null, answers: row.answers.map((answer) => ({ ...answer, answerText: null, answerAssetId: null })) } : row))}>
											<SelectTrigger className="w-full max-w-sm">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{quizTypeOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{config.promptMode === 'text' ? (
											<Input value={question.promptText ?? ''} placeholder="Prompt text" onChange={(e) => setQuizQuestions((current) => current.map((row) => row.id === question.id ? { ...row, promptText: e.target.value, promptAssetId: null } : row))} />
										) : (
											<Select value={question.promptAssetId ?? 'none'} onValueChange={(value) => setQuizQuestions((current) => current.map((row) => row.id === question.id ? { ...row, promptText: null, promptAssetId: value === 'none' ? null : value } : row))}>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="none">No asset selected</SelectItem>
													{mediaAssets
														.filter((asset) => asset.kind === config.promptKind)
														.map((asset) => (
															<SelectItem key={asset.id} value={asset.id}>
																{assetLabel(asset)}
															</SelectItem>
														))}
												</SelectContent>
											</Select>
										)}
										<div className="grid gap-3">
											{question.answers.map((answer, index) => (
												<AnswerEditor
													key={answer.id ?? index}
													answer={answer}
													index={index}
													config={config}
													assets={mediaAssets}
													onChange={(next) =>
														setQuizQuestions((current) =>
															current.map((row) =>
																row.id === question.id
																	? {
																			...row,
																			answers: row.answers.map((candidate, candidateIndex) =>
																				candidateIndex === index
																					? next
																					: next.isCorrect
																						? { ...candidate, isCorrect: false }
																						: candidate
																			),
																	  }
																	: row
															)
														)
													}
													onRemove={() =>
														setQuizQuestions((current) =>
															current.map((row) =>
																row.id === question.id
																	? {
																			...row,
																			answers: row.answers.filter((_, candidateIndex) => candidateIndex !== index),
																	  }
																	: row
															)
														)
													}
												/>
											))}
										</div>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													setQuizQuestions((current) =>
														current.map((row) =>
															row.id === question.id && row.answers.length < 6
																? {
																		...row,
																		answers: [...row.answers, makeAnswer(row.answers.length)],
																  }
																: row
														)
													)
												}
												disabled={question.answers.length >= 6}
											>
												<Plus />
												Answer
											</Button>
											<Button size="sm" variant="outline" onClick={() => saveQuizQuestion(question)} disabled={!!busyKey}>
												<Save />
												Save
											</Button>
											<Button size="sm" variant="destructive" onClick={() => deleteQuizQuestion(question.id)} disabled={!!busyKey}>
												<Trash2 />
												Delete
											</Button>
										</div>
									</CardContent>
								</Card>
							)
						})}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Quizzes</CardTitle>
					<CardDescription>Reusable quizzes that draw from reusable question rows.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<SectionHeader title="Create Quiz" description="Attach any number of reusable quiz questions in order." />
					<div className="grid gap-4">
						<Input placeholder="Quiz title" value={newQuiz.title} onChange={(e) => setNewQuiz((current) => ({ ...current, title: e.target.value }))} />
						<ItemChecklist
							items={quizQuestions.map((question) => ({ id: question.id, label: question.title }))}
							selectedIds={newQuiz.questionIds}
							onToggle={(id, checked) =>
								setNewQuiz((current) => ({
									...current,
									questionIds: checked
										? [...current.questionIds, id]
										: current.questionIds.filter((questionId) => questionId !== id),
								}))
							}
						/>
						<Button onClick={createQuiz} disabled={!newQuiz.title.trim() || !!busyKey}>
							<Plus />
							Create Quiz
						</Button>
					</div>

					<div className="grid gap-4">
						{quizzes.map((quiz) => (
							<Card key={quiz.id} className="border-dashed">
								<CardContent className="space-y-4 pt-6">
									<Input value={quiz.title} onChange={(e) => setQuizzes((current) => current.map((row) => row.id === quiz.id ? { ...row, title: e.target.value } : row))} />
									<ItemChecklist
										items={quizQuestions.map((question) => ({ id: question.id, label: question.title }))}
										selectedIds={quiz.questionIds}
										onToggle={(id, checked) =>
											setQuizzes((current) =>
												current.map((row) =>
													row.id === quiz.id
														? {
																...row,
																questionIds: checked
																	? [...row.questionIds, id]
																	: row.questionIds.filter((questionId) => questionId !== id),
														  }
														: row
												)
											)
										}
									/>
									<div className="flex gap-2">
										<Button size="sm" variant="outline" onClick={() => saveQuiz(quiz)} disabled={!!busyKey}>
											<Save />
											Save
										</Button>
										<Button size="sm" variant="destructive" onClick={() => deleteQuiz(quiz.id)} disabled={!!busyKey}>
											<Trash2 />
											Delete
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Study Groups</CardTitle>
					<CardDescription>Long-lived groups with many courses and one active principal course.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<SectionHeader title="Create Study Group" description="Assign many courses, then choose the one that is active now." />
					<div className="grid gap-4">
						<Input placeholder="Study group title" value={newStudyGroup.title} onChange={(e) => setNewStudyGroup((current) => ({ ...current, title: e.target.value }))} />
						<ItemChecklist
							items={courses.map((course) => ({ id: course.id, label: course.title }))}
							selectedIds={newStudyGroup.courseIds}
							onToggle={(id, checked) =>
								setNewStudyGroup((current) => {
									const courseIds = checked
										? [...current.courseIds, id]
										: current.courseIds.filter((courseId) => courseId !== id)
									return {
										...current,
										courseIds,
										activeCourseId: courseIds.includes(current.activeCourseId)
											? current.activeCourseId
											: 'none',
									}
								})
							}
						/>
						<Select value={newStudyGroup.activeCourseId} onValueChange={(value) => setNewStudyGroup((current) => ({ ...current, activeCourseId: value }))}>
							<SelectTrigger className="w-full max-w-sm">
								<SelectValue placeholder="Select active course" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">No active course</SelectItem>
								{courses
									.filter((course) => newStudyGroup.courseIds.includes(course.id))
									.map((course) => (
										<SelectItem key={course.id} value={course.id}>
											{course.title}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
						<Button onClick={createStudyGroup} disabled={!newStudyGroup.title.trim() || !!busyKey}>
							<Plus />
							Create Study Group
						</Button>
					</div>

					<div className="grid gap-4">
						{studyGroups.map((group) => (
							<Card key={group.id} className="border-dashed">
								<CardContent className="space-y-4 pt-6">
									<Input value={group.title} onChange={(e) => setStudyGroups((current) => current.map((row) => row.id === group.id ? { ...row, title: e.target.value } : row))} />
									<ItemChecklist
										items={courses.map((course) => ({ id: course.id, label: course.title }))}
										selectedIds={group.courseIds}
										onToggle={(id, checked) =>
											setStudyGroups((current) =>
												current.map((row) => {
													if (row.id !== group.id) return row
													const courseIds = checked
														? [...row.courseIds, id]
														: row.courseIds.filter((courseId) => courseId !== id)
													return {
														...row,
														courseIds,
														activeCourseId: courseIds.includes(row.activeCourseId ?? '')
															? row.activeCourseId
															: null,
													}
												})
											)
										}
									/>
									<Select value={group.activeCourseId ?? 'none'} onValueChange={(value) => setStudyGroups((current) => current.map((row) => row.id === group.id ? { ...row, activeCourseId: value === 'none' ? null : value } : row))}>
										<SelectTrigger className="w-full max-w-sm">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No active course</SelectItem>
											{courses
												.filter((course) => group.courseIds.includes(course.id))
												.map((course) => (
													<SelectItem key={course.id} value={course.id}>
														{course.title}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
									<div className="flex gap-2">
										<Button size="sm" variant="outline" onClick={() => saveStudyGroup(group)} disabled={!!busyKey}>
											<Save />
											Save
										</Button>
										<Button size="sm" variant="destructive" onClick={() => deleteStudyGroup(group.id)} disabled={!!busyKey}>
											<Trash2 />
											Delete
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
