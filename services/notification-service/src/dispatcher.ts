import { fetchAuthUser } from './internal-clients/auth';
import { buildMessage } from './message-templates';
import { pool } from './db';
import type { NotifiableEventType } from './event-types';
import { sendEmail } from './senders/email-sender';
import { sendWebPush } from './senders/web-push-sender';

const CHANNELS = ['web_push', 'email'] as const;

// Pas de ligne dans notification_preferences pour un (user_id, event_type,
// channel) donné = l'utilisateur n'a jamais configuré ce cas — on considère
// la préférence activée par défaut (opt-out, pas opt-in), pour qu'un
// abonnement fonctionne dès l'inscription sans réglage préalable requis.
async function isChannelEnabled(userId: string, eventType: string, channel: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT enabled FROM notification_preferences WHERE user_id = $1 AND event_type = $2 AND channel = $3',
    [userId, eventType, channel]
  );
  if (result.rows.length === 0) return true;
  return result.rows[0].enabled;
}

async function logNotification(
  userId: string,
  eventType: string,
  channel: string,
  status: 'sent' | 'failed',
  payload: Record<string, unknown>
): Promise<void> {
  await pool.query(
    `INSERT INTO notification_logs (user_id, event_type, channel, status, payload_snapshot, sent_at)
     VALUES ($1, $2, $3, $4, $5, CASE WHEN $4 = 'sent' THEN now() ELSE NULL END)`,
    [userId, eventType, channel, status, JSON.stringify(payload)]
  );
}

async function dispatchWebPush(
  userId: string,
  eventType: NotifiableEventType,
  message: { title: string; body: string },
  payload: Record<string, unknown>
): Promise<void> {
  const subscriptions = await pool.query(
    'SELECT id, endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = $1',
    [userId]
  );

  if (subscriptions.rows.length === 0) return;

  for (const sub of subscriptions.rows) {
    try {
      await sendWebPush(sub, message);
      await pool.query('UPDATE push_subscriptions SET last_used_at = now() WHERE id = $1', [sub.id]);
      await logNotification(userId, eventType, 'web_push', 'sent', payload);
    } catch (err) {
      console.error(`Échec web push pour user ${userId}:`, err);
      await logNotification(userId, eventType, 'web_push', 'failed', payload);
    }
  }
}

async function dispatchEmail(
  userId: string,
  eventType: NotifiableEventType,
  message: { title: string; body: string },
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const user = await fetchAuthUser(userId);
    await sendEmail(user.email, message.title, message.body);
    await logNotification(userId, eventType, 'email', 'sent', payload);
  } catch (err) {
    console.error(`Échec email pour user ${userId}:`, err);
    await logNotification(userId, eventType, 'email', 'failed', payload);
  }
}

export async function dispatchNotification(
  eventType: NotifiableEventType,
  payload: Record<string, unknown>
): Promise<void> {
  const userId = payload.user_id as string | undefined;
  if (!userId) {
    console.error(`Événement ${eventType} sans user_id dans le payload, ignoré`);
    return;
  }

  const message = buildMessage(eventType, payload);

  for (const channel of CHANNELS) {
    const enabled = await isChannelEnabled(userId, eventType, channel);
    if (!enabled) continue;

    if (channel === 'web_push') {
      await dispatchWebPush(userId, eventType, message, payload);
    } else {
      await dispatchEmail(userId, eventType, message, payload);
    }
  }
}
