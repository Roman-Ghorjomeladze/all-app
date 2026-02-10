import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, Pressable, ScrollView } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useColors, Colors, spacing } from "../theme";
import { Cycle } from "../database";
import { useLanguage } from "../../../../i18n";

type EditCycleModalProps = {
	visible: boolean;
	cycle: Cycle | null;
	onClose: () => void;
	onSave: (id: number, startDate: string, endDate: string | null) => void;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		overlay: {
			flex: 1,
			backgroundColor: "rgba(0, 0, 0, 0.5)",
			justifyContent: "flex-end",
		},
		modalContent: {
			backgroundColor: colors.background,
			borderTopLeftRadius: 20,
			borderTopRightRadius: 20,
			padding: spacing.lg,
			paddingBottom: spacing.xl + 20,
		},
		header: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
		},
		title: {
			fontSize: 20,
			fontWeight: "600",
			color: colors.textPrimary,
		},
		closeButton: {
			padding: spacing.sm,
		},
		closeButtonText: {
			fontSize: 20,
			color: colors.textSecondary,
		},
		divider: {
			height: 1,
			backgroundColor: colors.border,
			marginVertical: spacing.md,
		},
		formScroll: {
			maxHeight: 500,
		},
		form: {
			marginBottom: spacing.lg,
		},
		fieldContainer: {
			marginBottom: spacing.md,
		},
		label: {
			fontSize: 14,
			fontWeight: "500",
			color: colors.textSecondary,
			marginBottom: spacing.sm,
		},
		dateButton: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			backgroundColor: colors.cardBackground,
			padding: spacing.md,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: colors.border,
		},
		endDateRow: {
			flexDirection: "row",
			alignItems: "center",
		},
		endDateButton: {
			flex: 1,
		},
		dateButtonText: {
			fontSize: 16,
			color: colors.textPrimary,
		},
		calendarIcon: {
			fontSize: 18,
		},
		clearButton: {
			marginLeft: spacing.sm,
			padding: spacing.sm,
			backgroundColor: colors.textSecondary + "20",
			borderRadius: 8,
		},
		clearButtonText: {
			fontSize: 14,
			color: colors.textSecondary,
		},
		pickerContainer: {
			backgroundColor: colors.cardBackground,
			borderRadius: 12,
			marginBottom: spacing.md,
		},
		pickerDoneButton: {
			alignItems: "center",
			padding: spacing.sm,
			borderTopWidth: 1,
			borderTopColor: colors.border,
		},
		pickerDoneText: {
			color: colors.period,
			fontSize: 16,
			fontWeight: "600",
		},
		saveButton: {
			backgroundColor: colors.period,
			padding: spacing.md,
			borderRadius: 12,
			alignItems: "center",
		},
		saveButtonText: {
			color: colors.white,
			fontSize: 17,
			fontWeight: "600",
		},
	}), [colors]);
}

export default function EditCycleModal({ visible, cycle, onClose, onSave }: EditCycleModalProps) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [startDate, setStartDate] = useState<Date>(cycle ? new Date(cycle.start_date) : new Date());
	const [endDate, setEndDate] = useState<Date | null>(cycle?.end_date ? new Date(cycle.end_date) : null);
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	React.useEffect(() => {
		if (cycle) {
			setStartDate(new Date(cycle.start_date));
			setEndDate(cycle.end_date ? new Date(cycle.end_date) : null);
		}
	}, [cycle]);

	const formatDate = (date: Date) => {
		return date.toLocaleDateString(undefined, {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatDateForDB = (date: Date) => {
		return date.toISOString().split("T")[0];
	};

	const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
		if (Platform.OS === "android") {
			setShowStartPicker(false);
		}
		if (selectedDate) {
			setStartDate(selectedDate);
			if (endDate && selectedDate > endDate) {
				setEndDate(selectedDate);
			}
		}
	};

	const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
		if (Platform.OS === "android") {
			setShowEndPicker(false);
		}
		if (selectedDate) {
			setEndDate(selectedDate);
		}
	};

	const handleSave = () => {
		if (cycle) {
			onSave(cycle.id, formatDateForDB(startDate), endDate ? formatDateForDB(endDate) : null);
		}
		onClose();
	};

	const handleClearEndDate = () => {
		setEndDate(null);
	};

	if (!cycle) return null;

	return (
		<Modal visible={visible} animationType="slide" transparent supportedOrientations={["portrait", "landscape"]} onRequestClose={onClose}>
			<View style={styles.overlay}>
				<Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
					<View style={styles.header}>
						<Text style={styles.title}>{t("editCycle")}</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Text style={styles.closeButtonText}>✕</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.divider} />

					<ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
						<View style={styles.form}>
							{/* Start Date */}
							<View style={styles.fieldContainer}>
								<Text style={styles.label}>{t("startDate")}</Text>
								<TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
									<Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
									<Text style={styles.calendarIcon}>📅</Text>
								</TouchableOpacity>
							</View>

							{showStartPicker && (
								<View style={styles.pickerContainer}>
									<DateTimePicker
										value={startDate}
										mode="date"
										display={Platform.OS === "ios" ? "spinner" : "default"}
										onChange={handleStartDateChange}
										maximumDate={new Date()}
										themeVariant="light"
										textColor={colors.textPrimary}
									/>
									{Platform.OS === "ios" && (
										<TouchableOpacity
											style={styles.pickerDoneButton}
											onPress={() => setShowStartPicker(false)}
										>
											<Text style={styles.pickerDoneText}>{t("done")}</Text>
										</TouchableOpacity>
									)}
								</View>
							)}

							{/* End Date */}
							<View style={styles.fieldContainer}>
								<Text style={styles.label}>{t("endDate")}</Text>
								<View style={styles.endDateRow}>
									<TouchableOpacity
										style={[styles.dateButton, styles.endDateButton]}
										onPress={() => setShowEndPicker(true)}
									>
										<Text style={styles.dateButtonText}>
											{endDate ? formatDate(endDate) : t("notSet")}
										</Text>
										<Text style={styles.calendarIcon}>📅</Text>
									</TouchableOpacity>
									{endDate && (
										<TouchableOpacity style={styles.clearButton} onPress={handleClearEndDate}>
											<Text style={styles.clearButtonText}>✕</Text>
										</TouchableOpacity>
									)}
								</View>
							</View>

							{showEndPicker && (
								<View style={styles.pickerContainer}>
									<DateTimePicker
										value={endDate || startDate}
										mode="date"
										display={Platform.OS === "ios" ? "spinner" : "default"}
										onChange={handleEndDateChange}
										minimumDate={startDate}
										maximumDate={new Date()}
										themeVariant="light"
										textColor={colors.textPrimary}
									/>
									{Platform.OS === "ios" && (
										<TouchableOpacity
											style={styles.pickerDoneButton}
											onPress={() => setShowEndPicker(false)}
										>
											<Text style={styles.pickerDoneText}>{t("done")}</Text>
										</TouchableOpacity>
									)}
								</View>
							)}
						</View>

						<TouchableOpacity style={styles.saveButton} onPress={handleSave}>
							<Text style={styles.saveButtonText}>{t("save")}</Text>
						</TouchableOpacity>
					</ScrollView>
				</Pressable>
			</View>
		</Modal>
	);
}
