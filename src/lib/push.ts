import webpush from 'web-push';
import { getAdminSupabase } from './supabase';

let isVapidConfigured = false;

function ensureVapidDetails(): boolean {
  if (isVapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@miattaqwa15.sch.id';

  if (!publicKey || !privateKey) {
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isVapidConfigured = true;
    return true;
  } catch (err) {
    console.error('Failed to configure VAPID details:', err);
    return false;
  }
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string; icon?: string }
) {
  if (!ensureVapidDetails()) {
    console.warn('Push notification skipped: VAPID keys not configured in environment.');
    return { success: false, message: 'VAPID keys not configured' };
  }
  const supabase: any = getAdminSupabase();

  // Find user's push subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    return { success: false, message: 'No subscriptions found' };
  }

  const notificationPayload = JSON.stringify(payload);
  const promises = subscriptions.map(async (sub: any) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.auth,
        p256dh: sub.p256dh,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, notificationPayload);
      
      // Log success
      await supabase.from('notification_logs').insert({
        subscription_id: sub.id,
        title: payload.title,
        body: payload.body,
        status: 'SUCCESS',
      });
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      
      // Log failure
      await supabase.from('notification_logs').insert({
        subscription_id: sub.id,
        title: payload.title,
        body: payload.body,
        status: 'FAILED',
        error_message: error.message,
      });

      // If the subscription is no longer valid (e.g. 410 Gone), remove it
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  });

  await Promise.all(promises);
  return { success: true };
}

// Helper to also create an in-app notification
export async function createNotification(
  userId: string,
  role: 'admin' | 'parent',
  type: 'PAYMENT' | 'ATTENDANCE' | 'INFO',
  title: string,
  message: string,
  actionUrl?: string,
  sendPush: boolean = true
) {
  const supabase: any = getAdminSupabase();

  // Insert In-App Notification
  await supabase.from('in_app_notifications').insert({
    user_id: userId,
    role,
    type,
    title,
    message,
    action_url: actionUrl,
  });

  // Optionally send Push Notification
  if (sendPush) {
    await sendPushNotification(userId, {
      title,
      body: message,
      url: actionUrl,
    });
  }
}
