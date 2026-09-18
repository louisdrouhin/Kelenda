import { connect, NatsConnection, StringCodec, Subscription } from 'nats';
import { EventEnvelope, buildSubject, createEnvelope } from './envelope';

const codec = StringCodec();

let connection: NatsConnection | null = null;

export async function getNatsConnection(url: string): Promise<NatsConnection> {
  if (!connection) {
    connection = await connect({ servers: url });
  }
  return connection;
}

export async function publishEvent<TPayload>(
  natsUrl: string,
  emitterService: string,
  eventType: string,
  payload: TPayload,
): Promise<void> {
  const nc = await getNatsConnection(natsUrl);
  const envelope = createEnvelope(eventType, payload);
  const subject = buildSubject(emitterService, eventType);
  nc.publish(subject, codec.encode(JSON.stringify(envelope)));
}

export async function subscribeToEvent<TPayload>(
  natsUrl: string,
  subjectPattern: string,
  onMessage: (envelope: EventEnvelope<TPayload>, subject: string) => void | Promise<void>,
): Promise<Subscription> {
  const nc = await getNatsConnection(natsUrl);
  const sub = nc.subscribe(subjectPattern);

  (async () => {
    for await (const msg of sub) {
      const envelope = JSON.parse(codec.decode(msg.data)) as EventEnvelope<TPayload>;
      await onMessage(envelope, msg.subject);
    }
  })();

  return sub;
}
