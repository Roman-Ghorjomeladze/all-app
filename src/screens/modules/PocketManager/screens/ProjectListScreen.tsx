import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PocketManagerStackParamList } from "../../../../types/navigation";
import { initDatabase, getAllProjects, ProjectWithStats } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import ProjectCard from "../components/ProjectCard";

type Nav = NativeStackNavigationProp<PocketManagerStackParamList>;

export default function ProjectListScreen() {
	const navigation = useNavigation<Nav>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const [activeProjects, setActiveProjects] = useState<ProjectWithStats[]>([]);
	const [archivedProjects, setArchivedProjects] = useState<ProjectWithStats[]>([]);
	const [showArchived, setShowArchived] = useState(false);

	const loadData = useCallback(async () => {
		await initDatabase();
		const all = await getAllProjects(true);
		setActiveProjects(all.filter((p) => p.is_archived === 0));
		setArchivedProjects(all.filter((p) => p.is_archived === 1));
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handleAdd = useCallback(() => {
		navigation.navigate("PMProjectForm", { mode: "create" });
	}, [navigation]);

	const handleProjectPress = useCallback((project: ProjectWithStats) => {
		navigation.navigate("PMProjectDetail", { projectId: project.id });
	}, [navigation]);

	const renderContent = () => (
		<View style={styles.content}>
			{/* Active Projects */}
			{activeProjects.length > 0 ? (
				activeProjects.map((project) => (
					<ProjectCard
						key={project.id}
						project={project}
						onPress={handleProjectPress}
						colors={colors}
					/>
				))
			) : (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyEmoji}>{"\u{1F4C1}"}</Text>
					<Text style={styles.emptyText}>{t("pmNoProjects")}</Text>
					<Text style={styles.emptyHint}>{t("pmNoProjectsHint")}</Text>
				</View>
			)}

			{/* Archived Projects */}
			{archivedProjects.length > 0 && (
				<View style={styles.archivedSection}>
					<TouchableOpacity
						style={styles.archivedHeader}
						onPress={() => setShowArchived(!showArchived)}
						activeOpacity={0.7}
					>
						<Text style={styles.archivedTitle}>{t("pmArchivedProjects")}</Text>
						<Ionicons
							name={showArchived ? "chevron-up" : "chevron-down"}
							size={20}
							color={colors.textSecondary}
						/>
					</TouchableOpacity>
					{showArchived &&
						archivedProjects.map((project) => (
							<ProjectCard
								key={project.id}
								project={project}
								onPress={handleProjectPress}
								colors={colors}
							/>
						))}
				</View>
			)}
		</View>
	);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>{t("pmProjects")}</Text>
				<TouchableOpacity onPress={handleAdd} activeOpacity={0.7}>
					<Ionicons name="add-circle" size={32} color={colors.accent} />
				</TouchableOpacity>
			</View>

			<FlatList
				data={[]}
				renderItem={null}
				ListHeaderComponent={renderContent}
				contentContainerStyle={styles.listContent}
			/>
		</SafeAreaView>
	);
}

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
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
					flex: 1,
					marginRight: spacing.sm,
				},
				content: {
					paddingHorizontal: spacing.lg,
				},
				listContent: {
					paddingBottom: spacing.xl,
				},
				emptyContainer: {
					alignItems: "center",
					paddingTop: spacing.xl * 3,
					paddingHorizontal: spacing.xl,
				},
				emptyEmoji: {
					fontSize: 64,
					marginBottom: spacing.md,
				},
				emptyText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
					marginBottom: spacing.sm,
				},
				emptyHint: {
					...typography.footnote,
					color: colors.textSecondary,
					textAlign: "center",
				},
				archivedSection: {
					marginTop: spacing.lg,
				},
				archivedHeader: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingVertical: spacing.sm,
					marginBottom: spacing.sm,
				},
				archivedTitle: {
					...typography.headline,
					color: colors.textSecondary,
				},
			}),
		[colors]
	);
}
