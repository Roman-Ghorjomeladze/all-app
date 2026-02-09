import * as Notifications from "expo-notifications";
import { BirthdayEvent, getAllEvents, updateNotificationIds } from "../database";

// Configure notification behavior
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

export async function requestNotificationPermissions(): Promise<boolean> {
	const { status: existingStatus } = await Notifications.getPermissionsAsync();
	let finalStatus = existingStatus;

	if (existingStatus !== "granted") {
		const { status } = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}

	return finalStatus === "granted";
}

function getEventTypeEmoji(type: string): string {
	switch (type) {
		case "birthday":
			return "\u{1F382}";
		case "anniversary":
			return "\u{1F48D}";
		case "reminder":
			return "\u{1F514}";
		default:
			return "\u{1F4CC}";
	}
}

function getNextOccurrence(month: number, day: number): Date {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const thisYear = new Date(now.getFullYear(), month - 1, day);
	thisYear.setHours(9, 0, 0, 0);
	if (thisYear > now) return thisYear;
	return new Date(now.getFullYear() + 1, month - 1, day, 9, 0, 0, 0);
}

function getAgeText(event: BirthdayEvent, date: Date): string {
	if (event.event_year == null || event.event_type !== "birthday") return "";
	const age = date.getFullYear() - event.event_year;
	return ` (turns ${age})`;
}

export async function scheduleEventNotifications(
	event: BirthdayEvent
): Promise<{ onDayId: string | null; dayBeforeId: string | null }> {
	let onDayId: string | null = null;
	let dayBeforeId: string | null = null;

	const nextDate = getNextOccurrence(event.event_month, event.event_day);
	const emoji = getEventTypeEmoji(event.event_type);
	const ageText = getAgeText(event, nextDate);

	if (event.notification_type === "on_day" || event.notification_type === "both") {
		onDayId = await Notifications.scheduleNotificationAsync({
			content: {
				title: `${emoji} ${event.name}`,
				body: `Today is ${event.name}'s ${event.event_type}${ageText}!`,
			},
			trigger: {
				type: Notifications.SchedulableTriggerInputTypes.DATE,
				date: nextDate,
			},
		});
	}

	if (event.notification_type === "day_before" || event.notification_type === "both") {
		const dayBefore = new Date(nextDate);
		dayBefore.setDate(dayBefore.getDate() - 1);

		dayBeforeId = await Notifications.scheduleNotificationAsync({
			content: {
				title: `${emoji} ${event.name} - Tomorrow`,
				body: `Tomorrow is ${event.name}'s ${event.event_type}${ageText}!`,
			},
			trigger: {
				type: Notifications.SchedulableTriggerInputTypes.DATE,
				date: dayBefore,
			},
		});
	}

	return { onDayId, dayBeforeId };
}

export async function cancelEventNotifications(
	onDayId: string | null | undefined,
	dayBeforeId: string | null | undefined
): Promise<void> {
	if (onDayId) {
		await Notifications.cancelScheduledNotificationAsync(onDayId).catch(() => {});
	}
	if (dayBeforeId) {
		await Notifications.cancelScheduledNotificationAsync(dayBeforeId).catch(() => {});
	}
}

export async function rescheduleEventNotifications(
	event: BirthdayEvent
): Promise<void> {
	// Cancel existing notifications
	await cancelEventNotifications(
		event.notification_id_on_day,
		event.notification_id_day_before
	);

	if (event.notification_type === "none") {
		await updateNotificationIds(event.id, null, null);
		return;
	}

	// Schedule new notifications
	const { onDayId, dayBeforeId } = await scheduleEventNotifications(event);
	await updateNotificationIds(event.id, onDayId, dayBeforeId);
}

/**
 * Refresh all notifications on app open.
 * Re-schedules notifications for events whose next occurrence
 * notification may have already fired.
 */
export async function refreshAllNotifications(): Promise<void> {
	try {
		const hasPermission = await requestNotificationPermissions();
		if (!hasPermission) return;

		const events = await getAllEvents();
		for (const event of events) {
			if (event.notification_type !== "none") {
				await rescheduleEventNotifications(event);
			}
		}
	} catch (error) {
		console.warn("Failed to refresh notifications:", error);
	}
}
