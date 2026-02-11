import React, { useCallback, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Linking,
	Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FitLogStackParamList } from "../../../../types/navigation";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type Nav = NativeStackNavigationProp<FitLogStackParamList>;
type Route = RouteProp<FitLogStackParamList, "FLYouTubePreview">;

function extractVideoId(url: string): string | null {
	const patterns = [
		/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
		/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
		/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
		/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
	];
	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) return match[1];
	}
	return null;
}

export default function YouTubePreviewScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const { url, title } = route.params;
	const videoId = extractVideoId(url);
	const thumbnailUrl = videoId
		? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
		: null;

	const handleOpenInBrowser = useCallback(() => {
		Linking.openURL(url).catch(() => {});
	}, [url]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
					<Ionicons name="close" size={28} color={colors.textPrimary} />
				</TouchableOpacity>
				<Text style={styles.headerTitle} numberOfLines={1}>
					{title}
				</Text>
				<View style={{ width: 28 }} />
			</View>

			<View style={styles.content}>
				{/* Thumbnail */}
				{thumbnailUrl ? (
					<TouchableOpacity
						style={styles.thumbnailContainer}
						onPress={handleOpenInBrowser}
						activeOpacity={0.8}
					>
						<Image
							source={{ uri: thumbnailUrl }}
							style={styles.thumbnail}
							resizeMode="cover"
						/>
						<View style={styles.playOverlay}>
							<View style={styles.playButton}>
								<Ionicons name="play" size={48} color={colors.white} />
							</View>
						</View>
					</TouchableOpacity>
				) : (
					<View style={styles.noPreview}>
						<Ionicons name="videocam-outline" size={64} color={colors.textSecondary} />
						<Text style={styles.noPreviewText}>{t("fitPreview")}</Text>
					</View>
				)}

				{/* Open in Browser Button */}
				<TouchableOpacity
					style={styles.openButton}
					onPress={handleOpenInBrowser}
					activeOpacity={0.7}
				>
					<Ionicons name="open-outline" size={20} color={colors.white} />
					<Text style={styles.openButtonText}>{t("fitWatchVideo")}</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				safeArea: {
					flex: 1,
					backgroundColor: colors.background,
				},
				header: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				headerTitle: {
					...typography.headline,
					color: colors.textPrimary,
					flex: 1,
					textAlign: "center",
					marginHorizontal: spacing.sm,
				},
				content: {
					flex: 1,
					paddingHorizontal: spacing.lg,
					paddingTop: spacing.xl,
					alignItems: "center",
				},
				thumbnailContainer: {
					width: "100%",
					aspectRatio: 16 / 9,
					borderRadius: 12,
					overflow: "hidden",
					backgroundColor: colors.cardBackground,
					marginBottom: spacing.xl,
				},
				thumbnail: {
					width: "100%",
					height: "100%",
				},
				playOverlay: {
					...StyleSheet.absoluteFillObject,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "rgba(0,0,0,0.3)",
				},
				playButton: {
					width: 72,
					height: 72,
					borderRadius: 36,
					backgroundColor: "rgba(255,0,0,0.85)",
					alignItems: "center",
					justifyContent: "center",
					paddingLeft: 4,
				},
				noPreview: {
					width: "100%",
					aspectRatio: 16 / 9,
					borderRadius: 12,
					backgroundColor: colors.cardBackground,
					alignItems: "center",
					justifyContent: "center",
					marginBottom: spacing.xl,
				},
				noPreviewText: {
					...typography.body,
					color: colors.textSecondary,
					marginTop: spacing.sm,
				},
				openButton: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.accent,
					borderRadius: 12,
					paddingVertical: spacing.md,
					paddingHorizontal: spacing.xl,
					gap: spacing.sm,
				},
				openButtonText: {
					...typography.headline,
					color: colors.white,
				},
			}),
		[colors]
	);
}
