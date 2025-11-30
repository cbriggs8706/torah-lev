'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Send } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type User = {
	id: string
	name: string
	image?: string
	isInstructor?: boolean
}

type Message = {
	id: number
	senderId: string
	content: string
	createdAt: string | Date
	tempId?: string
}

type CourseMessagesProps = {
	currentUserId: string
	// instructor: User
	members: User[]
	messages: Message[]
	courseCode?: string
}

export default function CourseMessages({
	currentUserId,
	// instructor,
	members,
	messages: initialMessages,
	courseCode,
}: CourseMessagesProps) {
	const [messages, setMessages] = useState<Message[]>(initialMessages || [])
	const [newMessage, setNewMessage] = useState('')
	const scrollRef = useRef<HTMLDivElement>(null)
	const allMembers = Array.from(
		new Map([...members].map((u) => [u.id, u])).values()
		// new Map([instructor, ...members].map((u) => [u.id, u])).values()
	)

	const findUser = (id: string) => allMembers.find((u) => u.id === id)

	// 🔄 Auto-scroll to bottom
	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: 'smooth',
		})
	}, [messages])

	// 🧠 Initial fetch of messages
	useEffect(() => {
		if (!courseCode) return

		const fetchMessages = async () => {
			const { data, error } = await supabase
				.from('messages')
				.select('*')
				.eq('study_group_id', courseCode)
				.order('created_at', { ascending: true })

			if (error) {
				console.error('Error fetching messages:', error)
				return
			}

			setMessages(
				(data || []).map((m) => ({
					id: m.id,
					senderId: m.sender_id,
					content: m.content,
					createdAt: m.created_at,
				}))
			)
		}

		fetchMessages()
	}, [courseCode])

	// ⚡ Single realtime listener for INSERT
	useEffect(() => {
		if (!courseCode) return

		const channel = supabase
			.channel(`study-group-${courseCode}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
					filter: `study_group_id=eq.${courseCode}`,
				},
				(payload) => {
					setMessages((prev) => {
						// ✅ Prevent duplicates (either same DB id or tempId)
						if (
							prev.some(
								(m) =>
									m.id === payload.new.id ||
									(m.tempId && m.tempId === payload.new.temp_id)
							)
						)
							return prev

						return [
							...prev,
							{
								id: payload.new.id,
								senderId: payload.new.sender_id,
								content: payload.new.content,
								createdAt: payload.new.created_at,
							},
						]
					})
				}
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [courseCode])

	const cleanSrc = (url?: string) =>
		url?.replace(/\s|\n|\r/g, '') || '/mascot.svg'

	// ✉️ Handle sending (with optimistic UI)
	const handleSend = async () => {
		if (!newMessage.trim() || !courseCode) return
		const messageText = newMessage.trim()
		setNewMessage('')

		const tempId = uuidv4()

		// Optimistic update
		setMessages((prev) => [
			...prev,
			{
				id: Date.now(), // temp local id
				tempId,
				senderId: currentUserId,
				content: messageText,
				createdAt: new Date().toISOString(),
			},
		])

		// Send to Supabase
		await supabase.from('messages').insert({
			sender_id: currentUserId,
			content: messageText,
			study_group_id: courseCode,
			temp_id: tempId, // optional column in DB
		})
	}

	// 🕒 Format timestamp
	const formatTimestamp = (date: string | Date) => {
		const d = new Date(date)
		return d.toLocaleString([], {
			weekday: 'short',
			hour: '2-digit',
			minute: '2-digit',
			month: 'short',
			day: 'numeric',
		})
	}

	// 🧭 Determine if timestamp separator needed
	const shouldShowTimestamp = (current: Message, previous?: Message) => {
		if (!previous) return true
		const diff =
			new Date(current.createdAt).getTime() -
			new Date(previous.createdAt).getTime()
		return diff > 1000 * 60 * 30 // 30 minutes
	}

	return (
		<div className="flex flex-col h-full max-h-[calc(100vh-5rem)] w-full mx-auto sm:max-w-lg border rounded-2xl shadow bg-white overflow-hidden">
			{/* Header */}
			<div className="p-3 border-b bg-gray-50">
				<p className="text-sm font-semibold mb-2 text-center">
					Instructor & Members
				</p>
				<div className="flex flex-wrap justify-center gap-3">
					{allMembers.map((user) => (
						<div
							key={`member=${user.id}`}
							className="flex flex-col items-center text-center text-xs w-16"
						>
							<Image
								src={cleanSrc(user.image)}
								alt={user.name}
								width={48}
								height={48}
								className="rounded-full border object-cover"
								unoptimized
								onError={(e) =>
									((e.target as HTMLImageElement).src = '/mascot.svg')
								}
							/>
							<p
								className={`truncate ${
									user.isInstructor
										? 'text-blue-600 font-semibold'
										: 'text-gray-600'
								}`}
							>
								{user.name}
							</p>
						</div>
					))}
				</div>
			</div>

			{/* Messages */}
			<div
				ref={scrollRef}
				className="flex-1 overflow-y-auto px-3 py-2 bg-gray-50 space-y-3"
			>
				{messages.map((msg, idx) => {
					const sender = findUser(msg.senderId)
					const isMe = msg.senderId === currentUserId
					const previous = idx > 0 ? messages[idx - 1] : undefined
					const showTime = shouldShowTimestamp(msg, previous)

					return (
						<div key={`${msg.id ?? 'temp'}-${msg.tempId ?? ''}`}>
							{showTime && (
								<div className="text-center text-xs text-gray-400 my-3">
									{formatTimestamp(msg.createdAt)}
								</div>
							)}

							<div
								className={`flex items-start gap-2 ${
									isMe ? 'justify-end' : 'justify-start'
								}`}
							>
								{!isMe && sender && (
									<Image
										src={cleanSrc(sender.image)}
										alt={sender.name}
										width={36}
										height={36}
										unoptimized
										onError={(e) =>
											((e.target as HTMLImageElement).src = '/mascot.svg')
										}
										className="rounded-full border object-cover"
									/>
								)}

								<div
									className={`flex flex-col max-w-[80%] ${
										isMe ? 'items-end text-right' : 'items-start'
									}`}
								>
									{sender && (
										<span className="text-xs text-gray-500 mb-0.5">
											{sender.name}
										</span>
									)}
									<div
										className={`px-3 py-2 rounded-2xl text-sm ${
											isMe
												? 'bg-blue-500 text-white rounded-br-none'
												: 'bg-gray-200 text-gray-800 rounded-bl-none'
										}`}
									>
										{msg.content}
									</div>
								</div>

								{isMe && (
									<Image
										src={(
											cleanSrc(findUser(currentUserId)?.image) || '/mascot.svg'
										).trim()}
										alt="Me"
										width={36}
										height={36}
										unoptimized
										onError={(e) =>
											((e.target as HTMLImageElement).src = '/mascot.svg')
										}
										className="rounded-full border object-cover"
									/>
								)}
							</div>
						</div>
					)
				})}
			</div>

			{/* Input */}
			<div className="flex items-center gap-2 p-3 border-t bg-white">
				<Input
					value={newMessage}
					onChange={(e) => setNewMessage(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleSend()}
					placeholder="Type a message..."
					className="flex-1 text-sm"
				/>
				<Button size="sm" onClick={handleSend}>
					<Send className="h-4 w-4" />
				</Button>
			</div>
		</div>
	)
}
