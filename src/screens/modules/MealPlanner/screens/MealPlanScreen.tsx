import React, { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MealPlannerStackParamList } from "../../../../types/navigation";
import { initDatabase, getMealPlanForWeek, removeFromMealPlan, MealPlanEntryWithRecipe } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import WeekSelector from "../components/WeekSelector";
import MealSlot from "../components/MealSlot";

type Nav = NativeStackNavigationProp<MealPlannerStackParamList>;

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

function getMonday(d: Date): Date {
	const date = new Date(d);
	const day = date.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	date.setDate(date.getDate() + diff);
	date.setHours(0, 0, 0, 0);
	return date;
}

function formatDateISO(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export default function MealPlanScreen() {
	const navigation = useNavigation<Nav>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
	const [entries, setEntries] = useState<MealPlanEntryWithRecipe[]>([]);

	const loadData = useCallback(async () => {
		await initDatabase();
		const data = await getMealPlanForWeek(formatDateISO(weekStart));
		setEntries(data);
	}, [weekStart]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handlePrevWeek = useCallback(() => {
		setWeekStart((prev) => {
			const d = new Date(prev);
			d.setDate(d.getDate() - 7);
			return d;
		});
	}, []);

	const handleNextWeek = useCallback(() => {
		setWeekStart((prev) => {
			const d = new Date(prev);
			d.setDate(d.getDate() + 7);
			return d;
		});
	}, []);

	const handleAddRecipe = useCallback((date: string, mealType: string) => {
		navigation.navigate("MPRecipePicker", { date, mealType });
	}, [navigation]);

	const handleRemoveEntry = useCallback((id: number) => {
		Alert.alert(t("mpRemoveMeal"), t("mpRemoveMealConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("mpRemove"),
				style: "destructive",
				onPress: async () => {
					await removeFromMealPlan(id);
					loadData();
				},
			},
		]);
	}, [t, loadData]);

	const days = useMemo(() => {
		const dayKeys = ["mpMonday", "mpTuesday", "mpWednesday", "mpThursday", "mpFriday", "mpSaturday", "mpSunday"];
		const result = [];
		for (let i = 0; i < 7; i++) {
			const d = new Date(weekStart);
			d.setDate(d.getDate() + i);
			const dateStr = formatDateISO(d);
			const isToday = formatDateISO(new Date()) === dateStr;
			result.push({
				date: dateStr,
				dayName: t(dayKeys[i]),
				dayNumber: d.getDate(),
				isToday,
			});
		}
		return result;
	}, [weekStart, t]);

	const entriesByDateAndType = useMemo(() => {
		const map: Record<string, Record<string, MealPlanEntryWithRecipe[]>> = {};
		for (const entry of entries) {
			if (!map[entry.date]) map[entry.date] = {};
			if (!map[entry.date][entry.meal_type]) map[entry.date][entry.meal_type] = [];
			map[entry.date][entry.meal_type].push(entry);
		}
		return map;
	}, [entries]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title}>{t("mpMealPlan")}</Text>
			</View>

			{/* Week selector */}
			<WeekSelector
				weekStart={weekStart}
				onPrev={handlePrevWeek}
				onNext={handleNextWeek}
				colors={colors}
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				{days.map((day) => {
					const dayEntries = entriesByDateAndType[day.date] || {};
					const dayCalories = Object.values(dayEntries)
						.flat()
						.reduce((sum, e) => sum + (e.recipe_calories || 0), 0);

					return (
						<View key={day.date} style={styles.daySection}>
							<View style={styles.dayHeader}>
								<View style={styles.dayHeaderLeft}>
									<Text style={[styles.dayName, day.isToday && styles.dayNameToday]}>
										{day.dayName} {day.dayNumber}
									</Text>
									{day.isToday && <View style={styles.todayDot} />}
								</View>
								{dayCalories > 0 && (
									<Text style={styles.dayCalories}>
										{Math.round(dayCalories)} {t("mpKcal")}
									</Text>
								)}
							</View>

							{MEAL_TYPES.map((mealType) => (
								<MealSlot
									key={mealType}
									mealType={mealType}
									entries={dayEntries[mealType] || []}
									onAddPress={() => handleAddRecipe(day.date, mealType)}
									onRemoveEntry={handleRemoveEntry}
									colors={colors}
								/>
							))}
						</View>
					);
				})}
			</ScrollView>
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
					paddingHorizontal: spacing.lg,
					paddingTop: spacing.md,
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
				},
				scrollContent: {
					paddingHorizontal: spacing.lg,
					paddingBottom: spacing.xl * 2,
				},
				daySection: {
					marginBottom: spacing.lg,
				},
				dayHeader: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: spacing.sm,
				},
				dayHeaderLeft: {
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.sm,
				},
				dayName: {
					...typography.headline,
					color: colors.textPrimary,
				},
				dayNameToday: {
					color: colors.accent,
				},
				todayDot: {
					width: 8,
					height: 8,
					borderRadius: 4,
					backgroundColor: colors.accent,
				},
				dayCalories: {
					...typography.caption1,
					color: colors.calorieAccent,
					fontWeight: "600",
				},
			}),
		[colors]
	);
}
