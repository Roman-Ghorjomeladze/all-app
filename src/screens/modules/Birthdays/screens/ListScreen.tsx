import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, SectionList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BirthdaysStackParamList } from "../../../../types/navigation";
import { BirthdayEvent, getAllEvents, initDatabase } from "../database";
import { refreshAllNotifications } from "../utils/notifications";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import EventListItem from "../components/EventListItem";

type Nav = NativeStackNavigationProp<BirthdaysStackParamList>;

function getNextOccurrence(month: number, day: number): Date {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const thisYear = new Date(now.getFullYear(), month - 1, day);
	if (thisYear >= now) return thisYear;
	return new Date(now.getFullYear() + 1, month - 1, day);
}

function getDaysUntil(month: number, day: number): number {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const next = getNextOccurrence(month, day);
	return Math.round((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

type Section = {
	title: string;
	data: BirthdayEvent[];
};

function groupEvents(events: BirthdayEvent[], t: (key: string) => string): Section[] {
	const sorted = [...events].sort((a, b) => {
		const da = getDaysUntil(a.event_month, a.event_day);
		const db = getDaysUntil(b.event_month, b.event_day);
		return da - db;
	});

	const todayItems: BirthdayEvent[] = [];
	const thisWeekItems: BirthdayEvent[] = [];
	const thisMonthItems: BirthdayEvent[] = [];
	const upcomingItems: BirthdayEvent[] = [];

	for (const event of sorted) {
		const days = getDaysUntil(event.event_month, event.event_day);
		if (days === 0) {
			todayItems.push(event);
		} else if (days <= 7) {
			thisWeekItems.push(event);
		} else if (days <= 30) {
			thisMonthItems.push(event);
		} else {
			upcomingItems.push(event);
		}
	}

	const sections: Section[] = [];
	if (todayItems.length > 0) sections.push({ title: t("bdToday"), data: todayItems });
	if (thisWeekItems.length > 0) sections.push({ title: t("bdThisWeek"), data: thisWeekItems });
	if (thisMonthItems.length > 0) sections.push({ title: t("bdThisMonth"), data: thisMonthItems });
	if (upcomingItems.length > 0) sections.push({ title: t("bdUpcoming"), data: upcomingItems });

	return sections;
}

export default function ListScreen() {
	const navigation = useNavigation<Nav>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [events, setEvents] = useState<BirthdayEvent[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const loadEvents = useCallback(async () => {
		await initDatabase();
		const allEvents = await getAllEvents();
		setEvents(allEvents);
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadEvents();
		}, [loadEvents])
	);

	useEffect(() => {
		// Refresh notifications on mount
		refreshAllNotifications();
	}, []);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadEvents();
		await refreshAllNotifications();
		setRefreshing(false);
	}, [loadEvents]);

	const sections = useMemo(() => groupEvents(events, t), [events, t]);

	const handleEventPress = useCallback(
		(event: BirthdayEvent) => {
			navigation.navigate("BirthdaysEventForm", { mode: "edit", eventId: event.id });
		},
		[navigation]
	);

	const handleAdd = useCallback(() => {
		navigation.navigate("BirthdaysEventForm", { mode: "create" });
	}, [navigation]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>{t("bdTitle")}</Text>
				<TouchableOpacity onPress={handleAdd} activeOpacity={0.7} style={styles.addButton}>
					<Ionicons name="add-circle" size={32} color={colors.accent} />
				</TouchableOpacity>
			</View>

			{sections.length === 0 && !refreshing ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyEmoji}>{"\u{1F382}"}</Text>
					<Text style={styles.emptyText}>{t("bdNoEvents")}</Text>
					<TouchableOpacity style={styles.emptyButton} onPress={handleAdd} activeOpacity={0.7}>
						<Text style={styles.emptyButtonText}>{t("bdAddEvent")}</Text>
					</TouchableOpacity>
				</View>
			) : (
				<SectionList
					sections={sections}
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item }) => (
						<EventListItem event={item} onPress={handleEventPress} />
					)}
					renderSectionHeader={({ section: { title } }) => (
						<Text style={styles.sectionHeader}>{title}</Text>
					)}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
					}
					contentContainerStyle={styles.listContent}
					stickySectionHeadersEnabled={false}
				/>
			)}
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
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
					flex: 1,
					marginRight: spacing.sm,
				},
				addButton: {
					padding: spacing.xs,
				},
				listContent: {
					paddingBottom: spacing.xl,
				},
				sectionHeader: {
					...typography.title3,
					color: colors.textPrimary,
					paddingHorizontal: spacing.lg,
					paddingTop: spacing.lg,
					paddingBottom: spacing.sm,
				},
				emptyContainer: {
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					paddingHorizontal: spacing.xl,
				},
				emptyEmoji: {
					fontSize: 64,
					marginBottom: spacing.md,
				},
				emptyText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
					marginBottom: spacing.lg,
				},
				emptyButton: {
					backgroundColor: colors.accent,
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					borderRadius: 12,
				},
				emptyButtonText: {
					...typography.headline,
					color: colors.white,
				},
			}),
		[colors]
	);
}
