'use client'

import Image from 'next/image'
import MaleFemaleIcon from '@/public/malefemale-sign-svgrepo-com.svg'
import FemaleIcon from '@/public/female-sign-svgrepo-com.svg'
import MaleIcon from '@/public/male-sign-svgrepo-com.svg'
import { HebrewVocab } from '@/lib/vocab'
import { getRootMorphologyParts } from '@/lib/vocab-morphology'

type RootMorphologyField = 'rootPerson' | 'rootGender' | 'rootNumber'

interface RootMorphologyIconsProps {
	entry: HebrewVocab
	fields?: RootMorphologyField[]
	className?: string
}

export function RootMorphologyIcons({
	entry,
	fields = ['rootPerson', 'rootGender', 'rootNumber'],
	className = 'flex gap-1 items-center text-slate-600',
}: RootMorphologyIconsProps) {
	const { rootPerson, rootGender, rootNumber } = getRootMorphologyParts(entry)
	const elements: JSX.Element[] = []

	if (fields.includes('rootPerson')) {
		if (rootPerson === '1') {
			elements.push(
				<span key="person-1" className="text-sm font-bold" title="first person">
					1
				</span>,
			)
		}
		if (rootPerson === '2') {
			elements.push(
				<span
					key="person-2"
					className="text-sm font-bold"
					title="second person"
				>
					2
				</span>,
			)
		}
		if (rootPerson === '3') {
			elements.push(
				<span key="person-3" className="text-sm font-bold" title="third person">
					3
				</span>,
			)
		}
	}

	if (fields.includes('rootGender')) {
		if (rootGender === 'm') {
			elements.push(
				<span key="gender-m" title="male">
					<Image
						src={MaleIcon}
						alt="male"
						width={16}
						height={16}
						className="inline-block"
					/>
				</span>,
			)
		}
		if (rootGender === 'f') {
			elements.push(
				<span key="gender-f" title="female">
					<Image
						src={FemaleIcon}
						alt="female"
						width={16}
						height={16}
						className="inline-block"
					/>
				</span>,
			)
		}
		if (rootGender === 'e' || rootGender === 'c') {
			elements.push(
				<span key="gender-e" title="epicene">
					<Image
						src={MaleFemaleIcon}
						alt="epicene"
						width={16}
						height={16}
						className="inline-block"
					/>
				</span>,
			)
		}
	}

	if (fields.includes('rootNumber')) {
		if (rootNumber === 's') {
			elements.push(
				<span key="number-s" title="singular">
					👤
				</span>,
			)
		}
		if (rootNumber === 'p') {
			elements.push(
				<span key="number-p" title="plural">
					👥
				</span>,
			)
		}
	}

	if (!elements.length) return null

	return <div className={className}>{elements}</div>
}
