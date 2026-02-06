import React, { useMemo } from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Continent, continents, countries } from "../data/countries";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../i18n";

type Props = {
	selected: Continent | null;
	onSelect: (continent: Continent | null) => void;
};

const continentKeyMap: Record<string, string> = {
	Africa: "flAfrica",
	Asia: "flAsia",
	Europe: "flEurope",
	"North America": "flNorthAmerica",
	"South America": "flSouthAmerica",
	Oceania: "flOceania",
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		scrollView: {
			flexGrow: 0,
		},
		container: {
			paddingHorizontal: spacing.md,
			paddingVertical: spacing.sm,
			gap: spacing.sm,
			alignItems: "center",
		},
		chip: {
			paddingHorizontal: 14,
			paddingVertical: 8,
			borderRadius: 20,
			backgroundColor: colors.chipBackground,
		},
		chipActive: {
			backgroundColor: colors.chipActive,
		},
		chipText: {
			fontSize: 13,
			fontWeight: "600",
			color: colors.textSecondary,
		},
		chipTextActive: {
			color: colors.chipActiveText,
		},
	}), [colors]);
}

export default function ContinentFilter({ selected, onSelect }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const allCount = countries.length;

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.container}
			style={styles.scrollView}
		>
			<TouchableOpacity
				style={[styles.chip, selected === null && styles.chipActive]}
				onPress={() => onSelect(null)}
				activeOpacity={0.7}
			>
				<Text style={[styles.chipText, selected === null && styles.chipTextActive]}>
					{t("flAll")} ({allCount})
				</Text>
			</TouchableOpacity>

			{continents.map((continent) => {
				const count = countries.filter((c) => c.continent === continent).length;
				const isActive = selected === continent;
				return (
					<TouchableOpacity
						key={continent}
						style={[styles.chip, isActive && styles.chipActive]}
						onPress={() => onSelect(continent)}
						activeOpacity={0.7}
					>
						<Text style={[styles.chipText, isActive && styles.chipTextActive]}>
							{t(continentKeyMap[continent])} ({count})
						</Text>
					</TouchableOpacity>
				);
			})}
		</ScrollView>
	);
}
