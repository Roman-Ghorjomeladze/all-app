import React, { useState, useMemo } from "react";
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { Person } from "../database";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../../../../i18n";

type RelationshipPickerProps = {
	visible: boolean;
	currentPersonId: number;
	allPersons: Person[];
	existingRelationIds: Set<number>;
	onClose: () => void;
	onSelect: (personId: number, type: "parent-child" | "spouse", role: "parent" | "child" | "spouse") => void;
};

type Step = "selectPerson" | "selectType";

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		overlay: {
			flex: 1,
			backgroundColor: "rgba(0,0,0,0.5)",
			justifyContent: "flex-end",
		},
		content: {
			backgroundColor: colors.background,
			borderTopLeftRadius: 20,
			borderTopRightRadius: 20,
			maxHeight: "70%",
			paddingBottom: 34,
		},
		header: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			padding: spacing.lg,
		},
		title: {
			fontSize: 20,
			fontWeight: "600",
			color: colors.textPrimary,
		},
		closeButton: {
			padding: spacing.sm,
		},
		closeText: {
			fontSize: 20,
			color: colors.textSecondary,
		},
		divider: {
			height: 1,
			backgroundColor: colors.border,
		},
		list: {
			padding: spacing.md,
		},
		personRow: {
			flexDirection: "row",
			alignItems: "center",
			padding: spacing.md,
			backgroundColor: colors.cardBackground,
			borderRadius: 12,
			marginBottom: spacing.sm,
			borderWidth: 1,
			borderColor: colors.border,
		},
		genderDot: {
			width: 10,
			height: 10,
			borderRadius: 5,
			marginRight: 12,
		},
		personName: {
			fontSize: 17,
			color: colors.textPrimary,
		},
		emptyText: {
			fontSize: 15,
			color: colors.textSecondary,
			textAlign: "center",
			padding: spacing.lg,
		},
		typeList: {
			padding: spacing.md,
		},
		typeRow: {
			flexDirection: "row",
			alignItems: "center",
			padding: spacing.md,
			backgroundColor: colors.cardBackground,
			borderRadius: 12,
			marginBottom: spacing.sm,
			borderWidth: 1,
			borderColor: colors.border,
		},
		typeEmoji: {
			fontSize: 24,
			marginRight: 12,
		},
		typeText: {
			fontSize: 17,
			color: colors.textPrimary,
			fontWeight: "500",
		},
	}), [colors]);
}

export default function RelationshipPicker({
	visible,
	currentPersonId,
	allPersons,
	existingRelationIds,
	onClose,
	onSelect,
}: RelationshipPickerProps) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [step, setStep] = useState<Step>("selectPerson");
	const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);

	const availablePersons = allPersons.filter(
		(p) => p.id !== currentPersonId && !existingRelationIds.has(p.id),
	);

	const handlePersonSelect = (personId: number) => {
		setSelectedPersonId(personId);
		setStep("selectType");
	};

	const handleTypeSelect = (role: "parent" | "child" | "spouse") => {
		if (selectedPersonId === null) return;
		const type = role === "spouse" ? "spouse" : "parent-child";
		onSelect(selectedPersonId, type, role);
		handleClose();
	};

	const handleClose = () => {
		setStep("selectPerson");
		setSelectedPersonId(null);
		onClose();
	};

	const genderColor: Record<string, string> = {
		male: colors.male,
		female: colors.female,
		other: colors.other,
	};

	return (
		<Modal visible={visible} transparent animationType="slide" supportedOrientations={["portrait", "landscape"]} onRequestClose={handleClose}>
			<View style={styles.overlay}>
				<View style={styles.content}>
					<View style={styles.header}>
						<Text style={styles.title}>
							{step === "selectPerson" ? t("ftSelectPerson") : t("ftSelectRelationType")}
						</Text>
						<TouchableOpacity onPress={handleClose} style={styles.closeButton}>
							<Text style={styles.closeText}>{"\u2715"}</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.divider} />

					{step === "selectPerson" ? (
						<FlatList
							data={availablePersons}
							keyExtractor={(item) => String(item.id)}
							style={styles.list}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={styles.personRow}
									onPress={() => handlePersonSelect(item.id)}
									activeOpacity={0.7}
								>
									<View
										style={[
											styles.genderDot,
											{ backgroundColor: genderColor[item.gender] || colors.other },
										]}
									/>
									<Text style={styles.personName}>
										{item.first_name} {item.last_name}
									</Text>
								</TouchableOpacity>
							)}
							ListEmptyComponent={
								<Text style={styles.emptyText}>{t("ftNoRelationships")}</Text>
							}
						/>
					) : (
						<View style={styles.typeList}>
							<TouchableOpacity
								style={styles.typeRow}
								onPress={() => handleTypeSelect("parent")}
								activeOpacity={0.7}
							>
								<Text style={styles.typeEmoji}>{"\uD83D\uDC68\u200D\uD83D\uDC69"}</Text>
								<Text style={styles.typeText}>{t("ftAsParent")}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.typeRow}
								onPress={() => handleTypeSelect("child")}
								activeOpacity={0.7}
							>
								<Text style={styles.typeEmoji}>{"\uD83D\uDC76"}</Text>
								<Text style={styles.typeText}>{t("ftAsChild")}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.typeRow}
								onPress={() => handleTypeSelect("spouse")}
								activeOpacity={0.7}
							>
								<Text style={styles.typeEmoji}>{"\uD83D\uDC8D"}</Text>
								<Text style={styles.typeText}>{t("ftAsSpouse")}</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</View>
		</Modal>
	);
}
