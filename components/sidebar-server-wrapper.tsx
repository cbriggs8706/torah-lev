// Server Component
import dynamic from 'next/dynamic'

// Dynamically load the real SidebarServer
const SidebarServer = dynamic(() => import('./sidebar-server'), {
	ssr: true, // Ensure it's only rendered on the server
})

export default function SidebarServerWrapper(props: {
	className?: string
	onItemClick?: () => void
}) {
	return <SidebarServer {...props} />
}
