const MS_PER_DAY = 24 * 60 * 60 * 1000

function startOfDay(value: Date) {
	return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function addDays(value: Date, days: number) {
	return new Date(value.getTime() + days * MS_PER_DAY)
}

function isWeekend(value: Date) {
	const day = value.getDay()
	return day === 0 || day === 6
}

function toIsoDate(value: Date) {
	return startOfDay(value).toISOString().slice(0, 10)
}

export function getScheduleWindow(startDate: Date, goalDays: number) {
	const normalizedStart = startOfDay(startDate)
	const normalizedGoalDays = Math.max(1, Math.floor(goalDays))

	return Array.from({ length: normalizedGoalDays }, (_, index) =>
		addDays(normalizedStart, index)
	)
}

function selectPreferredDays(days: Date[], lessonCount: number) {
	const weekdays = days.filter((day) => !isWeekend(day))

	if (lessonCount <= weekdays.length) {
		return weekdays
	}

	return days
}

export function buildEvenScheduleDates(
	lessonCount: number,
	goalDays: number,
	startDate = new Date()
) {
	if (lessonCount <= 0) return []

	const scheduleWindow = getScheduleWindow(startDate, goalDays)
	const preferredDays = selectPreferredDays(scheduleWindow, lessonCount)
	const selectedDates: string[] = []

	for (let lessonIndex = 0; lessonIndex < lessonCount; lessonIndex += 1) {
		const mappedIndex = Math.min(
			preferredDays.length - 1,
			Math.floor((lessonIndex * preferredDays.length) / lessonCount)
		)
		selectedDates.push(toIsoDate(preferredDays[mappedIndex]))
	}

	return selectedDates
}

export function getTargetEndDate(startDate: Date, goalDays: number) {
	return addDays(startOfDay(startDate), Math.max(0, Math.floor(goalDays) - 1))
}

