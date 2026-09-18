export interface EventEnvelope<TPayload = unknown> {
  event_type: string;
  version: string;
  timestamp: string;
  payload: TPayload;
}

export function createEnvelope<TPayload>(
  eventType: string,
  payload: TPayload,
  version = '1',
): EventEnvelope<TPayload> {
  return {
    event_type: eventType,
    version,
    timestamp: new Date().toISOString(),
    payload,
  };
}

export function buildSubject(emitterService: string, eventType: string): string {
  return `kelenda.${emitterService}.${eventType}`;
}
