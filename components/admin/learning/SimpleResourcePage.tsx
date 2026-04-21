import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

interface Props {
	locale: string
	title: string
	description: string
	columns: string[]
	basePath: string
	createHref?: string
	rows: Array<{
		id: string
		cells: string[]
	}>
	emptyText: string
}

export function SimpleResourcePage({
	locale,
	title,
	description,
	columns,
	basePath,
	createHref,
	rows,
	emptyText,
}: Props) {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-stone-50 via-background to-amber-50 p-6 shadow-sm md:flex-row md:items-end md:justify-between">
				<div>
					<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
						Learning
					</p>
					<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
						{title}
					</h1>
					<p className="mt-3 max-w-2xl text-sm text-muted-foreground">
						{description}
					</p>
				</div>
				{createHref ? (
					<Button asChild>
						<Link href={createHref}>Create</Link>
					</Button>
				) : null}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								{columns.map((column) => (
									<TableHead key={column}>{column}</TableHead>
								))}
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<TableRow key={row.id} className="cursor-pointer">
									{row.cells.map((cell, index) => (
										<TableCell key={`${row.id}-${index}`}>
											<Link
												href={`/${locale}${basePath}/${row.id}/read`}
												className="block py-1"
											>
												{cell}
											</Link>
										</TableCell>
									))}
									<TableCell>
										<div className="flex justify-end gap-2">
											<Button asChild size="sm" variant="outline">
												<Link href={`/${locale}${basePath}/${row.id}/update`}>
													Update
												</Link>
											</Button>
											<Button
												asChild
												size="icon"
												variant="destructive"
												className="h-8 w-8"
											>
												<Link
													href={`/${locale}${basePath}/${row.id}/delete`}
													aria-label={`Delete ${row.cells[0] ?? 'item'}`}
													title={`Delete ${row.cells[0] ?? 'item'}`}
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">Delete</span>
												</Link>
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
							{rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={columns.length + 1}
										className="py-10 text-center text-muted-foreground"
									>
										{emptyText}
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	)
}
