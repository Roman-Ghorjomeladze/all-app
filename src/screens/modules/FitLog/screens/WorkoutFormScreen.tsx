import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Alert,
	Platform,
	KeyboardAvoidingView,
	Modal,
	FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FitLogStackParamList } from "../../../../types/navigation";
import {
	initDatabase,
	getWorkout,
	getWorkoutItems,
	createWorkout,
	updateWorkout,
	getAllExercises,
	Exercise,
	WorkoutItemWithExercise,
	CreateWorkoutData,
} from "../database";
import { useColors, Colors, spacing, typography, WORKOUT_EMOJIS } from "../theme";
import { useLanguage } from "../../../../i18n";
import ExerciseRow from "../components/ExerciseRow";
import RestRow from "../components/RestRow";

type Nav = NativeStackNavigationProp<FitLogStackParamList>;
type Route = RouteProp<FitLogStackParamList, "FLWorkoutForm">;

type LocalItem = {
	key: string;
	item_type: "exercise" | "rest";
	exercise_id: number | null;
	exercise_name: string | null;
	exercise_icon: string | null;
	duration_seconds: number;
};

let keyCounter = 0;
function nextKey() {
	return `item_${Date.now()}_${keyCounter++}`;
}

export default function WorkoutFormScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const mode = route.params.mode;
	const workoutId =
		mode === "edit" || mode === "clone"
			? (route.params as { workoutId: number }).workoutId
			: null;

	const [name, setName] = useState("");
	const [icon, setIcon] = useState(WORKOUT_EMOJIS[0]);
	const [items, setItems] = useState<LocalItem[]>([]);
	const [exercises, setExercises] = useState<Exercise[]>([]);
	const [showExercisePicker, setShowExercisePicker] = useState(false);

	useEffect(() => {
		async function load() {
			await initDatabase();
			const allExercises = await getAllExercises();
			setExercises(allExercises);

			if (workoutId) {
				const workout = await getWorkout(workoutId);
				const workoutItems = await getWorkoutItems(workoutId);
				if (workout) {
					setName(mode === "clone" ? workout.name + t("fitCloneNameSuffix") : workout.name);
					setIcon(workout.icon);
				}
				setItems(
					workoutItems.map((wi) => ({
						key: nextKey(),
						item_type: wi.item_type,
						exercise_id: wi.exercise_id,
						exercise_name: wi.exercise_name,
						exercise_icon: wi.exercise_icon,
						duration_seconds: wi.duration_seconds,
					}))
				);
			}
		}
		load();
	}, [workoutId, mode, t]);

	const handleSave = useCallback(async () => {
		if (!name.trim()) {
			Alert.alert(t("error"), t("fitNameRequired"));
			return;
		}

		const data: CreateWorkoutData = {
			name: name.trim(),
			icon,
			items: items.map((item) => ({
				exercise_id: item.exercise_id,
				item_type: item.item_type,
				duration_seconds: item.duration_seconds,
			})),
		};

		if (mode === "edit" && workoutId) {
			await updateWorkout(workoutId, data);
		} else {
			await createWorkout(data);
		}
		navigation.goBack();
	}, [name, icon, items, mode, workoutId, navigation, t]);

	const handleAddExercise = useCallback(
		(exercise: Exercise) => {
			setItems((prev) => [
				...prev,
				{
					key: nextKey(),
					item_type: "exercise",
					exercise_id: exercise.id,
					exercise_name: exercise.name,
					exercise_icon: exercise.icon,
					duration_seconds: 30,
				},
			]);
			setShowExercisePicker(false);
		},
		[]
	);

	const handleAddRest = useCallback(() => {
		setItems((prev) => [
			...prev,
			{
				key: nextKey(),
				item_type: "rest",
				exercise_id: null,
				exercise_name: null,
				exercise_icon: null,
				duration_seconds: 30,
			},
		]);
	}, []);

	const handleDurationChange = useCallback((index: number, seconds: number) => {
		setItems((prev) =>
			prev.map((item, i) =>
				i === index ? { ...item, duration_seconds: seconds } : item
			)
		);
	}, []);

	const handleRemoveItem = useCallback((index: number) => {
		setItems((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const handleMoveUp = useCallback((index: number) => {
		setItems((prev) => {
			if (index <= 0) return prev;
			const updated = [...prev];
			[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
			return updated;
		});
	}, []);

	const handleMoveDown = useCallback((index: number) => {
		setItems((prev) => {
			if (index < 0 || index >= prev.length - 1) return prev;
			const updated = [...prev];
			[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
			return updated;
		});
	}, []);

	const handleYouTubePress = useCallback(
		(url: string) => {
			navigation.navigate("FLYouTubePreview", { url, title: url });
		},
		[navigation]
	);

	const handleCreateNewExercise = useCallback(() => {
		setShowExercisePicker(false);
		navigation.navigate("FLExerciseForm", { mode: "create" });
	}, [navigation]);

	const refreshExercises = useCallback(async () => {
		const allExercises = await getAllExercises();
		setExercises(allExercises);
	}, []);

	useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			refreshExercises();
		});
		return unsubscribe;
	}, [navigation, refreshExercises]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
						<Ionicons name="close" size={28} color={colors.textPrimary} />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>
						{mode === "edit" ? t("fitEditWorkout") : t("fitNewWorkout")}
					</Text>
					<TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
						<Text style={styles.saveButton}>{t("fitSave")}</Text>
					</TouchableOpacity>
				</View>

				<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
					{/* Name */}
					<Text style={styles.label}>{t("fitWorkoutName")}</Text>
					<TextInput
						style={styles.textInput}
						value={name}
						onChangeText={setName}
						placeholder={t("fitWorkoutNamePlaceholder")}
						placeholderTextColor={colors.textSecondary}
					/>

					{/* Icon Picker */}
					<Text style={styles.label}>{t("fitIcon")}</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.iconRow}
					>
						{WORKOUT_EMOJIS.map((emoji) => (
							<TouchableOpacity
								key={emoji}
								style={[
									styles.iconOption,
									icon === emoji && styles.iconOptionSelected,
								]}
								onPress={() => setIcon(emoji)}
								activeOpacity={0.7}
							>
								<Text style={styles.iconEmoji}>{emoji}</Text>
							</TouchableOpacity>
						))}
					</ScrollView>

					{/* Workout Items */}
					{items.length > 0 && (
						<View style={styles.itemsSection}>
							{items.map((item, index) => {
								if (item.item_type === "exercise") {
									return (
										<ExerciseRow
											key={item.key}
											item={{
												exercise_name: item.exercise_name,
												exercise_icon: item.exercise_icon,
												duration_seconds: item.duration_seconds,
												exercise_youtube_url: null,
											}}
											index={index}
											onDurationChange={handleDurationChange}
											onMoveUp={handleMoveUp}
											onMoveDown={handleMoveDown}
											onRemove={handleRemoveItem}
											onYouTubePress={handleYouTubePress}
											colors={colors}
											isFirst={index === 0}
											isLast={index === items.length - 1}
										/>
									);
								}
								return (
									<RestRow
										key={item.key}
										item={{ duration_seconds: item.duration_seconds }}
										index={index}
										onDurationChange={handleDurationChange}
										onRemove={handleRemoveItem}
										colors={colors}
									/>
								);
							})}
						</View>
					)}

					{/* Add Buttons */}
					<View style={styles.addButtonsRow}>
						<TouchableOpacity
							style={styles.addButton}
							onPress={() => setShowExercisePicker(true)}
							activeOpacity={0.7}
						>
							<Ionicons name="add-circle-outline" size={20} color={colors.accent} />
							<Text style={styles.addButtonText}>{t("fitAddExercise")}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.addButton}
							onPress={handleAddRest}
							activeOpacity={0.7}
						>
							<Ionicons name="timer-outline" size={20} color={colors.restColor} />
							<Text style={[styles.addButtonText, { color: colors.restColor }]}>
								{t("fitAddRest")}
							</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>

				{/* Exercise Picker Modal */}
				<Modal
					visible={showExercisePicker}
					animationType="slide"
					presentationStyle="pageSheet"
					onRequestClose={() => setShowExercisePicker(false)}
				>
					<SafeAreaView style={styles.modalSafeArea}>
						<View style={styles.modalHeader}>
							<TouchableOpacity
								onPress={() => setShowExercisePicker(false)}
								activeOpacity={0.7}
							>
								<Ionicons name="close" size={28} color={colors.textPrimary} />
							</TouchableOpacity>
							<Text style={styles.modalTitle}>{t("fitAddExercise")}</Text>
							<TouchableOpacity onPress={handleCreateNewExercise} activeOpacity={0.7}>
								<Ionicons name="add" size={28} color={colors.accent} />
							</TouchableOpacity>
						</View>
						<FlatList
							data={exercises}
							keyExtractor={(item) => item.id.toString()}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={styles.exercisePickerItem}
									onPress={() => handleAddExercise(item)}
									activeOpacity={0.7}
								>
									<Text style={styles.exercisePickerIcon}>{item.icon}</Text>
									<Text style={styles.exercisePickerName}>{item.name}</Text>
								</TouchableOpacity>
							)}
							contentContainerStyle={styles.exercisePickerList}
						/>
					</SafeAreaView>
				</Modal>
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
					paddingBottom: spacing.xl * 6,
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
				iconRow: {
					flexDirection: "row",
					gap: spacing.sm,
					paddingVertical: spacing.xs,
				},
				iconOption: {
					width: 44,
					height: 44,
					borderRadius: 22,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.cardBackground,
					borderWidth: 2,
					borderColor: "transparent",
				},
				iconOptionSelected: {
					borderColor: colors.accent,
					backgroundColor: colors.chipBackground,
				},
				iconEmoji: {
					fontSize: 24,
				},
				itemsSection: {
					marginTop: spacing.lg,
				},
				addButtonsRow: {
					flexDirection: "row",
					gap: spacing.md,
					marginTop: spacing.lg,
				},
				addButton: {
					flexDirection: "row",
					alignItems: "center",
					paddingVertical: spacing.sm,
				},
				addButtonText: {
					...typography.subhead,
					color: colors.accent,
					marginLeft: spacing.xs,
					fontWeight: "600",
				},
				/* Modal styles */
				modalSafeArea: {
					flex: 1,
					backgroundColor: colors.background,
				},
				modalHeader: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				modalTitle: {
					...typography.headline,
					color: colors.textPrimary,
				},
				exercisePickerList: {
					padding: spacing.lg,
				},
				exercisePickerItem: {
					flexDirection: "row",
					alignItems: "center",
					paddingVertical: spacing.md,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				exercisePickerIcon: {
					fontSize: 24,
					marginRight: spacing.sm,
				},
				exercisePickerName: {
					...typography.body,
					color: colors.textPrimary,
					flex: 1,
				},
			}),
		[colors]
	);
}
