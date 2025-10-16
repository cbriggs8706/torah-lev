'use client'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export const useGameSocket = () => {
	const [socket, setSocket] = useState<Socket | null>(null)

	useEffect(() => {
		const s = io({
			path: '/api/socket',
		})

		// optional log to confirm connection
		s.on('connect', () => console.log('✅ connected to socket:', s.id))

		setSocket(s)

		return () => {
			s.disconnect()
		}
	}, [])

	return socket
}
