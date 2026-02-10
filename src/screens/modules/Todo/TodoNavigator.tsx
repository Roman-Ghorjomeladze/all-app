import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import { TodoStackParamList, TodoTabParamList } from "../../../types/navigation";
import TaskListScreen from "./screens/TaskListScreen";
import CategoryListScreen from "./screens/CategoryListScreen";
import SearchScreen from "./screens/SearchScreen";
import TaskFormScreen from "./screens/TaskFormScreen";
import CategoryFormScreen from "./screens/CategoryFormScreen";
import { useColors, Colors } from "./theme";
import { useLanguage } from "../../../i18n";

const Stack = createNativeStackNavigator<TodoStackParamList>();
const Tab = createBottomTabNavigator<TodoTabParamList>();

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
				name="TodoTasks"
				component={TaskListScreen}
				options={{
					tabBarLabel: t("tdTasks"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u2705"} />,
				}}
			/>
			<Tab.Screen
				name="TodoCategories"
				component={CategoryListScreen}
				options={{
					tabBarLabel: t("tdCategories"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F4C1}"} />,
				}}
			/>
			<Tab.Screen
				name="TodoSearch"
				component={SearchScreen}
				options={{
					tabBarLabel: t("tdSearch"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F50D}"} />,
				}}
			/>
		</Tab.Navigator>
	);
}

export default function TodoNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="TodoTabs" component={TabNavigator} />
			<Stack.Screen
				name="TodoTaskForm"
				component={TaskFormScreen}
				options={{ presentation: "modal" }}
			/>
			<Stack.Screen
				name="TodoCategoryForm"
				component={CategoryFormScreen}
				options={{ presentation: "modal" }}
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
