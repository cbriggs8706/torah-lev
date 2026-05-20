'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import Image from 'next/image'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type User = {
	id: string
	name: string
	avatar?: string
	isInstructor?: boolean
}

type Message = {
	id: number
	senderId: string
	content: string
	createdAt: string | Date
}

type StudyGroupMessagesProps = {
	currentUserId: string
	instructor: User
	members: User[]
	messages: Message[]
	studyGroupId?: number
}

export default function StudyGroupMessages({
	currentUserId,
	instructor,
	members,
	messages: initialMessages,
	studyGroupId,
}: StudyGroupMessagesProps) {
	const [messages, setMessages] = useState<Message[]>(initialMessages || [])
	const [newMessage, setNewMessage] = useState('')
	const scrollRef = useRef<HTMLDivElement>(null)
	const allMembers = Array.from(
		new Map([instructor, ...members].map((u) => [u.id, u])).values()
	)

	const findUser = (id: string) => allMembers.find((u) => u.id === id)

	const fetchMessages = useEffectEvent(async () => {
		if (!studyGroupId) return

		try {
			const res = await fetch(`/api/study-groups/${studyGroupId}/messages`, {
				cache: 'no-store',
			})

			if (!res.ok) {
				throw new Error(`Failed to fetch messages (${res.status})`)
			}

			const data = await res.json()
			setMessages(Array.isArray(data) ? data : [])
		} catch (error) {
			console.error('Error fetching messages:', error)
		}
	})

	// 🔄 Auto-scroll to bottom
	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: 'smooth',
		})
	}, [messages])

	// 🧠 Initial fetch of messages
	useEffect(() => {
		if (!studyGroupId) return

		fetchMessages()
		const intervalId = window.setInterval(fetchMessages, 10000)

		return () => {
			window.clearInterval(intervalId)
		}
	}, [studyGroupId])

	const cleanSrc = (url?: string) =>
		url?.replace(/\s|\n|\r/g, '') || '/mascot.svg'

	// ✉️ Handle sending
	const handleSend = async () => {
		if (!newMessage.trim() || !studyGroupId) return
		const messageText = newMessage.trim()

		try {
			const res = await fetch(`/api/study-groups/${studyGroupId}/messages`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ content: messageText }),
			})

			if (!res.ok) {
				throw new Error(`Failed to send message (${res.status})`)
			}

			const created = await res.json()
			setMessages((prev) =>
				prev.some((message) => message.id === created.id)
					? prev
					: [...prev, created]
			)
			setNewMessage('')
		} catch (error) {
			console.error('Error sending message:', error)
		}
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
								src={cleanSrc(user.avatar)}
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
						<div key={msg.id}>
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
										src={cleanSrc(sender.avatar)}
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
											cleanSrc(findUser(currentUserId)?.avatar) || '/mascot.svg'
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
