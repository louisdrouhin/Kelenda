/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- ------------------------------------------------------------
    -- push_subscriptions
    -- ------------------------------------------------------------
    CREATE TABLE push_subscriptions (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       uuid NOT NULL,
        endpoint      text NOT NULL UNIQUE,
        p256dh_key    text NOT NULL,
        auth_key      text NOT NULL,
        created_at    timestamptz NOT NULL DEFAULT now(),
        last_used_at  timestamptz
    );

    CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

    -- ------------------------------------------------------------
    -- notification_preferences
    -- ------------------------------------------------------------
    CREATE TABLE notification_preferences (
        user_id     uuid NOT NULL,
        event_type  text NOT NULL,
        channel     text NOT NULL CHECK (channel IN ('web_push', 'email')),
        enabled     boolean NOT NULL DEFAULT true,
        PRIMARY KEY (user_id, event_type, channel)
    );

    -- ------------------------------------------------------------
    -- notification_logs
    -- ------------------------------------------------------------
    CREATE TABLE notification_logs (
        id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           uuid NOT NULL,
        event_type        text NOT NULL,
        channel           text NOT NULL,
        status            text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'sent', 'failed')),
        payload_snapshot  jsonb,
        created_at        timestamptz NOT NULL DEFAULT now(),
        sent_at           timestamptz
    );

    CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
    CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS notification_logs;
    DROP TABLE IF EXISTS notification_preferences;
    DROP TABLE IF EXISTS push_subscriptions;
  `);
};
