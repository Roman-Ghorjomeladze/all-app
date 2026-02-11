import React, { useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useLanguage } from "../i18n";
import { useThemeMode } from "../theme";
import { useHomeLayout, HomeLayout } from "../settings";
import BubblesLayout from "./home/BubblesLayout";
import OrbitLayout from "./home/OrbitLayout";
import ConstellationLayout from "./home/ConstellationLayout";

type Module = {
	id: string;
	name: string;
	color: string;
	icon: string;
	route: keyof RootStackParamList;
};

const modules: Module[] = [
	{ id: "1", name: "Todo", color: "#FF8C00", icon: "\u{2705}", route: "Todo" },
	{ id: "2", name: "Family Tree", color: "#6B8E23", icon: "\u{1F333}", route: "FamilyTree" },
	{ id: "3", name: "Flags", color: "#1A5276", icon: "\u{1F1EC}\u{1F1EA}", route: "Flags" },
	{ id: "4", name: "LinguaFlip", color: "#008B8B", icon: "\u{1F30E}", route: "LinguaFlip" },
	{ id: "5", name: "Birthdays", color: "#E91E63", icon: "\u{1F382}", route: "Birthdays" },
	{ id: "6", name: "CircleFlow", color: "#FF6B8A", icon: "\u{1F338}", route: "CircleFlow" },
	{ id: "7", name: "Pocket", color: "#2E7D32", icon: "\u{1F4B0}", route: "PocketManager" },
	{ id: "8", name: "Meal Planner", color: "#FF6B35", icon: "\u{1F37D}\u{FE0F}", route: "MealPlanner" },
	{ id: "9", name: "FitLog", color: "#FF5722", icon: "\u{23F1}\u{FE0F}", route: "FitLog" },
];

function getHomeColors(mode: "light" | "dark") {
	return mode === "dark"
		? {
				background: "#1E1E2E",
				cardBackground: "#2A273F",
				textPrimary: "#D9E0EE",
				textSecondary: "#6C6F93",
				toggleActiveBg: "#BD93F9",
				shadow: "#000000",
				moduleNameColor: "#FFFFFF",
				border: "#3A375C",
				overlay: "rgba(0,0,0,0.5)",
				settingsIcon: "#D9E0EE",
			}
		: {
				background: "#F2F2F7",
				cardBackground: "#FFFFFF",
				textPrimary: "#1C1C1E",
				textSecondary: "#8E8E93",
				toggleActiveBg: "#FF6B8A",
				shadow: "#000000",
				moduleNameColor: "#FFFFFF",
				border: "#C6C6C8",
				overlay: "rgba(0,0,0,0.5)",
				settingsIcon: "#1C1C1E",
			};
}

type Props = {
	navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
};

const LAYOUT_OPTIONS: { key: HomeLayout; icon: string }[] = [
	{ key: "bubbles", icon: "\u{1FAE7}" },
	{ key: "orbit", icon: "\u{1FA90}" },
	{ key: "constellation", icon: "\u{2728}" },
];

export default function HomeScreen({ navigation }: Props) {
	const { language, setLanguage, t } = useLanguage();
	const { mode, toggleMode } = useThemeMode();
	const { layout, setLayout } = useHomeLayout();
	const [settingsVisible, setSettingsVisible] = useState(false);
	const homeColors = getHomeColors(mode);
	const styles = useStyles(homeColors);

	const toggleLanguage = () => {
		setLanguage(language === "en" ? "ka" : "en");
	};

	const handleModulePress = useCallback(
		(route: keyof RootStackParamList) => {
			navigation.navigate(route);
		},
		[navigation]
	);

	// For constellation, override the settings icon color to white
	const settingsIconColor =
		layout === "constellation" ? "#D9E0EE" : homeColors.settingsIcon;

	const layoutColors = useMemo(() => {
		if (layout === "constellation") {
			return {
				...homeColors,
				background: "#0B0D21",
			};
		}
		return homeColors;
	}, [layout, homeColors]);

	return (
		<SafeAreaView
			style={[
				styles.safeArea,
				layout === "constellation" && { backgroundColor: "#0B0D21" },
			]}
		>
			{/* Settings gear icon — floated on top */}
			<View style={styles.settingsRow}>
				<TouchableOpacity onPress={() => setSettingsVisible(true)} activeOpacity={0.7}>
					<Ionicons name="settings-outline" size={26} color={settingsIconColor} />
				</TouchableOpacity>
			</View>

			{/* Layout */}
			{layout === "bubbles" && (
				<BubblesLayout
					modules={modules}
					onModulePress={handleModulePress}
					colors={layoutColors}
				/>
			)}
			{layout === "orbit" && (
				<OrbitLayout
					modules={modules}
					onModulePress={handleModulePress}
					colors={layoutColors}
				/>
			)}
			{layout === "constellation" && (
				<ConstellationLayout
					modules={modules}
					onModulePress={handleModulePress}
					colors={layoutColors}
				/>
			)}

			{/* Settings Modal */}
			<Modal
				visible={settingsVisible}
				transparent
				animationType="fade"
				supportedOrientations={["portrait", "landscape"]}
				onRequestClose={() => setSettingsVisible(false)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setSettingsVisible(false)}
				>
					<View style={styles.modalContent} onStartShouldSetResponder={() => true}>
						<Text style={styles.modalTitle}>{t("settings")}</Text>

						{/* Theme Toggle */}
						<View style={styles.settingRow}>
							<Text style={styles.settingLabel}>{t("theme")}</Text>
							<TouchableOpacity style={styles.themeToggle} onPress={toggleMode} activeOpacity={0.7}>
								<View style={[styles.themeOption, mode === "light" && styles.themeOptionActive]}>
									<Ionicons
										name="sunny"
										size={18}
										color={mode === "light" ? homeColors.moduleNameColor : homeColors.textSecondary}
									/>
								</View>
								<View style={[styles.themeOption, mode === "dark" && styles.themeOptionActiveDark]}>
									<Ionicons
										name="moon"
										size={18}
										color={mode === "dark" ? homeColors.moduleNameColor : homeColors.textSecondary}
									/>
								</View>
							</TouchableOpacity>
						</View>

						{/* Language Toggle */}
						<View style={styles.settingRow}>
							<Text style={styles.settingLabel}>{t("language")}</Text>
							<TouchableOpacity
								style={styles.languageToggle}
								onPress={toggleLanguage}
								activeOpacity={0.7}
							>
								<View style={[styles.languageOption, language === "en" && styles.languageOptionActive]}>
									<Text style={[styles.languageText, language === "en" && styles.languageTextActive]}>
										EN
									</Text>
								</View>
								<View style={[styles.languageOption, language === "ka" && styles.languageOptionActive]}>
									<Text style={[styles.languageText, language === "ka" && styles.languageTextActive]}>
										KA
									</Text>
								</View>
							</TouchableOpacity>
						</View>

						{/* Layout Toggle */}
						<View style={styles.settingRow}>
							<Text style={styles.settingLabel}>{t("homeLayout")}</Text>
							<View style={styles.layoutToggle}>
								{LAYOUT_OPTIONS.map((opt) => (
									<TouchableOpacity
										key={opt.key}
										style={[styles.layoutOption, layout === opt.key && styles.layoutOptionActive]}
										onPress={() => setLayout(opt.key)}
										activeOpacity={0.7}
									>
										<Text style={styles.layoutOptionIcon}>{opt.icon}</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>
					</View>
				</TouchableOpacity>
			</Modal>
		</SafeAreaView>
	);
}

type HomeColors = ReturnType<typeof getHomeColors>;

function useStyles(c: HomeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				safeArea: {
					flex: 1,
					backgroundColor: c.background,
				},
				settingsRow: {
					alignItems: "flex-end",
					paddingHorizontal: 20,
					paddingTop: 10,
					paddingBottom: 4,
					zIndex: 10,
				},
				// Modal
				modalOverlay: {
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: c.overlay,
				},
				modalContent: {
					backgroundColor: c.cardBackground,
					borderRadius: 20,
					padding: 24,
					width: "85%",
					maxWidth: 360,
				},
				modalTitle: {
					fontSize: 20,
					fontWeight: "700",
					color: c.textPrimary,
					marginBottom: 24,
					textAlign: "center",
				},
				settingRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 20,
				},
				settingLabel: {
					fontSize: 16,
					fontWeight: "500",
					color: c.textPrimary,
				},
				themeToggle: {
					flexDirection: "row",
					backgroundColor: c.background,
					borderRadius: 20,
					padding: 4,
					minWidth: 115,
				},
				themeOption: {
					paddingHorizontal: 14,
					paddingVertical: 8,
					borderRadius: 16,
				},
				themeOptionActive: {
					backgroundColor: c.toggleActiveBg,
				},
				themeOptionActiveDark: {
					backgroundColor: c.toggleActiveBg,
				},
				languageToggle: {
					flexDirection: "row",
					backgroundColor: c.background,
					borderRadius: 20,
					padding: 4,
					minWidth: 115,
				},
				languageOption: {
					paddingHorizontal: 16,
					paddingVertical: 8,
					borderRadius: 16,
				},
				languageOptionActive: {
					backgroundColor: c.toggleActiveBg,
				},
				languageText: {
					fontSize: 14,
					fontWeight: "600",
					color: c.textSecondary,
				},
				languageTextActive: {
					color: c.moduleNameColor,
				},
				// Layout toggle
				layoutToggle: {
					flexDirection: "row",
					backgroundColor: c.background,
					borderRadius: 20,
					padding: 4,
					minWidth: 145,
				},
				layoutOption: {
					flex: 1,
					paddingVertical: 8,
					borderRadius: 16,
					alignItems: "center",
				},
				layoutOptionActive: {
					backgroundColor: c.toggleActiveBg,
				},
				layoutOptionIcon: {
					fontSize: 18,
				},
			}),
		[c],
	);
}
