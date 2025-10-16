'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket<T extends Record<string, any>>(
	roomId: string,
	onConnect?: (socket: Socket) => void
) {
	const socketRef = useRef<Socket | null>(null)

	useEffect(() => {
		// 🧩 Ensure the Socket.IO server route wakes up
		fetch('/api/socket/io')

		const socket = io({
			path: '/api/socket/io',
			reconnection: true,
			reconnectionDelay: 500,
		})
		socketRef.current = socket

		socket.on('connect', () => {
			console.log('🟢 Connected to Socket.IO server')
			socket.emit('join-room', roomId)
			console.log('📚 Joined room:', roomId)
			onConnect?.(socket)
		})

		socket.on('disconnect', () => {
			console.log('🔴 Disconnected from Socket.IO server')
		})

		return () => {
			if (socket.connected) socket.disconnect()
		}
	}, [roomId])

	return socketRef
}
