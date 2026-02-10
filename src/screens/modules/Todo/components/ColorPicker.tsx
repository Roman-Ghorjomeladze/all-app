import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORY_COLORS } from "../theme";

type Props = {
	selected: string;
	onSelect: (color: string) => void;
};

export default function ColorPicker({ selected, onSelect }: Props) {
	return (
		<View style={styles.grid}>
			{CATEGORY_COLORS.map((color) => (
				<TouchableOpacity
					key={color}
					style={[styles.circle, { backgroundColor: color }]}
					onPress={() => onSelect(color)}
					activeOpacity={0.7}
				>
					{selected === color && (
						<Ionicons name="checkmark" size={18} color="#FFFFFF" />
					)}
				</TouchableOpacity>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
	},
	circle: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
	},
});
