// app/layout.tsx
import './globals.css'
import {
	nunito,
	frank,
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
			suppressHydrationWarning
			className={[
				nunito.variable,
				frank.variable,
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
			<body className="min-h-screen antialiased">{children}</body>
		</html>
	)
}
