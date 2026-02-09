import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BirthdayEvent, EventType } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type Props = {
	event: BirthdayEvent;
	onPress: (event: BirthdayEvent) => void;
};

const EVENT_EMOJIS: Record<EventType, string> = {
	birthday: "\u{1F382}",
	anniversary: "\u{1F48D}",
	reminder: "\u{1F514}",
	other: "\u{1F4CC}",
};

const EVENT_TYPE_I18N: Record<EventType, string> = {
	birthday: "bdBirthday",
	anniversary: "bdAnniversary",
	reminder: "bdReminder",
	other: "bdOther",
};

function getNextOccurrence(month: number, day: number): Date {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const thisYear = new Date(now.getFullYear(), month - 1, day);
	if (thisYear >= now) return thisYear;
	return new Date(now.getFullYear() + 1, month - 1, day);
}

function formatEventDate(month: number, day: number): string {
	const date = new Date(2000, month - 1, day);
	return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function getAgeText(event: BirthdayEvent): string | null {
	if (event.event_year == null || event.event_type !== "birthday") return null;
	const next = getNextOccurrence(event.event_month, event.event_day);
	const age = next.getFullYear() - event.event_year;
	return `Turns ${age}`;
}

function getDaysUntil(month: number, day: number): number {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const next = getNextOccurrence(month, day);
	return Math.round((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function EventListItem({ event, onPress }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const emoji = EVENT_EMOJIS[event.event_type];
	const dateStr = formatEventDate(event.event_month, event.event_day);
	const ageText = getAgeText(event);
	const daysUntil = getDaysUntil(event.event_month, event.event_day);
	const hasNotification = event.notification_type !== "none";

	const eventColor = colors[event.event_type as keyof Colors] as string || colors.accent;
	const typeLabel = t(EVENT_TYPE_I18N[event.event_type]);

	return (
		<TouchableOpacity style={styles.container} onPress={() => onPress(event)} activeOpacity={0.7}>
			<View style={[styles.emojiContainer, { backgroundColor: eventColor + "20" }]}>
				<Text style={styles.emoji}>{emoji}</Text>
			</View>

			<View style={styles.content}>
				<Text style={styles.name} numberOfLines={1}>
					{event.name}
				</Text>
				<View style={styles.detailRow}>
					<Text style={styles.date}>{dateStr}</Text>
					{ageText && <Text style={styles.age}> · {ageText}</Text>}
				</View>
				<View style={[styles.tag, { backgroundColor: eventColor + "18", borderColor: eventColor + "40" }]}>
					<Text style={styles.tagEmoji}>{emoji}</Text>
					<Text style={[styles.tagText, { color: eventColor }]}>{typeLabel}</Text>
				</View>
			</View>

			<View style={styles.rightSection}>
				<Text style={[styles.daysUntil, daysUntil === 0 && { color: eventColor }]}>
					{daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
				</Text>
				{hasNotification && (
					<Ionicons name="notifications" size={14} color={colors.textSecondary} style={styles.bellIcon} />
				)}
			</View>
		</TouchableOpacity>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.md,
					borderRadius: 12,
					marginHorizontal: spacing.md,
					marginVertical: spacing.xs,
				},
				emojiContainer: {
					width: 44,
					height: 44,
					borderRadius: 22,
					alignItems: "center",
					justifyContent: "center",
					marginRight: spacing.md,
				},
				emoji: {
					fontSize: 22,
				},
				content: {
					flex: 1,
				},
				name: {
					...typography.headline,
					color: colors.textPrimary,
				},
				detailRow: {
					flexDirection: "row",
					alignItems: "center",
					marginTop: 2,
				},
				date: {
					...typography.footnote,
					color: colors.textSecondary,
				},
				age: {
					...typography.footnote,
					color: colors.textSecondary,
				},
				tag: {
					flexDirection: "row",
					alignItems: "center",
					alignSelf: "flex-start",
					paddingHorizontal: 8,
					paddingVertical: 2,
					borderRadius: 10,
					borderWidth: 1,
					marginTop: 4,
				},
				tagEmoji: {
					fontSize: 10,
					marginRight: 3,
				},
				tagText: {
					fontSize: 11,
					fontWeight: "600",
				},
				rightSection: {
					alignItems: "flex-end",
					marginLeft: spacing.sm,
				},
				daysUntil: {
					...typography.callout,
					fontWeight: "600",
					color: colors.textSecondary,
				},
				bellIcon: {
					marginTop: 4,
				},
			}),
		[colors]
	);
}
