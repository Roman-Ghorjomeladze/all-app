import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FamilyTreeStackParamList } from "../../../types/navigation";
import { useColors, Colors, spacing } from "./theme";
import { useLanguage } from "../../../i18n";
import { getAllPersons, Person } from "./database";
import PersonListItem from "./components/PersonListItem";

type Props = NativeStackScreenProps<FamilyTreeStackParamList, "FamilyTreeList">;

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				safeArea: {
					flex: 1,
					backgroundColor: colors.background,
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
				backText: {
					fontSize: 32,
					color: colors.accent,
					fontWeight: "300",
					marginTop: -4,
				},
				headerTitle: {
					fontSize: 17,
					fontWeight: "600",
					color: colors.textPrimary,
				},
				addText: {
					fontSize: 28,
					color: colors.accent,
					fontWeight: "400",
				},
				searchContainer: {
					padding: spacing.md,
				},
				searchInput: {
					backgroundColor: colors.cardBackground,
					padding: 12,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: colors.border,
					fontSize: 16,
					color: colors.textPrimary,
				},
				countText: {
					fontSize: 13,
					color: colors.textSecondary,
					paddingHorizontal: spacing.md,
					marginBottom: spacing.sm,
				},
				listContent: {
					paddingHorizontal: spacing.md,
					paddingBottom: 40,
				},
				emptyContainer: {
					alignItems: "center",
					paddingTop: 80,
				},
				emptyEmoji: {
					fontSize: 48,
					marginBottom: spacing.md,
				},
				emptyText: {
					fontSize: 17,
					color: colors.textSecondary,
				},
			}),
		[colors],
	);
}

export default function ListScreen({ navigation, route }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const { treeId } = route.params;
	const [persons, setPersons] = useState<Person[]>([]);
	const [search, setSearch] = useState("");

	useFocusEffect(
		useCallback(() => {
			loadPersons();
		}, [treeId]),
	);

	const loadPersons = async () => {
		const data = await getAllPersons(treeId);
		setPersons(data);
	};

	const filtered = persons.filter((p) => {
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		return p.first_name.toLowerCase().includes(q) || p.last_name.toLowerCase().includes(q);
	});

	const handlePersonPress = (person: Person) => {
		navigation.navigate("FamilyTreePerson", { mode: "edit", treeId, personId: person.id });
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backText}>‹</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{t("ftList")}</Text>
				<TouchableOpacity onPress={() => navigation.navigate("FamilyTreePerson", { mode: "create", treeId })}>
					<Text style={styles.addText}>+</Text>
				</TouchableOpacity>
			</View>

			{/* Search */}
			<View style={styles.searchContainer}>
				<TextInput
					style={styles.searchInput}
					value={search}
					onChangeText={setSearch}
					placeholder={t("ftSearchPlaceholder")}
					placeholderTextColor={colors.textSecondary}
					clearButtonMode="while-editing"
				/>
			</View>

			{/* Member count */}
			<Text style={styles.countText}>{t("ftPersons", { count: String(filtered.length) })}</Text>

			{/* List */}
			<FlatList
				data={filtered}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={styles.listContent}
				renderItem={({ item }) => <PersonListItem person={item} onPress={handlePersonPress} />}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
						<Text style={styles.emptyText}>{t("ftEmptyTree")}</Text>
					</View>
				}
			/>
		</SafeAreaView>
	);
}
