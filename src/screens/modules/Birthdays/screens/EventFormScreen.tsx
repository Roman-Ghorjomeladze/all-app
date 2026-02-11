import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Alert,
	Switch,
	Platform,
	KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { BirthdaysStackParamList } from "../../../../types/navigation";
import {
	BirthdayEvent,
	EventType,
	NotificationType,
	createEvent,
	updateEvent,
	deleteEvent,
	getEvent,
	initDatabase,
} from "../database";
import { rescheduleEventNotifications, cancelEventNotifications, requestNotificationPermissions } from "../utils/notifications";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import EventTypeSelector from "../components/EventTypeSelector";

type Nav = NativeStackNavigationProp<BirthdaysStackParamList>;
type Route = RouteProp<BirthdaysStackParamList, "BirthdaysEventForm">;

const NOTIFICATION_OPTIONS: { type: NotificationType; label: string }[] = [
	{ type: "none", label: "None" },
	{ type: "on_day", label: "On the day" },
	{ type: "day_before", label: "Day before" },
	{ type: "both", label: "Both" },
];

export default function EventFormScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const isEdit = route.params.mode === "edit";
	const eventId = isEdit ? (route.params as { mode: "edit"; eventId: number }).eventId : null;
	const prefilledDate = !isEdit ? (route.params as { mode: "create"; date?: string }).date : null;

	const [name, setName] = useState("");
	const [eventType, setEventType] = useState<EventType>("birthday");
	const [eventMonth, setEventMonth] = useState(new Date().getMonth() + 1);
	const [eventDay, setEventDay] = useState(new Date().getDate());
	const [yearKnown, setYearKnown] = useState(false);
	const [eventYear, setEventYear] = useState(new Date().getFullYear());
	const [notificationType, setNotificationType] = useState<NotificationType>("none");
	const [notes, setNotes] = useState("");
	const [existingEvent, setExistingEvent] = useState<BirthdayEvent | null>(null);

	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showYearPicker, setShowYearPicker] = useState(false);

	useEffect(() => {
		async function load() {
			await initDatabase();
			if (isEdit && eventId) {
				const event = await getEvent(eventId);
				if (event) {
					setExistingEvent(event);
					setName(event.name);
					setEventType(event.event_type);
					setEventMonth(event.event_month);
					setEventDay(event.event_day);
					setYearKnown(event.event_year != null);
					setEventYear(event.event_year ?? new Date().getFullYear());
					setNotificationType(event.notification_type);
					setNotes(event.notes ?? "");
				}
			} else if (prefilledDate) {
				const parts = prefilledDate.split("-");
				if (parts.length === 3) {
					setEventMonth(parseInt(parts[1], 10));
					setEventDay(parseInt(parts[2], 10));
				}
			}
		}
		load();
	}, [isEdit, eventId, prefilledDate]);

	const dateForPicker = useMemo(
		() => new Date(2000, eventMonth - 1, eventDay),
		[eventMonth, eventDay]
	);

	const yearForPicker = useMemo(
		() => new Date(eventYear, 0, 1),
		[eventYear]
	);

	const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
		if (Platform.OS === "android") setShowDatePicker(false);
		if (date) {
			setEventMonth(date.getMonth() + 1);
			setEventDay(date.getDate());
		}
	};

	const handleYearChange = (_event: DateTimePickerEvent, date?: Date) => {
		if (Platform.OS === "android") setShowYearPicker(false);
		if (date) {
			setEventYear(date.getFullYear());
		}
	};

	const formattedDate = useMemo(() => {
		const date = new Date(2000, eventMonth - 1, eventDay);
		return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
	}, [eventMonth, eventDay]);

	const handleSave = useCallback(async () => {
		if (!name.trim()) {
			Alert.alert(t("bdEventName"), "Name is required");
			return;
		}

		// Request notification permissions if needed
		if (notificationType !== "none") {
			const granted = await requestNotificationPermissions();
			if (!granted) {
				Alert.alert(
					"Notifications",
					"Permission denied. You can enable notifications in your device settings.",
					[{ text: "OK" }]
				);
			}
		}

		const data = {
			name: name.trim(),
			event_month: eventMonth,
			event_day: eventDay,
			event_year: yearKnown ? eventYear : null,
			event_type: eventType,
			notes: notes.trim() || null,
			notification_type: notificationType,
		};

		if (isEdit && eventId && existingEvent) {
			await updateEvent(eventId, data);
			const updated = await getEvent(eventId);
			if (updated) await rescheduleEventNotifications(updated);
		} else {
			const newId = await createEvent(data);
			const newEvent = await getEvent(newId);
			if (newEvent) await rescheduleEventNotifications(newEvent);
		}

		navigation.goBack();
	}, [
		name, eventMonth, eventDay, yearKnown, eventYear, eventType, notes,
		notificationType, isEdit, eventId, existingEvent, navigation, t,
	]);

	const handleDelete = useCallback(async () => {
		if (!existingEvent) return;

		Alert.alert(t("bdDeleteConfirm"), `Delete "${existingEvent.name}"?`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: t("bdDelete"),
				style: "destructive",
				onPress: async () => {
					await cancelEventNotifications(
						existingEvent.notification_id_on_day,
						existingEvent.notification_id_day_before
					);
					await deleteEvent(existingEvent.id);
					navigation.goBack();
				},
			},
		]);
	}, [existingEvent, navigation, t]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
					<Ionicons name="close" size={28} color={colors.textPrimary} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>
					{isEdit ? t("bdEditEvent") : t("bdAddEvent")}
				</Text>
				<TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
					<Text style={styles.saveButton}>{t("bdSave")}</Text>
				</TouchableOpacity>
			</View>

			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				{/* Name */}
				<Text style={styles.label}>{t("bdEventName")}</Text>
				<TextInput
					style={styles.textInput}
					value={name}
					onChangeText={setName}
					placeholder="e.g. John's Birthday"
					placeholderTextColor={colors.textSecondary}
				/>

				{/* Event Type */}
				<Text style={styles.label}>{t("bdEventType")}</Text>
				<EventTypeSelector selected={eventType} onSelect={setEventType} />

				{/* Date */}
				<Text style={styles.label}>{t("bdSelectDate")}</Text>
				<TouchableOpacity
					style={styles.dateButton}
					onPress={() => setShowDatePicker(!showDatePicker)}
					activeOpacity={0.7}
				>
					<Ionicons name="calendar-outline" size={20} color={colors.accent} />
					<Text style={styles.dateButtonText}>{formattedDate}</Text>
				</TouchableOpacity>
				{showDatePicker && (
					<DateTimePicker
						value={dateForPicker}
						mode="date"
						display={Platform.OS === "ios" ? "spinner" : "default"}
						onChange={handleDateChange}
					/>
				)}

				{/* Year */}
				<View style={styles.yearRow}>
					<Text style={styles.label}>{t("bdYearKnown")}</Text>
					<Switch
						value={yearKnown}
						onValueChange={setYearKnown}
						trackColor={{ true: colors.accent }}
						thumbColor={colors.white}
					/>
				</View>
				{yearKnown && (
					<>
						<TouchableOpacity
							style={styles.dateButton}
							onPress={() => setShowYearPicker(!showYearPicker)}
							activeOpacity={0.7}
						>
							<Ionicons name="calendar-outline" size={20} color={colors.accent} />
							<Text style={styles.dateButtonText}>{eventYear}</Text>
						</TouchableOpacity>
						{showYearPicker && (
							<DateTimePicker
								value={yearForPicker}
								mode="date"
								display={Platform.OS === "ios" ? "spinner" : "default"}
								onChange={handleYearChange}
								maximumDate={new Date()}
							/>
						)}
					</>
				)}

				{/* Notification */}
				<Text style={styles.label}>Notification</Text>
				<View style={styles.notificationRow}>
					{NOTIFICATION_OPTIONS.map(({ type, label }) => (
						<TouchableOpacity
							key={type}
							style={[
								styles.notificationChip,
								notificationType === type && {
									backgroundColor: colors.accent + "25",
									borderColor: colors.accent,
								},
							]}
							onPress={() => setNotificationType(type)}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.notificationChipText,
									notificationType === type && { color: colors.accent, fontWeight: "600" },
								]}
							>
								{label}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Notes */}
				<Text style={styles.label}>{t("bdNotes")}</Text>
				<TextInput
					style={[styles.textInput, styles.notesInput]}
					value={notes}
					onChangeText={setNotes}
					placeholder="Optional notes..."
					placeholderTextColor={colors.textSecondary}
					multiline
					textAlignVertical="top"
				/>

				{/* Delete Button */}
				{isEdit && (
					<TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
						<Ionicons name="trash-outline" size={20} color={colors.danger} />
						<Text style={styles.deleteButtonText}>{t("bdDelete")}</Text>
					</TouchableOpacity>
				)}
			</ScrollView>
		</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				safeArea: {
					flex: 1,
					backgroundColor: colors.background,
				},
				header: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				headerTitle: {
					...typography.headline,
					color: colors.textPrimary,
				},
				saveButton: {
					...typography.headline,
					color: colors.accent,
				},
				content: {
					padding: spacing.lg,
					paddingBottom: spacing.xl * 2,
				},
				label: {
					...typography.subhead,
					color: colors.textSecondary,
					marginBottom: spacing.sm,
					marginTop: spacing.lg,
				},
				textInput: {
					...typography.body,
					color: colors.textPrimary,
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.md,
					borderWidth: 1,
					borderColor: colors.border,
				},
				notesInput: {
					height: 100,
					paddingTop: spacing.md,
				},
				dateButton: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.md,
					borderWidth: 1,
					borderColor: colors.border,
				},
				dateButtonText: {
					...typography.body,
					color: colors.textPrimary,
					marginLeft: spacing.sm,
				},
				yearRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					marginTop: spacing.lg,
					marginBottom: spacing.sm,
				},
				notificationRow: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: spacing.sm,
				},
				notificationChip: {
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
					borderRadius: 20,
					backgroundColor: colors.chipBackground,
					borderWidth: 1.5,
					borderColor: "transparent",
				},
				notificationChipText: {
					...typography.subhead,
					color: colors.textSecondary,
				},
				deleteButton: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					marginTop: spacing.xl,
					paddingVertical: spacing.md,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: colors.danger,
				},
				deleteButtonText: {
					...typography.headline,
					color: colors.danger,
					marginLeft: spacing.sm,
				},
			}),
		[colors]
	);
}
