import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { TodoStackParamList, TodoTabParamList } from "../../../types/navigation";
import TaskListScreen from "./screens/TaskListScreen";
import CategoryListScreen from "./screens/CategoryListScreen";
import SearchScreen from "./screens/SearchScreen";
import TaskFormScreen from "./screens/TaskFormScreen";
import CategoryFormScreen from "./screens/CategoryFormScreen";
import { useColors, Colors } from "./theme";
import { useLanguage } from "../../../i18n";
import { useIconMode } from "../../../settings";

const Stack = createNativeStackNavigator<TodoStackParamList>();
const Tab = createBottomTabNavigator<TodoTabParamList>();

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
				name="TodoTasks"
				component={TaskListScreen}
				options={{
					tabBarLabel: t("tdTasks"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u2705"} ionicon="checkmark-done-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="TodoCategories"
				component={CategoryListScreen}
				options={{
					tabBarLabel: t("tdCategories"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u{1F4C1}"} ionicon="folder-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="TodoSearch"
				component={SearchScreen}
				options={{
					tabBarLabel: t("tdSearch"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u{1F50D}"} ionicon="search-outline" iconMode={iconMode} color={color} />,
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
