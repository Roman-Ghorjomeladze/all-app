import React, { useCallback, useMemo, useState } from "react";
import {
	View,
	Text,
	SectionList,
	StyleSheet,
	TouchableOpacity,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FitLogStackParamList } from "../../../../types/navigation";
import {
	initDatabase,
	getAllWorkouts,
	getTemplateWorkouts,
	deleteWorkout,
	cloneWorkout,
	WorkoutWithDetails,
} from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import WorkoutCard from "../components/WorkoutCard";

type Nav = NativeStackNavigationProp<FitLogStackParamList>;

type Section = {
	title: string;
	data: WorkoutWithDetails[];
};

export default function WorkoutListScreen() {
	const navigation = useNavigation<Nav>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const [sections, setSections] = useState<Section[]>([]);

	const loadData = useCallback(async () => {
		await initDatabase();
		const [workouts, templates] = await Promise.all([
			getAllWorkouts(),
			getTemplateWorkouts(),
		]);
		const result: Section[] = [];
		if (workouts.length > 0) {
			result.push({ title: t("fitMyWorkouts"), data: workouts });
		}
		if (templates.length > 0) {
			result.push({ title: t("fitTemplates"), data: templates });
		}
		setSections(result);
	}, [t]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handleAdd = useCallback(() => {
		navigation.navigate("FLWorkoutForm", { mode: "create" });
	}, [navigation]);

	const handlePress = useCallback(
		(workout: WorkoutWithDetails) => {
			navigation.navigate("FLPlayer", { workoutId: workout.id });
		},
		[navigation]
	);

	const handleLongPress = useCallback(
		(workout: WorkoutWithDetails) => {
			Alert.alert(workout.name, undefined, [
				{
					text: t("fitEditWorkout"),
					onPress: () =>
						navigation.navigate("FLWorkoutForm", {
							mode: "edit",
							workoutId: workout.id,
						}),
				},
				{
					text: t("fitCloneWorkout"),
					onPress: async () => {
						await cloneWorkout(
							workout.id,
							workout.name + t("fitCloneNameSuffix")
						);
						loadData();
					},
				},
				{
					text: t("fitDeleteWorkout"),
					style: "destructive",
					onPress: () => {
						Alert.alert(
							t("fitDeleteWorkout"),
							t("fitDeleteWorkoutConfirm"),
							[
								{ text: t("cancel"), style: "cancel" },
								{
									text: t("fitDeleteWorkout"),
									style: "destructive",
									onPress: async () => {
										await deleteWorkout(workout.id);
										loadData();
									},
								},
							]
						);
					},
				},
				{ text: t("cancel"), style: "cancel" },
			]);
		},
		[navigation, t, loadData]
	);

	const isEmpty = sections.length === 0;

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>
					{t("fitTitle")}
				</Text>
				<TouchableOpacity onPress={handleAdd} activeOpacity={0.7}>
					<Ionicons name="add-circle" size={32} color={colors.accent} />
				</TouchableOpacity>
			</View>

			{isEmpty ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyEmoji}>{"\u{1F3CB}\u{FE0F}"}</Text>
					<Text style={styles.emptyText}>{t("fitNoWorkouts")}</Text>
					<Text style={styles.emptyHint}>{t("fitNoWorkoutsHint")}</Text>
				</View>
			) : (
				<SectionList
					sections={sections}
					keyExtractor={(item) => item.id.toString()}
					renderSectionHeader={({ section }) => (
						<Text style={styles.sectionTitle}>{section.title}</Text>
					)}
					renderItem={({ item }) => (
						<View style={styles.cardContainer}>
							<WorkoutCard
								workout={item}
								onPress={handlePress}
								onLongPress={handleLongPress}
								colors={colors}
							/>
						</View>
					)}
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
					paddingTop: spacing.md,
					paddingBottom: spacing.xs,
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
					flex: 1,
					marginRight: spacing.sm,
				},
				sectionTitle: {
					...typography.title3,
					color: colors.textPrimary,
					paddingHorizontal: spacing.lg,
					paddingTop: spacing.lg,
					paddingBottom: spacing.sm,
				},
				cardContainer: {
					paddingHorizontal: spacing.lg,
				},
				listContent: {
					paddingBottom: spacing.xl,
				},
				emptyContainer: {
					flex: 1,
					alignItems: "center",
					paddingHorizontal: spacing.xl,
					paddingTop: spacing.xl * 3,
				},
				emptyEmoji: {
					fontSize: 64,
					marginBottom: spacing.md,
				},
				emptyText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
					marginBottom: spacing.sm,
				},
				emptyHint: {
					...typography.footnote,
					color: colors.textSecondary,
					textAlign: "center",
				},
			}),
		[colors]
	);
}
