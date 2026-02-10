import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "../theme";
import { CATEGORY_ICONS } from "../theme";

type Props = {
	selected: string;
	onSelect: (emoji: string) => void;
};

export default function EmojiPicker({ selected, onSelect }: Props) {
	const colors = useColors();

	return (
		<View style={styles.grid}>
			{CATEGORY_ICONS.map((emoji) => (
				<TouchableOpacity
					key={emoji}
					style={[
						styles.cell,
						selected === emoji && {
							backgroundColor: colors.accent + "25",
							borderColor: colors.accent,
						},
					]}
					onPress={() => onSelect(emoji)}
					activeOpacity={0.7}
				>
					<Text style={styles.emoji}>{emoji}</Text>
				</TouchableOpacity>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	cell: {
		width: 44,
		height: 44,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1.5,
		borderColor: "transparent",
	},
	emoji: {
		fontSize: 24,
	},
});
