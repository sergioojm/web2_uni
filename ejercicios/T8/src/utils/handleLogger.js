import { IncomingWebhook } from '@slack/webhook';

const webhook = process.env.SLACK_WEBHOOK
  ? new IncomingWebhook(process.env.SLACK_WEBHOOK)
  : null;

export const sendSlackNotification = async (text) => {
  if (!webhook) return;
  try {
    await webhook.send({ text });
  } catch (err) {
    console.error('Error enviando notificación a Slack:', err.message);
  }
};
