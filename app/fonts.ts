// app/fonts.ts
import {
	Nunito,
	Frank_Ruhl_Libre,
	Tinos,
	Cardo,
	Noto_Rashi_Hebrew,
	Suez_One,
	EB_Garamond,
	Eczar,
	Mansalva,
	Alegreya_SC,
	MonteCarlo,
	UnifrakturMaguntia,
	Reenie_Beanie,
} from 'next/font/google'

/* ---------------- NUNITO ---------------- */
export const nunito = Nunito({
	subsets: ['latin'],
	variable: '--font-nunito',
	weight: ['200', '300', '400', '600', '700', '800', '900'],
	display: 'swap',
})

/* ---------------- FRANK RUHL LIBRE ---------------- */
export const frl = Frank_Ruhl_Libre({
	subsets: ['latin', 'hebrew'],
	variable: '--font-frl',
	weight: ['400', '500', '700', '900'],
	display: 'swap',
})

/* ---------------- TINOS ---------------- */
export const tinos = Tinos({
	subsets: ['latin'],
	variable: '--font-tinos',
	weight: ['400', '700'],
	display: 'swap',
})

/* ---------------- CARDO ---------------- */
export const cardo = Cardo({
	subsets: ['latin', 'greek'],
	variable: '--font-cardo',
	weight: ['400', '700'],
	display: 'swap',
})

/* ---------------- NOTO RASHI HEBREW ---------------- */
export const rashi = Noto_Rashi_Hebrew({
	subsets: ['hebrew'],
	variable: '--font-rashi',
	weight: ['400'],
	display: 'swap',
})

/* ---------------- SUEZ ONE ---------------- */
export const suezOne = Suez_One({
	subsets: ['latin', 'hebrew'],
	variable: '--font-suez-one',
	weight: ['400'],
	display: 'swap',
})

/* ---------------- EB GARAMOND ---------------- */
export const ebGaramond = EB_Garamond({
	subsets: ['latin'],
	variable: '--font-eb-garamond',
	weight: ['400', '500', '600', '700', '800'],
	display: 'swap',
})

/* ---------------- ECZAR ---------------- */
export const eczar = Eczar({
	subsets: ['latin'],
	variable: '--font-eczar',
	weight: ['400', '500', '600', '700', '800'],
	display: 'swap',
})

/* ---------------- MANSALVA ---------------- */
export const mansalva = Mansalva({
	subsets: ['latin'],
	variable: '--font-mansalva',
	weight: ['400'],
	display: 'swap',
})

/* ---------------- ALEGREYA SC ---------------- */
export const alegreyaSC = Alegreya_SC({
	subsets: ['latin'],
	variable: '--font-alegreya-sc',
	weight: ['400', '500', '700', '900'],
	display: 'swap',
})

/* ---------------- MONTECARLO ---------------- */
export const monteCarlo = MonteCarlo({
	subsets: ['latin'],
	variable: '--font-montecarlo',
	weight: ['400'],
	display: 'swap',
})

/* ---------------- UNIFRAKTUR MAGUNTIA ---------------- */
export const unifraktur = UnifrakturMaguntia({
	subsets: ['latin'],
	variable: '--font-unifraktur',
	weight: ['400'],
	display: 'swap',
})

/* ---------------- REENIE BEANIE ---------------- */
export const reenieBeanie = Reenie_Beanie({
	subsets: ['latin'],
	variable: '--font-reenie-beanie',
	weight: ['400'],
	display: 'swap',
})
