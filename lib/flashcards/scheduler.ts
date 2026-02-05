export type FlashcardState =
	| 'new'
	| 'learning'
	| 'review'
	| 'relearning'
	| 'suspended'

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export type FlashcardScheduling = {
	state: FlashcardState
	dueAt: Date
	learningStep: number
	intervalDays: number
	ease: number
	reps: number
	lapses: number
	leech: boolean
	lastReviewedAt: Date | null
}

export type SchedulerConfig = {
	learningStepsMinutes: number[]
	relearningStepsMinutes: number[]
	graduatingIntervalDays: number
	easyIntervalDays: number
	easyBonus: number
	hardIntervalFactor: number
	intervalModifier: number
	easeMin: number
	easeMax: number
	leechThreshold: number
}

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
	learningStepsMinutes: [10, 1440],
	relearningStepsMinutes: [10, 1440],
	graduatingIntervalDays: 1,
	easyIntervalDays: 4,
	easyBonus: 1.3,
	hardIntervalFactor: 1.2,
	intervalModifier: 1.0,
	easeMin: 1.3,
	easeMax: 3.5,
	leechThreshold: 8,
}

type ApplyReviewResult = {
	prev: FlashcardScheduling
	next: FlashcardScheduling
	rating: ReviewRating
}

function addMinutes(date: Date, minutes: number): Date {
	return new Date(date.getTime() + minutes * 60 * 1000)
}

function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

function adjustEase(
	ease: number,
	rating: ReviewRating,
	config: SchedulerConfig
): number {
	const delta =
		rating === 'again'
			? -0.2
			: rating === 'hard'
			? -0.15
			: rating === 'easy'
			? 0.15
			: 0
	return clamp(ease + delta, config.easeMin, config.easeMax)
}

function scheduleLearning(
	prev: FlashcardScheduling,
	rating: ReviewRating,
	now: Date,
	steps: number[],
	config: SchedulerConfig,
	state: FlashcardState
): FlashcardScheduling {
	const stepIndex = prev.learningStep

	if (rating === 'again') {
		return {
			...prev,
			state,
			learningStep: 0,
			intervalDays: 0,
			dueAt: addMinutes(now, steps[0]),
		}
	}

	if (rating === 'hard') {
		const repeatStep = Math.min(stepIndex, steps.length - 1)
		return {
			...prev,
			state,
			learningStep: repeatStep,
			intervalDays: 0,
			dueAt: addMinutes(now, steps[repeatStep]),
		}
	}

	if (rating === 'easy') {
		return {
			...prev,
			state: 'review',
			learningStep: 0,
			intervalDays: config.easyIntervalDays,
			dueAt: addDays(now, config.easyIntervalDays),
		}
	}

	const nextStep = stepIndex + 1
	if (nextStep >= steps.length) {
		return {
			...prev,
			state: 'review',
			learningStep: 0,
			intervalDays: config.graduatingIntervalDays,
			dueAt: addDays(now, config.graduatingIntervalDays),
		}
	}

	return {
		...prev,
		state,
		learningStep: nextStep,
		intervalDays: 0,
		dueAt: addMinutes(now, steps[nextStep]),
	}
}

function scheduleReview(
	prev: FlashcardScheduling,
	rating: ReviewRating,
	now: Date,
	config: SchedulerConfig
): FlashcardScheduling {
	const baseInterval = Math.max(1, prev.intervalDays)

	if (rating === 'again') {
		const lapseCount = prev.lapses + 1
		const leech = lapseCount >= config.leechThreshold
		const nextState: FlashcardState = leech ? 'suspended' : 'relearning'

		return {
			...prev,
			state: nextState,
			learningStep: leech ? 0 : 0,
			intervalDays: 0,
			dueAt: leech
				? prev.dueAt
				: addMinutes(now, config.relearningStepsMinutes[0]),
			lapses: lapseCount,
			leech,
		}
	}

	const interval =
		rating === 'hard'
			? baseInterval * config.hardIntervalFactor
			: rating === 'easy'
			? baseInterval * prev.ease * config.easyBonus
			: baseInterval * prev.ease
	const nextInterval = clamp(interval * config.intervalModifier, 1, 36500)

	return {
		...prev,
		state: 'review',
		learningStep: 0,
		intervalDays: nextInterval,
		dueAt: addDays(now, nextInterval),
	}
}

export function applyReview(
	prev: FlashcardScheduling,
	rating: ReviewRating,
	now: Date = new Date(),
	config: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG
): ApplyReviewResult {
	if (prev.state === 'suspended') {
		return { prev, next: { ...prev }, rating }
	}

	const normalizedPrev: FlashcardScheduling = {
		...prev,
		learningStep: Math.max(0, prev.learningStep ?? 0),
	}

	const baseNext: FlashcardScheduling = {
		...normalizedPrev,
		reps: normalizedPrev.reps + 1,
		lastReviewedAt: now,
	}

	let next: FlashcardScheduling

	if (normalizedPrev.state === 'new') {
		next = scheduleLearning(
			{ ...baseNext, state: 'learning', learningStep: 0 },
			rating,
			now,
			config.learningStepsMinutes,
			config,
			'learning'
		)
	} else if (normalizedPrev.state === 'learning') {
		next = scheduleLearning(
			baseNext,
			rating,
			now,
			config.learningStepsMinutes,
			config,
			'learning'
		)
	} else if (normalizedPrev.state === 'relearning') {
		next = scheduleLearning(
			baseNext,
			rating,
			now,
			config.relearningStepsMinutes,
			config,
			'relearning'
		)
	} else {
		next = scheduleReview(baseNext, rating, now, config)
	}

	if (normalizedPrev.state === 'review' || normalizedPrev.state === 'relearning') {
		next.ease = adjustEase(normalizedPrev.ease, rating, config)
	}

	return { prev: normalizedPrev, next, rating }
}
