import * as Haptics from 'expo-haptics';

// Vibration is used sparingly: only for the outcome of something the driver did that matters.
// Taps, tabs, filters, scrolling and background loading never vibrate; new assignments already
// buzz through the notification channel.
const quiet = (feedback: Promise<void>) => { feedback.catch(() => {}); };

export const haptics = {
  /** A delivery step went through (picked up, in transit, issue reported). */
  confirm: () => quiet(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Something was finished (delivery completed, expense saved). */
  success: () => quiet(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** What the driver just tried was refused. */
  error: () => quiet(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
