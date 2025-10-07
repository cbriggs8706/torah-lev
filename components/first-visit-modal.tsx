'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function FirstVisitModal() {
	const [isOpen, setIsOpen] = useState(false)
	const [showArrow, setShowArrow] = useState(false)

	useEffect(() => {
		const hasSeen = localStorage.getItem('first-visit-ack')
		if (!hasSeen) {
			setIsOpen(true)
			// delay arrow a bit so modal text shows first
			setTimeout(() => setShowArrow(true), 1000)
		}
	}, [])

	const handleAcknowledge = () => {
		localStorage.setItem('first-visit-ack', 'true')
		setIsOpen(false)
		setShowArrow(false)
	}

	if (!isOpen) return null

	return createPortal(
		<>
			{/* Block all interaction */}
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
					className="bg-white rounded-2xl shadow-xl max-w-md mx-4 p-6 text-center"
				>
					<h2 className="text-xl font-semibold mb-4">Welcome!</h2>
					<p className="text-gray-700 text-md leading-relaxed mb-4">
						This is the main section of the app. You could stay here and never
						do the rest of the activities if you&apos;d like. For extra
						practice, tap the{' '}
						<strong>menu button in the upper left corner</strong> (☰) to view
						other activities.
					</p>
					<button
						onClick={handleAcknowledge}
						className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
					>
						Got it!
					</button>
				</motion.div>
			</div>

			{/* Animated Arrow Overlay */}
			<AnimatePresence>
				{showArrow && (
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.5 }}
						className="fixed top-3 left-3 z-[60] flex flex-col items-center"
					>
						{/* arrow icon */}
						<motion.svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={2.5}
							stroke="white"
							className="w-10 h-10 drop-shadow-[0_0_6px_rgba(0,0,0,0.6)]"
							animate={{ y: [0, 10, 0] }}
							transition={{ repeat: Infinity, duration: 1 }}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 19V6m0 0l-6 6m6-6l6 6"
							/>
						</motion.svg>
						<div className="bg-black/70 text-white px-3 py-1 rounded-md mt-1 text-xs font-semibold">
							Menu
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>,
		document.body
	)
}
