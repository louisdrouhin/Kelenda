import webpush from 'web-push';

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushSubscriptionTarget {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

export async function sendWebPush(
  subscription: PushSubscriptionTarget,
  payload: { title: string; body: string }
): Promise<void> {
  if (!ensureConfigured()) {
    throw new Error('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT non configurés');
  }

  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh_key, auth: subscription.auth_key },
    },
    JSON.stringify(payload)
  );
}
