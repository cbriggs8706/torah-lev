// components/admin/courses/CourseForm.tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { usePathname } from 'next/navigation'

import { courseType, proficiencyLevel } from '@/db/schema/enums'

import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldError,
	FieldContent,
	FieldDescription,
} from '@/components/ui/field'

import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { Switch } from '../../ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { Calendar } from '../../ui/calendar'
import { toast } from 'sonner'

// -----------------------------------------------------
// ZOD SCHEMA
// -----------------------------------------------------

const formSchema = z.object({
	slug: z.string().min(2),
	courseCode: z.string().min(2),
	section: z.string().optional(),

	type: z.enum(courseType.enumValues),

	description: z.string().optional(),
	imageSrc: z.string(),
	category: z.string().optional(),
	current: z.boolean().optional(),
	startProficiencyLevel: z.enum(proficiencyLevel.enumValues),
	endProficiencyLevel: z.enum(proficiencyLevel.enumValues),
	public: z.boolean().optional(),

	startDate: z.string().optional(),
	endDate: z.string().optional(),

	organizerGroupName: z.string().optional(),

	location: z.string().optional(),
	zoomLink: z.string().optional(),

	maxEnrollment: z.coerce.number().optional(),
	enrollmentOpen: z.boolean().optional(),
})

export type CourseFormValues = z.infer<typeof formSchema>
type CourseWithId = CourseFormValues & { id: string }

function parseDate(value?: string | null): Date | undefined {
	if (!value) return undefined
	const d = new Date(value)
	return isNaN(d.getTime()) ? undefined : d
}

export function CourseForm({
	mode = 'create',
	initialData,
}: {
	mode?: 'create' | 'update' | 'view'
	initialData?: Partial<CourseWithId>
}) {
	const pathname = usePathname()
	const locale = pathname.split('/')[1] ?? 'en'
	const router = useRouter()
	const [loading, setLoading] = React.useState(false)
	const isReadOnly = mode === 'view'

	// -----------------------------------------------------
	// IMPORTANT: DO NOT PASS A GENERIC TO useForm()
	// -----------------------------------------------------
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			slug: initialData?.slug ?? '',
			courseCode: initialData?.courseCode ?? '',
			section: initialData?.section ?? '',
			type: initialData?.type ?? 'INPERSON',
			description: initialData?.description ?? '',
			imageSrc: initialData?.imageSrc ?? '',
			category: initialData?.category ?? '',
			current: initialData?.current ?? true,
			startProficiencyLevel: initialData?.startProficiencyLevel ?? 'A1',
			endProficiencyLevel: initialData?.endProficiencyLevel ?? 'A1',
			public: initialData?.public ?? true,
			startDate: initialData?.startDate ?? '',
			endDate: initialData?.endDate ?? '',
			organizerGroupName: initialData?.organizerGroupName ?? '',
			location: initialData?.location ?? '',
			zoomLink: initialData?.zoomLink ?? '',
			maxEnrollment: initialData?.maxEnrollment ?? undefined,
			enrollmentOpen: initialData?.enrollmentOpen ?? true,
		},
	})

	// -----------------------------------------------------
	// ALSO IMPORTANT: onSubmit MUST BE UNTYPED
	// -----------------------------------------------------
	async function onSubmit(values: CourseFormValues) {
		if (isReadOnly) return

		setLoading(true)

		let res: Response

		if (mode === 'create') {
			res = await fetch('/api/courses', {
				method: 'POST',
				body: JSON.stringify(values),
			})
		} else {
			// update mode
			res = await fetch(`/api/courses/${initialData!.id}`, {
				method: 'PATCH',
				body: JSON.stringify(values),
			})
		}

		setLoading(false)

		if (!res.ok) {
			console.error(await res.text())
			toast.error('Error saving course')
			return
		}

		router.push(`/${locale}/admin/course`)
	}

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle>Create Course</CardTitle>
				<CardDescription>
					{mode === 'view'
						? 'View your course details.'
						: 'Fill out the details below.'}
				</CardDescription>
			</CardHeader>

			<CardContent>
				<form id="course-form" onSubmit={form.handleSubmit(onSubmit)}>
					<FieldGroup className="space-y-6">
						{/* SLUG */}
						<Controller
							name="slug"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Name (Slug)</FieldLabel>
									<Input
										disabled={isReadOnly}
										placeholder="unique name for your class, not visible to others"
										{...field}
									/>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* COURSE CODE */}
						<Controller
							name="courseCode"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Course Code</FieldLabel>
									<Input
										disabled={isReadOnly}
										placeholder="HEB-101, AWB-A1, etc"
										{...field}
									/>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						{/* COURSE LOCATION */}
						<Controller
							name="location"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Location</FieldLabel>
									<Input
										disabled={isReadOnly}
										placeholder="Address, Building/Room#, etc"
										{...field}
									/>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						{/* COURSE ZOOM LINK */}
						<Controller
							name="zoomLink"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Zoom Link</FieldLabel>
									<Input
										disabled={isReadOnly}
										placeholder="Full zoom link"
										{...field}
									/>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* MAX ENROLLMENT */}
						<Controller
							name="maxEnrollment"
							control={form.control}
							render={({ field, fieldState }) => {
								const numericValue =
									typeof field.value === 'number' ? field.value : ''

								return (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Max Enrollment</FieldLabel>

										<Input
											type="number"
											disabled={isReadOnly}
											placeholder="30"
											value={numericValue}
											onChange={(e) => {
												const num = e.target.valueAsNumber
												field.onChange(Number.isNaN(num) ? undefined : num)
											}}
											aria-invalid={fieldState.invalid}
										/>

										<FieldDescription>
											Leave blank for unlimited enrollment.
										</FieldDescription>

										{fieldState.error && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)
							}}
						/>

						{/* COURSE GROUP NAME */}
						<Controller
							name="organizerGroupName"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Group Name (Optional)</FieldLabel>
									<Input
										disabled={isReadOnly}
										placeholder="Linga Deo Gloria, Mary's Study Groups, etc"
										{...field}
									/>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* COURSE SECTION */}
						<Controller
							name="section"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Section</FieldLabel>
									<Input
										disabled={isReadOnly}
										placeholder="A, B1, 65, etc"
										{...field}
									/>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* COURSE TYPE */}
						<Controller
							name="type"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Course Type</FieldLabel>
									<Select
										disabled={isReadOnly}
										value={field.value}
										onValueChange={field.onChange}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											{courseType.enumValues.map((t) => (
												<SelectItem key={t} value={t}>
													{t}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* DESCRIPTION */}
						<Controller
							name="description"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Description (optional)</FieldLabel>
									<Textarea disabled={isReadOnly} rows={4} {...field} />
								</Field>
							)}
						/>

						{/* IMAGE */}
						<Controller
							name="imageSrc"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Image URL</FieldLabel>
									<Input
										disabled={isReadOnly}
										placeholder="/images/hebrew.png"
										{...field}
									/>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* COURSE CATEGORY */}
						<Controller
							name="category"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Category</FieldLabel>
									<Input
										disabled={isReadOnly}
										placeholder="additional optional way to categorize your class"
										{...field}
									/>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* COURSE STATUS */}
						<Controller
							name="current"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field
									orientation="horizontal"
									data-invalid={fieldState.invalid}
								>
									<FieldLabel>Active</FieldLabel>
									<Switch
										disabled={isReadOnly}
										checked={!!field.value}
										onCheckedChange={field.onChange}
										aria-invalid={fieldState.invalid}
									/>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* COURSE VISIBILITY */}
						<Controller
							name="public"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field
									orientation="horizontal"
									data-invalid={fieldState.invalid}
								>
									<FieldLabel>Public</FieldLabel>
									<Switch
										disabled={isReadOnly}
										checked={!!field.value}
										onCheckedChange={field.onChange}
										aria-invalid={fieldState.invalid}
									/>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* COURSE ENROLLMENT */}
						<Controller
							name="enrollmentOpen"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field
									orientation="horizontal"
									data-invalid={fieldState.invalid}
								>
									<FieldLabel>Enrollment Open</FieldLabel>
									<Switch
										disabled={isReadOnly}
										checked={!!field.value}
										onCheckedChange={field.onChange}
										aria-invalid={fieldState.invalid}
									/>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* START PROFICIENCY */}
						<Controller
							name="startProficiencyLevel"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Start Level</FieldLabel>
									<Select
										disabled={isReadOnly}
										value={field.value}
										onValueChange={field.onChange}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{proficiencyLevel.enumValues.map((p) => (
												<SelectItem key={p} value={p}>
													{p}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* END PROFICIENCY */}
						<Controller
							name="endProficiencyLevel"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>End Level</FieldLabel>
									<Select
										disabled={isReadOnly}
										value={field.value}
										onValueChange={field.onChange}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{proficiencyLevel.enumValues.map((p) => (
												<SelectItem key={p} value={p}>
													{p}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</FieldGroup>

					{/* START DATE */}
					<Controller
						name="startDate"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel>Start Date</FieldLabel>

								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-start text-left font-normal"
										>
											{field.value
												? format(parseDate(field.value)!, 'PPP')
												: 'Select a date'}
										</Button>
									</PopoverTrigger>

									<PopoverContent className="p-0">
										<Calendar
											mode="single"
											selected={parseDate(field.value)}
											// Convert Date → string for Zod/RHF
											onSelect={(date) =>
												field.onChange(date?.toISOString() ?? '')
											}
											initialFocus
										/>
									</PopoverContent>
								</Popover>

								{fieldState.error && <FieldError errors={[fieldState.error]} />}
							</Field>
						)}
					/>

					{/* END DATE */}
					<Controller
						name="endDate"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel>End Date</FieldLabel>

								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-start text-left font-normal"
										>
											{field.value
												? format(parseDate(field.value)!, 'PPP')
												: 'Select a date'}
										</Button>
									</PopoverTrigger>

									<PopoverContent className="p-0">
										<Calendar
											mode="single"
											selected={parseDate(field.value)}
											onSelect={(date) =>
												field.onChange(date?.toISOString() ?? '')
											}
											initialFocus
										/>
									</PopoverContent>
								</Popover>

								{fieldState.error && <FieldError errors={[fieldState.error]} />}
							</Field>
						)}
					/>
				</form>
			</CardContent>

			<CardFooter>
				{mode === 'view' ? (
					<Button
						type="button"
						onClick={() => router.push(`/${locale}/admin/course`)}
					>
						View all Courses
					</Button>
				) : (
					<Button form="course-form" type="submit" disabled={loading}>
						{loading
							? 'Saving…'
							: mode === 'create'
							? 'Create Course'
							: 'Save Course'}
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}
