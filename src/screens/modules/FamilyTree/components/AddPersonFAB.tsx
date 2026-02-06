import React, { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useColors, Colors, spacing } from "../theme";

type AddPersonFABProps = {
	onPress: () => void;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		fab: {
			position: "absolute",
			bottom: 30,
			right: 24,
			width: 56,
			height: 56,
			borderRadius: 28,
			backgroundColor: colors.fabBackground,
			justifyContent: "center",
			alignItems: "center",
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.3,
			shadowRadius: 8,
			elevation: 8,
		},
		icon: {
			fontSize: 32,
			color: colors.white,
			fontWeight: "300",
			marginTop: -2,
		},
	}), [colors]);
}

export default function AddPersonFAB({ onPress }: AddPersonFABProps) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
			<Text style={styles.icon}>+</Text>
		</TouchableOpacity>
	);
}
