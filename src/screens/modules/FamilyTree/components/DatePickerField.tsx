import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useColors, Colors, spacing } from "../theme";

type DatePickerFieldProps = {
	label: string;
	value: string | null;
	onChange: (date: string | null) => void;
	placeholder?: string;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			marginBottom: spacing.md,
		},
		label: {
			fontSize: 14,
			fontWeight: "500",
			color: colors.textSecondary,
			marginBottom: spacing.sm,
		},
		row: {
			flexDirection: "row",
			alignItems: "center",
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
		dateButtonFlex: {
			flex: 1,
		},
		dateText: {
			fontSize: 16,
			color: colors.textPrimary,
		},
		placeholder: {
			color: colors.textSecondary,
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
		clearText: {
			fontSize: 14,
			color: colors.textSecondary,
		},
		modalOverlay: {
			flex: 1,
			justifyContent: "flex-end",
			backgroundColor: "rgba(0,0,0,0.4)",
		},
		modalContent: {
			backgroundColor: colors.cardBackground,
			borderTopLeftRadius: 20,
			borderTopRightRadius: 20,
			paddingBottom: 34,
		},
		modalHeader: {
			flexDirection: "row",
			justifyContent: "space-between",
			padding: spacing.md,
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
		},
		modalCancel: {
			fontSize: 16,
			color: colors.textSecondary,
		},
		modalDone: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.accent,
		},
	}), [colors]);
}

export default function DatePickerField({ label, value, onChange, placeholder }: DatePickerFieldProps) {
	const colors = useColors();
	const styles = useStyles(colors);
	const [showPicker, setShowPicker] = useState(false);

	const dateValue = value ? new Date(value) : new Date();

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

	const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
		if (Platform.OS === "android") {
			setShowPicker(false);
			if (event.type === "dismissed") return;
		}
		if (selectedDate) {
			onChange(formatDateForDB(selectedDate));
		}
	};

	const handleClear = () => {
		onChange(null);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.label}>{label}</Text>
			<View style={styles.row}>
				<TouchableOpacity
					style={[styles.dateButton, styles.dateButtonFlex]}
					onPress={() => setShowPicker(true)}
					activeOpacity={0.7}
				>
					<Text style={[styles.dateText, !value && styles.placeholder]}>
						{value ? formatDate(new Date(value)) : placeholder || "Not set"}
					</Text>
					<Text style={styles.calendarIcon}>{"\uD83D\uDCC5"}</Text>
				</TouchableOpacity>
				{value && (
					<TouchableOpacity style={styles.clearButton} onPress={handleClear}>
						<Text style={styles.clearText}>{"\u2715"}</Text>
					</TouchableOpacity>
				)}
			</View>

			{showPicker && Platform.OS === "ios" && (
				<Modal transparent animationType="slide">
					<View style={styles.modalOverlay}>
						<View style={styles.modalContent}>
							<View style={styles.modalHeader}>
								<TouchableOpacity onPress={() => setShowPicker(false)}>
									<Text style={styles.modalCancel}>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() => {
										setShowPicker(false);
									}}
								>
									<Text style={styles.modalDone}>Done</Text>
								</TouchableOpacity>
							</View>
							<DateTimePicker
								value={dateValue}
								mode="date"
								display="spinner"
								onChange={handleDateChange}
								themeVariant="light"
								textColor={colors.textPrimary}
							/>
						</View>
					</View>
				</Modal>
			)}

			{showPicker && Platform.OS === "android" && (
				<DateTimePicker
					value={dateValue}
					mode="date"
					display="default"
					onChange={handleDateChange}
				/>
			)}
		</View>
	);
}
