import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

/**
 * Paystack Webhook Handler
 * 
 * Verifies the HMAC signature from Paystack and returns 200.
 * Since this is a client-side Firebase app (no firebase-admin SDK),
 * the webhook validates the payment and returns a success response.
 * 
 * For full server-side Firestore updates, deploy a Firebase Cloud Function
 * that listens to this webhook or use Paystack's dashboard to verify transactions.
 * 
 * The client app polls/listens for order status changes via Firestore onSnapshot.
 */

const paystackSecret = process.env.PAYSTACK_SECRET_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Verify Paystack signature
  if (!paystackSecret) {
    console.error('PAYSTACK_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const hash = crypto
    .createHmac('sha512', paystackSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const event = req.body;

  try {
    if (event.event === 'charge.success') {
      const data = event.data;
      const metadata = data.metadata || {};

      // Log the verified payment for audit trail
      console.log(`[PAYSTACK] Payment verified: ${data.reference}`, {
        amount: data.amount / 100,
        currency: data.currency,
        email: data.customer?.email,
        type: metadata.type || 'unknown',
        orderId: metadata.orderId,
        category: metadata.category,
      });

      // NOTE: To update Firestore from here, you need firebase-admin.
      // Add "firebase-admin" to package.json and set these env vars on Vercel:
      //   FIREBASE_PROJECT_ID
      //   FIREBASE_CLIENT_EMAIL
      //   FIREBASE_PRIVATE_KEY
      //
      // Then uncomment the block below:
      //
      // const admin = await import('firebase-admin');
      // if (!admin.apps.length) {
      //   admin.initializeApp({
      //     credential: admin.credential.cert({
      //       projectId: process.env.FIREBASE_PROJECT_ID,
      //       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      //       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      //     }),
      //   });
      // }
      // const db = admin.firestore();
      //
      // if (metadata.type === 'order') {
      //   await db.collection('orders').doc(metadata.orderId).set({
      //     status: 'processing',
      //     paymentStatus: 'paid',
      //     updatedAt: new Date().toISOString(),
      //     reference: data.reference,
      //     amount: data.amount / 100,
      //   }, { merge: true });
      // } else if (metadata.type === 'donation') {
      //   await db.collection('donations').doc(data.reference).set({
      //     donorName: metadata.donorName || 'Anonymous',
      //     donorEmail: data.customer?.email || '',
      //     amount: data.amount / 100,
      //     category: metadata.category || 'General',
      //     paymentMethod: 'Paystack',
      //     createdAt: new Date().toISOString(),
      //     reference: data.reference,
      //     status: 'completed',
      //   }, { merge: true });
      // }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
