// import { SpanishNumber } from '@/components/spanish/spanish-number-quiz'

export const spanishNumbers = [
	// export const spanishNumbers: SpanishNumber[] = [
	{
		number: 0,
		audio: {
			cardinal: '/numbers/spanish/cardinal/0.mp3',
			ordinal: '/numbers/spanish/ordinal/0.mp3',
		},
		text: {
			cardinal: 'cero',
			ordinal: 'cero (ordinal rarely used)',
		},
		translit: {
			cardinal: 'seh-ro',
			ordinal: 'seh-ro',
		},
		categories: ['cardinal'],
		irregular: { gendered: false, apocopated: false },
	},
	{
		number: 1,
		audio: {
			mCardinal: '/numbers/spanish/mCardinal/1.mp3',
			fCardinal: '/numbers/spanish/fCardinal/1.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/1.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/1.mp3',
		},
		text: {
			mCardinal: 'uno',
			fCardinal: 'una',
			mOrdinal: 'primero',
			fOrdinal: 'primera',
		},
		translit: {
			mCardinal: 'oo-no',
			fCardinal: 'oo-nah',
			mOrdinal: 'pree-meh-ro',
			fOrdinal: 'pree-meh-rah',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: true }, // "un" before masc noun
	},
	{
		number: 2,
		audio: {
			cardinal: '/numbers/spanish/cardinal/2.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/2.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/2.mp3',
		},
		text: {
			cardinal: 'dos',
			mOrdinal: 'segundo',
			fOrdinal: 'segunda',
		},
		translit: {
			cardinal: 'dohs',
			mOrdinal: 'seh-goon-do',
			fOrdinal: 'seh-goon-dah',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 3,
		audio: {
			cardinal: '/numbers/spanish/cardinal/3.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/3.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/3.mp3',
		},
		text: {
			cardinal: 'tres',
			mOrdinal: 'tercero',
			fOrdinal: 'tercera',
		},
		translit: {
			cardinal: 'tres',
			mOrdinal: 'tehr-seh-ro',
			fOrdinal: 'tehr-seh-rah',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: true }, // "tercer" before masc noun
	},
	{
		number: 4,
		audio: {
			cardinal: '/numbers/spanish/cardinal/4.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/4.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/4.mp3',
		},
		text: {
			cardinal: 'cuatro',
			mOrdinal: 'cuarto',
			fOrdinal: 'cuarta',
		},
		translit: {
			cardinal: 'kwah-tro',
			mOrdinal: 'kwahr-to',
			fOrdinal: 'kwahr-tah',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 5,
		audio: {
			cardinal: '/numbers/spanish/cardinal/5.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/5.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/5.mp3',
		},
		text: {
			cardinal: 'cinco',
			mOrdinal: 'quinto',
			fOrdinal: 'quinta',
		},
		translit: {
			cardinal: 'seen-ko',
			mOrdinal: 'keen-to',
			fOrdinal: 'keen-tah',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 6,
		audio: {
			cardinal: '/numbers/spanish/cardinal/6.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/6.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/6.mp3',
		},
		text: {
			cardinal: 'seis',
			mOrdinal: 'sexto',
			fOrdinal: 'sexta',
		},
		translit: {
			cardinal: 'says',
			mOrdinal: 'seks-to',
			fOrdinal: 'seks-tah',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 7,
		audio: {
			cardinal: '/numbers/spanish/cardinal/7.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/7.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/7.mp3',
		},
		text: {
			cardinal: 'siete',
			mOrdinal: 'séptimo',
			fOrdinal: 'séptima',
		},
		translit: {
			cardinal: 'syeh-teh',
			mOrdinal: 'sep-tee-mo',
			fOrdinal: 'sep-tee-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 8,
		audio: {
			cardinal: '/numbers/spanish/cardinal/8.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/8.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/8.mp3',
		},
		text: {
			cardinal: 'ocho',
			mOrdinal: 'octavo',
			fOrdinal: 'octava',
		},
		translit: {
			cardinal: 'oh-cho',
			mOrdinal: 'ok-tah-vo',
			fOrdinal: 'ok-tah-vah',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 9,
		audio: {
			cardinal: '/numbers/spanish/cardinal/9.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/9.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/9.mp3',
		},
		text: {
			cardinal: 'nueve',
			mOrdinal: 'noveno',
			fOrdinal: 'novena',
		},
		translit: {
			cardinal: 'nweh-beh',
			mOrdinal: 'noh-veh-no',
			fOrdinal: 'noh-veh-nah',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 10,
		audio: {
			cardinal: '/numbers/spanish/cardinal/10.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/10.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/10.mp3',
		},
		text: {
			cardinal: 'diez',
			mOrdinal: 'décimo',
			fOrdinal: 'décima',
		},
		translit: {
			cardinal: 'dyehs',
			mOrdinal: 'deh-see-mo',
			fOrdinal: 'deh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 11,
		audio: {
			cardinal: '/numbers/spanish/cardinal/11.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/11.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/11.mp3',
		},
		text: {
			cardinal: 'once',
			mOrdinal: 'undécimo',
			fOrdinal: 'undécima',
		},
		translit: {
			cardinal: 'on-seh',
			mOrdinal: 'oon-deh-see-mo',
			fOrdinal: 'oon-deh-see-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 12,
		audio: {
			cardinal: '/numbers/spanish/cardinal/12.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/12.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/12.mp3',
		},
		text: {
			cardinal: 'doce',
			mOrdinal: 'duodécimo',
			fOrdinal: 'duodécima',
		},
		translit: {
			cardinal: 'doh-seh',
			mOrdinal: 'doo-oh-deh-see-mo',
			fOrdinal: 'doo-oh-deh-see-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 13,
		audio: {
			cardinal: '/numbers/spanish/cardinal/13.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/13.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/13.mp3',
		},
		text: {
			cardinal: 'trece',
			mOrdinal: 'decimotercero',
			fOrdinal: 'decimotercera',
		},
		translit: {
			cardinal: 'treh-seh',
			mOrdinal: 'deh-see-mo-tehr-seh-ro',
			fOrdinal: 'deh-see-mo-tehr-seh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 14,
		audio: {
			cardinal: '/numbers/spanish/cardinal/14.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/14.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/14.mp3',
		},
		text: {
			cardinal: 'catorce',
			mOrdinal: 'decimocuarto',
			fOrdinal: 'decimocuarta',
		},
		translit: {
			cardinal: 'kah-tohr-seh',
			mOrdinal: 'deh-see-mo-kwahr-to',
			fOrdinal: 'deh-see-mo-kwahr-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 15,
		audio: {
			cardinal: '/numbers/spanish/cardinal/15.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/15.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/15.mp3',
		},
		text: {
			cardinal: 'quince',
			mOrdinal: 'decimoquinto',
			fOrdinal: 'decimoquinta',
		},
		translit: {
			cardinal: 'keen-seh',
			mOrdinal: 'deh-see-mo-keen-to',
			fOrdinal: 'deh-see-mo-keen-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 16,
		audio: {
			cardinal: '/numbers/spanish/cardinal/16.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/16.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/16.mp3',
		},
		text: {
			cardinal: 'dieciséis',
			mOrdinal: 'decimosexto',
			fOrdinal: 'decimosexta',
		},
		translit: {
			cardinal: 'dyeh-see-says',
			mOrdinal: 'deh-see-mo-sek-sto',
			fOrdinal: 'deh-see-mo-sek-stah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 17,
		audio: {
			cardinal: '/numbers/spanish/cardinal/17.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/17.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/17.mp3',
		},
		text: {
			cardinal: 'diecisiete',
			mOrdinal: 'decimoséptimo',
			fOrdinal: 'decimoséptima',
		},
		translit: {
			cardinal: 'dyeh-see-syeh-teh',
			mOrdinal: 'deh-see-mo-sehp-tee-mo',
			fOrdinal: 'deh-see-mo-sehp-tee-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 18,
		audio: {
			cardinal: '/numbers/spanish/cardinal/18.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/18.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/18.mp3',
		},
		text: {
			cardinal: 'dieciocho',
			mOrdinal: 'decimoctavo',
			fOrdinal: 'decimoctava',
		},
		translit: {
			cardinal: 'dyeh-syo-cho',
			mOrdinal: 'deh-see-mo-ok-tah-vo',
			fOrdinal: 'deh-see-mo-ok-tah-vah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 19,
		audio: {
			cardinal: '/numbers/spanish/cardinal/19.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/19.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/19.mp3',
		},
		text: {
			cardinal: 'diecinueve',
			mOrdinal: 'decimonoveno',
			fOrdinal: 'decimonovena',
		},
		translit: {
			cardinal: 'dyeh-see-nweh-beh',
			mOrdinal: 'deh-see-mo-no-veh-no',
			fOrdinal: 'deh-see-mo-no-veh-nah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 20,
		audio: {
			cardinal: '/numbers/spanish/cardinal/20.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/20.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/20.mp3',
		},
		text: {
			cardinal: 'veinte',
			mOrdinal: 'vigésimo',
			fOrdinal: 'vigésima',
		},
		translit: {
			cardinal: 'beyn-teh',
			mOrdinal: 'bee-heh-see-mo',
			fOrdinal: 'bee-heh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 21,
		audio: {
			cardinal: '/numbers/spanish/cardinal/21.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/21.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/21.mp3',
		},
		text: {
			cardinal: 'veintiuno',
			mOrdinal: 'vigésimo primero',
			fOrdinal: 'vigésima primera',
		},
		translit: {
			cardinal: 'beyn-tee-oo-no',
			mOrdinal: 'bee-heh-see-mo pree-meh-ro',
			fOrdinal: 'bee-heh-see-ma pree-meh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: true }, // "veintiún hombres"
	},
	{
		number: 22,
		audio: {
			cardinal: '/numbers/spanish/cardinal/22.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/22.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/22.mp3',
		},
		text: {
			cardinal: 'veintidós',
			mOrdinal: 'vigésimo segundo',
			fOrdinal: 'vigésima segunda',
		},
		translit: {
			cardinal: 'beyn-tee-dohs',
			mOrdinal: 'bee-heh-see-mo seh-goon-do',
			fOrdinal: 'bee-heh-see-ma seh-goon-dah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 23,
		audio: {
			cardinal: '/numbers/spanish/cardinal/23.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/23.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/23.mp3',
		},
		text: {
			cardinal: 'veintitrés',
			mOrdinal: 'vigésimo tercero',
			fOrdinal: 'vigésima tercera',
		},
		translit: {
			cardinal: 'beyn-tee-tres',
			mOrdinal: 'bee-heh-see-mo tehr-seh-ro',
			fOrdinal: 'bee-heh-see-ma tehr-seh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 24,
		audio: {
			cardinal: '/numbers/spanish/cardinal/24.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/24.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/24.mp3',
		},
		text: {
			cardinal: 'veinticuatro',
			mOrdinal: 'vigésimo cuarto',
			fOrdinal: 'vigésima cuarta',
		},
		translit: {
			cardinal: 'beyn-tee-kwah-tro',
			mOrdinal: 'bee-heh-see-mo kwahr-to',
			fOrdinal: 'bee-heh-see-ma kwahr-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 25,
		audio: {
			cardinal: '/numbers/spanish/cardinal/25.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/25.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/25.mp3',
		},
		text: {
			cardinal: 'veinticinco',
			mOrdinal: 'vigésimo quinto',
			fOrdinal: 'vigésima quinta',
		},
		translit: {
			cardinal: 'beyn-tee-seen-ko',
			mOrdinal: 'bee-heh-see-mo keen-to',
			fOrdinal: 'bee-heh-see-ma keen-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 26,
		audio: {
			cardinal: '/numbers/spanish/cardinal/26.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/26.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/26.mp3',
		},
		text: {
			cardinal: 'veintiséis',
			mOrdinal: 'vigésimo sexto',
			fOrdinal: 'vigésima sexta',
		},
		translit: {
			cardinal: 'beyn-tee-says',
			mOrdinal: 'bee-heh-see-mo seks-to',
			fOrdinal: 'bee-heh-see-ma seks-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 27,
		audio: {
			cardinal: '/numbers/spanish/cardinal/27.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/27.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/27.mp3',
		},
		text: {
			cardinal: 'veintisiete',
			mOrdinal: 'vigésimo séptimo',
			fOrdinal: 'vigésima séptima',
		},
		translit: {
			cardinal: 'beyn-tee-syeh-teh',
			mOrdinal: 'bee-heh-see-mo sep-tee-mo',
			fOrdinal: 'bee-heh-see-ma sep-tee-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 28,
		audio: {
			cardinal: '/numbers/spanish/cardinal/28.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/28.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/28.mp3',
		},
		text: {
			cardinal: 'veintiocho',
			mOrdinal: 'vigésimo octavo',
			fOrdinal: 'vigésima octava',
		},
		translit: {
			cardinal: 'beyn-tyo-cho',
			mOrdinal: 'bee-heh-see-mo ok-tah-vo',
			fOrdinal: 'bee-heh-see-ma ok-tah-vah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 29,
		audio: {
			cardinal: '/numbers/spanish/cardinal/29.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/29.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/29.mp3',
		},
		text: {
			cardinal: 'veintinueve',
			mOrdinal: 'vigésimo noveno',
			fOrdinal: 'vigésima novena',
		},
		translit: {
			cardinal: 'beyn-tee-nweh-beh',
			mOrdinal: 'bee-heh-see-mo noh-veh-no',
			fOrdinal: 'bee-heh-see-ma noh-veh-nah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 30,
		audio: {
			cardinal: '/numbers/spanish/cardinal/30.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/30.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/30.mp3',
		},
		text: {
			cardinal: 'treinta',
			mOrdinal: 'trigésimo',
			fOrdinal: 'trigésima',
		},
		translit: {
			cardinal: 'treyn-tah',
			mOrdinal: 'tree-heh-see-mo',
			fOrdinal: 'tree-heh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 31,
		audio: {
			cardinal: '/numbers/spanish/cardinal/31.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/31.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/31.mp3',
		},
		text: {
			cardinal: 'treinta y uno',
			mOrdinal: 'trigésimo primero',
			fOrdinal: 'trigésima primera',
		},
		translit: {
			cardinal: 'treyn-tah ee oo-no',
			mOrdinal: 'tree-heh-see-mo pree-meh-ro',
			fOrdinal: 'tree-heh-see-ma pree-meh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: true },
	},
	{
		number: 32,
		audio: {
			cardinal: '/numbers/spanish/cardinal/32.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/32.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/32.mp3',
		},
		text: {
			cardinal: 'treinta y dos',
			mOrdinal: 'trigésimo segundo',
			fOrdinal: 'trigésima segunda',
		},
		translit: {
			cardinal: 'treyn-tah ee dohs',
			mOrdinal: 'tree-heh-see-mo seh-goon-do',
			fOrdinal: 'tree-heh-see-ma seh-goon-dah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 33,
		audio: {
			cardinal: '/numbers/spanish/cardinal/33.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/33.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/33.mp3',
		},
		text: {
			cardinal: 'treinta y tres',
			mOrdinal: 'trigésimo tercero',
			fOrdinal: 'trigésima tercera',
		},
		translit: {
			cardinal: 'treyn-tah ee tres',
			mOrdinal: 'tree-heh-see-mo tehr-seh-ro',
			fOrdinal: 'tree-heh-see-ma tehr-seh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 34,
		audio: {
			cardinal: '/numbers/spanish/cardinal/34.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/34.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/34.mp3',
		},
		text: {
			cardinal: 'treinta y cuatro',
			mOrdinal: 'trigésimo cuarto',
			fOrdinal: 'trigésima cuarta',
		},
		translit: {
			cardinal: 'treyn-tah ee kwah-tro',
			mOrdinal: 'tree-heh-see-mo kwahr-to',
			fOrdinal: 'tree-heh-see-ma kwahr-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 35,
		audio: {
			cardinal: '/numbers/spanish/cardinal/35.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/35.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/35.mp3',
		},
		text: {
			cardinal: 'treinta y cinco',
			mOrdinal: 'trigésimo quinto',
			fOrdinal: 'trigésima quinta',
		},
		translit: {
			cardinal: 'treyn-tah ee seen-ko',
			mOrdinal: 'tree-heh-see-mo keen-to',
			fOrdinal: 'tree-heh-see-ma keen-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 36,
		audio: {
			cardinal: '/numbers/spanish/cardinal/36.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/36.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/36.mp3',
		},
		text: {
			cardinal: 'treinta y seis',
			mOrdinal: 'trigésimo sexto',
			fOrdinal: 'trigésima sexta',
		},
		translit: {
			cardinal: 'treyn-tah ee says',
			mOrdinal: 'tree-heh-see-mo seks-to',
			fOrdinal: 'tree-heh-see-ma seks-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 37,
		audio: {
			cardinal: '/numbers/spanish/cardinal/37.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/37.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/37.mp3',
		},
		text: {
			cardinal: 'treinta y siete',
			mOrdinal: 'trigésimo séptimo',
			fOrdinal: 'trigésima séptima',
		},
		translit: {
			cardinal: 'treyn-tah ee syeh-teh',
			mOrdinal: 'tree-heh-see-mo sep-tee-mo',
			fOrdinal: 'tree-heh-see-ma sep-tee-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 38,
		audio: {
			cardinal: '/numbers/spanish/cardinal/38.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/38.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/38.mp3',
		},
		text: {
			cardinal: 'treinta y ocho',
			mOrdinal: 'trigésimo octavo',
			fOrdinal: 'trigésima octava',
		},
		translit: {
			cardinal: 'treyn-tah ee oh-cho',
			mOrdinal: 'tree-heh-see-mo ok-tah-vo',
			fOrdinal: 'tree-heh-see-ma ok-tah-vah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 39,
		audio: {
			cardinal: '/numbers/spanish/cardinal/39.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/39.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/39.mp3',
		},
		text: {
			cardinal: 'treinta y nueve',
			mOrdinal: 'trigésimo noveno',
			fOrdinal: 'trigésima novena',
		},
		translit: {
			cardinal: 'treyn-tah ee nweh-beh',
			mOrdinal: 'tree-heh-see-mo noh-veh-no',
			fOrdinal: 'tree-heh-see-ma noh-veh-nah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 40,
		audio: {
			cardinal: '/numbers/spanish/cardinal/40.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/40.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/40.mp3',
		},
		text: {
			cardinal: 'cuarenta',
			mOrdinal: 'cuadragésimo',
			fOrdinal: 'cuadragésima',
		},
		translit: {
			cardinal: 'kwah-ren-tah',
			mOrdinal: 'kwah-drah-heh-see-mo',
			fOrdinal: 'kwah-drah-heh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 41,
		audio: {
			cardinal: '/numbers/spanish/cardinal/41.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/41.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/41.mp3',
		},
		text: {
			cardinal: 'cuarenta y uno',
			mOrdinal: 'cuadragésimo primero',
			fOrdinal: 'cuadragésima primera',
		},
		translit: {
			cardinal: 'kwah-ren-tah ee oo-no',
			mOrdinal: 'kwah-drah-heh-see-mo pree-meh-ro',
			fOrdinal: 'kwah-drah-heh-see-ma pree-meh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: true },
	},
	{
		number: 42,
		audio: {
			cardinal: '/numbers/spanish/cardinal/42.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/42.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/42.mp3',
		},
		text: {
			cardinal: 'cuarenta y dos',
			mOrdinal: 'cuadragésimo segundo',
			fOrdinal: 'cuadragésima segunda',
		},
		translit: {
			cardinal: 'kwah-ren-tah ee dohs',
			mOrdinal: 'kwah-drah-heh-see-mo seh-goon-do',
			fOrdinal: 'kwah-drah-heh-see-ma seh-goon-dah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 43,
		audio: {
			cardinal: '/numbers/spanish/cardinal/43.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/43.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/43.mp3',
		},
		text: {
			cardinal: 'cuarenta y tres',
			mOrdinal: 'cuadragésimo tercero',
			fOrdinal: 'cuadragésima tercera',
		},
		translit: {
			cardinal: 'kwah-ren-tah ee tres',
			mOrdinal: 'kwah-drah-heh-see-mo tehr-seh-ro',
			fOrdinal: 'kwah-drah-heh-see-ma tehr-seh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 44,
		audio: {
			cardinal: '/numbers/spanish/cardinal/44.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/44.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/44.mp3',
		},
		text: {
			cardinal: 'cuarenta y cuatro',
			mOrdinal: 'cuadragésimo cuarto',
			fOrdinal: 'cuadragésima cuarta',
		},
		translit: {
			cardinal: 'kwah-ren-tah ee kwah-tro',
			mOrdinal: 'kwah-drah-heh-see-mo kwahr-to',
			fOrdinal: 'kwah-drah-heh-see-ma kwahr-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 45,
		audio: {
			cardinal: '/numbers/spanish/cardinal/45.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/45.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/45.mp3',
		},
		text: {
			cardinal: 'cuarenta y cinco',
			mOrdinal: 'cuadragésimo quinto',
			fOrdinal: 'cuadragésima quinta',
		},
		translit: {
			cardinal: 'kwah-ren-tah ee seen-ko',
			mOrdinal: 'kwah-drah-heh-see-mo keen-to',
			fOrdinal: 'kwah-drah-heh-see-ma keen-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 46,
		audio: {
			cardinal: '/numbers/spanish/cardinal/46.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/46.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/46.mp3',
		},
		text: {
			cardinal: 'cuarenta y seis',
			mOrdinal: 'cuadragésimo sexto',
			fOrdinal: 'cuadragésima sexta',
		},
		translit: {
			cardinal: 'kwah-ren-tah ee says',
			mOrdinal: 'kwah-drah-heh-see-mo seks-to',
			fOrdinal: 'kwah-drah-heh-see-ma seks-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 47,
		audio: {
			cardinal: '/numbers/spanish/cardinal/47.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/47.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/47.mp3',
		},
		text: {
			cardinal: 'cuarenta y siete',
			mOrdinal: 'cuadragésimo séptimo',
			fOrdinal: 'cuadragésima séptima',
		},
		translit: {
			cardinal: 'kwah-ren-tah ee syeh-teh',
			mOrdinal: 'kwah-drah-heh-see-mo sep-tee-mo',
			fOrdinal: 'kwah-drah-heh-see-ma sep-tee-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 48,
		audio: {
			cardinal: '/numbers/spanish/cardinal/48.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/48.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/48.mp3',
		},
		text: {
			cardinal: 'cuarenta y ocho',
			mOrdinal: 'cuadragésimo octavo',
			fOrdinal: 'cuadragésima octava',
		},
		translit: {
			cardinal: 'kwah-ren-tah ee oh-cho',
			mOrdinal: 'kwah-drah-heh-see-mo ok-tah-vo',
			fOrdinal: 'kwah-drah-heh-see-ma ok-tah-vah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 49,
		audio: {
			cardinal: '/numbers/spanish/cardinal/49.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/49.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/49.mp3',
		},
		text: {
			cardinal: 'cuarenta y nueve',
			mOrdinal: 'cuadragésimo noveno',
			fOrdinal: 'cuadragésima novena',
		},
		translit: {
			cardinal: 'kwah-ren-tah ee nweh-beh',
			mOrdinal: 'kwah-drah-heh-see-mo noh-veh-no',
			fOrdinal: 'kwah-drah-heh-see-ma noh-veh-nah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 50,
		audio: {
			cardinal: '/numbers/spanish/cardinal/50.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/50.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/50.mp3',
		},
		text: {
			cardinal: 'cincuenta',
			mOrdinal: 'quincuagésimo',
			fOrdinal: 'quincuagésima',
		},
		translit: {
			cardinal: 'seen-kwen-tah',
			mOrdinal: 'keen-kwah-heh-see-mo',
			fOrdinal: 'keen-kwah-heh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 51,
		audio: {
			cardinal: '/numbers/spanish/cardinal/51.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/51.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/51.mp3',
		},
		text: {
			cardinal: 'cincuenta y uno',
			mOrdinal: 'quincuagésimo primero',
			fOrdinal: 'quincuagésima primera',
		},
		translit: {
			cardinal: 'seen-kwen-tah ee oo-no',
			mOrdinal: 'keen-kwah-heh-see-mo pree-meh-ro',
			fOrdinal: 'keen-kwah-heh-see-ma pree-meh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: true },
	},
	{
		number: 52,
		audio: {
			cardinal: '/numbers/spanish/cardinal/52.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/52.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/52.mp3',
		},
		text: {
			cardinal: 'cincuenta y dos',
			mOrdinal: 'quincuagésimo segundo',
			fOrdinal: 'quincuagésima segunda',
		},
		translit: {
			cardinal: 'seen-kwen-tah ee dohs',
			mOrdinal: 'keen-kwah-heh-see-mo seh-goon-do',
			fOrdinal: 'keen-kwah-heh-see-ma seh-goon-dah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 53,
		audio: {
			cardinal: '/numbers/spanish/cardinal/53.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/53.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/53.mp3',
		},
		text: {
			cardinal: 'cincuenta y tres',
			mOrdinal: 'quincuagésimo tercero',
			fOrdinal: 'quincuagésima tercera',
		},
		translit: {
			cardinal: 'seen-kwen-tah ee tres',
			mOrdinal: 'keen-kwah-heh-see-mo tehr-seh-ro',
			fOrdinal: 'keen-kwah-heh-see-ma tehr-seh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 54,
		audio: {
			cardinal: '/numbers/spanish/cardinal/54.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/54.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/54.mp3',
		},
		text: {
			cardinal: 'cincuenta y cuatro',
			mOrdinal: 'quincuagésimo cuarto',
			fOrdinal: 'quincuagésima cuarta',
		},
		translit: {
			cardinal: 'seen-kwen-tah ee kwah-tro',
			mOrdinal: 'keen-kwah-heh-see-mo kwahr-to',
			fOrdinal: 'keen-kwah-heh-see-ma kwahr-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 55,
		audio: {
			cardinal: '/numbers/spanish/cardinal/55.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/55.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/55.mp3',
		},
		text: {
			cardinal: 'cincuenta y cinco',
			mOrdinal: 'quincuagésimo quinto',
			fOrdinal: 'quincuagésima quinta',
		},
		translit: {
			cardinal: 'seen-kwen-tah ee seen-ko',
			mOrdinal: 'keen-kwah-heh-see-mo keen-to',
			fOrdinal: 'keen-kwah-heh-see-ma keen-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 56,
		audio: {
			cardinal: '/numbers/spanish/cardinal/56.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/56.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/56.mp3',
		},
		text: {
			cardinal: 'cincuenta y seis',
			mOrdinal: 'quincuagésimo sexto',
			fOrdinal: 'quincuagésima sexta',
		},
		translit: {
			cardinal: 'seen-kwen-tah ee says',
			mOrdinal: 'keen-kwah-heh-see-mo seks-to',
			fOrdinal: 'keen-kwah-heh-see-ma seks-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 57,
		audio: {
			cardinal: '/numbers/spanish/cardinal/57.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/57.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/57.mp3',
		},
		text: {
			cardinal: 'cincuenta y siete',
			mOrdinal: 'quincuagésimo séptimo',
			fOrdinal: 'quincuagésima séptima',
		},
		translit: {
			cardinal: 'seen-kwen-tah ee syeh-teh',
			mOrdinal: 'keen-kwah-heh-see-mo sep-tee-mo',
			fOrdinal: 'keen-kwah-heh-see-ma sep-tee-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 58,
		audio: {
			cardinal: '/numbers/spanish/cardinal/58.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/58.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/58.mp3',
		},
		text: {
			cardinal: 'cincuenta y ocho',
			mOrdinal: 'quincuagésimo octavo',
			fOrdinal: 'quincuagésima octava',
		},
		translit: {
			cardinal: 'seen-kwen-tah ee oh-cho',
			mOrdinal: 'keen-kwah-heh-see-mo ok-tah-vo',
			fOrdinal: 'keen-kwah-heh-see-ma ok-tah-vah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 59,
		audio: {
			cardinal: '/numbers/spanish/cardinal/59.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/59.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/59.mp3',
		},
		text: {
			cardinal: 'cincuenta y nueve',
			mOrdinal: 'quincuagésimo noveno',
			fOrdinal: 'quincuagésima novena',
		},
		translit: {
			cardinal: 'seen-kwen-tah ee nweh-beh',
			mOrdinal: 'keen-kwah-heh-see-mo noh-veh-no',
			fOrdinal: 'keen-kwah-heh-see-ma noh-veh-nah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 60,
		audio: {
			cardinal: '/numbers/spanish/cardinal/60.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/60.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/60.mp3',
		},
		text: {
			cardinal: 'sesenta',
			mOrdinal: 'sexagésimo',
			fOrdinal: 'sexagésima',
		},
		translit: {
			cardinal: 'seh-sen-tah',
			mOrdinal: 'seh-khah-heh-see-mo',
			fOrdinal: 'seh-khah-heh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 61,
		audio: {
			cardinal: '/numbers/spanish/cardinal/61.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/61.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/61.mp3',
		},
		text: {
			cardinal: 'sesenta y uno',
			mOrdinal: 'sexagésimo primero',
			fOrdinal: 'sexagésima primera',
		},
		translit: {
			cardinal: 'seh-sen-tah ee oo-no',
			mOrdinal: 'seh-khah-heh-see-mo pree-meh-ro',
			fOrdinal: 'seh-khah-heh-see-ma pree-meh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: true },
	},
	{
		number: 62,
		audio: {
			cardinal: '/numbers/spanish/cardinal/62.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/62.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/62.mp3',
		},
		text: {
			cardinal: 'sesenta y dos',
			mOrdinal: 'sexagésimo segundo',
			fOrdinal: 'sexagésima segunda',
		},
		translit: {
			cardinal: 'seh-sen-tah ee dohs',
			mOrdinal: 'seh-khah-heh-see-mo seh-goon-do',
			fOrdinal: 'seh-khah-heh-see-ma seh-goon-dah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 63,
		audio: {
			cardinal: '/numbers/spanish/cardinal/63.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/63.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/63.mp3',
		},
		text: {
			cardinal: 'sesenta y tres',
			mOrdinal: 'sexagésimo tercero',
			fOrdinal: 'sexagésima tercera',
		},
		translit: {
			cardinal: 'seh-sen-tah ee tres',
			mOrdinal: 'seh-khah-heh-see-mo tehr-seh-ro',
			fOrdinal: 'seh-khah-heh-see-ma tehr-seh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 64,
		audio: {
			cardinal: '/numbers/spanish/cardinal/64.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/64.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/64.mp3',
		},
		text: {
			cardinal: 'sesenta y cuatro',
			mOrdinal: 'sexagésimo cuarto',
			fOrdinal: 'sexagésima cuarta',
		},
		translit: {
			cardinal: 'seh-sen-tah ee kwah-tro',
			mOrdinal: 'seh-khah-heh-see-mo kwahr-to',
			fOrdinal: 'seh-khah-heh-see-ma kwahr-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 65,
		audio: {
			cardinal: '/numbers/spanish/cardinal/65.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/65.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/65.mp3',
		},
		text: {
			cardinal: 'sesenta y cinco',
			mOrdinal: 'sexagésimo quinto',
			fOrdinal: 'sexagésima quinta',
		},
		translit: {
			cardinal: 'seh-sen-tah ee seen-ko',
			mOrdinal: 'seh-khah-heh-see-mo keen-to',
			fOrdinal: 'seh-khah-heh-see-ma keen-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 66,
		audio: {
			cardinal: '/numbers/spanish/cardinal/66.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/66.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/66.mp3',
		},
		text: {
			cardinal: 'sesenta y seis',
			mOrdinal: 'sexagésimo sexto',
			fOrdinal: 'sexagésima sexta',
		},
		translit: {
			cardinal: 'seh-sen-tah ee says',
			mOrdinal: 'seh-khah-heh-see-mo seks-to',
			fOrdinal: 'seh-khah-heh-see-ma seks-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 67,
		audio: {
			cardinal: '/numbers/spanish/cardinal/67.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/67.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/67.mp3',
		},
		text: {
			cardinal: 'sesenta y siete',
			mOrdinal: 'sexagésimo séptimo',
			fOrdinal: 'sexagésima séptima',
		},
		translit: {
			cardinal: 'seh-sen-tah ee syeh-teh',
			mOrdinal: 'seh-khah-heh-see-mo sep-tee-mo',
			fOrdinal: 'seh-khah-heh-see-ma sep-tee-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 68,
		audio: {
			cardinal: '/numbers/spanish/cardinal/68.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/68.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/68.mp3',
		},
		text: {
			cardinal: 'sesenta y ocho',
			mOrdinal: 'sexagésimo octavo',
			fOrdinal: 'sexagésima octava',
		},
		translit: {
			cardinal: 'seh-sen-tah ee oh-cho',
			mOrdinal: 'seh-khah-heh-see-mo ok-tah-vo',
			fOrdinal: 'seh-khah-heh-see-ma ok-tah-vah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 69,
		audio: {
			cardinal: '/numbers/spanish/cardinal/69.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/69.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/69.mp3',
		},
		text: {
			cardinal: 'sesenta y nueve',
			mOrdinal: 'sexagésimo noveno',
			fOrdinal: 'sexagésima novena',
		},
		translit: {
			cardinal: 'seh-sen-tah ee nweh-beh',
			mOrdinal: 'seh-khah-heh-see-mo noh-veh-no',
			fOrdinal: 'seh-khah-heh-see-ma noh-veh-nah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 70,
		audio: {
			cardinal: '/numbers/spanish/cardinal/70.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/70.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/70.mp3',
		},
		text: {
			cardinal: 'setenta',
			mOrdinal: 'septuagésimo',
			fOrdinal: 'septuagésima',
		},
		translit: {
			cardinal: 'seh-ten-tah',
			mOrdinal: 'sep-too-ah-heh-see-mo',
			fOrdinal: 'sep-too-ah-heh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 71,
		audio: {
			cardinal: '/numbers/spanish/cardinal/71.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/71.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/71.mp3',
		},
		text: {
			cardinal: 'setenta y uno',
			mOrdinal: 'septuagésimo primero',
			fOrdinal: 'septuagésima primera',
		},
		translit: {
			cardinal: 'seh-ten-tah ee oo-no',
			mOrdinal: 'sep-too-ah-heh-see-mo pree-meh-ro',
			fOrdinal: 'sep-too-ah-heh-see-ma pree-meh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: true },
	},
	{
		number: 72,
		audio: {
			cardinal: '/numbers/spanish/cardinal/72.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/72.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/72.mp3',
		},
		text: {
			cardinal: 'setenta y dos',
			mOrdinal: 'septuagésimo segundo',
			fOrdinal: 'septuagésima segunda',
		},
		translit: {
			cardinal: 'seh-ten-tah ee dohs',
			mOrdinal: 'sep-too-ah-heh-see-mo seh-goon-do',
			fOrdinal: 'sep-too-ah-heh-see-ma seh-goon-dah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 73,
		audio: {
			cardinal: '/numbers/spanish/cardinal/73.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/73.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/73.mp3',
		},
		text: {
			cardinal: 'setenta y tres',
			mOrdinal: 'septuagésimo tercero',
			fOrdinal: 'septuagésima tercera',
		},
		translit: {
			cardinal: 'seh-ten-tah ee tres',
			mOrdinal: 'sep-too-ah-heh-see-mo tehr-seh-ro',
			fOrdinal: 'sep-too-ah-heh-see-ma tehr-seh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 74,
		audio: {
			cardinal: '/numbers/spanish/cardinal/74.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/74.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/74.mp3',
		},
		text: {
			cardinal: 'setenta y cuatro',
			mOrdinal: 'septuagésimo cuarto',
			fOrdinal: 'septuagésima cuarta',
		},
		translit: {
			cardinal: 'seh-ten-tah ee kwah-tro',
			mOrdinal: 'sep-too-ah-heh-see-mo kwahr-to',
			fOrdinal: 'sep-too-ah-heh-see-ma kwahr-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 75,
		audio: {
			cardinal: '/numbers/spanish/cardinal/75.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/75.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/75.mp3',
		},
		text: {
			cardinal: 'setenta y cinco',
			mOrdinal: 'septuagésimo quinto',
			fOrdinal: 'septuagésima quinta',
		},
		translit: {
			cardinal: 'seh-ten-tah ee seen-ko',
			mOrdinal: 'sep-too-ah-heh-see-mo keen-to',
			fOrdinal: 'sep-too-ah-heh-see-ma keen-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 76,
		audio: {
			cardinal: '/numbers/spanish/cardinal/76.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/76.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/76.mp3',
		},
		text: {
			cardinal: 'setenta y seis',
			mOrdinal: 'septuagésimo sexto',
			fOrdinal: 'septuagésima sexta',
		},
		translit: {
			cardinal: 'seh-ten-tah ee says',
			mOrdinal: 'sep-too-ah-heh-see-mo seks-to',
			fOrdinal: 'sep-too-ah-heh-see-ma seks-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 77,
		audio: {
			cardinal: '/numbers/spanish/cardinal/77.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/77.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/77.mp3',
		},
		text: {
			cardinal: 'setenta y siete',
			mOrdinal: 'septuagésimo séptimo',
			fOrdinal: 'septuagésima séptima',
		},
		translit: {
			cardinal: 'seh-ten-tah ee syeh-teh',
			mOrdinal: 'sep-too-ah-heh-see-mo sep-tee-mo',
			fOrdinal: 'sep-too-ah-heh-see-ma sep-tee-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 78,
		audio: {
			cardinal: '/numbers/spanish/cardinal/78.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/78.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/78.mp3',
		},
		text: {
			cardinal: 'setenta y ocho',
			mOrdinal: 'septuagésimo octavo',
			fOrdinal: 'septuagésima octava',
		},
		translit: {
			cardinal: 'seh-ten-tah ee oh-cho',
			mOrdinal: 'sep-too-ah-heh-see-mo ok-tah-vo',
			fOrdinal: 'sep-too-ah-heh-see-ma ok-tah-vah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 79,
		audio: {
			cardinal: '/numbers/spanish/cardinal/79.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/79.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/79.mp3',
		},
		text: {
			cardinal: 'setenta y nueve',
			mOrdinal: 'septuagésimo noveno',
			fOrdinal: 'septuagésima novena',
		},
		translit: {
			cardinal: 'seh-ten-tah ee nweh-beh',
			mOrdinal: 'sep-too-ah-heh-see-mo noh-veh-no',
			fOrdinal: 'sep-too-ah-heh-see-ma noh-veh-nah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 80,
		audio: {
			cardinal: '/numbers/spanish/cardinal/80.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/80.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/80.mp3',
		},
		text: {
			cardinal: 'ochenta',
			mOrdinal: 'octogésimo',
			fOrdinal: 'octogésima',
		},
		translit: {
			cardinal: 'oh-chen-tah',
			mOrdinal: 'ok-toh-heh-see-mo',
			fOrdinal: 'ok-toh-heh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 81,
		audio: {
			cardinal: '/numbers/spanish/cardinal/81.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/81.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/81.mp3',
		},
		text: {
			cardinal: 'ochenta y uno',
			mOrdinal: 'octogésimo primero',
			fOrdinal: 'octogésima primera',
		},
		translit: {
			cardinal: 'oh-chen-tah ee oo-no',
			mOrdinal: 'ok-toh-heh-see-mo pree-meh-ro',
			fOrdinal: 'ok-toh-heh-see-ma pree-meh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: true },
	},
	{
		number: 82,
		audio: {
			cardinal: '/numbers/spanish/cardinal/82.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/82.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/82.mp3',
		},
		text: {
			cardinal: 'ochenta y dos',
			mOrdinal: 'octogésimo segundo',
			fOrdinal: 'octogésima segunda',
		},
		translit: {
			cardinal: 'oh-chen-tah ee dohs',
			mOrdinal: 'ok-toh-heh-see-mo seh-goon-do',
			fOrdinal: 'ok-toh-heh-see-ma seh-goon-dah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 83,
		audio: {
			cardinal: '/numbers/spanish/cardinal/83.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/83.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/83.mp3',
		},
		text: {
			cardinal: 'ochenta y tres',
			mOrdinal: 'octogésimo tercero',
			fOrdinal: 'octogésima tercera',
		},
		translit: {
			cardinal: 'oh-chen-tah ee tres',
			mOrdinal: 'ok-toh-heh-see-mo tehr-seh-ro',
			fOrdinal: 'ok-toh-heh-see-ma tehr-seh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 84,
		audio: {
			cardinal: '/numbers/spanish/cardinal/84.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/84.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/84.mp3',
		},
		text: {
			cardinal: 'ochenta y cuatro',
			mOrdinal: 'octogésimo cuarto',
			fOrdinal: 'octogésima cuarta',
		},
		translit: {
			cardinal: 'oh-chen-tah ee kwah-tro',
			mOrdinal: 'ok-toh-heh-see-mo kwahr-to',
			fOrdinal: 'ok-toh-heh-see-ma kwahr-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 85,
		audio: {
			cardinal: '/numbers/spanish/cardinal/85.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/85.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/85.mp3',
		},
		text: {
			cardinal: 'ochenta y cinco',
			mOrdinal: 'octogésimo quinto',
			fOrdinal: 'octogésima quinta',
		},
		translit: {
			cardinal: 'oh-chen-tah ee seen-ko',
			mOrdinal: 'ok-toh-heh-see-mo keen-to',
			fOrdinal: 'ok-toh-heh-see-ma keen-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 86,
		audio: {
			cardinal: '/numbers/spanish/cardinal/86.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/86.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/86.mp3',
		},
		text: {
			cardinal: 'ochenta y seis',
			mOrdinal: 'octogésimo sexto',
			fOrdinal: 'octogésima sexta',
		},
		translit: {
			cardinal: 'oh-chen-tah ee says',
			mOrdinal: 'ok-toh-heh-see-mo seks-to',
			fOrdinal: 'ok-toh-heh-see-ma seks-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 87,
		audio: {
			cardinal: '/numbers/spanish/cardinal/87.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/87.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/87.mp3',
		},
		text: {
			cardinal: 'ochenta y siete',
			mOrdinal: 'octogésimo séptimo',
			fOrdinal: 'octogésima séptima',
		},
		translit: {
			cardinal: 'oh-chen-tah ee syeh-teh',
			mOrdinal: 'ok-toh-heh-see-mo sep-tee-mo',
			fOrdinal: 'ok-toh-heh-see-ma sep-tee-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 88,
		audio: {
			cardinal: '/numbers/spanish/cardinal/88.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/88.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/88.mp3',
		},
		text: {
			cardinal: 'ochenta y ocho',
			mOrdinal: 'octogésimo octavo',
			fOrdinal: 'octogésima octava',
		},
		translit: {
			cardinal: 'oh-chen-tah ee oh-cho',
			mOrdinal: 'ok-toh-heh-see-mo ok-tah-vo',
			fOrdinal: 'ok-toh-heh-see-ma ok-tah-vah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 89,
		audio: {
			cardinal: '/numbers/spanish/cardinal/89.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/89.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/89.mp3',
		},
		text: {
			cardinal: 'ochenta y nueve',
			mOrdinal: 'octogésimo noveno',
			fOrdinal: 'octogésima novena',
		},
		translit: {
			cardinal: 'oh-chen-tah ee nweh-beh',
			mOrdinal: 'ok-toh-heh-see-mo noh-veh-no',
			fOrdinal: 'ok-toh-heh-see-ma noh-veh-nah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 90,
		audio: {
			cardinal: '/numbers/spanish/cardinal/90.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/90.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/90.mp3',
		},
		text: {
			cardinal: 'noventa',
			mOrdinal: 'nonagésimo',
			fOrdinal: 'nonagésima',
		},
		translit: {
			cardinal: 'noh-ben-tah',
			mOrdinal: 'noh-nah-heh-see-mo',
			fOrdinal: 'noh-nah-heh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 91,
		audio: {
			cardinal: '/numbers/spanish/cardinal/91.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/91.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/91.mp3',
		},
		text: {
			cardinal: 'noventa y uno',
			mOrdinal: 'nonagésimo primero',
			fOrdinal: 'nonagésima primera',
		},
		translit: {
			cardinal: 'noh-ben-tah ee oo-no',
			mOrdinal: 'noh-nah-heh-see-mo pree-meh-ro',
			fOrdinal: 'noh-nah-heh-see-ma pree-meh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: true },
	},
	{
		number: 92,
		audio: {
			cardinal: '/numbers/spanish/cardinal/92.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/92.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/92.mp3',
		},
		text: {
			cardinal: 'noventa y dos',
			mOrdinal: 'nonagésimo segundo',
			fOrdinal: 'nonagésima segunda',
		},
		translit: {
			cardinal: 'noh-ben-tah ee dohs',
			mOrdinal: 'noh-nah-heh-see-mo seh-goon-do',
			fOrdinal: 'noh-nah-heh-see-ma seh-goon-dah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 93,
		audio: {
			cardinal: '/numbers/spanish/cardinal/93.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/93.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/93.mp3',
		},
		text: {
			cardinal: 'noventa y tres',
			mOrdinal: 'nonagésimo tercero',
			fOrdinal: 'nonagésima tercera',
		},
		translit: {
			cardinal: 'noh-ben-tah ee tres',
			mOrdinal: 'noh-nah-heh-see-mo tehr-seh-ro',
			fOrdinal: 'noh-nah-heh-see-ma tehr-seh-rah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 94,
		audio: {
			cardinal: '/numbers/spanish/cardinal/94.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/94.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/94.mp3',
		},
		text: {
			cardinal: 'noventa y cuatro',
			mOrdinal: 'nonagésimo cuarto',
			fOrdinal: 'nonagésima cuarta',
		},
		translit: {
			cardinal: 'noh-ben-tah ee kwah-tro',
			mOrdinal: 'noh-nah-heh-see-mo kwahr-to',
			fOrdinal: 'noh-nah-heh-see-ma kwahr-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 95,
		audio: {
			cardinal: '/numbers/spanish/cardinal/95.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/95.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/95.mp3',
		},
		text: {
			cardinal: 'noventa y cinco',
			mOrdinal: 'nonagésimo quinto',
			fOrdinal: 'nonagésima quinta',
		},
		translit: {
			cardinal: 'noh-ben-tah ee seen-ko',
			mOrdinal: 'noh-nah-heh-see-mo keen-to',
			fOrdinal: 'noh-nah-heh-see-ma keen-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 96,
		audio: {
			cardinal: '/numbers/spanish/cardinal/96.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/96.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/96.mp3',
		},
		text: {
			cardinal: 'noventa y seis',
			mOrdinal: 'nonagésimo sexto',
			fOrdinal: 'nonagésima sexta',
		},
		translit: {
			cardinal: 'noh-ben-tah ee says',
			mOrdinal: 'noh-nah-heh-see-mo seks-to',
			fOrdinal: 'noh-nah-heh-see-ma seks-tah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 97,
		audio: {
			cardinal: '/numbers/spanish/cardinal/97.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/97.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/97.mp3',
		},
		text: {
			cardinal: 'noventa y siete',
			mOrdinal: 'nonagésimo séptimo',
			fOrdinal: 'nonagésima séptima',
		},
		translit: {
			cardinal: 'noh-ben-tah ee syeh-teh',
			mOrdinal: 'noh-nah-heh-see-mo sep-tee-mo',
			fOrdinal: 'noh-nah-heh-see-ma sep-tee-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 98,
		audio: {
			cardinal: '/numbers/spanish/cardinal/98.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/98.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/98.mp3',
		},
		text: {
			cardinal: 'noventa y ocho',
			mOrdinal: 'nonagésimo octavo',
			fOrdinal: 'nonagésima octava',
		},
		translit: {
			cardinal: 'noh-ben-tah ee oh-cho',
			mOrdinal: 'noh-nah-heh-see-mo ok-tah-vo',
			fOrdinal: 'noh-nah-heh-see-ma ok-tah-vah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 99,
		audio: {
			cardinal: '/numbers/spanish/cardinal/99.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/99.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/99.mp3',
		},
		text: {
			cardinal: 'noventa y nueve',
			mOrdinal: 'nonagésimo noveno',
			fOrdinal: 'nonagésima novena',
		},
		translit: {
			cardinal: 'noh-ben-tah ee nweh-beh',
			mOrdinal: 'noh-nah-heh-see-mo noh-veh-no',
			fOrdinal: 'noh-nah-heh-see-ma noh-veh-nah',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 100,
		audio: {
			cardinal: '/numbers/spanish/cardinal/100.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/100.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/100.mp3',
		},
		text: {
			cardinal: 'cien',
			mOrdinal: 'centésimo',
			fOrdinal: 'centésima',
		},
		translit: {
			cardinal: 'syen',
			mOrdinal: 'sen-teh-see-mo',
			fOrdinal: 'sen-teh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 200,
		audio: {
			cardinal: '/numbers/spanish/cardinal/200.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/200.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/200.mp3',
		},
		text: {
			cardinal: 'doscientos',
			mOrdinal: 'ducentésimo',
			fOrdinal: 'ducentésima',
		},
		translit: {
			cardinal: 'dohs-syen-tos',
			mOrdinal: 'doo-sen-teh-see-mo',
			fOrdinal: 'doo-sen-teh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 300,
		audio: {
			cardinal: '/numbers/spanish/cardinal/300.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/300.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/300.mp3',
		},
		text: {
			cardinal: 'trescientos',
			mOrdinal: 'tricentésimo',
			fOrdinal: 'tricentésima',
		},
		translit: {
			cardinal: 'tres-syen-tos',
			mOrdinal: 'tree-sen-teh-see-mo',
			fOrdinal: 'tree-sen-teh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 400,
		audio: {
			cardinal: '/numbers/spanish/cardinal/400.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/400.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/400.mp3',
		},
		text: {
			cardinal: 'cuatrocientos',
			mOrdinal: 'cuadringentésimo',
			fOrdinal: 'cuadringentésima',
		},
		translit: {
			cardinal: 'kwah-troh-syen-tos',
			mOrdinal: 'kwah-dreen-hen-teh-see-mo',
			fOrdinal: 'kwah-dreen-hen-teh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 500,
		audio: {
			cardinal: '/numbers/spanish/cardinal/500.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/500.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/500.mp3',
		},
		text: {
			cardinal: 'quinientos',
			mOrdinal: 'quingentésimo',
			fOrdinal: 'quingentésima',
		},
		translit: {
			cardinal: 'kee-nyehn-tos',
			mOrdinal: 'keen-hen-teh-see-mo',
			fOrdinal: 'keen-hen-teh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: true },
	},
	{
		number: 600,
		audio: {
			cardinal: '/numbers/spanish/cardinal/600.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/600.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/600.mp3',
		},
		text: {
			cardinal: 'seiscientos',
			mOrdinal: 'sexcentésimo',
			fOrdinal: 'sexcentésima',
		},
		translit: {
			cardinal: 'says-syen-tos',
			mOrdinal: 'seks-sen-teh-see-mo',
			fOrdinal: 'seks-sen-teh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 700,
		audio: {
			cardinal: '/numbers/spanish/cardinal/700.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/700.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/700.mp3',
		},
		text: {
			cardinal: 'setecientos',
			mOrdinal: 'septingentésimo',
			fOrdinal: 'septingentésima',
		},
		translit: {
			cardinal: 'seh-teh-syen-tos',
			mOrdinal: 'sep-teen-hen-teh-see-mo',
			fOrdinal: 'sep-teen-hen-teh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 800,
		audio: {
			cardinal: '/numbers/spanish/cardinal/800.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/800.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/800.mp3',
		},
		text: {
			cardinal: 'ochocientos',
			mOrdinal: 'octingentésimo',
			fOrdinal: 'octingentésima',
		},
		translit: {
			cardinal: 'oh-cho-syen-tos',
			mOrdinal: 'ok-teen-hen-teh-see-mo',
			fOrdinal: 'ok-teen-hen-teh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 900,
		audio: {
			cardinal: '/numbers/spanish/cardinal/900.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/900.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/900.mp3',
		},
		text: {
			cardinal: 'novecientos',
			mOrdinal: 'noningentésimo',
			fOrdinal: 'noningentésima',
		},
		translit: {
			cardinal: 'noh-beh-syen-tos',
			mOrdinal: 'noh-neen-hen-teh-see-mo',
			fOrdinal: 'noh-neen-hen-teh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 1000,
		audio: {
			cardinal: '/numbers/spanish/cardinal/1000.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/1000.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/1000.mp3',
		},
		text: {
			cardinal: 'mil',
			mOrdinal: 'milésimo',
			fOrdinal: 'milésima',
		},
		translit: {
			cardinal: 'meel',
			mOrdinal: 'mee-leh-see-mo',
			fOrdinal: 'mee-leh-see-ma',
		},
		categories: ['cardinal', 'ordinal'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 2000,
		audio: {
			cardinal: '/numbers/spanish/cardinal/2000.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/2000.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/2000.mp3',
		},
		text: {
			cardinal: 'dos mil',
			mOrdinal: 'dosmilésimo',
			fOrdinal: 'dosmilésima',
		},
		translit: {
			cardinal: 'dohs meel',
			mOrdinal: 'dohs-mee-leh-see-mo',
			fOrdinal: 'dohs-mee-leh-see-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 3000,
		audio: {
			cardinal: '/numbers/spanish/cardinal/3000.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/3000.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/3000.mp3',
		},
		text: {
			cardinal: 'tres mil',
			mOrdinal: 'tresmilésimo',
			fOrdinal: 'tresmilésima',
		},
		translit: {
			cardinal: 'tres meel',
			mOrdinal: 'tres-mee-leh-see-mo',
			fOrdinal: 'tres-mee-leh-see-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 4000,
		audio: {
			cardinal: '/numbers/spanish/cardinal/4000.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/4000.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/4000.mp3',
		},
		text: {
			cardinal: 'cuatro mil',
			mOrdinal: 'cuatromilésimo',
			fOrdinal: 'cuatromilésima',
		},
		translit: {
			cardinal: 'kwah-troh meel',
			mOrdinal: 'kwah-troh-mee-leh-see-mo',
			fOrdinal: 'kwah-troh-mee-leh-see-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 5000,
		audio: {
			cardinal: '/numbers/spanish/cardinal/5000.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/5000.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/5000.mp3',
		},
		text: {
			cardinal: 'cinco mil',
			mOrdinal: 'cincomilésimo',
			fOrdinal: 'cincomilésima',
		},
		translit: {
			cardinal: 'seen-ko meel',
			mOrdinal: 'seen-ko-mee-leh-see-mo',
			fOrdinal: 'seen-ko-mee-leh-see-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 6000,
		audio: {
			cardinal: '/numbers/spanish/cardinal/6000.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/6000.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/6000.mp3',
		},
		text: {
			cardinal: 'seis mil',
			mOrdinal: 'seismilésimo',
			fOrdinal: 'seismilésima',
		},
		translit: {
			cardinal: 'says meel',
			mOrdinal: 'says-mee-leh-see-mo',
			fOrdinal: 'says-mee-leh-see-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 7000,
		audio: {
			cardinal: '/numbers/spanish/cardinal/7000.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/7000.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/7000.mp3',
		},
		text: {
			cardinal: 'siete mil',
			mOrdinal: 'sietemilésimo',
			fOrdinal: 'sietemilésima',
		},
		translit: {
			cardinal: 'syeh-teh meel',
			mOrdinal: 'syeh-teh-mee-leh-see-mo',
			fOrdinal: 'syeh-teh-mee-leh-see-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 8000,
		audio: {
			cardinal: '/numbers/spanish/cardinal/8000.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/8000.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/8000.mp3',
		},
		text: {
			cardinal: 'ocho mil',
			mOrdinal: 'ochomilésimo',
			fOrdinal: 'ochomilésima',
		},
		translit: {
			cardinal: 'oh-cho meel',
			mOrdinal: 'oh-cho-mee-leh-see-mo',
			fOrdinal: 'oh-cho-mee-leh-see-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 9000,
		audio: {
			cardinal: '/numbers/spanish/cardinal/9000.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/9000.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/9000.mp3',
		},
		text: {
			cardinal: 'nueve mil',
			mOrdinal: 'nuevemilésimo',
			fOrdinal: 'nuevemilésima',
		},
		translit: {
			cardinal: 'nweh-beh meel',
			mOrdinal: 'nweh-beh-mee-leh-see-mo',
			fOrdinal: 'nweh-beh-mee-leh-see-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
	{
		number: 10000,
		audio: {
			cardinal: '/numbers/spanish/cardinal/10000.mp3',
			mOrdinal: '/numbers/spanish/mOrdinal/10000.mp3',
			fOrdinal: '/numbers/spanish/fOrdinal/10000.mp3',
		},
		text: {
			cardinal: 'diez mil',
			mOrdinal: 'diezmilésimo',
			fOrdinal: 'diezmilésima',
		},
		translit: {
			cardinal: 'dyehs meel',
			mOrdinal: 'dyehs-mee-leh-see-mo',
			fOrdinal: 'dyehs-mee-leh-see-ma',
		},
		categories: ['cardinal', 'ordinal', 'compound'],
		irregular: { gendered: true, apocopated: false },
	},
]
