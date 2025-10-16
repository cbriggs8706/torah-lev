export type StudyGroupType = {
	id: number
	name: string
	teacher: {
		userId: string
		userName: string
		userImageSrc?: string | null
	}
	members: {
		user: {
			userId: string
			userName: string
			userImageSrc?: string | null
		}
	}[]
	availableCourses: {
		id: number
		title: string
		description?: string | null
		order?: number
	}[]
}
