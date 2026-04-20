import { VercelRequest, VercelResponse } from '@vercel/node';

// Fallback to test key if env isn't configured
const paystackSecret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_5881919a318f2c16d1c2a5df2d6d9e17a172f5c2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { items, email } = req.body;

    // Calculate total amount in pesewas (100 pesewas = 1 GHS)
    const totalAmount = items.reduce((acc: number, item: any) => acc + (item.price || 0), 0) * 100;

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: Math.round(totalAmount),
        currency: 'GHS',
        callback_url: `${req.headers.origin}/books?success=true`,
        metadata: {
          items: items.map((i: any) => i.id)
        }
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message);
    }

    return res.status(200).json({ authorization_url: data.data.authorization_url, reference: data.data.reference });
  } catch (error: any) {
    console.error('Paystack error:', error.message);
    return res.status(500).json({ statusCode: 500, message: error.message });
  }
}
