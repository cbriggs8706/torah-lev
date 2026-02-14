'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RichTextEditor } from '@/components/courses/RichTextEditor'

type ThreadMember = {
	userId: string
	role: 'owner' | 'member'
	user: {
		id: string
		name: string | null
		email: string | null
		image: string | null
	}
}

type Thread = {
	id: string
	courseId: string
	type: 'course' | 'dm' | 'group'
	name: string | null
	members: ThreadMember[]
}

type ThreadMessage = {
	id: string
	senderId: string
	contentHtml: string
	createdAt: string
	sender: {
		id: string
		name: string | null
		image: string | null
	}
}

export default function CourseThreadsWorkspace({
	courseId,
	currentUserId,
}: {
	courseId: string
	currentUserId: string
}) {
	const [threads, setThreads] = React.useState<Thread[]>([])
	const [loadingThreads, setLoadingThreads] = React.useState(true)
	const [selectedThreadId, setSelectedThreadId] = React.useState<string | null>(null)
	const [messages, setMessages] = React.useState<ThreadMessage[]>([])
	const [loadingMessages, setLoadingMessages] = React.useState(false)
	const [newMessageHtml, setNewMessageHtml] = React.useState('')
	const [creatingType, setCreatingType] = React.useState<'dm' | 'group'>('dm')
	const [createName, setCreateName] = React.useState('')
	const [createMemberIds, setCreateMemberIds] = React.useState<string[]>([])

	const threadById = React.useMemo(
		() => new Map(threads.map((thread) => [thread.id, thread])),
		[threads]
	)
	const selectedThread = selectedThreadId ? threadById.get(selectedThreadId) : null

	const allMembers = React.useMemo(() => {
		const map = new Map<string, { id: string; name: string; email: string }>()
		for (const thread of threads) {
			for (const member of thread.members) {
				map.set(member.userId, {
					id: member.userId,
					name: member.user.name ?? member.user.email ?? member.userId,
					email: member.user.email ?? '',
				})
			}
		}
		return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
	}, [threads])

	const loadThreads = React.useCallback(async () => {
		setLoadingThreads(true)
		try {
			const res = await fetch(`/api/courses/${courseId}/threads`, { cache: 'no-store' })
			if (!res.ok) throw new Error('Failed to load threads')
			const data = await res.json()
			const incoming: Thread[] = data.threads ?? []
			setThreads(incoming)
			if (!selectedThreadId && incoming.length > 0) {
				setSelectedThreadId(incoming[0].id)
			} else if (
				selectedThreadId &&
				incoming.every((thread) => thread.id !== selectedThreadId)
			) {
				setSelectedThreadId(incoming[0]?.id ?? null)
			}
		} catch (error) {
			console.error(error)
			toast.error('Could not load threads')
		} finally {
			setLoadingThreads(false)
		}
	}, [courseId, selectedThreadId])

	const loadMessages = React.useCallback(async () => {
		if (!selectedThreadId) {
			setMessages([])
			return
		}

		setLoadingMessages(true)
		try {
			const res = await fetch(
				`/api/courses/${courseId}/threads/${selectedThreadId}/messages`,
				{
					cache: 'no-store',
				}
			)
			if (!res.ok) throw new Error('Failed to load messages')
			const data = await res.json()
			setMessages(data.messages ?? [])
		} catch (error) {
			console.error(error)
			toast.error('Could not load messages')
		} finally {
			setLoadingMessages(false)
		}
	}, [courseId, selectedThreadId])

	React.useEffect(() => {
		void loadThreads()
	}, [loadThreads])

	React.useEffect(() => {
		void loadMessages()
	}, [loadMessages])

	React.useEffect(() => {
		if (!selectedThreadId) return
		const id = setInterval(() => {
			void loadMessages()
		}, 5000)
		return () => clearInterval(id)
	}, [selectedThreadId, loadMessages])

	async function sendMessage() {
		if (!selectedThreadId) return
		if (!newMessageHtml.trim()) return
		try {
			const res = await fetch(
				`/api/courses/${courseId}/threads/${selectedThreadId}/messages`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contentHtml: newMessageHtml,
						contentText: newMessageHtml.replace(/<[^>]+>/g, '').trim(),
						attachments: [],
					}),
				}
			)
			if (!res.ok) throw new Error('Failed to send message')
			setNewMessageHtml('')
			await loadMessages()
		} catch (error) {
			console.error(error)
			toast.error('Could not send message')
		}
	}

	async function createThread() {
		const memberIds = createMemberIds
		const normalizedName = createName.trim()
		if (creatingType === 'dm' && memberIds.length !== 1) {
			toast.error('Select exactly one member for a direct message')
			return
		}
		try {
			const res = await fetch(`/api/courses/${courseId}/threads`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: creatingType,
					name: normalizedName || undefined,
					memberIds,
				}),
			})
			if (!res.ok) {
				const body = await res.json().catch(() => ({}))
				throw new Error(body.error || 'Failed to create thread')
			}
			const data = await res.json()
			setCreateName('')
			setCreateMemberIds([])
			await loadThreads()
			if (data.thread?.id) {
				setSelectedThreadId(data.thread.id)
			}
		} catch (error) {
			console.error(error)
			toast.error(error instanceof Error ? error.message : 'Could not create thread')
		}
	}

	return (
		<div className="grid gap-4 md:grid-cols-[300px_1fr]">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Threads</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{loadingThreads && <p className="text-sm text-muted-foreground">Loading...</p>}
					{threads.map((thread) => (
						<button
							key={thread.id}
							type="button"
							onClick={() => setSelectedThreadId(thread.id)}
							className={`w-full text-left rounded border p-2 text-sm ${
								selectedThreadId === thread.id ? 'bg-muted' : ''
							}`}
						>
							<p className="font-medium">
								{thread.name ||
									(thread.type === 'course'
										? 'Course Chat'
										: thread.type === 'dm'
										? 'Direct Message'
										: 'Group Chat')}
							</p>
							<p className="text-xs text-muted-foreground">
								{thread.members.length} members
							</p>
						</button>
					))}
					<div className="space-y-2 border-t pt-3">
						<p className="text-sm font-medium">Create Thread</p>
						<div className="flex gap-2">
							<Button
								type="button"
								variant={creatingType === 'dm' ? 'default' : 'outline'}
								size="sm"
								onClick={() => setCreatingType('dm')}
							>
								DM
							</Button>
							<Button
								type="button"
								variant={creatingType === 'group' ? 'default' : 'outline'}
								size="sm"
								onClick={() => setCreatingType('group')}
							>
								Group
							</Button>
						</div>
						<Input
							placeholder="Name (group only)"
							value={createName}
							onChange={(e) => setCreateName(e.target.value)}
						/>
						<div className="max-h-28 overflow-auto rounded border p-2 space-y-1">
							{allMembers
								.filter((member) => member.id !== currentUserId)
								.map((member) => {
									const checked = createMemberIds.includes(member.id)
									return (
										<label
											key={member.id}
											className="flex items-center justify-between gap-2 text-xs"
										>
											<span className="truncate">{member.name}</span>
											<input
												type="checkbox"
												checked={checked}
												onChange={(e) =>
													setCreateMemberIds((prev) =>
														e.target.checked
															? [...prev, member.id]
															: prev.filter((id) => id !== member.id)
													)
												}
											/>
										</label>
									)
								})}
						</div>
						<Button type="button" size="sm" onClick={createThread}>
							Create
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						{selectedThread
							? selectedThread.name ||
							  (selectedThread.type === 'course'
									? 'Course Chat'
									: selectedThread.type === 'dm'
									? 'Direct Message'
									: 'Group Chat')
							: 'Messages'}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{loadingMessages && (
						<p className="text-sm text-muted-foreground">Loading messages...</p>
					)}
					<div className="max-h-[420px] overflow-auto space-y-2 border rounded p-3">
						{messages.map((message) => {
							const mine = message.senderId === currentUserId
							return (
								<div
									key={message.id}
									className={`rounded p-2 text-sm ${
										mine ? 'bg-blue-50 border border-blue-100' : 'bg-muted'
									}`}
								>
									<p className="text-xs text-muted-foreground">
										{message.sender?.name || message.senderId}
									</p>
									<div
										className="prose prose-sm max-w-none"
										dangerouslySetInnerHTML={{ __html: message.contentHtml }}
									/>
								</div>
							)
						})}
						{messages.length === 0 && !loadingMessages && (
							<p className="text-sm text-muted-foreground">
								No messages yet in this thread.
							</p>
						)}
					</div>

					{selectedThread && (
						<div className="space-y-2">
							<RichTextEditor
								value={newMessageHtml}
								onChange={setNewMessageHtml}
								height={220}
							/>
							<div className="flex justify-end">
								<Button type="button" onClick={sendMessage}>
									Send Message
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
