import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MealPlannerStackParamList, MealPlannerTabParamList } from "../../../types/navigation";
import RecipeListScreen from "./screens/RecipeListScreen";
import RecipeDetailScreen from "./screens/RecipeDetailScreen";
import RecipeFormScreen from "./screens/RecipeFormScreen";
import MealPlanScreen from "./screens/MealPlanScreen";
import ShoppingListScreen from "./screens/ShoppingListScreen";
import RecipePickerScreen from "./screens/RecipePickerScreen";
import CalorieBookScreen from "./screens/CalorieBookScreen";
import { useColors, Colors } from "./theme";
import { useLanguage } from "../../../i18n";
import { useIconMode } from "../../../settings";

const Stack = createNativeStackNavigator<MealPlannerStackParamList>();
const Tab = createBottomTabNavigator<MealPlannerTabParamList>();

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
				name="MPRecipes"
				component={RecipeListScreen}
				options={{
					tabBarLabel: t("mpRecipes"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u{1F373}"} ionicon="restaurant-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="MPMealPlan"
				component={MealPlanScreen}
				options={{
					tabBarLabel: t("mpMealPlan"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u{1F4C5}"} ionicon="calendar-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="MPShopping"
				component={ShoppingListScreen}
				options={{
					tabBarLabel: t("mpShopping"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u{1F6D2}"} ionicon="cart-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="MPCalorieBook"
				component={CalorieBookScreen}
				options={{
					tabBarLabel: t("mpCalorieBook"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u{1F525}"} ionicon="flame-outline" iconMode={iconMode} color={color} />,
				}}
			/>
		</Tab.Navigator>
	);
}

export default function MealPlannerNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: true, animation: "slide_from_right" }}>
			<Stack.Screen name="MealPlannerTabs" component={TabNavigator} />
			<Stack.Screen name="MPRecipeDetail" component={RecipeDetailScreen} />
			<Stack.Screen
				name="MPRecipeForm"
				component={RecipeFormScreen}
				options={{ presentation: "modal" }}
			/>
			<Stack.Screen
				name="MPRecipePicker"
				component={RecipePickerScreen}
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
