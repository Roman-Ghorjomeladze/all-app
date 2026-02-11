import React, { useMemo, useCallback, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, spacing, typography } from "../theme";
import { searchCalorieBook, CalorieEntry } from "../database";
import { useLanguage } from "../../../../i18n";

export type IngredientData = {
	name: string;
	quantity: string;
	unit: string;
	calories_per_100g: number | null;
	quantity_grams: number | null;
};

type ReadOnlyProps = {
	mode: "read";
	name: string;
	quantity?: string | null;
	unit?: string | null;
	calories_per_100g?: number | null;
	quantity_grams?: number | null;
	colors: Colors;
};

type EditProps = {
	mode: "edit";
	data: IngredientData;
	onChange: (data: IngredientData) => void;
	onRemove: () => void;
	colors: Colors;
};

type Props = ReadOnlyProps | EditProps;

export default function IngredientRow(props: Props) {
	const { colors } = props;
	const styles = useStyles(colors);
	const { t } = useLanguage();

	if (props.mode === "read") {
		const kcal =
			props.calories_per_100g && props.quantity_grams
				? Math.round((props.quantity_grams / 100) * props.calories_per_100g)
				: null;

		return (
			<View style={styles.readContainer}>
				<Text style={styles.bullet}>{"\u2022"}</Text>
				<View style={styles.readContent}>
					<Text style={styles.readName}>
						{props.name}
						{props.quantity ? ` — ${props.quantity}` : ""}
						{props.unit ? ` ${props.unit}` : ""}
					</Text>
					{kcal !== null && (
						<Text style={styles.kcalBadge}>{kcal} {t("mpKcal")}</Text>
					)}
				</View>
			</View>
		);
	}

	return <EditIngredientRow {...props} />;
}

function EditIngredientRow({ data, onChange, onRemove, colors }: EditProps) {
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [suggestions, setSuggestions] = useState<CalorieEntry[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);

	const handleNameChange = useCallback(async (text: string) => {
		onChange({ ...data, name: text });
		if (text.trim().length >= 2) {
			const results = await searchCalorieBook(text.trim());
			setSuggestions(results);
			setShowSuggestions(results.length > 0);
		} else {
			setShowSuggestions(false);
		}
	}, [data, onChange]);

	const handleSuggestionSelect = useCallback((entry: CalorieEntry) => {
		onChange({
			...data,
			name: entry.food_name,
			calories_per_100g: entry.calories_per_100g,
		});
		setShowSuggestions(false);
	}, [data, onChange]);

	const calculatedKcal =
		data.calories_per_100g && data.quantity_grams
			? Math.round((data.quantity_grams / 100) * data.calories_per_100g)
			: null;

	return (
		<View style={styles.editContainer}>
			<View style={styles.editRow}>
				<TextInput
					style={[styles.editInput, styles.nameInput]}
					value={data.name}
					onChangeText={handleNameChange}
					placeholder={t("mpIngredientName")}
					placeholderTextColor={colors.textSecondary}
					onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
				/>
				<TextInput
					style={[styles.editInput, styles.qtyInput]}
					value={data.quantity}
					onChangeText={(text) => onChange({ ...data, quantity: text })}
					placeholder={t("mpQty")}
					placeholderTextColor={colors.textSecondary}
				/>
				<TextInput
					style={[styles.editInput, styles.unitInput]}
					value={data.unit}
					onChangeText={(text) => onChange({ ...data, unit: text })}
					placeholder={t("mpUnit")}
					placeholderTextColor={colors.textSecondary}
				/>
				<TouchableOpacity onPress={onRemove} activeOpacity={0.7} style={styles.removeButton}>
					<Ionicons name="close-circle" size={22} color={colors.danger} />
				</TouchableOpacity>
			</View>

			{/* Calorie row */}
			<View style={styles.calorieRow}>
				<TextInput
					style={[styles.editInput, styles.gramsInput]}
					value={data.quantity_grams != null ? String(data.quantity_grams) : ""}
					onChangeText={(text) => onChange({ ...data, quantity_grams: text ? parseFloat(text) || null : null })}
					placeholder={t("mpGrams")}
					placeholderTextColor={colors.textSecondary}
					keyboardType="numeric"
				/>
				<TextInput
					style={[styles.editInput, styles.kcalInput]}
					value={data.calories_per_100g != null ? String(data.calories_per_100g) : ""}
					onChangeText={(text) => onChange({ ...data, calories_per_100g: text ? parseInt(text, 10) || null : null })}
					placeholder={t("mpKcalPer100g")}
					placeholderTextColor={colors.textSecondary}
					keyboardType="numeric"
				/>
				{calculatedKcal !== null && (
					<Text style={styles.calculatedKcal}>= {calculatedKcal} {t("mpKcal")}</Text>
				)}
			</View>

			{/* Auto-suggest dropdown */}
			{showSuggestions && (
				<View style={styles.suggestionsContainer}>
					{suggestions.map((s) => (
						<TouchableOpacity
							key={s.id}
							style={styles.suggestionItem}
							onPress={() => handleSuggestionSelect(s)}
							activeOpacity={0.7}
						>
							<Text style={styles.suggestionName}>{s.food_name}</Text>
							<Text style={styles.suggestionKcal}>{s.calories_per_100g} {t("mpKcal")}/100{t("mpG")}</Text>
						</TouchableOpacity>
					))}
				</View>
			)}
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				// Read mode
				readContainer: {
					flexDirection: "row",
					paddingVertical: spacing.xs,
					gap: spacing.sm,
				},
				bullet: {
					...typography.body,
					color: colors.accent,
					marginTop: 1,
				},
				readContent: {
					flex: 1,
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
				},
				readName: {
					...typography.body,
					color: colors.textPrimary,
					flex: 1,
				},
				kcalBadge: {
					...typography.caption1,
					color: colors.calorieAccent,
					fontWeight: "600",
				},
				// Edit mode
				editContainer: {
					marginBottom: spacing.sm,
				},
				editRow: {
					flexDirection: "row",
					gap: spacing.xs,
					alignItems: "center",
				},
				editInput: {
					...typography.subhead,
					color: colors.textPrimary,
					backgroundColor: colors.inputBackground,
					borderRadius: 8,
					paddingHorizontal: spacing.sm,
					paddingVertical: 8,
					borderWidth: 1,
					borderColor: colors.border,
				},
				nameInput: {
					flex: 3,
				},
				qtyInput: {
					flex: 1,
				},
				unitInput: {
					flex: 1,
				},
				removeButton: {
					padding: 2,
				},
				calorieRow: {
					flexDirection: "row",
					gap: spacing.xs,
					alignItems: "center",
					marginTop: spacing.xs,
					paddingLeft: spacing.xs,
				},
				gramsInput: {
					flex: 1,
				},
				kcalInput: {
					flex: 1,
				},
				calculatedKcal: {
					...typography.caption1,
					color: colors.calorieAccent,
					fontWeight: "600",
					minWidth: 70,
				},
				// Suggestions
				suggestionsContainer: {
					backgroundColor: colors.cardBackground,
					borderRadius: 8,
					borderWidth: 1,
					borderColor: colors.border,
					marginTop: spacing.xs,
					maxHeight: 150,
				},
				suggestionItem: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				suggestionName: {
					...typography.subhead,
					color: colors.textPrimary,
				},
				suggestionKcal: {
					...typography.caption1,
					color: colors.calorieAccent,
				},
			}),
		[colors]
	);
}
