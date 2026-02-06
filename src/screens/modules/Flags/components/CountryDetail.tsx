import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Country } from "../data/countries";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../i18n";

type Props = {
	country: Country;
	onClose: () => void;
};

function formatPopulation(pop: number): string {
	if (pop >= 1_000_000_000) {
		return (pop / 1_000_000_000).toFixed(2) + "B";
	}
	if (pop >= 1_000_000) {
		return (pop / 1_000_000).toFixed(1) + "M";
	}
	if (pop >= 1_000) {
		return (pop / 1_000).toFixed(0) + "K";
	}
	return pop.toString();
}

function formatArea(area: number): string {
	return area.toLocaleString();
}

const continentEmoji: Record<string, string> = {
	Africa: "\u{1F30D}",
	Asia: "\u{1F30F}",
	Europe: "\u{1F30D}",
	"North America": "\u{1F30E}",
	"South America": "\u{1F30E}",
	Oceania: "\u{1F30F}",
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			backgroundColor: colors.cardBackground,
			borderRadius: 24,
			padding: spacing.lg,
			alignItems: "center",
			marginHorizontal: spacing.md,
			width: "92%",
		},
		closeButton: {
			position: "absolute",
			top: spacing.md,
			right: spacing.md,
			width: 32,
			height: 32,
			borderRadius: 16,
			backgroundColor: colors.chipBackground,
			justifyContent: "center",
			alignItems: "center",
		},
		closeText: {
			fontSize: 16,
			color: colors.textSecondary,
			fontWeight: "600",
		},
		flag: {
			fontSize: 100,
			marginTop: spacing.sm,
			marginBottom: spacing.md,
		},
		name: {
			fontSize: 24,
			fontWeight: "700",
			color: colors.textPrimary,
			textAlign: "center",
			marginBottom: spacing.xs,
		},
		continent: {
			fontSize: 14,
			color: colors.textSecondary,
			marginBottom: spacing.lg,
		},
		infoContainer: {
			width: "100%",
			backgroundColor: colors.background,
			borderRadius: 16,
			paddingVertical: spacing.sm,
			paddingHorizontal: spacing.md,
		},
		infoRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			paddingVertical: 12,
		},
		infoLabel: {
			fontSize: 15,
			color: colors.textSecondary,
			fontWeight: "500",
		},
		infoValue: {
			fontSize: 15,
			color: colors.textPrimary,
			fontWeight: "600",
		},
		divider: {
			height: 1,
			backgroundColor: colors.border,
			opacity: 0.5,
		},
	}), [colors]);
}

export default function CountryDetail({ country, onClose }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { language, t } = useLanguage();

	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
				<Text style={styles.closeText}>✕</Text>
			</TouchableOpacity>

			<Text style={styles.flag}>{country.flag}</Text>
			<Text style={styles.name}>{country.name[language]}</Text>
			<Text style={styles.continent}>
				{continentEmoji[country.continent] || "\u{1F30D}"} {country.continent}
			</Text>

			<View style={styles.infoContainer}>
				<View style={styles.infoRow}>
					<Text style={styles.infoLabel}>{t("flCapital")}</Text>
					<Text style={styles.infoValue}>{country.capital[language]}</Text>
				</View>
				<View style={styles.divider} />
				<View style={styles.infoRow}>
					<Text style={styles.infoLabel}>{t("flPopulation")}</Text>
					<Text style={styles.infoValue}>{formatPopulation(country.population)}</Text>
				</View>
				<View style={styles.divider} />
				<View style={styles.infoRow}>
					<Text style={styles.infoLabel}>{t("flArea")}</Text>
					<Text style={styles.infoValue}>
						{formatArea(country.area)} {t("flAreaUnit")}
					</Text>
				</View>
			</View>
		</View>
	);
}
