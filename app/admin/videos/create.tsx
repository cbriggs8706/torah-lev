'use client'

import { Create } from 'react-admin'

import { VideoForm } from './form'

export const VideoCreate = () => {
	return (
		<Create>
			<VideoForm />
		</Create>
	)
}
