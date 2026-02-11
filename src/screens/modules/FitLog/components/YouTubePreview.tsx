import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, spacing, typography } from "../theme";

type YouTubePreviewProps = {
	url: string;
	onPress: (url: string) => void;
	colors: Colors;
};

function extractVideoId(url: string): string | null {
	// Match youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
	const patterns = [
		/[?&]v=([a-zA-Z0-9_-]{11})/,
		/youtu\.be\/([a-zA-Z0-9_-]{11})/,
		/embed\/([a-zA-Z0-9_-]{11})/,
	];
	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) return match[1];
	}
	return null;
}

export default function YouTubePreview({ url, onPress, colors }: YouTubePreviewProps) {
	const styles = useStyles(colors);

	const videoId = useMemo(() => extractVideoId(url), [url]);

	if (!videoId) return null;

	const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={() => onPress(url)}
			activeOpacity={0.7}
		>
			<Image
				source={{ uri: thumbnailUrl }}
				style={styles.thumbnail}
				resizeMode="cover"
			/>
			<View style={styles.overlay}>
				<View style={styles.playButton}>
					<Ionicons name="play" size={28} color={colors.white} />
				</View>
			</View>
		</TouchableOpacity>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					borderRadius: 12,
					overflow: "hidden",
					backgroundColor: colors.chipBackground,
				},
				thumbnail: {
					width: "100%",
					aspectRatio: 16 / 9,
				},
				overlay: {
					...StyleSheet.absoluteFillObject,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: "rgba(0,0,0,0.25)",
				},
				playButton: {
					width: 56,
					height: 56,
					borderRadius: 28,
					backgroundColor: "rgba(255,0,0,0.85)",
					justifyContent: "center",
					alignItems: "center",
					paddingLeft: 3,
				},
			}),
		[colors]
	);
}
