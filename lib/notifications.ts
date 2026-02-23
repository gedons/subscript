import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is open
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Checks if the current environment is Expo Go.
 */
const isExpoGo = Constants.appOwnership === 'expo';

export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'web') return;

    try {
        // We only request permissions. This works in Expo Go and is sufficient for 
        // local scheduled reminders (like our renewal alerts).
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return;
        }

        // SUPPRESS EXPO GO PUSH ERRORS:
        // Expo Go SDK 53+ removed remote push registration. 
        // We only attempt to get a token if we are on a real device AND not in Expo Go.
        if (isExpoGo) {
            return;
        }

        // PHYSICAL DEVICE ONLY: getDevicePushTokenAsync is lower-level and safer 
        // than getExpoPushTokenAsync in many environments.
        if (Device.isDevice) {
            try {
                // Use the native device token instead of the Expo Push Token 
                // to avoid Expo's remote push infrastructure errors.
                const deviceToken = (await Notifications.getDevicePushTokenAsync()).data;
                console.log('Native Device Token:', deviceToken);
            } catch (innerError) {
                // Ignore errors here to keep the dev experience clean
            }
        }
    } catch (quietError) {
        // Completely silent to prevent popups on the user's phone during development
    }
}

export async function scheduleSubscriptionReminder(id: string, name: string, date: Date) {
    try {
        // Schedule a reminder 1 day before the renewal date at 9:00 AM
        const reminderDate = new Date(date);
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(9, 0, 0, 0);

        // If the reminder date is in the past, don't schedule
        if (reminderDate.getTime() < Date.now()) return;

        await Notifications.scheduleNotificationAsync({
            identifier: `sub-${id}`,
            content: {
                title: "Subscription Renewal Tomorrow! 🔔",
                body: `Your ${name} subscription is renewing tomorrow. Check your budget!`,
                data: { subId: id },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: reminderDate,
            },
        });
        console.log(`Notification scheduled for ${name} at ${reminderDate.toLocaleString()}`);
    } catch (error) {
        console.log('Error scheduling notification:', error);
    }
}

export async function cancelSubscriptionReminder(id: string) {
    try {
        await Notifications.cancelScheduledNotificationAsync(`sub-${id}`);
    } catch (error) {
        console.log('Error cancelling notification:', error);
    }
}
