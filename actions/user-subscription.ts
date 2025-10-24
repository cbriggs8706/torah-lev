'use server'

import { getSession, getUserId } from '@/lib/auth'

import { stripe } from '@/lib/stripe'
import { absoluteUrl } from '@/lib/utils'
import { getUserSubscription } from '@/db/queries'

const returnUrl = absoluteUrl('/market')

export const createStripeUrl = async () => {
	const session = await getSession()
	const userId = session?.user?.id
	const userEmail = session?.user?.email

	if (!userId || !userEmail) {
		throw new Error('Unauthorized')
	}

	const userSubscription = await getUserSubscription()

	if (userSubscription && userSubscription.stripeCustomerId) {
		const stripeSession = await stripe.billingPortal.sessions.create({
			customer: userSubscription.stripeCustomerId,
			return_url: returnUrl,
		})

		return { data: stripeSession.url }
	}

	const stripeSession = await stripe.checkout.sessions.create({
		mode: 'subscription',
		payment_method_types: ['card'],
		customer_email: userEmail,
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency: 'USD',
					product_data: {
						name: 'Idiom Go',
						description: 'Unlimited Hearts',
					},
					unit_amount: 2000, // $20.00 USD
					recurring: {
						interval: 'month',
					},
				},
			},
		],
		metadata: {
			userId,
		},
		success_url: returnUrl,
		cancel_url: returnUrl,
	})

	return { data: stripeSession.url }
}
