import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { TodoStackParamList, TodoTabParamList } from "../../../types/navigation";
import TaskListScreen from "./screens/TaskListScreen";
import CategoryListScreen from "./screens/CategoryListScreen";
import SearchScreen from "./screens/SearchScreen";
import TaskFormScreen from "./screens/TaskFormScreen";
import CategoryFormScreen from "./screens/CategoryFormScreen";
import { useColors } from "./theme";
import { useLanguage } from "../../../i18n";
import { useIconMode } from "../../../settings";
import AnimatedTabBar from "../../../components/AnimatedTabBar";

const Stack = createNativeStackNavigator<TodoStackParamList>();
const Tab = createBottomTabNavigator<TodoTabParamList>();

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
				name="TodoTasks"
				component={TaskListScreen}
				options={{
					tabBarLabel: t("tdTasks"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="checkmark-done-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="TodoCategories"
				component={CategoryListScreen}
				options={{
					tabBarLabel: t("tdCategories"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="folder-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="TodoSearch"
				component={SearchScreen}
				options={{
					tabBarLabel: t("tdSearch"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="search-outline" color={color} focused={focused} />,
				}}
			/>
		</Tab.Navigator>
	);
}

export default function TodoNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: true, animation: "slide_from_right" }}>
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
