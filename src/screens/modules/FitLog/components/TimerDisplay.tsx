import React, { useMemo, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Colors, spacing, typography } from "../theme";

type TimerDisplayProps = {
	secondsLeft: number;
	totalSeconds: number;
	isRest: boolean;
	colors: Colors;
};

const RING_SIZE = 220;
const RING_WIDTH = 8;

export default function TimerDisplay({ secondsLeft, totalSeconds, isRest, colors }: TimerDisplayProps) {
	const styles = useStyles(colors);
	const pulseAnim = useRef(new Animated.Value(1)).current;
	const isWarning = secondsLeft <= 10 && secondsLeft > 0;

	const ringColor = isRest ? colors.restColor : colors.exerciseColor;

	const formattedTime = useMemo(() => {
		const mins = Math.floor(secondsLeft / 60);
		const secs = secondsLeft % 60;
		return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
	}, [secondsLeft]);

	const progress = useMemo(() => {
		if (totalSeconds === 0) return 0;
		return (totalSeconds - secondsLeft) / totalSeconds;
	}, [secondsLeft, totalSeconds]);

	// Pulsing warning animation
	useEffect(() => {
		if (isWarning) {
			const animation = Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnim, {
						toValue: 1.08,
						duration: 400,
						useNativeDriver: true,
					}),
					Animated.timing(pulseAnim, {
						toValue: 1,
						duration: 400,
						useNativeDriver: true,
					}),
				])
			);
			animation.start();
			return () => animation.stop();
		} else {
			pulseAnim.setValue(1);
		}
	}, [isWarning, pulseAnim]);

	// Build progress ring segments using 4 quadrant borders
	const borderStyles = useMemo(() => {
		const angle = progress * 360;
		// Use a simple approach: overlay colored borders on top of background ring
		// For each quadrant (0-90, 90-180, 180-270, 270-360), show colored or background
		const q1 = Math.min(angle, 90) / 90; // top-right
		const q2 = Math.min(Math.max(angle - 90, 0), 90) / 90; // bottom-right
		const q3 = Math.min(Math.max(angle - 180, 0), 90) / 90; // bottom-left
		const q4 = Math.min(Math.max(angle - 270, 0), 90) / 90; // top-left
		return { q1, q2, q3, q4 };
	}, [progress]);

	return (
		<Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
			{/* Background ring */}
			<View style={[styles.ring, { borderColor: colors.timerBackground }]} />

			{/* Progress ring - top-right quadrant */}
			{borderStyles.q1 > 0 && (
				<View
					style={[
						styles.quadrant,
						styles.quadrantTopRight,
						{
							borderTopColor: ringColor,
							borderRightColor: borderStyles.q1 >= 1 ? ringColor : "transparent",
						},
					]}
				/>
			)}
			{/* Progress ring - bottom-right quadrant */}
			{borderStyles.q2 > 0 && (
				<View
					style={[
						styles.quadrant,
						styles.quadrantBottomRight,
						{
							borderRightColor: ringColor,
							borderBottomColor: borderStyles.q2 >= 1 ? ringColor : "transparent",
						},
					]}
				/>
			)}
			{/* Progress ring - bottom-left quadrant */}
			{borderStyles.q3 > 0 && (
				<View
					style={[
						styles.quadrant,
						styles.quadrantBottomLeft,
						{
							borderBottomColor: ringColor,
							borderLeftColor: borderStyles.q3 >= 1 ? ringColor : "transparent",
						},
					]}
				/>
			)}
			{/* Progress ring - top-left quadrant */}
			{borderStyles.q4 > 0 && (
				<View
					style={[
						styles.quadrant,
						styles.quadrantTopLeft,
						{
							borderLeftColor: ringColor,
							borderTopColor: borderStyles.q4 >= 1 ? ringColor : "transparent",
						},
					]}
				/>
			)}

			{/* Center content */}
			<View style={styles.center}>
				<Text
					style={[
						styles.time,
						isWarning && { color: colors.warningColor },
					]}
				>
					{formattedTime}
				</Text>
			</View>
		</Animated.View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					width: RING_SIZE,
					height: RING_SIZE,
					alignItems: "center",
					justifyContent: "center",
					alignSelf: "center",
				},
				ring: {
					position: "absolute",
					width: RING_SIZE,
					height: RING_SIZE,
					borderRadius: RING_SIZE / 2,
					borderWidth: RING_WIDTH,
				},
				quadrant: {
					position: "absolute",
					width: RING_SIZE / 2,
					height: RING_SIZE / 2,
					borderWidth: RING_WIDTH,
					borderColor: "transparent",
				},
				quadrantTopRight: {
					top: 0,
					right: 0,
					borderTopRightRadius: RING_SIZE / 2,
				},
				quadrantBottomRight: {
					bottom: 0,
					right: 0,
					borderBottomRightRadius: RING_SIZE / 2,
				},
				quadrantBottomLeft: {
					bottom: 0,
					left: 0,
					borderBottomLeftRadius: RING_SIZE / 2,
				},
				quadrantTopLeft: {
					top: 0,
					left: 0,
					borderTopLeftRadius: RING_SIZE / 2,
				},
				center: {
					alignItems: "center",
					justifyContent: "center",
				},
				time: {
					...typography.timer,
					color: colors.textPrimary,
				},
			}),
		[colors]
	);
}
