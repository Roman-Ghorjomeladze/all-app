import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { PocketManagerStackParamList, PocketManagerTabParamList } from "../../../types/navigation";
import DashboardScreen from "./screens/DashboardScreen";
import ExpenseListScreen from "./screens/ExpenseListScreen";
import ProjectListScreen from "./screens/ProjectListScreen";
import ExpenseFormScreen from "./screens/ExpenseFormScreen";
import ProjectFormScreen from "./screens/ProjectFormScreen";
import ProjectDetailScreen from "./screens/ProjectDetailScreen";
import { useColors, Colors } from "./theme";
import { useLanguage } from "../../../i18n";
import { useIconMode } from "../../../settings";

const Stack = createNativeStackNavigator<PocketManagerStackParamList>();
const Tab = createBottomTabNavigator<PocketManagerTabParamList>();

type TabIconProps = {
	focused: boolean;
	icon: string;
	ionicon?: keyof typeof Ionicons.glyphMap;
	iconMode?: boolean;
	color?: string;
};

function TabIcon({ focused, icon, ionicon, iconMode, color }: TabIconProps) {
	if (iconMode && ionicon) {
		return (
			<Ionicons
				name={ionicon}
				size={24}
				color={color}
				style={{ opacity: focused ? 1 : 0.6 }}
			/>
		);
	}
	return (
		<View style={layoutStyles.iconContainer}>
			<Text style={[layoutStyles.icon, focused && layoutStyles.iconFocused]}>{icon}</Text>
		</View>
	);
}

function TabNavigator() {
	const { t } = useLanguage();
	const colors = useColors();
	const insets = useSafeAreaInsets();
	const { iconMode } = useIconMode();
	const styles = useStyles(colors, insets.bottom);

	return (
		<Tab.Navigator
			screenOptions={{
				tabBarActiveTintColor: colors.tabActive,
				tabBarInactiveTintColor: colors.tabInactive,
				headerShown: false,
				tabBarStyle: styles.tabBar,
				tabBarLabelStyle: layoutStyles.tabLabel,
				tabBarShowLabel: !iconMode,
			}}
		>
			<Tab.Screen
				name="PMDashboard"
				component={DashboardScreen}
				options={{
					tabBarLabel: t("pmDashboard"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u{1F4CA}"} ionicon="pie-chart-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="PMExpenses"
				component={ExpenseListScreen}
				options={{
					tabBarLabel: t("pmExpenses"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u{1F4B3}"} ionicon="card-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="PMProjects"
				component={ProjectListScreen}
				options={{
					tabBarLabel: t("pmProjects"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u{1F4C1}"} ionicon="briefcase-outline" iconMode={iconMode} color={color} />,
				}}
			/>
		</Tab.Navigator>
	);
}

export default function PocketManagerNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: true, animation: "slide_from_right" }}>
			<Stack.Screen name="PocketManagerTabs" component={TabNavigator} />
			<Stack.Screen
				name="PMExpenseForm"
				component={ExpenseFormScreen}
				options={{ presentation: "modal" }}
			/>
			<Stack.Screen
				name="PMProjectForm"
				component={ProjectFormScreen}
				options={{ presentation: "modal" }}
			/>
			<Stack.Screen
				name="PMProjectDetail"
				component={ProjectDetailScreen}
			/>
		</Stack.Navigator>
	);
}

function useStyles(colors: Colors, bottomInset: number) {
	return useMemo(
		() =>
			StyleSheet.create({
				tabBar: {
					backgroundColor: colors.cardBackground,
					borderTopColor: colors.border,
					borderTopWidth: 0.5,
					paddingTop: 8,
					paddingBottom: bottomInset > 0 ? bottomInset : 8,
					height: 60 + (bottomInset > 0 ? bottomInset : 8),
				},
			}),
		[colors, bottomInset]
	);
}

const layoutStyles = StyleSheet.create({
	tabLabel: {
		fontSize: 12,
		fontWeight: "500",
	},
	iconContainer: {
		alignItems: "center",
		justifyContent: "center",
	},
	icon: {
		fontSize: 24,
		opacity: 0.6,
	},
	iconFocused: {
		opacity: 1,
	},
});
