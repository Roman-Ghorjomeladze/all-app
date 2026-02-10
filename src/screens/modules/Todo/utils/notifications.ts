import * as Notifications from "expo-notifications";
import { Task, getTasksForSmartList, updateTaskNotificationIds } from "../database";

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
	if (existingStatus === "granted") return true;
	const { status } = await Notifications.requestPermissionsAsync();
	return status === "granted";
}

export async function scheduleTaskNotifications(task: Task): Promise<{ atTimeId: string | null; dayBeforeId: string | null }> {
	let atTimeId: string | null = null;
	let dayBeforeId: string | null = null;

	if (!task.due_date || task.reminder_type === "none") {
		return { atTimeId, dayBeforeId };
	}

	const hasPermission = await requestNotificationPermissions();
	if (!hasPermission) return { atTimeId, dayBeforeId };

	const [year, month, day] = task.due_date.split("-").map(Number);
	let hours = 9;
	let minutes = 0;
	if (task.due_time) {
		const [h, m] = task.due_time.split(":").map(Number);
		hours = h;
		minutes = m;
	}

	const shouldScheduleAtTime = task.reminder_type === "at_time" || task.reminder_type === "both";
	const shouldScheduleDayBefore = task.reminder_type === "day_before" || task.reminder_type === "both";

	if (shouldScheduleAtTime) {
		const triggerDate = new Date(year, month - 1, day, hours, minutes, 0);
		if (triggerDate.getTime() > Date.now()) {
			atTimeId = await Notifications.scheduleNotificationAsync({
				content: {
					title: task.title,
					body: "Due today",
				},
				trigger: {
					type: Notifications.SchedulableTriggerInputTypes.DATE,
					date: triggerDate,
				},
			});
		}
	}

	if (shouldScheduleDayBefore) {
		const beforeDate = new Date(year, month - 1, day - 1, 9, 0, 0);
		if (beforeDate.getTime() > Date.now()) {
			dayBeforeId = await Notifications.scheduleNotificationAsync({
				content: {
					title: task.title,
					body: "Due tomorrow",
				},
				trigger: {
					type: Notifications.SchedulableTriggerInputTypes.DATE,
					date: beforeDate,
				},
			});
		}
	}

	return { atTimeId, dayBeforeId };
}

export async function cancelTaskNotifications(
	atTimeId: string | null | undefined,
	dayBeforeId: string | null | undefined
): Promise<void> {
	if (atTimeId) {
		try {
			await Notifications.cancelScheduledNotificationAsync(atTimeId);
		} catch {}
	}
	if (dayBeforeId) {
		try {
			await Notifications.cancelScheduledNotificationAsync(dayBeforeId);
		} catch {}
	}
}

export async function rescheduleTaskNotifications(task: Task): Promise<void> {
	await cancelTaskNotifications(task.notification_id_at_time, task.notification_id_day_before);
	const { atTimeId, dayBeforeId } = await scheduleTaskNotifications(task);
	await updateTaskNotificationIds(task.id, atTimeId, dayBeforeId);
}

export async function refreshAllTaskNotifications(): Promise<void> {
	try {
		// Get all incomplete tasks that have reminders
		const allTasks = await getTasksForSmartList("all");
		for (const task of allTasks) {
			if (task.reminder_type !== "none" && task.due_date) {
				await rescheduleTaskNotifications(task as Task);
			}
		}
	} catch {}
}
