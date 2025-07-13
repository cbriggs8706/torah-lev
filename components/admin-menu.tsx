// components/AdminMenu.tsx
'use client'

import { Menu } from 'react-admin'
import { DashboardMenuItem, MenuItemLink } from 'react-admin'
import BookIcon from '@mui/icons-material/Book'
import BuildIcon from '@mui/icons-material/Build'
import { useLocation } from 'react-router-dom'

export const AdminMenu = () => {
	const location = useLocation()

	return (
		<Menu>
			<DashboardMenuItem />
			<Menu.ResourceItems />
			<MenuItemLink
				to="/generate-challenges"
				primaryText="Generate Challenges"
				leftIcon={<BuildIcon />}
				selected={location.pathname === '/generate-challenges'}
			/>
		</Menu>
	)
}
