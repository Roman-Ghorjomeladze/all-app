import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import { PocketManagerStackParamList, PocketManagerTabParamList } from "../../../types/navigation";
import DashboardScreen from "./screens/DashboardScreen";
import ExpenseListScreen from "./screens/ExpenseListScreen";
import ProjectListScreen from "./screens/ProjectListScreen";
import ExpenseFormScreen from "./screens/ExpenseFormScreen";
import ProjectFormScreen from "./screens/ProjectFormScreen";
import ProjectDetailScreen from "./screens/ProjectDetailScreen";
import { useColors, Colors } from "./theme";
import { useLanguage } from "../../../i18n";

const Stack = createNativeStackNavigator<PocketManagerStackParamList>();
const Tab = createBottomTabNavigator<PocketManagerTabParamList>();

type TabIconProps = {
	focused: boolean;
	icon: string;
};

function TabIcon({ focused, icon }: TabIconProps) {
	return (
		<View style={layoutStyles.iconContainer}>
			<Text style={[layoutStyles.icon, focused && layoutStyles.iconFocused]}>{icon}</Text>
		</View>
	);
}

function TabNavigator() {
	const { t } = useLanguage();
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<Tab.Navigator
			screenOptions={{
				tabBarActiveTintColor: colors.tabActive,
				tabBarInactiveTintColor: colors.tabInactive,
				headerShown: false,
				tabBarStyle: styles.tabBar,
				tabBarLabelStyle: layoutStyles.tabLabel,
			}}
		>
			<Tab.Screen
				name="PMDashboard"
				component={DashboardScreen}
				options={{
					tabBarLabel: t("pmDashboard"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F4CA}"} />,
				}}
			/>
			<Tab.Screen
				name="PMExpenses"
				component={ExpenseListScreen}
				options={{
					tabBarLabel: t("pmExpenses"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F4B3}"} />,
				}}
			/>
			<Tab.Screen
				name="PMProjects"
				component={ProjectListScreen}
				options={{
					tabBarLabel: t("pmProjects"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F4C1}"} />,
				}}
			/>
		</Tab.Navigator>
	);
}

export default function PocketManagerNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
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

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				tabBar: {
					backgroundColor: colors.cardBackground,
					borderTopColor: colors.border,
					borderTopWidth: 0.5,
					paddingTop: 8,
					height: 88,
				},
			}),
		[colors]
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
