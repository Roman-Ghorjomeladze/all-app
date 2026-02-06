import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Person } from "../database";
import { useColors, Colors, spacing } from "../theme";

type PersonListItemProps = {
	person: Person;
	onPress: (person: Person) => void;
};

const genderEmoji: Record<string, string> = {
	male: "\u2642",
	female: "\u2640",
	other: "\u26A5",
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			flexDirection: "row",
			alignItems: "center",
			backgroundColor: colors.cardBackground,
			paddingVertical: 14,
			paddingHorizontal: spacing.md,
			borderRadius: 12,
			marginBottom: spacing.sm,
			borderWidth: 1,
			borderColor: colors.border,
		},
		genderIndicator: {
			width: 4,
			height: 36,
			borderRadius: 2,
			marginRight: 12,
		},
		info: {
			flex: 1,
		},
		name: {
			fontSize: 17,
			fontWeight: "500",
			color: colors.textPrimary,
		},
		date: {
			fontSize: 13,
			color: colors.textSecondary,
			marginTop: 2,
		},
		genderEmoji: {
			fontSize: 18,
			marginRight: 8,
		},
		chevron: {
			fontSize: 22,
			color: colors.textSecondary,
			fontWeight: "300",
		},
	}), [colors]);
}

export default function PersonListItem({ person, onPress }: PersonListItemProps) {
	const colors = useColors();
	const styles = useStyles(colors);

	const genderColor: Record<string, string> = {
		male: colors.male,
		female: colors.female,
		other: colors.other,
	};

	const fullName = [person.first_name, person.last_name].filter(Boolean).join(" ");

	const formatDate = (date: string | null) => {
		if (!date) return null;
		return new Date(date).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const birthStr = formatDate(person.birth_date);
	const deathStr = formatDate(person.death_date);

	let dateInfo = "";
	if (birthStr && deathStr) {
		dateInfo = `${birthStr} \u2014 ${deathStr}`;
	} else if (birthStr) {
		dateInfo = birthStr;
	}

	return (
		<TouchableOpacity style={styles.container} onPress={() => onPress(person)} activeOpacity={0.7}>
			<View style={[styles.genderIndicator, { backgroundColor: genderColor[person.gender] || colors.other }]} />
			<View style={styles.info}>
				<Text style={styles.name} numberOfLines={1}>
					{fullName}
				</Text>
				{dateInfo ? (
					<Text style={styles.date} numberOfLines={1}>
						{dateInfo}
					</Text>
				) : null}
			</View>
			<Text style={[styles.genderEmoji, { color: genderColor[person.gender] || colors.other }]}>
				{genderEmoji[person.gender] || "\u26A5"}
			</Text>
			<Text style={styles.chevron}>{"\u203A"}</Text>
		</TouchableOpacity>
	);
}
