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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FitLogStackParamList } from "../../../../types/navigation";
import {
	initDatabase,
	getExercise,
	createExercise,
	updateExercise,
	deleteExercise,
} from "../database";
import { useColors, Colors, spacing, typography, EXERCISE_EMOJIS } from "../theme";
import { useLanguage } from "../../../../i18n";
import YouTubePreview from "../components/YouTubePreview";

type Nav = NativeStackNavigationProp<FitLogStackParamList>;
type Route = RouteProp<FitLogStackParamList, "FLExerciseForm">;

export default function ExerciseFormScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const isEdit = route.params.mode === "edit";
	const exerciseId = isEdit
		? (route.params as { mode: "edit"; exerciseId: number }).exerciseId
		: null;

	const [name, setName] = useState("");
	const [icon, setIcon] = useState(EXERCISE_EMOJIS[0]);
	const [youtubeUrl, setYoutubeUrl] = useState("");

	useEffect(() => {
		async function load() {
			await initDatabase();
			if (isEdit && exerciseId) {
				const exercise = await getExercise(exerciseId);
				if (exercise) {
					setName(exercise.name);
					setIcon(exercise.icon);
					setYoutubeUrl(exercise.youtube_url ?? "");
				}
			}
		}
		load();
	}, [isEdit, exerciseId]);

	const handleSave = useCallback(async () => {
		if (!name.trim()) {
			Alert.alert(t("error"), t("fitNameRequired"));
			return;
		}

		const data = {
			name: name.trim(),
			icon,
			youtube_url: youtubeUrl.trim() || null,
		};

		if (isEdit && exerciseId) {
			await updateExercise(exerciseId, data);
		} else {
			await createExercise(data);
		}
		navigation.goBack();
	}, [name, icon, youtubeUrl, isEdit, exerciseId, navigation, t]);

	const handleDelete = useCallback(async () => {
		if (!exerciseId) return;
		Alert.alert(t("fitDeleteExercise"), t("fitDeleteExerciseConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("fitDeleteExercise"),
				style: "destructive",
				onPress: async () => {
					await deleteExercise(exerciseId);
					navigation.goBack();
				},
			},
		]);
	}, [exerciseId, navigation, t]);

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
						{isEdit ? t("fitEditExercise") : t("fitNewExercise")}
					</Text>
					<TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
						<Text style={styles.saveButton}>{t("fitSave")}</Text>
					</TouchableOpacity>
				</View>

				<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
					{/* Name */}
					<Text style={styles.label}>{t("fitExerciseName")}</Text>
					<TextInput
						style={styles.textInput}
						value={name}
						onChangeText={setName}
						placeholder={t("fitExerciseNamePlaceholder")}
						placeholderTextColor={colors.textSecondary}
					/>

					{/* Icon Picker */}
					<Text style={styles.label}>{t("fitIcon")}</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.iconRow}
					>
						{EXERCISE_EMOJIS.map((emoji) => (
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

					{/* YouTube URL */}
					<Text style={styles.label}>{t("fitYouTubeUrl")}</Text>
					<TextInput
						style={styles.textInput}
						value={youtubeUrl}
						onChangeText={setYoutubeUrl}
						placeholder={t("fitYouTubeUrlPlaceholder")}
						placeholderTextColor={colors.textSecondary}
						autoCapitalize="none"
						autoCorrect={false}
						keyboardType="url"
					/>

					{/* YouTube Preview */}
					{youtubeUrl.trim().length > 0 && (
						<View style={styles.previewContainer}>
							<YouTubePreview
								url={youtubeUrl.trim()}
								onPress={(url) =>
									navigation.navigate("FLYouTubePreview", {
										url,
										title: name || t("fitWatchVideo"),
									})
								}
								colors={colors}
							/>
						</View>
					)}

					{/* Delete Button */}
					{isEdit && (
						<TouchableOpacity
							style={styles.deleteButton}
							onPress={handleDelete}
							activeOpacity={0.7}
						>
							<Ionicons name="trash-outline" size={20} color={colors.danger} />
							<Text style={styles.deleteButtonText}>
								{t("fitDeleteExercise")}
							</Text>
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
				previewContainer: {
					marginTop: spacing.md,
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
