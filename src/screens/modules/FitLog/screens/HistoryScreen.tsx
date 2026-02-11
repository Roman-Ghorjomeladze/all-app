import React, { useCallback, useMemo, useState } from "react";
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
	initDatabase,
	getAllHistory,
	deleteHistoryEntry,
	HistoryEntry,
} from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import HistoryCard from "../components/HistoryCard";

export default function HistoryScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const [history, setHistory] = useState<HistoryEntry[]>([]);

	const loadData = useCallback(async () => {
		await initDatabase();
		const entries = await getAllHistory();
		setHistory(entries);
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handleDelete = useCallback(
		(entry: HistoryEntry) => {
			Alert.alert(t("fitDeleteHistory"), t("fitDeleteHistoryConfirm"), [
				{ text: t("cancel"), style: "cancel" },
				{
					text: t("fitDeleteHistory"),
					style: "destructive",
					onPress: async () => {
						await deleteHistoryEntry(entry.id);
						loadData();
					},
				},
			]);
		},
		[t, loadData]
	);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>
					{t("fitHistory")}
				</Text>
			</View>

			{history.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyEmoji}>{"\u{1F4CB}"}</Text>
					<Text style={styles.emptyText}>{t("fitNoHistory")}</Text>
					<Text style={styles.emptyHint}>{t("fitNoHistoryHint")}</Text>
				</View>
			) : (
				<FlatList
					data={history}
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item }) => (
						<View style={styles.cardContainer}>
							<HistoryCard
								entry={item}
								onDelete={handleDelete}
								colors={colors}
							/>
						</View>
					)}
					contentContainerStyle={styles.listContent}
				/>
			)}
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
					paddingTop: spacing.md,
					paddingBottom: spacing.xs,
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
					flex: 1,
				},
				cardContainer: {
					paddingHorizontal: spacing.lg,
				},
				listContent: {
					paddingTop: spacing.sm,
					paddingBottom: spacing.xl,
				},
				emptyContainer: {
					flex: 1,
					alignItems: "center",
					paddingHorizontal: spacing.xl,
					paddingTop: spacing.xl * 3,
				},
				emptyEmoji: {
					fontSize: 64,
					marginBottom: spacing.md,
				},
				emptyText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
					marginBottom: spacing.sm,
				},
				emptyHint: {
					...typography.footnote,
					color: colors.textSecondary,
					textAlign: "center",
				},
			}),
		[colors]
	);
}
