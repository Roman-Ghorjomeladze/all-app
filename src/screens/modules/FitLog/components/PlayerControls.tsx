import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, spacing } from "../theme";

type PlayerControlsProps = {
	isRunning: boolean;
	isPaused: boolean;
	onPause: () => void;
	onResume: () => void;
	onSkip: () => void;
	onStop: () => void;
	colors: Colors;
};

export default function PlayerControls({
	isRunning,
	isPaused,
	onPause,
	onResume,
	onSkip,
	onStop,
	colors,
}: PlayerControlsProps) {
	const styles = useStyles(colors);

	return (
		<View style={styles.container}>
			{/* Stop button */}
			<TouchableOpacity
				style={[styles.button, styles.secondaryButton]}
				onPress={onStop}
				activeOpacity={0.7}
			>
				<Ionicons name="stop" size={28} color={colors.danger} />
			</TouchableOpacity>

			{/* Pause / Resume button */}
			{isPaused ? (
				<TouchableOpacity
					style={[styles.button, styles.primaryButton, { backgroundColor: colors.accent }]}
					onPress={onResume}
					activeOpacity={0.7}
				>
					<Ionicons name="play" size={32} color={colors.white} />
				</TouchableOpacity>
			) : (
				<TouchableOpacity
					style={[styles.button, styles.primaryButton, { backgroundColor: colors.accent }]}
					onPress={onPause}
					activeOpacity={0.7}
				>
					<Ionicons name="pause" size={32} color={colors.white} />
				</TouchableOpacity>
			)}

			{/* Skip button */}
			<TouchableOpacity
				style={[styles.button, styles.secondaryButton]}
				onPress={onSkip}
				activeOpacity={0.7}
			>
				<Ionicons name="play-skip-forward" size={28} color={colors.textPrimary} />
			</TouchableOpacity>
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					gap: spacing.lg,
					paddingVertical: spacing.md,
				},
				button: {
					justifyContent: "center",
					alignItems: "center",
					borderRadius: 999,
				},
				primaryButton: {
					width: 72,
					height: 72,
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.15,
					shadowRadius: 4,
					elevation: 3,
				},
				secondaryButton: {
					width: 52,
					height: 52,
					backgroundColor: colors.chipBackground,
				},
			}),
		[colors]
	);
}
