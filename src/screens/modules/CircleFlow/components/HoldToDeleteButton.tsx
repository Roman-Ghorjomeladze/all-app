import React, { useRef, useState, useMemo } from "react";
import { View, Text, StyleSheet, Animated, Pressable } from "react-native";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../../../../i18n";

type HoldToDeleteButtonProps = {
	onComplete: () => void;
	duration?: number; // in milliseconds
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			width: "100%",
		},
		button: {
			borderRadius: 12,
			overflow: "hidden",
			position: "relative",
		},
		progressFill: {
			position: "absolute",
			top: 0,
			left: 0,
			bottom: 0,
			opacity: 0.3,
		},
		contentContainer: {
			padding: spacing.md,
			alignItems: "center",
		},
		buttonText: {
			color: colors.white,
			fontSize: 17,
			fontWeight: "600",
		},
		progressBarContainer: {
			width: "80%",
			height: 4,
			backgroundColor: "rgba(255, 255, 255, 0.3)",
			borderRadius: 2,
			marginTop: spacing.sm,
			overflow: "hidden",
		},
		progressBar: {
			height: "100%",
			backgroundColor: colors.white,
			borderRadius: 2,
		},
	}), [colors]);
}

export default function HoldToDeleteButton({
	onComplete,
	duration = 3000,
}: HoldToDeleteButtonProps) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const progress = useRef(new Animated.Value(0)).current;
	const [isHolding, setIsHolding] = useState(false);
	const animationRef = useRef<Animated.CompositeAnimation | null>(null);

	const startHold = () => {
		setIsHolding(true);
		progress.setValue(0);

		animationRef.current = Animated.timing(progress, {
			toValue: 1,
			duration: duration,
			useNativeDriver: false,
		});

		animationRef.current.start(({ finished }) => {
			if (finished) {
				onComplete();
			}
			setIsHolding(false);
		});
	};

	const cancelHold = () => {
		if (animationRef.current) {
			animationRef.current.stop();
		}
		progress.setValue(0);
		setIsHolding(false);
	};

	const progressWidth = progress.interpolate({
		inputRange: [0, 1],
		outputRange: ["0%", "100%"],
	});

	const backgroundColor = progress.interpolate({
		inputRange: [0, 0.7, 1],
		outputRange: [colors.period, colors.period, colors.period],
	});

	return (
		<Pressable
			onPressIn={startHold}
			onPressOut={cancelHold}
			style={styles.container}
		>
			<Animated.View
				style={[
					styles.button,
					{ backgroundColor: isHolding ? colors.period : colors.period },
				]}
			>
				<Animated.View
					style={[
						styles.progressFill,
						{
							width: progressWidth,
							backgroundColor: backgroundColor,
						},
					]}
				/>
				<View style={styles.contentContainer}>
					<Text style={styles.buttonText}>{t("holdToDelete")}</Text>
					{isHolding && (
						<View style={styles.progressBarContainer}>
							<Animated.View
								style={[
									styles.progressBar,
									{ width: progressWidth },
								]}
							/>
						</View>
					)}
				</View>
			</Animated.View>
		</Pressable>
	);
}
