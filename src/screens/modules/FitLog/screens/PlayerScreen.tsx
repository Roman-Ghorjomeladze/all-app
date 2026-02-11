import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FitLogStackParamList } from "../../../../types/navigation";
import {
	initDatabase,
	getWorkout,
	getWorkoutItems,
	getSoundForEvent,
	addToHistory,
	WorkoutItemWithExercise,
} from "../database";
import { loadSounds, unloadSounds, playSound } from "../sounds";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import TimerDisplay from "../components/TimerDisplay";
import PlayerControls from "../components/PlayerControls";

type Nav = NativeStackNavigationProp<FitLogStackParamList>;
type Route = RouteProp<FitLogStackParamList, "FLPlayer">;

type PlayerState = "loading" | "ready" | "running" | "paused" | "completed";

export default function PlayerScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const { workoutId } = route.params;

	const [playerState, setPlayerState] = useState<PlayerState>("loading");
	const [items, setItems] = useState<WorkoutItemWithExercise[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [secondsRemaining, setSecondsRemaining] = useState(0);
	const [workoutName, setWorkoutName] = useState("");
	const [totalElapsed, setTotalElapsed] = useState(0);
	const [exercisesCompleted, setExercisesCompleted] = useState(0);

	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const warningPlayedRef = useRef(false);

	// Load sounds on mount
	useEffect(() => {
		loadSounds();
		return () => {
			unloadSounds();
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	// Load workout data
	useEffect(() => {
		async function load() {
			await initDatabase();
			const workout = await getWorkout(workoutId);
			const workoutItems = await getWorkoutItems(workoutId);
			if (workout) {
				setWorkoutName(workout.name);
			}
			setItems(workoutItems);
			if (workoutItems.length > 0) {
				setSecondsRemaining(workoutItems[0].duration_seconds);
				setPlayerState("ready");
			}
		}
		load();
	}, [workoutId]);

	const currentItem = items[currentIndex] ?? null;
	const nextItem = items[currentIndex + 1] ?? null;
	const exerciseCount = items.filter((i) => i.item_type === "exercise").length;

	const playSoundForEvent = useCallback(async (eventType: string) => {
		try {
			const soundIndex = await getSoundForEvent(eventType);
			await playSound(soundIndex);
		} catch (_) {}
	}, []);

	const advanceToNext = useCallback(() => {
		if (currentItem?.item_type === "exercise") {
			setExercisesCompleted((prev) => prev + 1);
		}

		const nextIndex = currentIndex + 1;
		if (nextIndex >= items.length) {
			// Workout complete
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			setPlayerState("completed");
			playSoundForEvent("workout_complete");
			return;
		}

		// Play transition sound
		if (currentItem?.item_type === "exercise") {
			playSoundForEvent("exercise_end");
		} else if (currentItem?.item_type === "rest") {
			playSoundForEvent("rest_end");
		}

		setCurrentIndex(nextIndex);
		setSecondsRemaining(items[nextIndex].duration_seconds);
		warningPlayedRef.current = false;
	}, [currentIndex, items, currentItem, playSoundForEvent]);

	// Timer tick
	useEffect(() => {
		if (playerState !== "running") return;

		intervalRef.current = setInterval(() => {
			setSecondsRemaining((prev) => {
				if (prev <= 1) {
					advanceToNext();
					return 0;
				}
				// 10-second warning
				if (prev === 11 && !warningPlayedRef.current) {
					warningPlayedRef.current = true;
					playSoundForEvent("ten_sec_warning");
				}
				return prev - 1;
			});
			setTotalElapsed((prev) => prev + 1);
		}, 1000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [playerState, advanceToNext, playSoundForEvent]);

	const handleStart = useCallback(() => {
		setPlayerState("running");
		playSoundForEvent("workout_start");
	}, [playSoundForEvent]);

	const handlePause = useCallback(() => {
		setPlayerState("paused");
	}, []);

	const handleResume = useCallback(() => {
		setPlayerState("running");
	}, []);

	const handleSkip = useCallback(() => {
		advanceToNext();
	}, [advanceToNext]);

	const handleStop = useCallback(() => {
		Alert.alert(t("fitStop"), t("fitStopConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("fitStop"),
				style: "destructive",
				onPress: () => {
					if (intervalRef.current) {
						clearInterval(intervalRef.current);
						intervalRef.current = null;
					}
					navigation.goBack();
				},
			},
		]);
	}, [navigation, t]);

	const handleDone = useCallback(async () => {
		await addToHistory(workoutId, workoutName, totalElapsed, exercisesCompleted);
		navigation.goBack();
	}, [workoutId, workoutName, totalElapsed, exercisesCompleted, navigation]);

	const formatTime = useCallback((seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	}, []);

	const currentLabel = useMemo(() => {
		if (!currentItem) return "";
		if (currentItem.item_type === "rest") return t("fitRest");
		return currentItem.exercise_name ?? t("fitExercise");
	}, [currentItem, t]);

	const currentIcon = useMemo(() => {
		if (!currentItem) return "";
		if (currentItem.item_type === "rest") return "\u{23F8}\u{FE0F}";
		return currentItem.exercise_icon ?? "\u{1F3CB}\u{FE0F}";
	}, [currentItem]);

	const exerciseProgress = useMemo(() => {
		if (items.length === 0) return "";
		const exerciseItems = items.filter((i) => i.item_type === "exercise");
		const currentExerciseNum =
			items.slice(0, currentIndex + 1).filter((i) => i.item_type === "exercise").length;
		return `${t("fitExercise")} ${currentExerciseNum} / ${exerciseItems.length}`;
	}, [items, currentIndex, t]);

	const nextUpLabel = useMemo(() => {
		if (!nextItem) return "";
		if (nextItem.item_type === "rest") return `${t("fitNextUp")}: ${t("fitRest")}`;
		return `${t("fitNextUp")}: ${nextItem.exercise_name ?? t("fitExercise")}`;
	}, [nextItem, t]);

	if (playerState === "loading") {
		return (
			<SafeAreaView style={styles.safeArea} edges={["top"]}>
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>{t("fitGetReady")}</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (playerState === "completed") {
		return (
			<SafeAreaView style={styles.safeArea} edges={["top"]}>
				<View style={styles.completedContainer}>
					<Text style={styles.completedEmoji}>{"\u{1F389}"}</Text>
					<Text style={styles.completedTitle}>{t("fitComplete")}</Text>
					<Text style={styles.completedSubtitle}>{t("fitGreatJob")}</Text>

					<View style={styles.summaryCard}>
						<Text style={styles.summaryTitle}>{t("fitWorkoutSummary")}</Text>
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>{t("fitTimeElapsed")}</Text>
							<Text style={styles.summaryValue}>{formatTime(totalElapsed)}</Text>
						</View>
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>{t("fitExercisesCompleted")}</Text>
							<Text style={styles.summaryValue}>{exercisesCompleted}</Text>
						</View>
					</View>

					<TouchableOpacity
						style={styles.doneButton}
						onPress={handleDone}
						activeOpacity={0.7}
					>
						<Text style={styles.doneButtonText}>{t("done")}</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<View style={styles.container}>
				{/* Top Bar */}
				<View style={styles.topBar}>
					<TouchableOpacity onPress={handleStop} activeOpacity={0.7}>
						<Text style={styles.stopText}>{t("fitStop")}</Text>
					</TouchableOpacity>
					<Text style={styles.workoutTitle} numberOfLines={1}>
						{workoutName}
					</Text>
					<Text style={styles.elapsed}>{formatTime(totalElapsed)}</Text>
				</View>

				{/* Current Exercise Info */}
				<View style={styles.exerciseInfo}>
					<Text style={styles.exerciseIcon}>{currentIcon}</Text>
					<Text style={styles.exerciseName}>{currentLabel}</Text>
					{currentItem?.item_type === "exercise" && (
						<Text style={styles.progress}>{exerciseProgress}</Text>
					)}
				</View>

				{/* Timer */}
				<View style={styles.timerContainer}>
					<TimerDisplay
						secondsLeft={secondsRemaining}
						totalSeconds={currentItem?.duration_seconds ?? 0}
						isRest={currentItem?.item_type === "rest"}
						colors={colors}
					/>
				</View>

				{/* Next Up */}
				{nextUpLabel.length > 0 && (
					<Text style={styles.nextUp}>{nextUpLabel}</Text>
				)}

				{/* Controls */}
				<View style={styles.controlsContainer}>
					{playerState === "ready" ? (
						<PlayerControls
							isRunning={false}
							isPaused={false}
							onPause={handleStart}
							onResume={handleStart}
							onSkip={handleSkip}
							onStop={handleStop}
							colors={colors}
						/>
					) : (
						<PlayerControls
							isRunning={playerState === "running"}
							isPaused={playerState === "paused"}
							onPause={handlePause}
							onResume={handleResume}
							onSkip={handleSkip}
							onStop={handleStop}
							colors={colors}
						/>
					)}
				</View>
			</View>
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
				loadingContainer: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
				},
				loadingText: {
					...typography.title1,
					color: colors.textPrimary,
				},
				container: {
					flex: 1,
					paddingHorizontal: spacing.lg,
				},
				topBar: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingVertical: spacing.md,
				},
				stopText: {
					...typography.headline,
					color: colors.danger,
				},
				workoutTitle: {
					...typography.headline,
					color: colors.textPrimary,
					flex: 1,
					textAlign: "center",
					marginHorizontal: spacing.sm,
				},
				elapsed: {
					...typography.subhead,
					color: colors.textSecondary,
				},
				exerciseInfo: {
					alignItems: "center",
					paddingTop: spacing.xl,
				},
				exerciseIcon: {
					fontSize: 48,
					marginBottom: spacing.sm,
				},
				exerciseName: {
					...typography.title2,
					color: colors.textPrimary,
					textAlign: "center",
				},
				progress: {
					...typography.subhead,
					color: colors.textSecondary,
					marginTop: spacing.xs,
				},
				timerContainer: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
				},
				nextUp: {
					...typography.subhead,
					color: colors.textSecondary,
					textAlign: "center",
					marginBottom: spacing.md,
				},
				controlsContainer: {
					paddingBottom: spacing.xl * 2,
				},
				/* Completed overlay */
				completedContainer: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					paddingHorizontal: spacing.xl,
				},
				completedEmoji: {
					fontSize: 80,
					marginBottom: spacing.md,
				},
				completedTitle: {
					...typography.title1,
					color: colors.completedColor,
					marginBottom: spacing.xs,
				},
				completedSubtitle: {
					...typography.body,
					color: colors.textSecondary,
					marginBottom: spacing.xl,
				},
				summaryCard: {
					backgroundColor: colors.cardBackground,
					borderRadius: 16,
					padding: spacing.lg,
					width: "100%",
					marginBottom: spacing.xl,
				},
				summaryTitle: {
					...typography.headline,
					color: colors.textPrimary,
					marginBottom: spacing.md,
					textAlign: "center",
				},
				summaryRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingVertical: spacing.sm,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				summaryLabel: {
					...typography.body,
					color: colors.textSecondary,
				},
				summaryValue: {
					...typography.headline,
					color: colors.textPrimary,
				},
				doneButton: {
					backgroundColor: colors.accent,
					borderRadius: 12,
					paddingVertical: spacing.md,
					paddingHorizontal: spacing.xl * 2,
				},
				doneButtonText: {
					...typography.headline,
					color: colors.white,
					textAlign: "center",
				},
			}),
		[colors]
	);
}
