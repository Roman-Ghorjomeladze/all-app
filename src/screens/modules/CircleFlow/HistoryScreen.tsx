import React, { useState, useCallback, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	SafeAreaView,
	TouchableOpacity,
	Alert,
	Modal,
	Pressable,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";
import { useColors, Colors, typography, spacing } from "./theme";
import { useLanguage } from "../../../i18n";
import {
	initDatabase,
	getAllCycles,
	getSettings,
	deleteCycle,
	updateCycle,
	clearAllData,
	Cycle,
	Settings,
} from "./database";
import SwipeableCycleCard from "./components/SwipeableCycleCard";
import EditCycleModal from "./components/EditCycleModal";
import HoldToDeleteButton from "./components/HoldToDeleteButton";

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				scrollContent: {
					paddingBottom: spacing.xl * 2,
				},
				loadingContainer: {
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
				},
				loadingText: {
					...typography.body,
					color: colors.textSecondary,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingTop: spacing.lg,
					paddingBottom: spacing.md,
					paddingHorizontal: spacing.lg,
				},
				headerSpacer: {
					width: 40,
				},
				title: {
					...typography.title2,
					color: colors.textPrimary,
				},
				gearButton: {
					width: 40,
					height: 40,
					borderRadius: 20,
					backgroundColor: colors.cardBackground,
					justifyContent: "center",
					alignItems: "center",
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: 0.1,
					shadowRadius: 3,
					elevation: 2,
				},
				gearIcon: {
					fontSize: 20,
				},
				statsContainer: {
					flexDirection: "row",
					paddingHorizontal: spacing.lg,
					gap: spacing.md,
					marginTop: spacing.md,
				},
				statCard: {
					flex: 1,
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					padding: spacing.md,
					alignItems: "center",
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.05,
					shadowRadius: 8,
					elevation: 2,
				},
				statLabel: {
					...typography.caption1,
					color: colors.textSecondary,
					textTransform: "uppercase",
					letterSpacing: 0.5,
				},
				statValue: {
					...typography.title1,
					color: colors.period,
					marginTop: spacing.xs,
				},
				statSubtext: {
					...typography.caption1,
					color: colors.textSecondary,
					marginTop: spacing.xs,
				},
				section: {
					marginTop: spacing.xl,
					paddingHorizontal: spacing.lg,
				},
				sectionTitle: {
					...typography.headline,
					color: colors.textPrimary,
					marginBottom: spacing.md,
				},
				emptyState: {
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					padding: spacing.xl,
					alignItems: "center",
				},
				emptyStateText: {
					...typography.headline,
					color: colors.textPrimary,
				},
				emptyStateSubtext: {
					...typography.subhead,
					color: colors.textSecondary,
					marginTop: spacing.xs,
					textAlign: "center",
				},
				swipeHint: {
					...typography.caption1,
					color: colors.textSecondary,
					textAlign: "center",
					marginTop: spacing.sm,
				},
				infoSection: {
					marginTop: spacing.xl,
					alignItems: "center",
				},
				infoText: {
					...typography.footnote,
					color: colors.textSecondary,
				},

				// Clear All Data Modal
				clearAllOverlay: {
					flex: 1,
					backgroundColor: "rgba(0, 0, 0, 0.5)",
					justifyContent: "center",
					alignItems: "center",
					padding: spacing.lg,
				},
				clearAllModal: {
					backgroundColor: colors.cardBackground,
					borderRadius: 20,
					padding: spacing.xl,
					width: "100%",
					maxWidth: 340,
					alignItems: "center",
				},
				clearAllEmoji: {
					fontSize: 48,
					marginBottom: spacing.md,
				},
				clearAllTitle: {
					...typography.title3,
					color: colors.textPrimary,
					marginBottom: spacing.sm,
				},
				clearAllSubtitle: {
					...typography.subhead,
					color: colors.textSecondary,
					textAlign: "center",
					marginBottom: spacing.lg,
				},
				holdButtonContainer: {
					width: "100%",
					marginBottom: spacing.md,
				},
				clearAllCancel: {
					padding: spacing.sm,
				},
				clearAllCancelText: {
					...typography.body,
					color: colors.ovulation,
				},
			}),
		[colors],
	);
}

export default function HistoryScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [settings, setSettings] = useState<Settings | null>(null);
	const [cycles, setCycles] = useState<Cycle[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Data management state
	const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showClearAllModal, setShowClearAllModal] = useState(false);

	const loadData = useCallback(async () => {
		try {
			await initDatabase();
			const [settingsData, cyclesData] = await Promise.all([getSettings(), getAllCycles()]);

			setSettings(settingsData);
			setCycles(cyclesData);
		} catch (error) {
			console.error("Error loading history:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData]),
	);

	const getMonthName = (month: number): string => {
		const monthKeys = [
			"january",
			"february",
			"march",
			"april",
			"may",
			"june",
			"july",
			"august",
			"september",
			"october",
			"november",
			"december",
		];
		return t(monthKeys[month - 1]);
	};

	const formatCycleDates = (cycle: Cycle): string => {
		const start = new Date(cycle.start_date);
		const startStr = `${start.getDate()} ${getMonthName(start.getMonth() + 1)}`;

		if (cycle.end_date) {
			const end = new Date(cycle.end_date);
			const endStr = `${end.getDate()} ${getMonthName(end.getMonth() + 1)}, ${end.getFullYear()}`;
			return `${startStr} - ${endStr}`;
		}

		return `${startStr} - ${t("ongoing")}`;
	};

	const getCycleStats = () => {
		const completedCycles = cycles.filter((c) => c.cycle_length !== null);
		const cyclesWithPeriod = cycles.filter((c) => c.period_length !== null);

		if (completedCycles.length === 0) {
			return {
				avgCycleLength: settings?.average_cycle_length || 28,
				minCycleLength: null,
				maxCycleLength: null,
				avgPeriodLength: settings?.average_period_length || 5,
			};
		}

		const cycleLengths = completedCycles.map((c) => c.cycle_length!);
		const periodLengths = cyclesWithPeriod.map((c) => c.period_length!);

		return {
			avgCycleLength: Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length),
			minCycleLength: Math.min(...cycleLengths),
			maxCycleLength: Math.max(...cycleLengths),
			avgPeriodLength:
				periodLengths.length > 0
					? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
					: settings?.average_period_length || 5,
		};
	};

	// --- Data Management Handlers ---

	const handleEditCycle = (cycle: Cycle) => {
		setEditingCycle(cycle);
		setShowEditModal(true);
	};

	const handleSaveEdit = async (id: number, startDate: string, endDate: string | null) => {
		try {
			await updateCycle(id, startDate, endDate);
			await loadData();
		} catch (error) {
			console.error("Error updating cycle:", error);
			Alert.alert(t("error"), t("logSaveError"));
		}
	};

	const handleDeleteCycle = async (cycle: Cycle) => {
		try {
			await deleteCycle(cycle.id);
			await loadData();
		} catch (error) {
			console.error("Error deleting cycle:", error);
			Alert.alert(t("error"), t("logSaveError"));
		}
	};

	const handleClearAllPress = () => {
		// Step 1: Standard alert
		Alert.alert(t("clearAllData"), t("clearAllDataWarning"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("continueButton"),
				style: "destructive",
				onPress: () => {
					// Step 2: Show the hold-to-delete modal
					setShowClearAllModal(true);
				},
			},
		]);
	};

	const handleClearAllComplete = async () => {
		try {
			await clearAllData();
			setShowClearAllModal(false);
			await loadData();
			Alert.alert("", t("dataCleared"));
		} catch (error) {
			console.error("Error clearing data:", error);
			Alert.alert(t("error"), t("logSaveError"));
		}
	};

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>{t("loading")}</Text>
				</View>
			</SafeAreaView>
		);
	}

	const stats = getCycleStats();

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaView style={styles.container}>
				<ScrollView contentContainerStyle={styles.scrollContent}>
					{/* Header with Gear Icon */}
					<View style={styles.header}>
						<View style={styles.headerSpacer} />
						<Text style={styles.title}>{t("cycleHistory")}</Text>
						{cycles.length > 0 ? (
							<TouchableOpacity style={styles.gearButton} onPress={handleClearAllPress}>
								<Text style={styles.gearIcon}>&#9881;&#65039;</Text>
							</TouchableOpacity>
						) : (
							<View style={styles.headerSpacer} />
						)}
					</View>

					{/* Stats Cards */}
					<View style={styles.statsContainer}>
						<View style={styles.statCard}>
							<Text style={styles.statLabel}>{t("averageCycle")}</Text>
							<Text style={styles.statValue}>
								{stats.avgCycleLength} {t("days")}
							</Text>
							{stats.minCycleLength !== null && stats.maxCycleLength !== null && (
								<Text style={styles.statSubtext}>
									{t("range", { min: stats.minCycleLength, max: stats.maxCycleLength })}
								</Text>
							)}
						</View>

						<View style={styles.statCard}>
							<Text style={styles.statLabel}>{t("averagePeriod")}</Text>
							<Text style={styles.statValue}>
								{stats.avgPeriodLength} {t("days")}
							</Text>
						</View>
					</View>

					{/* Cycles List */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("pastCycles")}</Text>

						{cycles.length === 0 ? (
							<View style={styles.emptyState}>
								<Text style={styles.emptyStateText}>{t("noCyclesYet")}</Text>
								<Text style={styles.emptyStateSubtext}>{t("startLogging")}</Text>
							</View>
						) : (
							<>
								{cycles.map((cycle, index) => (
									<SwipeableCycleCard
										key={cycle.id}
										cycle={cycle}
										isCurrent={index === 0 && !cycle.end_date}
										onEdit={handleEditCycle}
										onDelete={handleDeleteCycle}
									/>
								))}
								<Text style={styles.swipeHint}>{t("swipeHint")}</Text>
							</>
						)}
					</View>

					{/* Info */}
					{cycles.length > 0 && (
						<View style={styles.infoSection}>
							<Text style={styles.infoText}>
								{cycles.length === 1
									? t("trackingCycles", { count: cycles.length })
									: t("trackingCyclesPlural", { count: cycles.length })}
							</Text>
						</View>
					)}
				</ScrollView>

				{/* Edit Cycle Modal */}
				<EditCycleModal
					visible={showEditModal}
					cycle={editingCycle}
					onClose={() => {
						setShowEditModal(false);
						setEditingCycle(null);
					}}
					onSave={handleSaveEdit}
				/>

				{/* Clear All Data - Hold to Delete Modal */}
				<Modal
					visible={showClearAllModal}
					animationType="fade"
					transparent
					supportedOrientations={["portrait", "landscape"]}
					onRequestClose={() => setShowClearAllModal(false)}
				>
					<Pressable style={styles.clearAllOverlay} onPress={() => setShowClearAllModal(false)}>
						<Pressable style={styles.clearAllModal} onPress={(e) => e.stopPropagation()}>
							<Text style={styles.clearAllEmoji}>&#128680;</Text>
							<Text style={styles.clearAllTitle}>{t("clearAllData")}</Text>
							<Text style={styles.clearAllSubtitle}>{t("clearAllDataFinal")}</Text>

							<View style={styles.holdButtonContainer}>
								<HoldToDeleteButton onComplete={handleClearAllComplete} duration={3000} />
							</View>

							<TouchableOpacity style={styles.clearAllCancel} onPress={() => setShowClearAllModal(false)}>
								<Text style={styles.clearAllCancelText}>{t("cancel")}</Text>
							</TouchableOpacity>
						</Pressable>
					</Pressable>
				</Modal>
			</SafeAreaView>
		</GestureHandlerRootView>
	);
}
