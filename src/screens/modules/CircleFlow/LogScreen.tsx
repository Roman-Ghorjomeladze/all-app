import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	SafeAreaView,
	TextInput,
	Alert,
	KeyboardAvoidingView,
	Platform,
	Modal,
	Pressable,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import SymptomChip from "./components/SymptomChip";
import MoodSelector from "./components/MoodSelector";
import { useColors, Colors, typography, spacing } from "./theme";
import { useLanguage } from "../../../i18n";
import { initDatabase, saveDailyLog, getDailyLog, DailyLog } from "./database";
import { CircleFlowTabParamList } from "../../../types/navigation";

type LogScreenRouteProp = RouteProp<CircleFlowTabParamList, "CircleFlowLog">;

const SYMPTOMS = [
	{ key: "Cramps", labelKey: "symptomCramps" },
	{ key: "Bloating", labelKey: "symptomBloating" },
	{ key: "Acne", labelKey: "symptomAcne" },
	{ key: "Fatigue", labelKey: "symptomFatigue" },
	{ key: "Headache", labelKey: "symptomHeadache" },
	{ key: "Breast tenderness", labelKey: "symptomBreastTenderness" },
	{ key: "Back pain", labelKey: "symptomBackPain" },
	{ key: "Nausea", labelKey: "symptomNausea" },
	{ key: "Cravings", labelKey: "symptomCravings" },
	{ key: "Insomnia", labelKey: "symptomInsomnia" },
];

const FLOW_OPTIONS: { key: DailyLog["flow_intensity"]; labelKey: string }[] = [
	{ key: "light", labelKey: "flowLight" },
	{ key: "medium", labelKey: "flowMedium" },
	{ key: "heavy", labelKey: "flowHeavy" },
];

function toDateString(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background,
		},
		keyboardView: {
			flex: 1,
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
			alignItems: "center",
			paddingTop: spacing.lg,
			paddingBottom: spacing.md,
		},
		title: {
			...typography.title2,
			color: colors.textPrimary,
		},
		dateNav: {
			flexDirection: "row",
			alignItems: "center",
			marginTop: spacing.sm,
			gap: spacing.md,
		},
		dateArrow: {
			width: 36,
			height: 36,
			borderRadius: 18,
			backgroundColor: colors.cardBackground,
			justifyContent: "center",
			alignItems: "center",
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 1 },
			shadowOpacity: 0.1,
			shadowRadius: 2,
			elevation: 1,
		},
		dateArrowText: {
			fontSize: 24,
			fontWeight: "500",
			color: colors.period,
			marginTop: -2,
		},
		dateArrowDisabled: {
			color: colors.border,
		},
		dateTouchable: {
			alignItems: "center",
		},
		dateText: {
			...typography.subhead,
			color: colors.textPrimary,
			fontWeight: "600",
			textAlign: "center",
		},
		todayLabel: {
			...typography.caption1,
			color: colors.period,
			textAlign: "center",
			marginTop: 2,
		},
		tapToPickLabel: {
			fontSize: 12,
			textAlign: "center",
			marginTop: 2,
		},
		section: {
			marginTop: spacing.lg,
			paddingHorizontal: spacing.lg,
		},
		sectionTitle: {
			...typography.headline,
			color: colors.textPrimary,
			marginBottom: spacing.md,
		},
		flowOptions: {
			flexDirection: "row",
			gap: spacing.sm,
		},
		flowOption: {
			flex: 1,
			paddingVertical: spacing.md,
			backgroundColor: colors.cardBackground,
			borderRadius: 12,
			alignItems: "center",
			borderWidth: 1,
			borderColor: colors.border,
		},
		flowOptionSelected: {
			backgroundColor: colors.period,
			borderColor: colors.period,
		},
		flowOptionText: {
			...typography.subhead,
			color: colors.textPrimary,
		},
		flowOptionTextSelected: {
			color: colors.white,
			fontWeight: "600",
		},
		symptomsGrid: {
			flexDirection: "row",
			flexWrap: "wrap",
		},
		notesInput: {
			backgroundColor: colors.cardBackground,
			borderRadius: 12,
			padding: spacing.md,
			minHeight: 120,
			...typography.body,
			color: colors.textPrimary,
			borderWidth: 1,
			borderColor: colors.border,
		},
		saveButton: {
			marginHorizontal: spacing.lg,
			marginTop: spacing.xl,
			paddingVertical: spacing.md,
			backgroundColor: colors.period,
			borderRadius: 12,
			alignItems: "center",
		},
		saveButtonDisabled: {
			opacity: 0.6,
		},
		saveButtonText: {
			...typography.headline,
			color: colors.white,
		},

		// Date Picker Modal (iOS)
		pickerOverlay: {
			flex: 1,
			backgroundColor: "rgba(0, 0, 0, 0.4)",
			justifyContent: "flex-end",
		},
		pickerModal: {
			backgroundColor: colors.cardBackground,
			borderTopLeftRadius: 16,
			borderTopRightRadius: 16,
			paddingBottom: 20,
		},
		pickerHeader: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			paddingHorizontal: spacing.lg,
			paddingVertical: spacing.md,
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
		},
		pickerCancelText: {
			...typography.body,
			color: colors.textSecondary,
		},
		pickerDoneText: {
			...typography.body,
			color: colors.period,
			fontWeight: "600",
		},
	}), [colors]);
}

export default function LogScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const route = useRoute<LogScreenRouteProp>();

	const today = new Date();
	const dateParam = route.params?.date;
	const initialDate = dateParam ? new Date(dateParam) : today;

	const [currentDate, setCurrentDate] = useState<Date>(initialDate);
	const dateString = toDateString(currentDate);
	const isToday = isSameDay(currentDate, today);

	const [flowIntensity, setFlowIntensity] = useState<DailyLog["flow_intensity"]>(null);
	const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
	const [mood, setMood] = useState<DailyLog["mood"]>(null);
	const [notes, setNotes] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// Date picker state
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [tempPickerDate, setTempPickerDate] = useState<Date>(currentDate);

	// Reset to param date if it changes from outside
	useEffect(() => {
		if (dateParam) {
			setCurrentDate(new Date(dateParam));
		}
	}, [dateParam]);

	const loadExistingLog = useCallback(async () => {
		setIsLoading(true);
		try {
			await initDatabase();
			const existingLog = await getDailyLog(dateString);

			if (existingLog) {
				setFlowIntensity(existingLog.flow_intensity);
				setSelectedSymptoms(existingLog.symptoms || []);
				setMood(existingLog.mood);
				setNotes(existingLog.notes || "");
			} else {
				setFlowIntensity(null);
				setSelectedSymptoms([]);
				setMood(null);
				setNotes("");
			}
		} catch (error) {
			console.error("Error loading log:", error);
		} finally {
			setIsLoading(false);
		}
	}, [dateString]);

	useEffect(() => {
		loadExistingLog();
	}, [loadExistingLog]);

	const goToPreviousDay = () => {
		const prev = new Date(currentDate);
		prev.setDate(prev.getDate() - 1);
		setCurrentDate(prev);
	};

	const goToNextDay = () => {
		const next = new Date(currentDate);
		next.setDate(next.getDate() + 1);
		if (next <= today) {
			setCurrentDate(next);
		}
	};

	const openDatePicker = () => {
		setTempPickerDate(currentDate);
		setShowDatePicker(true);
	};

	const handleDatePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
		if (Platform.OS === "android") {
			setShowDatePicker(false);
			if (event.type === "set" && selectedDate) {
				setCurrentDate(selectedDate);
			}
		} else if (selectedDate) {
			setTempPickerDate(selectedDate);
		}
	};

	const confirmDatePicker = () => {
		setCurrentDate(tempPickerDate);
		setShowDatePicker(false);
	};

	const cancelDatePicker = () => {
		setShowDatePicker(false);
	};

	const toggleSymptom = (symptom: string) => {
		setSelectedSymptoms((prev) =>
			prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
		);
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await saveDailyLog(dateString, flowIntensity, selectedSymptoms, mood, notes || null);
			Alert.alert(t("saved"), t("logSavedMessage"), [{ text: t("ok") }]);
		} catch (error) {
			console.error("Error saving log:", error);
			Alert.alert(t("error"), t("logSaveError"));
		} finally {
			setIsSaving(false);
		}
	};

	const getMonthName = (month: number): string => {
		const monthKeys = [
			"january", "february", "march", "april", "may", "june",
			"july", "august", "september", "october", "november", "december",
		];
		return t(monthKeys[month - 1]);
	};

	const formatDisplayDate = (date: Date): string => {
		const day = date.getDate();
		const month = getMonthName(date.getMonth() + 1);
		const year = date.getFullYear();
		return `${day} ${month}, ${year}`;
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

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
				<ScrollView contentContainerStyle={styles.scrollContent}>
					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.title}>{t("logEntry")}</Text>

						{/* Date Navigation */}
						<View style={styles.dateNav}>
							<TouchableOpacity style={styles.dateArrow} onPress={goToPreviousDay}>
								<Text style={styles.dateArrowText}>&#8249;</Text>
							</TouchableOpacity>

							<TouchableOpacity onPress={openDatePicker} style={styles.dateTouchable}>
								<Text style={styles.dateText}>{formatDisplayDate(currentDate)}</Text>
								{isToday ? (
									<Text style={styles.todayLabel}>{t("today")}</Text>
								) : (
									<Text style={styles.tapToPickLabel}>&#128197;</Text>
								)}
							</TouchableOpacity>

							<TouchableOpacity style={styles.dateArrow} onPress={goToNextDay} disabled={isToday}>
								<Text style={[styles.dateArrowText, isToday && styles.dateArrowDisabled]}>&#8250;</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* Android date picker renders inline */}
					{Platform.OS === "android" && showDatePicker && (
						<DateTimePicker
							value={currentDate}
							mode="date"
							display="default"
							onChange={handleDatePickerChange}
							maximumDate={new Date()}
						/>
					)}

					{/* Flow Intensity */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("flowIntensity")}</Text>
						<View style={styles.flowOptions}>
							{FLOW_OPTIONS.map((option) => (
								<TouchableOpacity
									key={option.key}
									style={[styles.flowOption, flowIntensity === option.key && styles.flowOptionSelected]}
									onPress={() => setFlowIntensity(flowIntensity === option.key ? null : option.key)}
									activeOpacity={0.7}
								>
									<Text
										style={[
											styles.flowOptionText,
											flowIntensity === option.key && styles.flowOptionTextSelected,
										]}
									>
										{t(option.labelKey)}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>

					{/* Symptoms */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("symptoms")}</Text>
						<View style={styles.symptomsGrid}>
							{SYMPTOMS.map((symptom) => (
								<SymptomChip
									key={symptom.key}
									label={t(symptom.labelKey)}
									selected={selectedSymptoms.includes(symptom.key)}
									onPress={() => toggleSymptom(symptom.key)}
								/>
							))}
						</View>
					</View>

					{/* Mood */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("mood")}</Text>
						<MoodSelector selectedMood={mood} onSelect={(m) => setMood(mood === m ? null : m)} />
					</View>

					{/* Notes */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("notes")}</Text>
						<TextInput
							style={styles.notesInput}
							placeholder={t("notesPlaceholder")}
							placeholderTextColor={colors.textSecondary}
							value={notes}
							onChangeText={setNotes}
							multiline
							numberOfLines={4}
							textAlignVertical="top"
						/>
					</View>

					{/* Save Button */}
					<TouchableOpacity
						style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
						onPress={handleSave}
						disabled={isSaving}
						activeOpacity={0.8}
					>
						<Text style={styles.saveButtonText}>{isSaving ? t("saving") : t("saveLog")}</Text>
					</TouchableOpacity>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* iOS Date Picker Modal */}
			{Platform.OS === "ios" && (
				<Modal visible={showDatePicker} animationType="fade" transparent supportedOrientations={["portrait", "landscape"]} onRequestClose={cancelDatePicker}>
					<Pressable style={styles.pickerOverlay} onPress={cancelDatePicker}>
						<Pressable style={styles.pickerModal} onPress={(e) => e.stopPropagation()}>
							<View style={styles.pickerHeader}>
								<TouchableOpacity onPress={cancelDatePicker}>
									<Text style={styles.pickerCancelText}>{t("cancel")}</Text>
								</TouchableOpacity>
								<TouchableOpacity onPress={confirmDatePicker}>
									<Text style={styles.pickerDoneText}>{t("done")}</Text>
								</TouchableOpacity>
							</View>
							<DateTimePicker
								value={tempPickerDate}
								mode="date"
								display="spinner"
								onChange={handleDatePickerChange}
								maximumDate={new Date()}
								themeVariant="light"
								textColor={colors.textPrimary}
							/>
						</Pressable>
					</Pressable>
				</Modal>
			)}
		</SafeAreaView>
	);
}
