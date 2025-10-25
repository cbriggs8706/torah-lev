'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import ScheduleSection from './schedule-section'
import MembersTable from './members-table'
import LiveQuizSection from './live-quiz-section'

function formatTimeAgo(dateString: string) {
	const date = new Date(dateString)
	const diffMs = Date.now() - date.getTime()
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

	if (diffDays <= 0) return 'today'
	if (diffDays === 1) return '1 day ago'
	return `${diffDays} days ago`
}

export default function StudyGroupDashboard({
	userId,
	userName,
	studyGroup,
}: {
	userId: string
	userName: string
	studyGroup: any
}) {
	const router = useRouter()
	const [isLiveQuizActive, setIsLiveQuizActive] = useState(false)
	const [liveLessonTitle, setLiveLessonTitle] = useState<string | null>(null)
	const [schedule, setSchedule] = useState<any[]>([])
	const [lessons, setLessons] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [adding, setAdding] = useState(false)
	const [openModal, setOpenModal] = useState(false)
	const [editingSession, setEditingSession] = useState<any | null>(null)
	const [formData, setFormData] = useState({
		class_date: '',
		notes: '',
		homework_instructions: '',
		homework_links: [] as { label: string; url: string }[],
		lessons: [] as { id: number; title: string }[], // ✅ now store both id and title
		recording_link: '', // ✅ new field
	})

	console.log('studyGroupZoom', studyGroup.zoomLink)
	// ✅ Load available lessons for assignment (from Neon)
	useEffect(() => {
		async function loadLessons() {
			try {
				const res = await fetch('/api/public/lessons')
				if (!res.ok) throw new Error('Failed to fetch lessons')
				const data = await res.json()
				setLessons(Array.isArray(data) ? data : [])
			} catch (err) {
				console.error('Error loading lessons:', err)
				setLessons([])
			}
		}
		loadLessons()
	}, [])

	const channelName = `group-${studyGroup.id}`

	useEffect(() => {
		// define channel name inside effect so it's not an external dep
		const channelName = `group-${studyGroup.id}`

		const channel = supabase.channel(channelName)

		channel
			.on('broadcast', { event: 'game-started' }, (payload) => {
				setIsLiveQuizActive(true)
				setLiveLessonTitle(payload.payload.title || 'Lesson in progress')
			})
			.on('broadcast', { event: 'game-ended' }, () => {
				setIsLiveQuizActive(false)
				setLiveLessonTitle(null)
			})
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [studyGroup.id])

	const isInstructor = studyGroup.teacher.userId === userId

	// 🧩 Handle join click — broadcast player info before navigating
	const handleJoinQuiz = async () => {
		try {
			const member = studyGroup.members.find(
				(m: any) => m.user.userId === userId
			)
			const userImageSrc = member?.user.userImageSrc || '/mascot.svg'

			await supabase.channel(channelName).send({
				type: 'broadcast',
				event: 'player-joined',
				payload: {
					userId,
					userName,
					userImageSrc, // 👈 send image
				},
			})

			router.push(`/study-group/${studyGroup.id}/live-quiz`)
		} catch (err) {
			console.error('Failed to join quiz:', err)
		}
	}

	// 🔹 Fetch upcoming schedule + lessons
	// ✅ Fetch schedule from Supabase and merge lesson titles from Neon
	useEffect(() => {
		async function loadSchedule() {
			setLoading(true)

			// 1️⃣ Fetch schedule + lesson_id from Supabase
			const { data: scheduleData, error } = await supabase
				.from('study_group_schedule')
				.select('*, study_group_schedule_lessons(lesson_id, lesson_title)')
				.eq('study_group_id', studyGroup.id)
				.order('class_date', { ascending: true })

			if (error) {
				console.error('Error fetching schedule from Supabase:', error)
				setSchedule([])
				setLoading(false)
				return
			}

			if (!scheduleData || scheduleData.length === 0) {
				setSchedule([])
				setLoading(false)
				return
			}

			// 2️⃣ Collect unique lesson IDs
			const lessonIds = scheduleData.flatMap(
				(s: any) =>
					s.study_group_schedule_lessons?.map((l: any) => l.lesson_id) || []
			)
			const uniqueLessonIds = [...new Set(lessonIds)]

			// 3️⃣ ✅ Fetch lesson titles from safe API
			try {
				const res = await fetch('/api/public/lessons/by-ids', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ ids: uniqueLessonIds }),
				})
				const neonLessons = res.ok ? await res.json() : []

				const mergedSchedule = scheduleData.map((s: any) => ({
					...s,
					study_group_schedule_lessons: s.study_group_schedule_lessons.map(
						(l: any) => ({
							...l,
							title:
								neonLessons.find((nl: any) => nl.id === l.lesson_id)?.title ||
								'Untitled Lesson',
						})
					),
				}))

				setSchedule(mergedSchedule)
			} catch (err) {
				console.error('Error fetching Neon lessons via API:', err)
				setSchedule(scheduleData)
			}

			setLoading(false)
		}

		loadSchedule()
	}, [studyGroup.id])

	// 🧩 Teacher — Cancel a session
	const handleCancel = async (id: number) => {
		await supabase
			.from('study_group_schedule')
			.update({ is_canceled: true })
			.eq('id', id)
		location.reload()
	}

	const handleUncancel = async (id: number) => {
		await supabase
			.from('study_group_schedule')
			.update({ is_canceled: false })
			.eq('id', id)

		const { data: refreshed } = await supabase
			.from('study_group_schedule')
			.select('*, study_group_schedule_lessons(lesson_id, lesson_title)')
			.eq('study_group_id', studyGroup.id)
			.order('class_date', { ascending: true })

		setSchedule(refreshed || [])
	}

	const handleDeleteSession = async (id: number) => {
		if (!confirm('Are you sure you want to permanently delete this session?'))
			return

		try {
			// First delete related lessons to avoid FK constraint
			await supabase
				.from('study_group_schedule_lessons')
				.delete()
				.eq('schedule_id', id)

			// Then delete the session itself
			await supabase.from('study_group_schedule').delete().eq('id', id)

			// Refresh schedule
			const { data: refreshed } = await supabase
				.from('study_group_schedule')
				.select('*, study_group_schedule_lessons(lesson_id, lesson_title)')
				.eq('study_group_id', studyGroup.id)
				.order('class_date', { ascending: true })

			setSchedule(refreshed || [])
		} catch (err) {
			console.error('Error deleting session:', err)
			alert('Error deleting session. See console for details.')
		}
	}

	// 🧩 Student — Mark lesson completed
	const handleMarkComplete = async (lessonId: number) => {
		await supabase.from('challenge_progress').upsert({
			user_id: userId,
			challenge_id: lessonId, // or connect via userCourseProgress table depending on your schema
			completed: true,
		})
		alert('Lesson marked complete!')
	}

	const openEditModal = (session?: any) => {
		if (session) {
			setEditingSession(session)
			setFormData({
				class_date: toLocalInputValue(session.class_date),
				notes: session.notes || '',
				homework_instructions: session.homework_instructions || '',
				homework_links:
					session.homework_links_json ||
					(session.homework_links
						? session.homework_links.map((url: string) => ({
								label: 'Homework',
								url,
						  }))
						: []),
				lessons:
					session.study_group_schedule_lessons?.map((l: any) => ({
						id: l.lesson_id,
						title: l.lesson_title || l.title || 'Untitled Lesson',
					})) || [],
				recording_link: session.recording_link || '',
			})
		} else {
			setEditingSession(null)
			setFormData({
				class_date: '',
				notes: '',
				homework_instructions: '',
				homework_links: [],
				lessons: [],
				recording_link: '',
			})
		}
		setOpenModal(true)
	}

	//SUPABASE DB
	const handleSaveSession = async () => {
		const {
			class_date,
			notes,
			homework_instructions,
			homework_links,
			lessons,
			recording_link,
		} = formData

		if (!class_date) {
			alert('Please choose a date.')
			return
		}

		// ---------- CREATE NEW ----------
		if (!editingSession) {
			const { data, error } = await supabase
				.from('study_group_schedule')
				.insert([
					{
						study_group_id: studyGroup.id,
						class_date: new Date(class_date).toISOString(),
						notes,
						homework_instructions,
						homework_links_json: homework_links,
						recording_link: recording_link || null,
					},
				])
				.select()
				.single()

			if (error) {
				console.error('Insert error:', error)
				alert('Error creating session: ' + error.message)
				return
			}

			// insert linked lessons with stored titles
			for (const lesson of lessons) {
				await supabase.from('study_group_schedule_lessons').insert([
					{
						schedule_id: data.id,
						lesson_id: lesson.id,
						lesson_title: lesson.title,
					},
				])
			}
		}

		// ---------- UPDATE EXISTING ----------
		else {
			const { error } = await supabase
				.from('study_group_schedule')
				.update({
					class_date: new Date(class_date).toISOString(),
					notes,
					homework_instructions,
					homework_links_json: homework_links,
					recording_link: recording_link || null,
				})
				.eq('id', editingSession.id)

			if (error) {
				console.error('Update error:', error)
				alert('Error updating session: ' + error.message)
				return
			}

			// replace lessons cleanly
			await supabase
				.from('study_group_schedule_lessons')
				.delete()
				.eq('schedule_id', editingSession.id)

			for (const lesson of lessons) {
				await supabase.from('study_group_schedule_lessons').insert([
					{
						schedule_id: editingSession.id,
						lesson_id: lesson.id,
						lesson_title: lesson.title,
					},
				])
			}
		}

		// ---------- REFRESH ----------
		setOpenModal(false)
		setEditingSession(null)
		setFormData({
			class_date: '',
			notes: '',
			homework_instructions: '',
			homework_links: [],
			lessons: [],
			recording_link: '',
		})

		// 🕒 tiny wait to ensure new lessons committed
		await new Promise((r) => setTimeout(r, 400))

		let scheduleData: any[] | null = null
		let error: any = null
		for (let i = 0; i < 3; i++) {
			const { data, error: err } = await supabase
				.from('study_group_schedule')
				.select('*, study_group_schedule_lessons(lesson_id, lesson_title)')
				.eq('study_group_id', studyGroup.id)
				.order('class_date', { ascending: true })

			if (!err && data?.length) {
				scheduleData = data
				break
			}
			await new Promise((r) => setTimeout(r, 300)) // retry after small delay
		}
		if (!scheduleData) return console.error('Could not reload schedule', error)

		// Collect unique lesson IDs
		const lessonIds = scheduleData.flatMap(
			(s: any) =>
				s.study_group_schedule_lessons?.map((l: any) => l.lesson_id) || []
		)
		const uniqueLessonIds = [...new Set(lessonIds)]

		// Fetch lesson titles from Neon
		try {
			const res = await fetch('/api/public/lessons/by-ids', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: uniqueLessonIds }),
			})
			const neonLessons = res.ok ? await res.json() : []

			const mergedSchedule = scheduleData.map((s: any) => ({
				...s,
				study_group_schedule_lessons: s.study_group_schedule_lessons.map(
					(l: any) => ({
						...l,
						title:
							l.lesson_title ||
							neonLessons.find((nl: any) => nl.id === l.lesson_id)?.title ||
							'Untitled Lesson',
					})
				),
			}))

			setSchedule(mergedSchedule)
		} catch (err) {
			console.error('Error fetching Neon lessons after save:', err)
			setSchedule(scheduleData)
		}
	}

	// 🧭 Find the next upcoming class (by date)
	const now = new Date()
	const nextClass = schedule
		.filter((s) => new Date(s.class_date) > now && !s.is_canceled)
		.sort(
			(a, b) =>
				new Date(a.class_date).getTime() - new Date(b.class_date).getTime()
		)[0]

	function toLocalInputValue(isoString: string) {
		if (!isoString) return ''
		const date = new Date(isoString)
		const tzOffset = date.getTimezoneOffset() * 60000
		const localISOTime = new Date(date.getTime() - tzOffset)
			.toISOString()
			.slice(0, 16) // "YYYY-MM-DDTHH:MM"
		return localISOTime
	}

	return (
		<div className="w-full max-w-2xl mx-auto space-y-6">
			{isInstructor && (
				<h2 className="font-semibold text-2xl text-center text-sky-800">
					- You are the instructor for this course. -
				</h2>
			)}

			<LiveQuizSection
				isInstructor={isInstructor}
				isLiveQuizActive={isLiveQuizActive}
				liveLessonTitle={liveLessonTitle}
				studyGroupId={studyGroup.id}
				onJoinQuiz={handleJoinQuiz}
			/>

			<MembersTable studyGroup={studyGroup} />

			<ScheduleSection
				{...{
					schedule,
					nextClass,
					studyGroup,
					isInstructor,
					onEdit: openEditModal,
					onDelete: handleDeleteSession,
					onCancel: handleCancel,
					onUncancel: handleUncancel,
					handleSaveSession, // ✅ notice: this must match prop name in modal
					openModal,
					setOpenModal,
					editingSession,
					setEditingSession,
					formData,
					setFormData,
					loading,
					toLocalInputValue,
				}}
			/>
		</div>
	)
}
