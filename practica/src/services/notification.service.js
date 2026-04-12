import { EventEmitter } from 'node:events';

class NotificationService extends EventEmitter {}

export const notifier = new NotificationService();

const log = (evt) => (payload) => {
  if (process.env.NODE_ENV === 'test') return;
  console.log(`[event] ${evt}`, {
    userId: payload?.user?._id?.toString?.() || payload?.userId,
    email: payload?.user?.email || payload?.email,
    at: new Date().toISOString()
  });
};

notifier.on('user:registered', log('user:registered'));
notifier.on('user:verified', log('user:verified'));
notifier.on('user:invited', log('user:invited'));
notifier.on('user:deleted', log('user:deleted'));
