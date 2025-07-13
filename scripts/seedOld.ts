import 'dotenv/config'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'

import * as schema from '../db/schema'

const sql = neon(process.env.DATABASE_URL!)
// @ts-ignore
const db = drizzle(sql, { schema })

const main = async () => {
	try {
		console.log('Seeding database')

		await db.delete(schema.courses)
		await db.delete(schema.userProgress)
		await db.delete(schema.units)
		await db.delete(schema.lessons)
		await db.delete(schema.challenges)
		await db.delete(schema.challengeOptions)
		await db.delete(schema.challengeProgress)
		await db.delete(schema.userSubscription)

		await db.insert(schema.courses).values([
			{
				id: 1,
				title: 'Destinos',
				imageSrc: '/mx.svg',
			},
			{
				id: 3,
				title: 'EnglishConnect 1',
				imageSrc: '/us.svg',
			},
			{
				id: 4,
				title: 'EnglishConnect 2',
				imageSrc: '/us.svg',
			},
			{
				id: 5,
				title: 'Aleph with Beth',
				imageSrc: '/is.svg',
			},
		])

		await db.insert(schema.units).values([
			{
				id: 1,
				courseId: 1, // Destinos
				title: 'Semana 1',
				description: 'Sustantivos, Artículos y Adjetivos',
				order: 1,
			},
			{
				id: 2,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 1: Foundations',
				description:
					'First words, grammar basics, family, location, alphabet, and body vocabulary.',
				order: 1,
			},
			{
				id: 3,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 2: Descriptions & Existence',
				description:
					'Construct forms, numbers, more alphabet, nature/existence, geography, possession, and relative clauses.',
				order: 2,
			},
			{
				id: 4,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 3: Actions & Commands',
				description:
					'Common verbs (come, go, say), imperatives, possession suffixes, obedience, giving, marriage, and more prepositions.',
				order: 3,
			},
			{
				id: 5,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 4: People & Objects',
				description:
					'Higher numbers, prophets, direct objects (אֶת־), truth and lies, fruits, body parts, life & death, wisdom, and Noah’s ark.',
				order: 4,
			},
			{
				id: 6,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 5: Creation & Contrast',
				description:
					'Similarities, light/darkness, creation, movement, verb sequences, sending, food, time periods, and emotional contrasts.',
				order: 5,
			},
			{
				id: 7,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 6: Journeys & Decisions',
				description:
					'Spies, motion verbs, King Josiah, dilemmas, and crossing over—narratives of choice, leadership, and transitions.',
				order: 6,
			},
			{
				id: 8,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 7: Battles & Blessings',
				description:
					'Battles, leadership, and covenant, introducing feminine and second-person vayyiqtol forms.',
				order: 7,
			},
			{
				id: 9,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 8: Hearts & Actions',
				description:
					'Emotion, loyalty, and movement through stories like Ruth and Jordan’s crossing, while deepening grammar with participles and verb form review.',
				order: 8,
			},
			{
				id: 10,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 9: Life & Legacy',
				description:
					'Birth, knowledge, and discernment across generations, expanding vocabulary on time and family while refining participles, negation, and noun/verb distinctions.',
				order: 9,
			},
			{
				id: 11,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 10: Callings & Kings',
				description:
					'Calling, service, and leadership transitions through figures like Samuel and Solomon, focusing on yiqtol verb forms and imperative variations.',
				order: 10,
			},
			{
				id: 12,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 11: Tribes & Loliness',
				description:
					'Israel’s identity through tribal structure, inheritance, and holiness, while introducing binyanim (verb patterns), Pi’el verbs, and advanced vowel markings like meteg and silluq.',
				order: 11,
			},
			{
				id: 13,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 12: Fear, Love & Sacrifice',
				description:
					'Emotion, obedience, and drawing near to God through stories of Jacob, Abraham, and Joseph, while introducing negative commands, Hiph’il causative verbs, and veqatal verb sequences.',
				order: 12,
			},
			{
				id: 14,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 13: God Acts & People Respond',
				description:
					'Divine intervention and human choice through stories of Abraham, Rachel, and the prophets, while deepening grammar with veqatal forms, Hiph’il verbs, and conditional clauses.',
				order: 13,
			},
			{
				id: 15,
				courseId: 5, // Aleph with Beth
				title: 'AwB Unit 14: Revealing & Raising',
				description:
					'Divine revelation, resurrection, and decision-making through stories of Rebekah, Elijah, and Ezekiel, while continuing the Hiph’il causative verb series and exploring themes of vision, exile, and making known.',
				order: 14,
			},
			{
				id: 16,
				courseId: 5, // Aleph with Beth
				title: 'AwB Classroom',
				description: 'Vocabulary for the modern classroom.',
				order: 15,
			},
		])

		await db.insert(schema.lessons).values([
			{
				id: 1,
				unitId: 1, // Semana 1 (Sustantivos, Artículos y Adjetivos...)
				order: 1,
				title: 'Sustantivos Singulares',
			},
			{
				id: 2,
				unitId: 1, // Semana 1 (Sustantivos, Artículos y Adjetivos...)
				order: 2,
				title: 'Sustantivos Plurales',
			},
			{
				id: 3,
				unitId: 1, // Semana 1 (Sustantivos, Artículos y Adjetivos...)
				order: 3,
				title: 'Artículos Singulares Indefinidos',
			},
			{
				id: 4,
				unitId: 1, // Semana 1 (Sustantivos, Artículos y Adjetivos...)
				order: 4,
				title: 'Artículos Plurales Indefinidos',
			},
			{
				id: 5,
				unitId: 1, // Semana 1 (Sustantivos, Artículos y Adjetivos...)
				order: 5,
				title: 'Forma singular de adjetivos',
			},
			{
				id: 6,
				unitId: 1, // Semana 1 (Sustantivos, Artículos y Adjetivos...)
				order: 6,
				title: 'Forma plural de adjetivos',
			},
			{
				id: 7,
				unitId: 2, // AwB Lesson 1
				order: 1,
				title: 'First Words',
			},
		])

		await db.insert(schema.challenges).values([
			{ id: 1, lessonId: 1, type: 'ASSIST', order: 1, question: 'actitud' },
			{ id: 2, lessonId: 1, type: 'ASSIST', order: 2, question: 'problema' },
			{ id: 3, lessonId: 1, type: 'ASSIST', order: 3, question: 'ventana' },
			{ id: 4, lessonId: 1, type: 'ASSIST', order: 4, question: 'tomate' },
			{ id: 5, lessonId: 1, type: 'ASSIST', order: 5, question: 'niño' },
			{ id: 6, lessonId: 1, type: 'ASSIST', order: 6, question: 'luz' },
			{ id: 7, lessonId: 1, type: 'ASSIST', order: 7, question: 'hospital' },
			{ id: 8, lessonId: 1, type: 'ASSIST', order: 8, question: 'flor' },
			{ id: 9, lessonId: 1, type: 'ASSIST', order: 9, question: 'gerente' },
			{ id: 10, lessonId: 1, type: 'ASSIST', order: 10, question: 'banco' },
			{ id: 11, lessonId: 1, type: 'ASSIST', order: 11, question: 'dentista' },
			{ id: 12, lessonId: 1, type: 'ASSIST', order: 12, question: 'sistema' },
			{ id: 13, lessonId: 1, type: 'ASSIST', order: 13, question: 'piel' },
			{ id: 14, lessonId: 1, type: 'ASSIST', order: 14, question: 'hotel' },
			{ id: 15, lessonId: 1, type: 'ASSIST', order: 15, question: 'persona' },
			{ id: 16, lessonId: 1, type: 'ASSIST', order: 16, question: 'verdad' },
			{ id: 17, lessonId: 1, type: 'ASSIST', order: 17, question: 'artista' },
			{
				id: 18,
				lessonId: 1,
				type: 'ASSIST',
				order: 18,
				question: 'televisión',
			},
			{
				id: 19,
				lessonId: 1,
				type: 'ASSIST',
				order: 19,
				question: 'estudiante',
			},
			{ id: 20, lessonId: 1, type: 'ASSIST', order: 20, question: 'muchacho' },
			{ id: 21, lessonId: 1, type: 'ASSIST', order: 21, question: 'foto' },
			{ id: 22, lessonId: 1, type: 'ASSIST', order: 22, question: 'ciudad' },
			{ id: 23, lessonId: 1, type: 'ASSIST', order: 23, question: 'animal' },
			{ id: 24, lessonId: 1, type: 'ASSIST', order: 24, question: 'hermano' },
			{ id: 25, lessonId: 1, type: 'ASSIST', order: 25, question: 'comida' },
			{ id: 26, lessonId: 1, type: 'ASSIST', order: 26, question: 'mano' },
			{ id: 27, lessonId: 1, type: 'ASSIST', order: 27, question: 'gato' },
			{ id: 28, lessonId: 1, type: 'ASSIST', order: 28, question: 'hermana' },
			{ id: 29, lessonId: 1, type: 'ASSIST', order: 29, question: 'mujer' },
			{ id: 30, lessonId: 1, type: 'ASSIST', order: 30, question: 'vino' },
			{ id: 31, lessonId: 1, type: 'ASSIST', order: 31, question: 'teléfono' },
			{ id: 32, lessonId: 1, type: 'ASSIST', order: 32, question: 'muchacha' },
			{ id: 33, lessonId: 1, type: 'ASSIST', order: 33, question: 'iglesia' },
			{ id: 34, lessonId: 1, type: 'ASSIST', order: 34, question: 'mesa' },
			{ id: 35, lessonId: 1, type: 'ASSIST', order: 35, question: 'casa' },
			{ id: 36, lessonId: 1, type: 'ASSIST', order: 36, question: 'baño' },
			{ id: 37, lessonId: 1, type: 'ASSIST', order: 37, question: 'bolsa' },
			{ id: 38, lessonId: 1, type: 'ASSIST', order: 38, question: 'planta' },
			{ id: 39, lessonId: 1, type: 'ASSIST', order: 39, question: 'clase' },
			{ id: 40, lessonId: 1, type: 'ASSIST', order: 40, question: 'doctor' },
			{ id: 41, lessonId: 1, type: 'ASSIST', order: 41, question: 'perro' },
			{ id: 42, lessonId: 1, type: 'ASSIST', order: 42, question: 'hombre' },
			{ id: 43, lessonId: 1, type: 'ASSIST', order: 43, question: 'poema' },
			{ id: 44, lessonId: 1, type: 'ASSIST', order: 44, question: 'cama' },
			{ id: 45, lessonId: 1, type: 'ASSIST', order: 45, question: 'mapa' },
			{ id: 46, lessonId: 1, type: 'ASSIST', order: 46, question: 'ilusión' },
			{ id: 47, lessonId: 1, type: 'ASSIST', order: 47, question: 'programa' },
			{
				id: 48,
				lessonId: 1,
				type: 'ASSIST',
				order: 48,
				question: 'invitación',
			},
			{ id: 49, lessonId: 1, type: 'ASSIST', order: 49, question: 'lámpara' },
			{ id: 50, lessonId: 1, type: 'ASSIST', order: 50, question: 'amigo' },
			{ id: 51, lessonId: 1, type: 'ASSIST', order: 51, question: 'clima' },
			{ id: 52, lessonId: 1, type: 'ASSIST', order: 52, question: 'niña' },
			{ id: 53, lessonId: 1, type: 'ASSIST', order: 53, question: 'tren' },
			{ id: 54, lessonId: 1, type: 'ASSIST', order: 54, question: 'carro' },
			{ id: 55, lessonId: 1, type: 'ASSIST', order: 55, question: 'lección' },
			{ id: 56, lessonId: 1, type: 'ASSIST', order: 56, question: 'radio' },
			{ id: 57, lessonId: 1, type: 'ASSIST', order: 57, question: 'canción' },
			{ id: 58, lessonId: 1, type: 'ASSIST', order: 58, question: 'idioma' },
			{ id: 59, lessonId: 1, type: 'ASSIST', order: 59, question: 'amiga' },
			{ id: 60, lessonId: 1, type: 'ASSIST', order: 60, question: 'silla' },
			{ id: 61, lessonId: 1, type: 'ASSIST', order: 61, question: 'libro' },
			{ id: 62, lessonId: 1, type: 'ASSIST', order: 62, question: 'café' },
			{ id: 63, lessonId: 1, type: 'ASSIST', order: 63, question: 'drama' },
			{ id: 64, lessonId: 1, type: 'ASSIST', order: 64, question: 'suerte' },
			{ id: 65, lessonId: 1, type: 'ASSIST', order: 65, question: 'taxista' },
			{
				id: 66,
				lessonId: 1,
				type: 'ASSIST',
				order: 66,
				question: 'conversación',
			},
			{ id: 67, lessonId: 1, type: 'ASSIST', order: 67, question: 'planeta' },
			{ id: 68, lessonId: 1, type: 'ASSIST', order: 68, question: 'día' },
			{
				id: 69,
				lessonId: 1,
				type: 'ASSIST',
				order: 69,
				question: 'presidente',
			},
			{ id: 70, lessonId: 1, type: 'ASSIST', order: 70, question: 'tienda' },
			{ id: 71, lessonId: 1, type: 'ASSIST', order: 71, question: 'cantante' },
			{ id: 72, lessonId: 1, type: 'ASSIST', order: 72, question: 'pianista' },
			{ id: 73, lessonId: 1, type: 'ASSIST', order: 73, question: 'amistad' },
			{ id: 74, lessonId: 1, type: 'ASSIST', order: 74, question: 'blusa' },
			{
				id: 75,
				lessonId: 7,
				type: 'WATCH',
				order: 1,
				question: 'AwB Lesson 1 Video',
				video: 'https://youtu.be/y640-FIpxQs?si=hB3rDhgaloR4plIj',
			},
			// { id: 76, lessonId: 7, type: 'ASSIST', order: 2, question: 'eesh' },
		])

		await db.insert(schema.challengeOptions).values([
			{
				challengeId: 76,
				correct: true,
				text: 'eesh',
				imageSrc: '/eesh.jpeg',
				audioSrc: '/eesh.mp3',
			},
			{
				challengeId: 76,
				correct: false,
				text: 'eeshah',
				imageSrc: '/eeshah.jpeg',
				audioSrc: '/eeshah.mp3',
			},
			{
				challengeId: 76,
				correct: false,
				text: 'ayez',
				imageSrc: '/ayez.jpeg',
				audioSrc: '/ayez.mp3',
			},
			{
				challengeId: 76,
				correct: false,
				text: 'chamor',
				imageSrc: '/chamor.jpeg',
				audioSrc: '/chamor.mp3',
			},
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 2, correct: true, text: 'el problema' },
			{ challengeId: 2, correct: false, text: 'la problema' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 4, correct: true, text: 'el tomate' },
			{ challengeId: 4, correct: false, text: 'la tomate' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 5, correct: true, text: 'el niño' },
			{ challengeId: 5, correct: false, text: 'la niño' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 7, correct: true, text: 'el hospital' },
			{ challengeId: 7, correct: false, text: 'la hospital' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 10, correct: true, text: 'el banco' },
			{ challengeId: 10, correct: false, text: 'el/la banco' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 12, correct: true, text: 'el sistema' },
			{ challengeId: 12, correct: false, text: 'la sistema' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 14, correct: true, text: 'el hotel' },
			{ challengeId: 14, correct: false, text: 'la hotel' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 20, correct: true, text: 'el muchacho' },
			{ challengeId: 20, correct: false, text: 'la muchacho' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 23, correct: true, text: 'el animal' },
			{ challengeId: 23, correct: false, text: 'la animal' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 24, correct: true, text: 'el hermano' },
			{ challengeId: 24, correct: false, text: 'la hermano' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 27, correct: true, text: 'el gato' },
			{ challengeId: 27, correct: false, text: 'la gato' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 30, correct: true, text: 'el vino' },
			{ challengeId: 30, correct: false, text: 'la vino' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 31, correct: true, text: 'el teléfono' },
			{ challengeId: 31, correct: false, text: 'el/la teléfono' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 36, correct: true, text: 'el baño' },
			{ challengeId: 36, correct: false, text: 'el/la baño' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 40, correct: true, text: 'el doctor' },
			{ challengeId: 40, correct: false, text: 'la doctor' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 41, correct: true, text: 'el perro' },
			{ challengeId: 41, correct: false, text: 'la perro' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 42, correct: true, text: 'el hombre' },
			{ challengeId: 42, correct: false, text: 'la hombre' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 43, correct: true, text: 'el poema' },
			{ challengeId: 43, correct: false, text: 'la poema' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 45, correct: true, text: 'el mapa' },
			{ challengeId: 45, correct: false, text: 'la mapa' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 47, correct: true, text: 'el programa' },
			{ challengeId: 47, correct: false, text: 'la programa' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 50, correct: true, text: 'el amigo' },
			{ challengeId: 50, correct: false, text: 'la amigo' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 51, correct: true, text: 'el clima' },
			{ challengeId: 51, correct: false, text: 'el/la clima' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 53, correct: true, text: 'el tren' },
			{ challengeId: 53, correct: false, text: 'el/la tren' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 54, correct: true, text: 'el carro' },
			{ challengeId: 54, correct: false, text: 'la carro' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 58, correct: true, text: 'el idioma' },
			{ challengeId: 58, correct: false, text: 'la idioma' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 61, correct: true, text: 'el libro' },
			{ challengeId: 61, correct: false, text: 'la libro' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 62, correct: true, text: 'el café' },
			{ challengeId: 62, correct: false, text: 'la café' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 63, correct: true, text: 'el drama' },
			{ challengeId: 63, correct: false, text: 'la drama' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 67, correct: true, text: 'el planeta' },
			{ challengeId: 67, correct: false, text: 'la planeta' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 68, correct: true, text: 'el día' },
			{ challengeId: 68, correct: false, text: 'la día' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 9, correct: true, text: 'el/la gerente' },
			{ challengeId: 9, correct: false, text: 'el gerente' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 11, correct: false, text: 'la dentista' },
			{ challengeId: 11, correct: true, text: 'el/la dentista' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 17, correct: false, text: 'la artista' },
			{ challengeId: 17, correct: true, text: 'el/la artista' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 19, correct: false, text: 'el estudiante' },
			{ challengeId: 19, correct: true, text: 'el/la estudiante' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 65, correct: false, text: 'la taxista' },
			{ challengeId: 65, correct: true, text: 'el/la taxista' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 69, correct: false, text: 'el presidente' },
			{ challengeId: 69, correct: true, text: 'el/la presidente' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 71, correct: false, text: 'el cantante' },
			{ challengeId: 71, correct: true, text: 'el/la cantante' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 72, correct: false, text: 'la pianista' },
			{ challengeId: 72, correct: true, text: 'el/la pianista' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 1, correct: false, text: 'el actitud' },
			{ challengeId: 1, correct: true, text: 'la actitud' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 3, correct: false, text: 'el ventana' },
			{ challengeId: 3, correct: true, text: 'la ventana' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 6, correct: false, text: 'el luz' },
			{ challengeId: 6, correct: true, text: 'la luz' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 8, correct: false, text: 'el flor' },
			{ challengeId: 8, correct: true, text: 'la flor' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 13, correct: false, text: 'el piel' },
			{ challengeId: 13, correct: true, text: 'la piel' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 15, correct: false, text: 'el persona' },
			{ challengeId: 15, correct: true, text: 'la persona' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 16, correct: false, text: 'el/la verdad' },
			{ challengeId: 16, correct: true, text: 'la verdad' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 18, correct: false, text: 'el/la televisión' },
			{ challengeId: 18, correct: true, text: 'la televisión' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 21, correct: false, text: 'el/la foto' },
			{ challengeId: 21, correct: true, text: 'la foto' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 22, correct: false, text: 'el ciudad' },
			{ challengeId: 22, correct: true, text: 'la ciudad' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 25, correct: false, text: 'el comida' },
			{ challengeId: 25, correct: true, text: 'la comida' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 26, correct: false, text: 'el mano' },
			{ challengeId: 26, correct: true, text: 'la mano' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 28, correct: false, text: 'el hermana' },
			{ challengeId: 28, correct: true, text: 'la hermana' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 29, correct: false, text: 'el mujer' },
			{ challengeId: 29, correct: true, text: 'la mujer' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 32, correct: false, text: 'el muchacha' },
			{ challengeId: 32, correct: true, text: 'la muchacha' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 33, correct: false, text: 'el iglesia' },
			{ challengeId: 33, correct: true, text: 'la iglesia' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 34, correct: false, text: 'el mesa' },
			{ challengeId: 34, correct: true, text: 'la mesa' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 35, correct: false, text: 'el casa' },
			{ challengeId: 35, correct: true, text: 'la casa' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 37, correct: false, text: 'el bolsa' },
			{ challengeId: 37, correct: true, text: 'la bolsa' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 38, correct: false, text: 'el planta' },
			{ challengeId: 38, correct: true, text: 'la planta' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 39, correct: false, text: 'el clase' },
			{ challengeId: 39, correct: true, text: 'la clase' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 44, correct: false, text: 'el cama' },
			{ challengeId: 44, correct: true, text: 'la cama' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 46, correct: false, text: 'el ilusión' },
			{ challengeId: 46, correct: true, text: 'la ilusión' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 48, correct: false, text: 'el invitación' },
			{ challengeId: 48, correct: true, text: 'la invitación' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 49, correct: false, text: 'el/la lámpara' },
			{ challengeId: 49, correct: true, text: 'la lámpara' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 52, correct: false, text: 'el niña' },
			{ challengeId: 52, correct: true, text: 'la niña' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 55, correct: false, text: 'el/la lección' },
			{ challengeId: 55, correct: true, text: 'la lección' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 56, correct: false, text: 'el radio' },
			{ challengeId: 56, correct: true, text: 'la radio' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 57, correct: false, text: 'el canción' },
			{ challengeId: 57, correct: true, text: 'la canción' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 59, correct: false, text: 'el amiga' },
			{ challengeId: 59, correct: true, text: 'la amiga' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 60, correct: false, text: 'el silla' },
			{ challengeId: 60, correct: true, text: 'la silla' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 64, correct: false, text: 'el suerte' },
			{ challengeId: 64, correct: true, text: 'la suerte' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 66, correct: false, text: 'el conversación' },
			{ challengeId: 66, correct: true, text: 'la conversación' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 70, correct: false, text: 'el/la tienda' },
			{ challengeId: 70, correct: true, text: 'la tienda' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 73, correct: false, text: 'el/la amistad' },
			{ challengeId: 73, correct: true, text: 'la amistad' },
		])
		await db.insert(schema.challengeOptions).values([
			{ challengeId: 74, correct: false, text: 'el blusa' },
			{ challengeId: 74, correct: true, text: 'la blusa' },
		])
		console.log('Seeding finished')
	} catch (error) {
		console.error(error)
		throw new Error('Failed to seed the database')
	}
}

main()
