import 'server-only'
import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js'

if (!process.env.LEMONSQUEEZY_API_KEY) {
  throw new Error('LEMONSQUEEZY_API_KEY environment variable is not set')
}

lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY,
  onError(error) {
    console.error('[LemonSqueezy]', error)
  },
})
