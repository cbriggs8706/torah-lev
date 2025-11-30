// app/layout.tsx
import './globals.css'
import {
	nunito,
	frl,
	tinos,
	cardo,
	rashi,
	suezOne,
	ebGaramond,
	eczar,
	mansalva,
	alegreyaSC,
	monteCarlo,
	unifraktur,
	reenieBeanie,
} from './fonts'
export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html
			lang="en"
			className={[
				nunito.variable,
				frl.variable,
				tinos.variable,
				cardo.variable,
				rashi.variable,
				suezOne.variable,
				ebGaramond.variable,
				eczar.variable,
				mansalva.variable,
				alegreyaSC.variable,
				monteCarlo.variable,
				unifraktur.variable,
				reenieBeanie.variable,
			].join(' ')}
		>
			<body>{children}</body>
		</html>
	)
}
