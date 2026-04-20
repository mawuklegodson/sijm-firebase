import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Fallback to the test key if environment variable is not setup on Vercel yet
const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_51RrpSVKs46DvZjOHPmV7MoRobx5yBVJ6WgTMero4cMOBvrQigz4O7ezBuKXR8r8EYi60Snv5uratFR0LqQp8LSP000EBOGu9v3';

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2025-01-27.acacia', // Latest API version
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { items, email } = req.body;

    // Map items to Stripe line_items format
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd', // Default to USD for Stripe
        product_data: {
          name: item.title,
          images: [item.cover],
        },
        unit_amount: Math.round((item.price || 0) * 100), // Stripe expects cents
      },
      quantity: 1,
    }));

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      success_url: `${req.headers.origin}/books?success=true`,
      cancel_url: `${req.headers.origin}/books?canceled=true`,
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error.message);
    return res.status(500).json({ statusCode: 500, message: error.message });
  }
}
