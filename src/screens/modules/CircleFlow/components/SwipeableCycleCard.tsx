import React, { useRef, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useColors, Colors, spacing } from "../theme";
import { Cycle } from "../database";
import { useLanguage } from "../../../../i18n";

type SwipeableCycleCardProps = {
	cycle: Cycle;
	isCurrent: boolean;
	onEdit: (cycle: Cycle) => void;
	onDelete: (cycle: Cycle) => void;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		card: {
			backgroundColor: colors.cardBackground,
			borderRadius: 12,
			marginBottom: spacing.sm,
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.08,
			shadowRadius: 4,
			elevation: 2,
		},
		cardContent: {
			padding: spacing.md,
		},
		dateRow: {
			flexDirection: "row",
			alignItems: "center",
			marginBottom: spacing.xs,
		},
		dateText: {
			fontSize: 17,
			fontWeight: "600",
			color: colors.textPrimary,
		},
		currentBadge: {
			backgroundColor: colors.period + "20",
			paddingHorizontal: spacing.sm,
			paddingVertical: 2,
			borderRadius: 8,
			marginLeft: spacing.sm,
		},
		currentBadgeText: {
			fontSize: 12,
			fontWeight: "600",
			color: colors.period,
		},
		detailsText: {
			fontSize: 14,
			color: colors.textSecondary,
		},
		rightActionsContainer: {
			flexDirection: "row",
			alignItems: "center",
			marginBottom: spacing.sm,
		},
		actionButton: {
			justifyContent: "center",
			alignItems: "center",
		},
		actionButtonInner: {
			width: 60,
			height: "100%",
			justifyContent: "center",
			alignItems: "center",
			borderRadius: 0,
		},
		editButton: {
			backgroundColor: colors.ovulation,
		},
		deleteButton: {
			backgroundColor: colors.period,
			borderTopRightRadius: 12,
			borderBottomRightRadius: 12,
		},
		actionIcon: {
			fontSize: 20,
			marginBottom: 2,
		},
		actionText: {
			color: colors.white,
			fontSize: 12,
			fontWeight: "600",
		},
	}), [colors]);
}

export default function SwipeableCycleCard({ cycle, isCurrent, onEdit, onDelete }: SwipeableCycleCardProps) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const swipeableRef = useRef<Swipeable>(null);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
	};

	const formatDateRange = () => {
		const start = formatDate(cycle.start_date);
		if (cycle.end_date) {
			const end = formatDate(cycle.end_date);
			return `${start} - ${end}`;
		}
		return `${start} - ...`;
	};

	const handleDelete = () => {
		swipeableRef.current?.close();
		Alert.alert(t("deleteCycle"), t("deleteConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("delete"),
				style: "destructive",
				onPress: () => onDelete(cycle),
			},
		]);
	};

	const handleEdit = () => {
		swipeableRef.current?.close();
		onEdit(cycle);
	};

	const renderRightActions = (
		progress: Animated.AnimatedInterpolation<number>,
		dragX: Animated.AnimatedInterpolation<number>,
	) => {
		const translateX = dragX.interpolate({
			inputRange: [-120, 0],
			outputRange: [0, 120],
			extrapolate: "clamp",
		});

		return (
			<View style={styles.rightActionsContainer}>
				<Animated.View style={[styles.actionButton, { transform: [{ translateX }] }]}>
					<TouchableOpacity style={[styles.actionButtonInner, styles.editButton]} onPress={handleEdit}>
						<Text style={styles.actionIcon}>✏️</Text>
					</TouchableOpacity>
				</Animated.View>
				<Animated.View style={[styles.actionButton, { transform: [{ translateX }] }]}>
					<TouchableOpacity style={[styles.actionButtonInner, styles.deleteButton]} onPress={handleDelete}>
						<Text style={styles.actionIcon}>🗑️</Text>
					</TouchableOpacity>
				</Animated.View>
			</View>
		);
	};

	return (
		<Swipeable
			ref={swipeableRef}
			renderRightActions={renderRightActions}
			rightThreshold={40}
			overshootRight={false}
		>
			<View style={styles.card}>
				<View style={styles.cardContent}>
					<View style={styles.dateRow}>
						<Text style={styles.dateText}>{formatDateRange()}</Text>
						{isCurrent && (
							<View style={styles.currentBadge}>
								<Text style={styles.currentBadgeText}>{t("current")}</Text>
							</View>
						)}
					</View>
					<Text style={styles.detailsText}>
						{cycle.cycle_length ? `${cycle.cycle_length} ${t("dayCycle")}` : t("ongoingCycle")}
						{cycle.period_length ? ` • ${cycle.period_length} ${t("days")}` : ""}
					</Text>
				</View>
			</View>
		</Swipeable>
	);
}
