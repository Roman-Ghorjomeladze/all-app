import React, { useCallback, useMemo, useState } from "react";
import {
	View,
	Text,
	FlatList,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BirthdaysStackParamList } from "../../../../types/navigation";
import { BirthdayEvent, EventType, getAllEvents, initDatabase } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import EventListItem from "../components/EventListItem";

type Nav = NativeStackNavigationProp<BirthdaysStackParamList>;

const ALL_EVENT_TYPES: EventType[] = ["birthday", "anniversary", "reminder", "other"];

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

function formatEventDate(month: number, day: number): string {
	const date = new Date(2000, month - 1, day);
	return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

export default function SearchScreen() {
	const navigation = useNavigation<Nav>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [events, setEvents] = useState<BirthdayEvent[]>([]);
	const [query, setQuery] = useState("");
	const [selectedTypes, setSelectedTypes] = useState<Set<EventType>>(
		new Set(ALL_EVENT_TYPES)
	);

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

	const allSelected = selectedTypes.size === ALL_EVENT_TYPES.length;

	const toggleAll = useCallback(() => {
		if (allSelected) {
			setSelectedTypes(new Set());
		} else {
			setSelectedTypes(new Set(ALL_EVENT_TYPES));
		}
	}, [allSelected]);

	const toggleType = useCallback((type: EventType) => {
		setSelectedTypes((prev) => {
			const next = new Set(prev);
			if (next.has(type)) {
				next.delete(type);
			} else {
				next.add(type);
			}
			return next;
		});
	}, []);

	const filteredEvents = useMemo(() => {
		const q = query.trim().toLowerCase();

		return events
			.filter((event) => {
				// Filter by type
				if (!selectedTypes.has(event.event_type)) return false;

				// Filter by search query
				if (q.length > 0) {
					const nameMatch = event.name.toLowerCase().includes(q);
					const notesMatch = event.notes
						? event.notes.toLowerCase().includes(q)
						: false;
					const dateStr = formatEventDate(
						event.event_month,
						event.event_day
					).toLowerCase();
					const dateMatch = dateStr.includes(q);
					if (!nameMatch && !notesMatch && !dateMatch) return false;
				}

				return true;
			})
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [events, selectedTypes, query]);

	const handleEventPress = useCallback(
		(event: BirthdayEvent) => {
			navigation.navigate("BirthdaysEventForm", {
				mode: "edit",
				eventId: event.id,
			});
		},
		[navigation]
	);

	const handleAdd = useCallback(() => {
		navigation.navigate("BirthdaysEventForm", { mode: "create" });
	}, [navigation]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>
					{t("bdSearch")}
				</Text>
				<TouchableOpacity
					onPress={handleAdd}
					activeOpacity={0.7}
					style={styles.addButton}
				>
					<Ionicons name="add-circle" size={32} color={colors.accent} />
				</TouchableOpacity>
			</View>

			{/* Search bar */}
			<View style={styles.searchContainer}>
				<Ionicons
					name="search"
					size={18}
					color={colors.textSecondary}
					style={styles.searchIcon}
				/>
				<TextInput
					style={styles.searchInput}
					placeholder={t("bdSearchPlaceholder")}
					placeholderTextColor={colors.textSecondary}
					value={query}
					onChangeText={setQuery}
					autoCorrect={false}
					returnKeyType="search"
				/>
				{query.length > 0 && (
					<TouchableOpacity
						onPress={() => setQuery("")}
						activeOpacity={0.7}
						style={styles.clearButton}
					>
						<Ionicons
							name="close-circle"
							size={18}
							color={colors.textSecondary}
						/>
					</TouchableOpacity>
				)}
			</View>

			{/* Filter chips */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={{ flexGrow: 0 }}
				contentContainerStyle={styles.chipsContainer}
			>
				<TouchableOpacity
					style={[
						styles.chip,
						allSelected && {
							backgroundColor: colors.accent + "25",
							borderColor: colors.accent,
						},
					]}
					onPress={toggleAll}
					activeOpacity={0.7}
				>
					<Text
						style={[
							styles.chipLabel,
							allSelected && {
								color: colors.accent,
								fontWeight: "600",
							},
						]}
					>
						{t("bdAll")}
					</Text>
				</TouchableOpacity>

				{ALL_EVENT_TYPES.map((type) => {
					const isSelected = selectedTypes.has(type);
					const typeColor =
						(colors[type as keyof Colors] as string) || colors.accent;
					return (
						<TouchableOpacity
							key={type}
							style={[
								styles.chip,
								isSelected && {
									backgroundColor: typeColor + "25",
									borderColor: typeColor,
								},
							]}
							onPress={() => toggleType(type)}
							activeOpacity={0.7}
						>
							<Text style={styles.chipEmoji}>
								{EVENT_EMOJIS[type]}
							</Text>
							<Text
								style={[
									styles.chipLabel,
									isSelected && {
										color: typeColor,
										fontWeight: "600",
									},
								]}
							>
								{t(EVENT_TYPE_I18N[type])}
							</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{/* Results */}
			{filteredEvents.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyEmoji}>{"\u{1F50D}"}</Text>
					<Text style={styles.emptyText}>{t("bdNoResults")}</Text>
				</View>
			) : (
				<FlatList
					data={filteredEvents}
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item }) => (
						<EventListItem event={item} onPress={handleEventPress} />
					)}
					contentContainerStyle={styles.listContent}
					keyboardShouldPersistTaps="handled"
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
				searchContainer: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.inputBackground,
					marginHorizontal: spacing.md,
					borderRadius: 12,
					paddingHorizontal: spacing.md,
					height: 44,
				},
				searchIcon: {
					marginRight: spacing.sm,
				},
				searchInput: {
					flex: 1,
					...typography.body,
					color: colors.textPrimary,
					paddingVertical: 0,
				},
				clearButton: {
					padding: spacing.xs,
					marginLeft: spacing.xs,
				},
				chipsContainer: {
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
				},
				chip: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: 14,
					paddingVertical: 8,
					minHeight: 36,
					borderRadius: 18,
					backgroundColor: colors.chipBackground,
					borderWidth: 1,
					borderColor: "transparent",
					marginRight: 6,
				},
				chipEmoji: {
					fontSize: 12,
					marginRight: 3,
				},
				chipLabel: {
					...typography.caption1,
					color: colors.textSecondary,
				},
				listContent: {
					paddingBottom: spacing.xl,
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
				},
			}),
		[colors]
	);
}
