export interface LessonInput {
	title: string
	locale: string
}

export interface UnitInput {
	title: string
	locale: string
	lessons: LessonInput[]
}

export interface CourseTranslationInput {
	locale: string
	title: string
	description: string
}

export interface CreateCourseInput {
	slug: string
	imageSrc: string
	category: string
	translations: CourseTranslationInput[]
	units: UnitInput[]
}
