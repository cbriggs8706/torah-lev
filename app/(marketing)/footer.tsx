import { Button } from '@/components/ui/button'
import Image from 'next/image'

export const Footer = () => {
	return (
		<footer className="hidden lg:block h-20 w-full border-t-2 border-slate-200 p-2">
			<div className="max-w-screen-lg mx-auto flex items-center justify-evenly h-full">
				<Button size="lg" variant="ghost" className="w-full">
					<Image
						src="/is.svg"
						alt="Hebrew"
						height={32}
						width={40}
						className="mr-4 rounded-md"
					/>
					Hebrew
				</Button>
				<Button size="lg" variant="ghost" className="w-full">
					<Image
						src="/mx.svg"
						alt="Spanish"
						height={32}
						width={40}
						className="mr-4 rounded-md"
					/>
					Spanish
				</Button>
				<Button size="lg" variant="ghost" className="w-full">
					<Image
						src="/flag-for-flag-greece-svgrepo-com.svg"
						alt="Greek"
						height={32}
						width={40}
						className="mr-4 rounded-md"
					/>
					Greek
				</Button>
			</div>
		</footer>
	)
}
