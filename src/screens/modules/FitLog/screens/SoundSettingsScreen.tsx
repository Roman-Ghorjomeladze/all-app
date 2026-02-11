import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
	initDatabase,
	getSoundSettings,
	updateSoundSetting,
	SoundSetting,
} from "../database";
import { loadSounds, unloadSounds, SOUND_EVENT_TYPES, SoundEventType } from "../sounds";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import SoundPicker from "../components/SoundPicker";

const EVENT_LABELS: Record<SoundEventType, string> = {
	workout_start: "fitWorkoutStart",
	ten_sec_warning: "fitTenSecWarning",
	exercise_end: "fitExerciseEnd",
	rest_end: "fitRestEnd",
	workout_complete: "fitWorkoutComplete",
};

export default function SoundSettingsScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const [settings, setSettings] = useState<SoundSetting[]>([]);

	useEffect(() => {
		loadSounds();
		return () => {
			unloadSounds();
		};
	}, []);

	const loadData = useCallback(async () => {
		await initDatabase();
		const data = await getSoundSettings();
		setSettings(data);
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handleSoundSelect = useCallback(
		async (eventType: string, soundIndex: number) => {
			await updateSoundSetting(eventType, soundIndex);
			setSettings((prev) =>
				prev.map((s) =>
					s.event_type === eventType
						? { ...s, sound_index: soundIndex }
						: s
				)
			);
		},
		[]
	);

	const settingsMap = useMemo(() => {
		const map: Record<string, number> = {};
		for (const s of settings) {
			map[s.event_type] = s.sound_index;
		}
		return map;
	}, [settings]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>
					{t("fitSounds")}
				</Text>
			</View>

			<ScrollView contentContainerStyle={styles.content}>
				{SOUND_EVENT_TYPES.map((eventType) => (
					<View key={eventType} style={styles.section}>
						<Text style={styles.sectionTitle}>
							{t(EVENT_LABELS[eventType])}
						</Text>
						<SoundPicker
							selectedIndex={settingsMap[eventType] ?? 0}
							onSelect={(index) => handleSoundSelect(eventType, index)}
							colors={colors}
						/>
					</View>
				))}
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
				},
				content: {
					padding: spacing.lg,
					paddingBottom: spacing.xl * 2,
				},
				section: {
					marginBottom: spacing.lg,
				},
				sectionTitle: {
					...typography.headline,
					color: colors.textPrimary,
					marginBottom: spacing.sm,
				},
			}),
		[colors]
	);
}
