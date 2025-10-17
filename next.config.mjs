/** @type {import('next').NextConfig} */
const nextConfig = {
	typescript: {
		// 🚧 Temporary workaround for Next 15 route signature bug
		ignoreBuildErrors: true,
	},
	images: {
		domains: ['img.clerk.com', 'images.clerk.dev', 'supabase.co'],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**.clerk.com',
			},
			{
				protocol: 'https',
				hostname: '**.clerk.dev',
			},
		],
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
