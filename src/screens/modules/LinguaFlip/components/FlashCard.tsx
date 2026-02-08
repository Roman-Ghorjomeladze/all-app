import React, { useRef, useMemo } from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated, Dimensions } from "react-native";
import { useColors, Colors, spacing } from "../theme";
import MasteryStars from "./MasteryStars";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const CARD_HEIGHT = 280;

type Props = {
	frontText: string;
	backText: string;
	mastery: number;
	showBothSides: boolean;
	onFlip?: () => void;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		cardContainer: {
			width: CARD_WIDTH,
			height: CARD_HEIGHT,
		},
		card: {
			width: CARD_WIDTH,
			height: CARD_HEIGHT,
			backgroundColor: colors.cardBackground,
			borderRadius: 20,
			justifyContent: "center",
			alignItems: "center",
			paddingHorizontal: spacing.lg,
			paddingVertical: spacing.lg,
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.12,
			shadowRadius: 8,
			elevation: 6,
			backfaceVisibility: "hidden",
			position: "absolute",
		},
		cardBack: {
			backgroundColor: colors.cardBackground,
		},
		masteryRow: {
			position: "absolute",
			top: spacing.md,
			right: spacing.md,
		},
		cardLabel: {
			fontSize: 12,
			fontWeight: "600",
			color: colors.textSecondary,
			letterSpacing: 2,
			marginBottom: spacing.sm,
		},
		cardText: {
			fontSize: 32,
			fontWeight: "700",
			color: colors.textPrimary,
			textAlign: "center",
		},
		tapHint: {
			position: "absolute",
			bottom: spacing.md,
			fontSize: 13,
			color: colors.textSecondary,
		},
		// Static card (show both sides)
		cardStatic: {
			width: CARD_WIDTH,
			backgroundColor: colors.cardBackground,
			borderRadius: 20,
			paddingHorizontal: spacing.lg,
			paddingVertical: spacing.lg,
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.12,
			shadowRadius: 8,
			elevation: 6,
			alignItems: "center",
		},
		frontTextStatic: {
			fontSize: 28,
			fontWeight: "700",
			color: colors.textPrimary,
			textAlign: "center",
			marginBottom: spacing.md,
		},
		divider: {
			width: 60,
			height: 2,
			backgroundColor: colors.accent,
			borderRadius: 1,
			marginBottom: spacing.md,
		},
		backTextStatic: {
			fontSize: 24,
			fontWeight: "600",
			color: colors.accent,
			textAlign: "center",
		},
	}), [colors]);
}

export default function FlashCard({ frontText, backText, mastery, showBothSides, onFlip }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const flipAnim = useRef(new Animated.Value(0)).current;
	const isFlippedRef = useRef(false);

	const handleFlip = () => {
		if (showBothSides) return;

		const toValue = isFlippedRef.current ? 0 : 1;
		isFlippedRef.current = !isFlippedRef.current;

		Animated.spring(flipAnim, {
			toValue,
			friction: 8,
			tension: 60,
			useNativeDriver: true,
		}).start();

		onFlip?.();
	};

	const frontInterpolate = flipAnim.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: ["0deg", "90deg", "180deg"],
	});

	const backInterpolate = flipAnim.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: ["180deg", "270deg", "360deg"],
	});

	const frontOpacity = flipAnim.interpolate({
		inputRange: [0, 0.5, 0.5, 1],
		outputRange: [1, 1, 0, 0],
	});

	const backOpacity = flipAnim.interpolate({
		inputRange: [0, 0.5, 0.5, 1],
		outputRange: [0, 0, 1, 1],
	});

	if (showBothSides) {
		return (
			<View style={styles.cardStatic}>
				<View style={styles.masteryRow}>
					<MasteryStars level={mastery} />
				</View>
				<Text style={styles.frontTextStatic}>{frontText}</Text>
				<View style={styles.divider} />
				<Text style={styles.backTextStatic}>{backText}</Text>
			</View>
		);
	}

	return (
		<TouchableWithoutFeedback onPress={handleFlip}>
			<View style={styles.cardContainer}>
				{/* Front side */}
				<Animated.View
					style={[
						styles.card,
						{
							transform: [{ rotateY: frontInterpolate }],
							opacity: frontOpacity,
						},
					]}
				>
					<View style={styles.masteryRow}>
						<MasteryStars level={mastery} />
					</View>
					<Text style={styles.cardLabel}>FRONT</Text>
					<Text style={styles.cardText}>{frontText}</Text>
					<Text style={styles.tapHint}>Tap to flip</Text>
				</Animated.View>

				{/* Back side */}
				<Animated.View
					style={[
						styles.card,
						styles.cardBack,
						{
							transform: [{ rotateY: backInterpolate }],
							opacity: backOpacity,
						},
					]}
				>
					<View style={styles.masteryRow}>
						<MasteryStars level={mastery} />
					</View>
					<Text style={styles.cardLabel}>BACK</Text>
					<Text style={styles.cardText}>{backText}</Text>
					<Text style={styles.tapHint}>Tap to flip</Text>
				</Animated.View>
			</View>
		</TouchableWithoutFeedback>
	);
}
