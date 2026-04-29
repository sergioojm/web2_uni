export const notifySlack = async ({ method, path, message, stack, status }) => {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url || process.env.NODE_ENV === 'test') return;
  const text = [
    `:rotating_light: *${status} ${method} ${path}*`,
    `*Mensaje:* ${message}`,
    `*Timestamp:* ${new Date().toISOString()}`,
    stack ? '```' + stack.split('\n').slice(0, 6).join('\n') + '```' : ''
  ]
    .filter(Boolean)
    .join('\n');
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  } catch (err) {
    console.error('Slack webhook error:', err.message);
  }
};
