import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { PocketManagerStackParamList, PocketManagerTabParamList } from "../../../types/navigation";
import DashboardScreen from "./screens/DashboardScreen";
import ExpenseListScreen from "./screens/ExpenseListScreen";
import ProjectListScreen from "./screens/ProjectListScreen";
import ExpenseFormScreen from "./screens/ExpenseFormScreen";
import ProjectFormScreen from "./screens/ProjectFormScreen";
import ProjectDetailScreen from "./screens/ProjectDetailScreen";
import { useColors } from "./theme";
import { useLanguage } from "../../../i18n";
import { useIconMode } from "../../../settings";
import AnimatedTabBar from "../../../components/AnimatedTabBar";

const Stack = createNativeStackNavigator<PocketManagerStackParamList>();
const Tab = createBottomTabNavigator<PocketManagerTabParamList>();

function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
	return <Ionicons name={name} size={24} color={color} style={{ opacity: focused ? 1 : 0.6 }} />;
}

function TabNavigator() {
	const { t } = useLanguage();
	const colors = useColors();
	const { iconMode } = useIconMode();

	return (
		<Tab.Navigator
			screenOptions={{
				tabBarActiveTintColor: colors.tabActive,
				tabBarInactiveTintColor: colors.tabInactive,
				headerShown: false,
			}}
			tabBar={(props) => <AnimatedTabBar {...props} colors={colors} iconMode={iconMode} />}
		>
			<Tab.Screen
				name="PMDashboard"
				component={DashboardScreen}
				options={{
					tabBarLabel: t("pmDashboard"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="pie-chart-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="PMExpenses"
				component={ExpenseListScreen}
				options={{
					tabBarLabel: t("pmExpenses"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="card-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="PMProjects"
				component={ProjectListScreen}
				options={{
					tabBarLabel: t("pmProjects"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="briefcase-outline" color={color} focused={focused} />,
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
