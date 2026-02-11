import React, { useMemo } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, spacing } from "../theme";

type Props = {
	imageUrl: string | null | undefined;
	height?: number;
	borderRadius?: number;
	colors: Colors;
};

export default function ImagePreview({ imageUrl, height = 200, borderRadius = 12, colors }: Props) {
	const styles = useStyles(colors);

	if (!imageUrl) {
		return (
			<View style={[styles.placeholder, { height, borderRadius }]}>
				<Ionicons name="image-outline" size={48} color={colors.textSecondary} />
				<Text style={styles.placeholderText}>No image</Text>
			</View>
		);
	}

	return (
		<Image
			source={{ uri: imageUrl }}
			style={[styles.image, { height, borderRadius }]}
			resizeMode="cover"
		/>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				image: {
					width: "100%",
					backgroundColor: colors.chipBackground,
				},
				placeholder: {
					width: "100%",
					backgroundColor: colors.chipBackground,
					justifyContent: "center",
					alignItems: "center",
					gap: spacing.xs,
				},
				placeholderText: {
					fontSize: 13,
					color: colors.textSecondary,
				},
			}),
		[colors]
	);
}
