import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BirthdaysStackParamList } from "../../../../types/navigation";
import { BirthdayEvent, getAllEvents, initDatabase } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import BirthdayCalendarGrid from "../components/BirthdayCalendarGrid";
import EventListItem from "../components/EventListItem";

type Nav = NativeStackNavigationProp<BirthdaysStackParamList>;

const MONTH_NAMES = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December",
];

export default function CalendarScreen() {
	const navigation = useNavigation<Nav>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const now = new Date();
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [selectedDay, setSelectedDay] = useState<number | null>(null);
	const [events, setEvents] = useState<BirthdayEvent[]>([]);

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

	const monthEvents = useMemo(
		() => events.filter((e) => e.event_month === month),
		[events, month]
	);

	const selectedDayEvents = useMemo(
		() => (selectedDay != null ? monthEvents.filter((e) => e.event_day === selectedDay) : []),
		[monthEvents, selectedDay]
	);

	const goToPrevMonth = () => {
		if (month === 1) {
			setMonth(12);
			setYear(year - 1);
		} else {
			setMonth(month - 1);
		}
		setSelectedDay(null);
	};

	const goToNextMonth = () => {
		if (month === 12) {
			setMonth(1);
			setYear(year + 1);
		} else {
			setMonth(month + 1);
		}
		setSelectedDay(null);
	};

	const handleDayPress = (day: number) => {
		setSelectedDay(day === selectedDay ? null : day);
	};

	const handleEventPress = useCallback(
		(event: BirthdayEvent) => {
			navigation.navigate("BirthdaysEventForm", { mode: "edit", eventId: event.id });
		},
		[navigation]
	);

	const handleAdd = useCallback(() => {
		const dateStr = selectedDay
			? `${year}-${String(month).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
			: undefined;
		navigation.navigate("BirthdaysEventForm", { mode: "create", date: dateStr });
	}, [navigation, year, month, selectedDay]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>{t("bdCalendar")}</Text>
				<TouchableOpacity onPress={handleAdd} activeOpacity={0.7} style={styles.addButton}>
					<Ionicons name="add-circle" size={32} color={colors.accent} />
				</TouchableOpacity>
			</View>

			{/* Month Navigation */}
			<View style={styles.monthNav}>
				<TouchableOpacity onPress={goToPrevMonth} activeOpacity={0.7} style={styles.navArrow}>
					<Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
				</TouchableOpacity>
				<Text style={styles.monthTitle}>
					{MONTH_NAMES[month - 1]} {year}
				</Text>
				<TouchableOpacity onPress={goToNextMonth} activeOpacity={0.7} style={styles.navArrow}>
					<Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
				</TouchableOpacity>
			</View>

			<BirthdayCalendarGrid
				year={year}
				month={month}
				events={events}
				selectedDay={selectedDay}
				onDayPress={handleDayPress}
			/>

			{/* Events for selected day */}
			{selectedDay != null && (
				<View style={styles.dayEventsContainer}>
					<Text style={styles.dayEventsTitle}>
						{MONTH_NAMES[month - 1]} {selectedDay}
					</Text>
					{selectedDayEvents.length === 0 ? (
						<Text style={styles.noEventsText}>{t("bdNoEvents")}</Text>
					) : (
						<FlatList
							data={selectedDayEvents}
							keyExtractor={(item) => item.id.toString()}
							renderItem={({ item }) => (
								<EventListItem event={item} onPress={handleEventPress} />
							)}
							contentContainerStyle={styles.dayEventsList}
						/>
					)}
				</View>
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
				monthNav: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					paddingBottom: spacing.md,
				},
				navArrow: {
					padding: spacing.sm,
				},
				monthTitle: {
					...typography.title3,
					color: colors.textPrimary,
				},
				dayEventsContainer: {
					flex: 1,
					paddingTop: spacing.md,
				},
				dayEventsTitle: {
					...typography.headline,
					color: colors.textPrimary,
					paddingHorizontal: spacing.lg,
					paddingBottom: spacing.sm,
				},
				noEventsText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
					paddingTop: spacing.lg,
				},
				dayEventsList: {
					paddingBottom: spacing.lg,
				},
			}),
		[colors]
	);
}
