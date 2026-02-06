import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
	SafeAreaView,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FamilyTreeStackParamList } from "../../../types/navigation";
import { useColors, Colors, spacing } from "./theme";
import { useLanguage } from "../../../i18n";
import {
	createPerson,
	updatePerson,
	deletePerson,
	getPersonById,
	getAllPersons,
	addRelationship,
	removeRelationship,
	getPersonRelationships,
	PersonRelationship,
	Person,
} from "./database";
import GenderPicker from "./components/GenderPicker";
import DatePickerField from "./components/DatePickerField";
import RelationshipPicker from "./components/RelationshipPicker";

type Props = NativeStackScreenProps<FamilyTreeStackParamList, "FamilyTreePerson">;

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		safeArea: {
			flex: 1,
			backgroundColor: colors.background,
		},
		flex: {
			flex: 1,
		},
		header: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			paddingHorizontal: spacing.md,
			paddingVertical: 14,
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
			backgroundColor: colors.cardBackground,
		},
		cancelText: {
			fontSize: 17,
			color: colors.textSecondary,
		},
		headerTitle: {
			fontSize: 17,
			fontWeight: "600",
			color: colors.textPrimary,
		},
		saveText: {
			fontSize: 17,
			fontWeight: "600",
			color: colors.accent,
		},
		savingText: {
			color: colors.textSecondary,
		},
		scroll: {
			flex: 1,
		},
		scrollContent: {
			padding: spacing.md,
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
		input: {
			backgroundColor: colors.cardBackground,
			padding: spacing.md,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: colors.border,
			fontSize: 16,
			color: colors.textPrimary,
		},
		bioInput: {
			minHeight: 100,
			paddingTop: spacing.md,
		},
		relSection: {
			marginTop: spacing.md,
			marginBottom: spacing.md,
		},
		relHeader: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			marginBottom: spacing.md,
		},
		relTitle: {
			fontSize: 18,
			fontWeight: "600",
			color: colors.textPrimary,
		},
		addRelButton: {
			padding: spacing.sm,
		},
		addRelText: {
			fontSize: 15,
			fontWeight: "500",
			color: colors.accent,
		},
		noRelsText: {
			fontSize: 15,
			color: colors.textSecondary,
			textAlign: "center",
			padding: spacing.lg,
		},
		relRow: {
			flexDirection: "row",
			alignItems: "center",
			backgroundColor: colors.cardBackground,
			padding: 12,
			borderRadius: 12,
			marginBottom: spacing.sm,
			borderWidth: 1,
			borderColor: colors.border,
		},
		relBadge: {
			paddingHorizontal: 10,
			paddingVertical: 4,
			borderRadius: 8,
			marginRight: 10,
		},
		relBadgeText: {
			fontSize: 12,
			fontWeight: "600",
		},
		relName: {
			flex: 1,
			fontSize: 16,
			color: colors.textPrimary,
		},
		relRemove: {
			padding: 6,
		},
		relRemoveText: {
			fontSize: 14,
			color: colors.danger,
		},
		deleteButton: {
			marginTop: spacing.lg,
			padding: spacing.md,
			borderRadius: 12,
			backgroundColor: colors.danger + "15",
			alignItems: "center",
		},
		deleteText: {
			fontSize: 17,
			fontWeight: "600",
			color: colors.danger,
		},
		bottomPadding: {
			height: 40,
		},
	}), [colors]);
}

export default function PersonScreen({ navigation, route }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const params = route.params;
	const isEditMode = params.mode === "edit";
	const treeId = params.treeId;
	const personId = isEditMode ? params.personId : undefined;
	const parentId = !isEditMode ? params.parentId : undefined;

	// Form state
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [gender, setGender] = useState<"male" | "female" | "other">("other");
	const [birthDate, setBirthDate] = useState<string | null>(null);
	const [deathDate, setDeathDate] = useState<string | null>(null);
	const [bio, setBio] = useState("");
	const [imageUrl, setImageUrl] = useState("");

	// Relationships (edit mode only)
	const [relationships, setRelationships] = useState<PersonRelationship[]>([]);
	const [allPersons, setAllPersons] = useState<Person[]>([]);
	const [showRelPicker, setShowRelPicker] = useState(false);
	const [saving, setSaving] = useState(false);

	const loadPerson = useCallback(async () => {
		if (!isEditMode || !personId) return;
		const person = await getPersonById(personId);
		if (person) {
			setFirstName(person.first_name);
			setLastName(person.last_name);
			setGender(person.gender);
			setBirthDate(person.birth_date);
			setDeathDate(person.death_date);
			setBio(person.bio || "");
			setImageUrl(person.image_url || "");
		}
	}, [isEditMode, personId]);

	const loadRelationships = useCallback(async () => {
		if (!isEditMode || !personId) return;
		const rels = await getPersonRelationships(personId);
		setRelationships(rels);
	}, [isEditMode, personId]);

	const loadAllPersons = useCallback(async () => {
		const persons = await getAllPersons(treeId);
		setAllPersons(persons);
	}, [treeId]);

	useEffect(() => {
		loadPerson();
		loadRelationships();
		loadAllPersons();
	}, [loadPerson, loadRelationships, loadAllPersons]);

	const handleSave = async () => {
		if (!firstName.trim()) {
			Alert.alert(t("error"), t("ftFirstName"));
			return;
		}

		setSaving(true);
		try {
			if (isEditMode && personId) {
				await updatePerson(
					personId,
					firstName.trim(),
					lastName.trim(),
					gender,
					birthDate,
					deathDate,
					bio.trim() || null,
					imageUrl.trim() || null,
				);
			} else {
				const newId = await createPerson(
					treeId,
					firstName.trim(),
					lastName.trim(),
					gender,
					birthDate,
					deathDate,
					bio.trim() || null,
					imageUrl.trim() || null,
				);

				// If parentId is provided, auto-create parent-child relationship
				if (parentId) {
					await addRelationship(parentId, newId, "parent-child");
				}
			}
			navigation.goBack();
		} catch (error) {
			Alert.alert(t("error"), String(error));
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = () => {
		if (!personId) return;
		Alert.alert(t("ftDeletePerson"), t("ftDeletePersonConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("delete"),
				style: "destructive",
				onPress: async () => {
					await deletePerson(personId);
					navigation.goBack();
				},
			},
		]);
	};

	const handleAddRelationship = async (
		targetPersonId: number,
		type: "parent-child" | "spouse",
		role: "parent" | "child" | "spouse",
	) => {
		if (!personId) return;
		try {
			if (role === "parent") {
				// Target is parent of current person
				await addRelationship(targetPersonId, personId, "parent-child");
			} else if (role === "child") {
				// Target is child of current person
				await addRelationship(personId, targetPersonId, "parent-child");
			} else {
				// Spouse
				await addRelationship(personId, targetPersonId, "spouse");
			}
			loadRelationships();
		} catch (error) {
			Alert.alert(t("error"), String(error));
		}
	};

	const handleRemoveRelationship = (relId: number) => {
		Alert.alert(t("delete"), t("deleteConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("delete"),
				style: "destructive",
				onPress: async () => {
					await removeRelationship(relId);
					loadRelationships();
				},
			},
		]);
	};

	const existingRelationIds = new Set(relationships.map((r) => r.person.id));

	const roleLabel = (type: "parent" | "child" | "spouse") => {
		switch (type) {
			case "parent":
				return t("ftParent");
			case "child":
				return t("ftChild");
			case "spouse":
				return t("ftSpouse");
		}
	};

	const roleColor = (type: "parent" | "child" | "spouse") => {
		switch (type) {
			case "parent":
				return colors.parentChild;
			case "child":
				return colors.accent;
			case "spouse":
				return colors.spouse;
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.cancelText}>{t("cancel")}</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>
						{isEditMode ? t("ftEditPerson") : t("ftAddPerson")}
					</Text>
					<TouchableOpacity onPress={handleSave} disabled={saving}>
						<Text style={[styles.saveText, saving && styles.savingText]}>
							{saving ? t("saving") : t("save")}
						</Text>
					</TouchableOpacity>
				</View>

				<ScrollView
					style={styles.scroll}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
				>
					{/* First Name */}
					<View style={styles.fieldContainer}>
						<Text style={styles.label}>{t("ftFirstName")}</Text>
						<TextInput
							style={styles.input}
							value={firstName}
							onChangeText={setFirstName}
							placeholder={t("ftFirstName")}
							placeholderTextColor={colors.textSecondary}
							autoFocus={!isEditMode}
						/>
					</View>

					{/* Last Name */}
					<View style={styles.fieldContainer}>
						<Text style={styles.label}>{t("ftLastName")}</Text>
						<TextInput
							style={styles.input}
							value={lastName}
							onChangeText={setLastName}
							placeholder={t("ftLastName")}
							placeholderTextColor={colors.textSecondary}
						/>
					</View>

					{/* Gender */}
					<GenderPicker value={gender} onChange={setGender} />

					{/* Birth Date */}
					<DatePickerField
						label={t("ftBirthDate")}
						value={birthDate}
						onChange={setBirthDate}
					/>

					{/* Death Date */}
					<DatePickerField
						label={t("ftDeathDate")}
						value={deathDate}
						onChange={setDeathDate}
					/>

					{/* Bio */}
					<View style={styles.fieldContainer}>
						<Text style={styles.label}>{t("ftBio")}</Text>
						<TextInput
							style={[styles.input, styles.bioInput]}
							value={bio}
							onChangeText={setBio}
							placeholder={t("ftBioPlaceholder")}
							placeholderTextColor={colors.textSecondary}
							multiline
							textAlignVertical="top"
						/>
					</View>

					{/* Image URL */}
					<View style={styles.fieldContainer}>
						<Text style={styles.label}>{t("ftImageUrl")}</Text>
						<TextInput
							style={styles.input}
							value={imageUrl}
							onChangeText={setImageUrl}
							placeholder={t("ftImageUrlPlaceholder")}
							placeholderTextColor={colors.textSecondary}
							autoCapitalize="none"
							keyboardType="url"
						/>
					</View>

					{/* Relationships Section (edit mode only) */}
					{isEditMode && (
						<View style={styles.relSection}>
							<View style={styles.relHeader}>
								<Text style={styles.relTitle}>{t("ftRelationships")}</Text>
								<TouchableOpacity
									style={styles.addRelButton}
									onPress={() => setShowRelPicker(true)}
								>
									<Text style={styles.addRelText}>+ {t("ftAddRelationship")}</Text>
								</TouchableOpacity>
							</View>

							{relationships.length === 0 ? (
								<Text style={styles.noRelsText}>{t("ftNoRelationships")}</Text>
							) : (
								relationships.map((rel) => (
									<View key={rel.relationshipId} style={styles.relRow}>
										<View
											style={[styles.relBadge, { backgroundColor: roleColor(rel.type) + "20" }]}
										>
											<Text style={[styles.relBadgeText, { color: roleColor(rel.type) }]}>
												{roleLabel(rel.type)}
											</Text>
										</View>
										<Text style={styles.relName} numberOfLines={1}>
											{rel.person.first_name} {rel.person.last_name}
										</Text>
										<TouchableOpacity
											onPress={() => handleRemoveRelationship(rel.relationshipId)}
											style={styles.relRemove}
										>
											<Text style={styles.relRemoveText}>✕</Text>
										</TouchableOpacity>
									</View>
								))
							)}
						</View>
					)}

					{/* Delete Button (edit mode only) */}
					{isEditMode && (
						<TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
							<Text style={styles.deleteText}>{t("ftDeletePerson")}</Text>
						</TouchableOpacity>
					)}

					<View style={styles.bottomPadding} />
				</ScrollView>

				{/* Relationship Picker Modal */}
				{isEditMode && personId && (
					<RelationshipPicker
						visible={showRelPicker}
						currentPersonId={personId}
						allPersons={allPersons}
						existingRelationIds={existingRelationIds}
						onClose={() => setShowRelPicker(false)}
						onSelect={handleAddRelationship}
					/>
				)}
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
