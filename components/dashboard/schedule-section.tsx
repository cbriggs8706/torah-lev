'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarDays, Square, Trash, XCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import SessionFormModal from './session-form-modal'

export default function ScheduleSection({
	schedule,
	nextClass,
	studyGroup,
	isInstructor,
	onEdit,
	onDelete,
	onCancel,
	onUncancel,
	handleSaveSession,
	openModal,
	setOpenModal,
	editingSession,
	setEditingSession,
	formData,
	setFormData,
	loading,
	toLocalInputValue,
}: any) {
	return (
		<div className="p-4 border rounded-lg shadow-sm bg-gray-50">
			<div className="flex justify-between items-center mb-3">
				<h2 className="font-semibold text-lg flex items-center gap-2">
					<CalendarDays className="w-5 h-5" /> Class Schedule
				</h2>

				{isInstructor && (
					<SessionFormModal
						open={openModal}
						setOpen={setOpenModal}
						studyGroup={studyGroup}
						formData={formData}
						setFormData={setFormData}
						editingSession={editingSession}
						setEditingSession={setEditingSession}
						handleSaveSession={handleSaveSession}
						toLocalInputValue={toLocalInputValue}
					/>
				)}
			</div>

			{loading ? (
				<p className="text-gray-500">Loading schedule…</p>
			) : schedule.length === 0 ? (
				<p className="text-gray-500 italic">No sessions scheduled yet.</p>
			) : (
				<ul className="divide-y">
					{schedule.map((s: any) => (
						<li
							key={s.id}
							className={cn(
								'py-3 px-2 rounded-md transition border-l-4',
								s.id === nextClass?.id
									? 'bg-blue-50 border-blue-400'
									: s.is_canceled
									? 'bg-red-50 border-red-300 border-dashed'
									: 'hover:bg-gray-50 border-transparent'
							)}
						>
							<div className="flex justify-between items-start">
								{/* 🔹 LEFT SIDE */}
								<div className="flex-1 text-left">
									{/* Date */}
									<p className="font-medium">
										{format(new Date(s.class_date), 'eeee, MMM d')}
										<span className="text-gray-600 font-normal">
											{' • '}
											{new Date(s.class_date).toLocaleTimeString([], {
												hour: 'numeric',
												minute: '2-digit',
												timeZoneName: 'short',
											})}
										</span>
									</p>

									{/* Next Class Label + Zoom */}
									{s.id === nextClass?.id && (
										<div className="flex items-center gap-2 mt-1">
											<span className="inline-block text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
												Next Class
											</span>
											{studyGroup.zoomLink && (
												<Link
													href={studyGroup.zoomLink}
													target="_blank"
													rel="noopener noreferrer"
												>
													<Image
														src="/zoom.svg"
														alt="Join Zoom"
														width={22}
														height={22}
														className="hover:scale-110 transition-transform"
													/>
												</Link>
											)}
										</div>
									)}

									{/* Canceled */}
									{s.is_canceled && (
										<p className="text-red-600 font-medium mb-2">
											❌ Class canceled
										</p>
									)}

									{/* Recording */}
									{s.recording_link && (
										<div className="mt-2">
											<Link
												href={s.recording_link}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-2 text-red-600"
											>
												<Image
													src="/icons/iconYoutube.png"
													alt="Class recording"
													width={24}
													height={24}
												/>
												<span className="underline text-sm">
													Watch recording
												</span>
											</Link>
										</div>
									)}

									{/* Notes */}
									{s.notes && (
										<div className="text-sm text-gray-800 mb-1">
											<strong>Notes:</strong> {s.notes}
										</div>
									)}

									{/* Homework Instructions */}
									{s.homework_instructions && (
										<div className="text-sm text-gray-700 mb-1">
											<strong>Homework:</strong> {s.homework_instructions}
										</div>
									)}

									{/* Assigned Lessons */}
									{s.study_group_schedule_lessons?.length > 0 && (
										<div className="mt-2 text-sm text-blue-600 space-y-1">
											{s.study_group_schedule_lessons.map((l: any) => (
												<div
													key={l.lesson_id}
													className="flex items-center gap-2"
												>
													<Square className="w-4 h-4 text-gray-400" />
													<Link
														href={`/lesson/${l.lesson_id}`}
														className="underline"
													>
														{l.lesson_title || l.title || 'Open Lesson'}
													</Link>
												</div>
											))}
										</div>
									)}

									{/* Homework Links */}
									{(s.homework_links_json || []).length > 0 && (
										<div className="text-sm text-blue-700 mb-1 space-y-1">
											{s.homework_links_json.map((link: any, i: number) => {
												const url = link.url?.trim() || ''
												const isExternal = /^https?:\/\//i.test(url)

												return (
													<Link
														key={i}
														href={url}
														{...(isExternal
															? {
																	target: '_blank',
																	rel: 'noopener noreferrer',
															  }
															: {})}
														className="flex items-center gap-2 text-blue-600 underline text-sm mr-2"
													>
														<Square className="w-4 h-4 text-gray-400" />
														{link.label || `Homework ${i + 1}`}
													</Link>
												)
											})}
										</div>
									)}
								</div>

								{/* 🔹 RIGHT SIDE (Instructor Controls) */}
								{isInstructor && (
									<div className="flex flex-col items-end gap-2 ml-4">
										<Button
											size="sm"
											variant="secondary"
											onClick={() => onEdit(s)}
										>
											Edit
										</Button>
										<Button
											size="sm"
											variant="danger"
											onClick={() => onDelete(s.id)}
										>
											<Trash className="w-4 h-4 mr-1" /> Delete
										</Button>

										{s.is_canceled ? (
											<Button
												size="sm"
												variant="primaryOutline"
												onClick={() => onUncancel(s.id)}
											>
												🔄 Uncancel
											</Button>
										) : (
											<Button
												size="sm"
												variant="primaryOutline"
												onClick={() => onCancel(s.id)}
											>
												<XCircle className="w-4 h-4 mr-1" /> Cancel
											</Button>
										)}
									</div>
								)}
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
