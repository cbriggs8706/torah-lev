export const englishLetters = [
	{
		char: 'a',
		nameAudio: '/alphabet/eng/a.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/æ/',
					type: 'short',
					grapheme: 'ă',
					nameAudio: '/alphabet/short-a.mp3',
					audio: '/phonemes/short-a.mp3',
					examples: ['cat', 'map', 'glass'],
				},
				{
					ipa: '/eɪ/',
					type: 'long',
					grapheme: 'ā',
					nameAudio: '/alphabet/long-a.mp3',
					audio: '/phonemes/long-a.mp3',
					examples: ['name', 'rain', 'paper'],
				},
			],

			complex: [
				{
					ipa: '/æ/',
					audio: '/phonemes/short-a.mp3',
					examples: ['cat', 'map', 'glass'],
				},
				{
					ipa: '/ɑ/',
					audio: '/phonemes/ah.mp3',
					examples: ['father', 'pasta', 'spa'],
				},
				{
					ipa: '/eɪ/',
					audio: '/phonemes/long-a.mp3',
					examples: ['name', 'rain', 'paper'],
				},
				{
					ipa: '/ɔ/',
					audio: '/phonemes/aw.mp3',
					examples: ['talk', 'walk', 'water'],
				},
				{
					ipa: '/ə/',
					audio: '/phonemes/schwa.mp3',
					examples: ['about', 'sofa', 'comma'],
				},
				{
					ipa: '/ɛ/',
					audio: '/phonemes/short-e.mp3',
					examples: ['any', 'many', 'said'],
				},
			],
		},
	},
	{
		char: 'b',
		nameAudio: '/alphabet/eng/b.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/b/',
					audio: '/phonemes/b.mp3',
					nameAudio: '/alphabet/eng/b.mp3',
					grapheme: 'b',
					examples: ['bat', 'big', 'blue'],
				},
			],
			complex: [
				{
					ipa: '/b/',
					audio: '/phonemes/b.mp3',
					examples: ['bat', 'big', 'blue'],
				},
				{
					ipa: '∅',
					audio: '',
					examples: ['lamb', 'dumb', 'thumb'],
				},
			],
		},
	},
	{
		char: 'c',
		nameAudio: '/alphabet/eng/c.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/k/',
					audio: '/phonemes/k.mp3',
					nameAudio: '/alphabet/eng/c.mp3',
					grapheme: 'c',
					examples: ['cat', 'cold', 'class'],
				},
			],
			complex: [
				{
					ipa: '/k/',
					audio: '/phonemes/k.mp3',
					examples: ['cat', 'cold', 'class'],
				},
				{
					ipa: '/s/',
					audio: '/phonemes/s.mp3',
					examples: ['city', 'cent', 'face'],
				},
				{
					ipa: '/tʃ/',
					audio: '/phonemes/ch.mp3',
					examples: ['cello', 'celloist', 'duccio'],
				},
				{
					ipa: '∅',
					audio: '',
					examples: ['indict', 'Connecticut', 'czar'],
				},
			],
		},
	},
	{
		char: 'd',
		nameAudio: '/alphabet/eng/d.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/d/',
					audio: '/phonemes/d.mp3',
					nameAudio: '/alphabet/eng/d.mp3',
					grapheme: 'd',
					examples: ['dog', 'door', 'day'],
				},
			],
			complex: [
				{
					ipa: '/d/',
					audio: '/phonemes/d.mp3',
					examples: ['dog', 'door', 'day'],
				},
				{
					ipa: '/dʒ/',
					audio: '/phonemes/j.mp3',
					examples: ['education', 'schedule (AmE)', 'gradual'],
				},
				{
					ipa: '[ɾ]',
					audio: '/phonemes/flap-td.mp3',
					examples: ['ladder', 'butter', 'rider'],
				}, // alveolar flap (allophone)
				{
					ipa: '∅',
					audio: '',
					examples: ['Wednesday', 'handkerchief', 'edge (often unreleased)'],
				},
			],
		},
	},
	{
		char: 'e',
		nameAudio: '/alphabet/eng/e.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/ɛ/',
					type: 'short',
					grapheme: 'ĕ',
					nameAudio: '/alphabet/short-e.mp3',
					audio: '/phonemes/short-e.mp3',
					examples: ['pen', 'get', 'seven'],
				},
				{
					ipa: '/iː/',
					type: 'long',
					grapheme: 'ē',
					nameAudio: '/alphabet/long-e.mp3',
					audio: '/phonemes/long-e.mp3',
					examples: ['me', 'these', 'theme'],
				},
			],
			complex: [
				{
					ipa: '/iː/',
					audio: '/phonemes/long-e.mp3',
					examples: ['me', 'these', 'theme'],
				},
				{
					ipa: '/ɛ/',
					audio: '/phonemes/short-e.mp3',
					examples: ['pen', 'get', 'seven'],
				},
				{
					ipa: '/ə/',
					audio: '/phonemes/schwa.mp3',
					examples: ['open', 'problem', 'garden'],
				},
				{
					ipa: '/ɪ/',
					audio: '/phonemes/short-i.mp3',
					examples: ['pretty', 'England', 'give'],
				},
				{
					ipa: '/ɝ/',
					audio: '/phonemes/stressed-rhotic-schwa.mp3',
					examples: ['her', 'term', 'fern'],
				}, // r-colored in AmE
				{
					ipa: '∅',
					audio: '',
					examples: ['make (silent e)', 'bake', 'ride'],
				},
			],
		},
	},
	{
		char: 'f',
		nameAudio: '/alphabet/eng/f.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/f/',
					audio: '/phonemes/f.mp3',
					nameAudio: '/alphabet/eng/f.mp3',
					grapheme: 'f',
					examples: ['fan', 'coffee', 'after'],
				},
			],
			complex: [
				{
					ipa: '/f/',
					audio: '/phonemes/f.mp3',
					examples: ['fan', 'coffee', 'after'],
				},
				{
					ipa: '/v/',
					audio: '/phonemes/v.mp3',
					examples: ['of', 'Stephen', 'halves'],
				}, // spelling causes /v/
			],
		},
	},
	{
		char: 'g',
		nameAudio: '/alphabet/eng/g.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/g/',
					audio: '/phonemes/g.mp3',
					nameAudio: '/alphabet/eng/g.mp3',
					grapheme: 'g',
					examples: ['go', 'get', 'game'],
				},
			],
			complex: [
				{
					ipa: '/g/',
					audio: '/phonemes/g.mp3',
					examples: ['go', 'get', 'game'],
				},
				{
					ipa: '/dʒ/',
					audio: '/phonemes/j.mp3',
					examples: ['giant', 'gem', 'logic'],
				},
				{
					ipa: '/ʒ/',
					audio: '/phonemes/ezh.mp3',
					examples: ['genre', 'mirage', 'massage'],
				},
				{
					ipa: '∅',
					audio: '',
					examples: ['gnome', 'gnash', 'foreign'],
				},
			],
		},
	},
	{
		char: 'h',
		nameAudio: '/alphabet/eng/h.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/h/',
					audio: '/phonemes/h.mp3',
					nameAudio: '/alphabet/eng/h.mp3',
					grapheme: 'h',
					// audio: '/phonemes/sound-h-1.mp3',
					examples: ['hat', 'help', 'happy'],
				},
			],
			complex: [
				{
					ipa: '/h/',
					audio: '/phonemes/h.mp3',
					// audio: '/phonemes/sound-h-1.mp3',
					examples: ['hat', 'help', 'happy'],
				},
				{
					ipa: '∅',
					audio: '',
					examples: ['honest', 'hour', 'heir'],
				},
			],
		},
	},
	{
		char: 'i',
		nameAudio: '/alphabet/eng/i.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/ɪ/',
					type: 'short',
					grapheme: 'ĭ',
					nameAudio: '/alphabet/short-i.mp3',
					audio: '/phonemes/short-i.mp3',
					examples: ['sit', 'big', 'milk'],
				},
				{
					ipa: '/aɪ/',
					type: 'long',
					grapheme: 'ī',
					nameAudio: '/alphabet/long-i.mp3',
					audio: '/phonemes/long-i.mp3',
					// audio: '/phonemes/sound-a-3.mp3',
					examples: ['time', 'find', 'ice'],
				},
			],
			complex: [
				{
					ipa: '/ɪ/',
					audio: '/phonemes/short-i.mp3',
					examples: ['sit', 'big', 'milk'],
				},
				{
					ipa: '/aɪ/',
					audio: '/phonemes/long-i.mp3',
					// audio: '/phonemes/sound-i-2.mp3',
					examples: ['time', 'find', 'ice'],
				},
				{
					ipa: '/iː/',
					audio: '/phonemes/long-e.mp3',
					examples: ['machine', 'police', 'pizza (AmE)'],
				},
				{
					ipa: '/ɝ/',
					audio: '/phonemes/stressed-rhotic-schwa.mp3',
					examples: ['bird', 'shirt', 'first'],
				}, // r-colored
				{
					ipa: '/ə/',
					audio: '/phonemes/schwa.mp3',
					examples: ['family', 'origin', 'cousin'],
				},
			],
		},
	},
	{
		char: 'j',
		nameAudio: '/alphabet/eng/j.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/dʒ/',
					audio: '/phonemes/j.mp3',
					nameAudio: '/alphabet/eng/j.mp3',
					grapheme: 'j',
					examples: ['jam', 'job', 'jungle'],
				},
			],
			complex: [
				{
					ipa: '/dʒ/',
					audio: '/phonemes/j.mp3',
					examples: ['jam', 'job', 'jungle'],
				},
			],
		},
	},
	{
		char: 'k',
		nameAudio: '/alphabet/eng/k.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/k/',
					audio: '/phonemes/k.mp3',
					nameAudio: '/alphabet/eng/k.mp3',
					grapheme: 'k',
					examples: ['kit', 'key', 'book'],
				},
			],
			complex: [
				{
					ipa: '/k/',
					audio: '/phonemes/k.mp3',
					examples: ['kit', 'key', 'book'],
				},
				{
					ipa: '∅',
					audio: '',
					examples: ['knight', 'knee', 'know'],
				},
			],
		},
	},
	{
		char: 'l',
		nameAudio: '/alphabet/eng/l.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/l/',
					audio: '/phonemes/l.mp3',
					nameAudio: '/alphabet/eng/l.mp3',
					grapheme: 'l',
					// audio: '/phonemes/sound-l-1.mp3',
					examples: ['light', 'leaf', 'look'],
				},
			],
			complex: [
				{
					ipa: '/l/',
					audio: '/phonemes/l.mp3',
					examples: ['light', 'leaf', 'look'],
				},
				{
					ipa: '[ɫ]',
					audio: '/phonemes/dark-l.mp3',
					examples: ['ball', 'full', 'milk'],
				},
				{
					ipa: '∅',
					audio: '',
					examples: ['walk', 'talk', 'calm'],
				},
			],
		},
	},
	{
		char: 'm',
		nameAudio: '/alphabet/eng/m.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/m/',
					audio: '/phonemes/m.mp3',
					nameAudio: '/alphabet/eng/m.mp3',
					grapheme: 'm',
					examples: ['man', 'make', 'ham'],
				},
			],
			complex: [
				{
					ipa: '/m/',
					audio: '/phonemes/m.mp3',
					examples: ['man', 'make', 'ham'],
				},
				{
					ipa: '[m̩]',
					audio: '/phonemes/m.mp3',
					examples: ['prism', 'rhythm', 'chasm'],
				}, // syllabic m
				{
					ipa: '∅',
					audio: '',
					examples: [
						'mnemonic',
						'damn (historical)',
						'column (silent n, but m audible)',
					],
				},
			],
		},
	},
	{
		char: 'n',
		nameAudio: '/alphabet/eng/n.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/n/',
					audio: '/phonemes/n.mp3',
					nameAudio: '/alphabet/eng/n.mp3',
					grapheme: 'n',
					// audio: '/phonemes/sound-n-1.mp3',
					examples: ['no', 'nine', 'need'],
				},
			],
			complex: [
				{
					ipa: '/n/',
					audio: '/phonemes/n.mp3',
					// audio: '/phonemes/sound-n-1.mp3',
					examples: ['no', 'nine', 'need'],
				},
				{
					ipa: '[ŋ]',
					audio: '/phonemes/eng.mp3',
					examples: ['bank', 'thank', 'uncle'],
				}, // allophone before /k,g/
				{
					ipa: '∅',
					audio: '',
					examples: ['autumn', 'column', 'hymn'],
				},
			],
		},
	},
	{
		char: 'o',
		nameAudio: '/alphabet/eng/o.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/ɑ/',
					type: 'short',
					grapheme: 'ŏ',
					nameAudio: '/alphabet/short-o.mp3',
					audio: '/phonemes/ah.mp3',
					examples: ['pot', 'lot', 'shock'],
				},
				{
					ipa: '/oʊ/',
					type: 'long',
					grapheme: 'ō',
					nameAudio: '/alphabet/long-o.mp3',
					audio: '/phonemes/long-o.mp3',
					// audio: '/phonemes/sound-a-3.mp3',
					examples: ['go', 'home', 'open'],
				},
			],
			complex: [
				{
					ipa: '/oʊ/',
					audio: '/phonemes/long-o.mp3',
					// audio: '/phonemes/sound-o-1.mp3',
					examples: ['go', 'home', 'open'],
				},
				{
					ipa: '/ɑ/',
					audio: '/phonemes/ah.mp3',
					// audio: '/phonemes/sound-o-2.mp3',
					examples: ['pot', 'lot', 'shock'],
				},
				{
					ipa: '/o/',
					audio: '/phonemes/mid-o.mp3',
					examples: ['oasis', 'obey', 'donate'],
				},
				{
					ipa: '/uː/',
					audio: '/phonemes/long-u.mp3',
					// audio: '/phonemes/sound-o-4.mp3',
					examples: ['move', 'do', 'to'],
				},
				{
					ipa: '/ʌ/',
					audio: '/phonemes/wedge.mp3',
					examples: ['son', 'love', 'wonder'],
				},
				{
					ipa: '/ə/',
					audio: '/phonemes/schwa.mp3',
					examples: ['lemon', 'button', 'harmony'],
				},
			],
		},
	},
	{
		char: 'p',
		nameAudio: '/alphabet/eng/p.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/p/',
					audio: '/phonemes/p.mp3',
					nameAudio: '/alphabet/eng/p.mp3',
					grapheme: 'p',
					// audio: '/phonemes/sound-p-1.mp3',
					examples: ['pen', 'paper', 'open'],
				},
			],
			complex: [
				{
					ipa: '/p/',
					audio: '/phonemes/p.mp3',
					// audio: '/phonemes/sound-p-1.mp3',
					examples: ['pen', 'paper', 'open'],
				},
				{
					ipa: '∅',
					audio: '',
					examples: ['cupboard', 'raspberry', 'psychology'],
				},
			],
		},
	},
	{
		char: 'q',
		nameAudio: '/alphabet/eng/q.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/kw/',
					audio: '/phonemes/kw.mp3',
					nameAudio: '/alphabet/eng/q.mp3',
					grapheme: 'q',
					examples: ['queen', 'quick', 'equal'],
				},
			],
			complex: [
				{
					ipa: '/kw/',
					audio: '/phonemes/kw.mp3',
					examples: ['queen', 'quick', 'equal'],
				},
				{
					ipa: '/k/',
					audio: '/phonemes/k.mp3',
					examples: ['Iraq', 'Qatar', 'burqa'],
				},
			],
		},
	},
	{
		char: 'r',
		nameAudio: '/alphabet/eng/r.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/ɹ/',
					audio: '/phonemes/american-r.mp3',
					nameAudio: '/alphabet/eng/r.mp3',
					grapheme: 'r',
					examples: ['red', 'ring', 'river'],
				},
			],
			complex: [
				{
					ipa: '/ɹ/',
					audio: '/phonemes/american-r.mp3',
					examples: ['red', 'ring', 'river'],
				},
				{
					ipa: '[ɚ]',
					audio: '/phonemes/unstressed-rhotic-schwa.mp3',
					examples: ['butter', 'mother', 'paper'],
				},
			],
		},
	},
	{
		char: 's',
		nameAudio: '/alphabet/eng/s.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/s/',
					audio: '/phonemes/s.mp3',
					nameAudio: '/alphabet/eng/s.mp3',
					grapheme: 's',
					examples: ['sun', 'see', 'class'],
				},
			],
			complex: [
				{
					ipa: '/s/',
					audio: '/phonemes/s.mp3',
					examples: ['sun', 'see', 'class'],
				},
				{
					ipa: '/z/',
					audio: '/phonemes/z.mp3',
					examples: ['dogs', 'rose', 'was'],
				},
				{
					ipa: '/ʃ/',
					audio: '/phonemes/esh.mp3',
					examples: ['sure', 'sugar', 'Asia (1st s)'],
				},
				{
					ipa: '/ʒ/',
					audio: '/phonemes/ezh.mp3',
					examples: ['measure', 'vision', 'usual'],
				},
				{
					ipa: '∅',
					audio: '',
					examples: ['island', 'Aisle (s silent via digraph)', 'debris'],
				},
			],
		},
	},
	{
		char: 't',
		nameAudio: '/alphabet/eng/t.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/t/',
					audio: '/phonemes/t.mp3',
					nameAudio: '/alphabet/eng/t.mp3',
					grapheme: 't',
					// audio: '/phonemes/sound-t-1.mp3',
					examples: ['top', 'ten', 'time'],
				},
			],
			complex: [
				{
					ipa: '/t/',
					audio: '/phonemes/t.mp3',
					// audio: '/phonemes/sound-t-1.mp3',
					examples: ['top', 'ten', 'time'],
				},
				{
					ipa: '[ɾ]',
					audio: '/phonemes/flap-td.mp3',
					examples: ['water', 'city', 'butter'],
				}, // flap
				{
					ipa: '/tʃ/',
					audio: '/phonemes/ch.mp3',
					examples: ['future', 'nature', 'virtue'],
				},
				{
					ipa: '/ʃ/',
					audio: '/phonemes/esh.mp3',
					// audio: '/phonemes/sound-t-4.mp3',
					examples: ['nation', 'patient', 'motion'],
				},
				{
					ipa: '∅',
					audio: '',
					examples: ['castle', 'whistle', 'fasten'],
				},
			],
		},
	},
	{
		char: 'u',
		nameAudio: '/alphabet/eng/u.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/ʊ/',
					type: 'short',
					grapheme: 'ŭ',
					nameAudio: '/alphabet/short-u.mp3',
					audio: '/phonemes/short-u.mp3',
					examples: ['put', 'push', 'pull'],
				},
				{
					ipa: '/juː/',
					type: 'long',
					grapheme: 'ū',
					nameAudio: '/alphabet/long-u.mp3',
					audio: '/phonemes/long-u.mp3',
					examples: ['use', 'uniform', 'music'],
				},
			],
			complex: [
				{
					ipa: '/ʌ/',
					audio: '/phonemes/wedge.mp3',
					examples: ['cup', 'sun', 'lunch'],
				},
				{
					ipa: '/uː/',
					audio: '/phonemes/long-u.mp3',
					examples: ['flute', 'rule', 'truth'],
				},
				{
					ipa: '/juː/',
					audio: '/phonemes/long-u-yod.mp3',
					examples: ['use', 'uniform', 'music'],
				},
				{
					ipa: '/ʊ/',
					audio: '/phonemes/short-u.mp3',
					examples: ['put', 'push', 'pull'],
				},
				{
					ipa: '/ɝ/',
					audio: '/phonemes/stressed-rhotic-schwa.mp3',
					examples: ['turn', 'burn', 'nurse'],
				},
				{
					ipa: '/ə/',
					audio: '/phonemes/schwa.mp3',
					examples: ['supply', 'autumnal', 'medium'],
				},
			],
		},
	},
	{
		char: 'v',
		nameAudio: '/alphabet/eng/v.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/v/',
					audio: '/phonemes/v.mp3',
					nameAudio: '/alphabet/eng/v.mp3',
					grapheme: 'v',
					examples: ['van', 'move', 'seven'],
				},
			],
			complex: [
				{
					ipa: '/v/',
					audio: '/phonemes/v.mp3',
					examples: ['van', 'move', 'seven'],
				},
			],
		},
	},
	{
		char: 'w',
		nameAudio: '/alphabet/eng/w.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/w/',
					audio: '/phonemes/w.mp3',
					nameAudio: '/alphabet/eng/w.mp3',
					grapheme: 'w',
					examples: ['we', 'win', 'water'],
				},
			],
			complex: [
				{
					ipa: '/w/',
					audio: '/phonemes/w.mp3',
					examples: ['we', 'win', 'water'],
				},
				{
					ipa: '∅',
					audio: '',
					examples: ['write', 'wrist', 'answer'],
				},
			],
		},
	},
	{
		char: 'x',
		nameAudio: '/alphabet/eng/x.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/ks/',
					audio: '/phonemes/ks.mp3',
					nameAudio: '/alphabet/eng/x.mp3',
					grapheme: 'x',
					examples: ['box', 'fix', 'six'],
				},
			],
			complex: [
				{
					ipa: '/ks/',
					audio: '/phonemes/ks.mp3',
					examples: ['box', 'fix', 'six'],
				},
				{
					ipa: '/gz/',
					audio: '/phonemes/gz.mp3',
					examples: ['exam', 'example', 'exhaust'],
				},
				{
					ipa: '/z/',
					audio: '/phonemes/z.mp3',
					// audio: '/phonemes/sound-x-3.mp3',
					examples: ['xylophone', 'Xenia', 'Xerox'],
				},
				{
					ipa: '/kʃ/',
					audio: '/phonemes/ksh.mp3',
					examples: ['anxious', 'luxury', 'sexual'],
				},
				{
					ipa: '∅',
					audio: '',
					examples: [
						'faux',
						'auxiliary (Fr. loans)',
						'Hors d’oeuvres (x absent)',
					],
				},
			],
		},
	},
	{
		char: 'y',
		nameAudio: '/alphabet/eng/y.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/j/',
					audio: '/phonemes/yod.mp3',
					nameAudio: '/alphabet/eng/y.mp3',
					grapheme: 'y',
					examples: ['yes', 'yellow', 'yoga'],
				},
			],
			complex: [
				{
					ipa: '/j/',
					audio: '/phonemes/yod.mp3',
					examples: ['yes', 'yellow', 'yoga'],
				},
				{
					ipa: '/aɪ/',
					audio: '/phonemes/long-i.mp3',
					// audio: '/phonemes/sound-y-2.mp3',
					examples: ['my', 'try', 'fly'],
				},
				{
					ipa: '/ɪ/',
					audio: '/phonemes/short-i.mp3',
					examples: ['myth', 'gym', 'symbol'],
				},
				{
					ipa: '/iː/',
					audio: '/phonemes/long-e.mp3',
					// audio: '/phonemes/sound-y-4.mp3',
					examples: ['happy', 'city', 'candy'],
				},
				{
					ipa: '/ɝ/',
					audio: '/phonemes/stressed-rhotic-schwa.mp3',
					examples: ['myrrh', 'syrup (AmE varies)', 'Smyrna (rhotic)'],
				},
			],
		},
	},
	{
		char: 'z',
		nameAudio: '/alphabet/eng/z.mp3',
		phonemes: {
			simple: [
				{
					ipa: '/z/',
					audio: '/phonemes/z.mp3',
					nameAudio: '/alphabet/eng/z.mp3',
					grapheme: 'z',
					// audio: '/phonemes/sound-z-1.mp3',
					examples: ['zoo', 'zero', 'lazy'],
				},
			],
			complex: [
				{
					ipa: '/z/',
					audio: '/phonemes/z.mp3',
					// audio: '/phonemes/sound-z-1.mp3',
					examples: ['zoo', 'zero', 'lazy'],
				},
				{
					ipa: '/ʒ/',
					audio: '/phonemes/ezh.mp3',
					examples: ['azure', 'seizure', 'vizier (var.)'],
				},
				{
					ipa: '/ts/',
					audio: '/phonemes/ts.mp3',
					// audio: '/phonemes/sound-z-3.mp3',
					examples: ['pizza', 'mozzarella', 'piazza'],
				}, // loan/zz
				{
					ipa: '∅',
					audio: '',
					examples: ['rendezvous', 'chez', 'faux pas (Fr.)'],
				},
			],
		},
	},
]
