/** @type {import('next').NextConfig} */
const nextConfig = {
	typescript: {
		// 🚧 Temporary workaround for Next 15 route signature bug
		ignoreBuildErrors: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'supabase.co',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com', // ✅ Google profile photos
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'avatars.githubusercontent.com', // optional (GitHub)
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'pbs.twimg.com', // optional (Twitter)
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'platform-lookaside.fbsbx.com', // optional (Facebook)
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'wsdmzszpqaxeftyebiqg.supabase.co',
				port: '',
				pathname: '/storage/v1/object/public/**',
			},
		],
		// remotePatterns: [
		// 	{
		// 		protocol: 'https',
		// 		hostname: '**.clerk.com',
		// 	},
		// 	{
		// 		protocol: 'https',
		// 		hostname: '**.clerk.dev',
		// 	},
		// ],
	},
	async headers() {
		return [
			{
				source: '/api/(.*)',
				headers: [
					{
						key: 'Access-Control-Allow-Origin',
						value: '*',
					},
					{
						key: 'Access-Control-Allow-Methods',
						value: 'GET, POST, PUT, DELETE, OPTIONS',
					},
					{
						key: 'Access-Control-Allow-Headers',
						value: 'Content-Type, Authorization',
					},
					{
						key: 'Content-Range',
						value: 'bytes : 0-9/*',
					},
				],
			},
		]
	},
}

export default nextConfig
