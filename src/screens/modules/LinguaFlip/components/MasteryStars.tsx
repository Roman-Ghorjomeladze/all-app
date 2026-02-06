import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors, Colors } from "../theme";

type Props = {
	level: number; // 1-5
	size?: number;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			flexDirection: "row",
			alignItems: "center",
		},
	}), [colors]);
}

export default function MasteryStars({ level, size = 14 }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	const masteryColors = [
		colors.mastery1,
		colors.mastery2,
		colors.mastery3,
		colors.mastery4,
		colors.mastery5,
	];

	return (
		<View style={styles.container}>
			{[1, 2, 3, 4, 5].map((star) => (
				<Text
					key={star}
					style={{
						fontSize: size,
						color: star <= level ? masteryColors[level - 1] : colors.progressBackground,
						marginRight: 1,
					}}
				>
					{"\u2605"}
				</Text>
			))}
		</View>
	);
}
