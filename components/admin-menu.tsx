// components/AdminMenu.tsx
'use client'

import { Menu } from 'react-admin'
import { DashboardMenuItem, MenuItemLink } from 'react-admin'
import BookIcon from '@mui/icons-material/Book'
import BuildIcon from '@mui/icons-material/Build'
import HubIcon from '@mui/icons-material/Hub'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import SchoolIcon from '@mui/icons-material/School'
import { useLocation } from 'react-router-dom'

export const AdminMenu = () => {
	const location = useLocation()

	return (
		<Menu>
			<DashboardMenuItem />
			<MenuItemLink
				to="/vocab-intros"
				primaryText="Vocab Intros"
				leftIcon={<VideoLibraryIcon />}
				selected={location.pathname === '/vocab-intros'}
			/>
			<MenuItemLink
				to="/generate-challenges"
				primaryText="Generate Challenges"
				leftIcon={<BuildIcon />}
				selected={location.pathname === '/generate-challenges'}
			/>
			<MenuItemLink
				to="/vocab-relations"
				primaryText="Vocab Relations"
				leftIcon={<HubIcon />}
				selected={location.pathname === '/vocab-relations'}
			/>
			<MenuItemLink
				to="/public-courses"
				primaryText="Public Courses"
				leftIcon={<SchoolIcon />}
				selected={location.pathname.startsWith('/public-courses')}
			/>
			<MenuItemLink
				to="/construct-absolute-words"
				primaryText="Construct / Absolute"
				leftIcon={<BookIcon />}
				selected={location.pathname.startsWith('/construct-absolute-words')}
			/>
			<Menu.ResourceItems />
		</Menu>
	)
}
