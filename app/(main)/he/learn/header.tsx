type Props = {
	title: string
}

export const HebrewHeader = ({ title }: Props) => {
	return (
		<div className="sticky top-0 z-30 mb-6 border-b border-sidebar-border bg-sidebar/95 px-4 py-4 backdrop-blur">
			<h1 className="text-center text-3xl font-semibold tracking-tight text-sidebar-foreground">
				{title}
			</h1>
		</div>
	)
}
