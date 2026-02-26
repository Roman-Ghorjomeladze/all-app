import React, { useMemo } from "react";
import { TouchableOpacity, Text, View, StyleSheet, Dimensions } from "react-native";
import { Country } from "../data/countries";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../i18n";
import CountryFlag from "./CountryFlag";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.75;
const CARD_HEIGHT = CARD_WIDTH * 0.7;

type Props = {
	country: Country;
	onPress: (country: Country) => void;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		card: {
			width: CARD_WIDTH,
			height: CARD_HEIGHT,
			backgroundColor: colors.cardBackground,
			borderRadius: 20,
			justifyContent: "center",
			alignItems: "center",
			marginHorizontal: spacing.sm,
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.12,
			shadowRadius: 10,
			elevation: 6,
		},
		flagContainer: {
			marginBottom: spacing.md,
			borderRadius: 8,
			overflow: "hidden",
		},
		name: {
			fontSize: 20,
			fontWeight: "600",
			color: colors.textPrimary,
			paddingHorizontal: spacing.md,
			textAlign: "center",
		},
	}), [colors]);
}

export default function FlagCard({ country, onPress }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { language } = useLanguage();

	return (
		<TouchableOpacity
			style={styles.card}
			onPress={() => onPress(country)}
			activeOpacity={0.85}
		>
			<View style={styles.flagContainer}>
				<CountryFlag code={country.code} width={120} />
			</View>
			<Text style={styles.name} numberOfLines={1}>
				{country.name[language]}
			</Text>
		</TouchableOpacity>
	);
}
