import assert from 'node:assert/strict'
import {
	applyReview,
	DEFAULT_SCHEDULER_CONFIG,
	type FlashcardScheduling,
} from '@/lib/flashcards/scheduler'

const now = new Date('2026-02-05T12:00:00.000Z')

function baseCard(
	overrides: Partial<FlashcardScheduling> = {}
): FlashcardScheduling {
	return {
		state: 'new',
		dueAt: now,
		learningStep: 0,
		intervalDays: 0,
		ease: 2.5,
		reps: 0,
		lapses: 0,
		leech: false,
		lastReviewedAt: null,
		...overrides,
	}
}

// New card -> Good advances to next learning step (1 day)
{
	const result = applyReview(baseCard(), 'good', now)
	assert.equal(result.next.state, 'learning')
	assert.equal(result.next.learningStep, 1)
	assert.equal(
		result.next.dueAt.getTime(),
		now.getTime() + 1440 * 60 * 1000
	)
}

// New card -> Easy graduates to review
{
	const result = applyReview(baseCard(), 'easy', now)
	assert.equal(result.next.state, 'review')
	assert.equal(result.next.intervalDays, DEFAULT_SCHEDULER_CONFIG.easyIntervalDays)
	assert.equal(
		result.next.dueAt.getTime(),
		now.getTime() +
			DEFAULT_SCHEDULER_CONFIG.easyIntervalDays * 24 * 60 * 60 * 1000
	)
}

// Review card -> Good uses ease
{
	const result = applyReview(
		baseCard({ state: 'review', intervalDays: 4, ease: 2.5 }),
		'good',
		now
	)
	assert.equal(result.next.state, 'review')
	assert.equal(result.next.intervalDays, 10)
}

// Review card -> Again triggers relearning and lapse
{
	const result = applyReview(
		baseCard({ state: 'review', intervalDays: 4, lapses: 0 }),
		'again',
		now
	)
	assert.equal(result.next.state, 'relearning')
	assert.equal(result.next.lapses, 1)
	assert.equal(
		result.next.dueAt.getTime(),
		now.getTime() + DEFAULT_SCHEDULER_CONFIG.relearningStepsMinutes[0] * 60 * 1000
	)
}

// Leech threshold triggers suspension
{
	const result = applyReview(
		baseCard({ state: 'review', lapses: 7 }),
		'again',
		now
	)
	assert.equal(result.next.leech, true)
	assert.equal(result.next.state, 'suspended')
}

console.log('flashcard scheduler tests passed')
