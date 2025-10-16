export interface ChallengeOption {
	id: number
	text: string
	correct: boolean
	imageSrc?: string | null
	audioSrc?: string | null
}

export interface Challenge {
	id: number
	type: string
	question: string
	order: number
	challengeOptions: ChallengeOption[]
}

export interface Lesson {
	id: number
	title: string
	challenges: Challenge[]
}
