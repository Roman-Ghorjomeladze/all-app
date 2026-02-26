import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { MealPlannerStackParamList, MealPlannerTabParamList } from "../../../types/navigation";
import RecipeListScreen from "./screens/RecipeListScreen";
import RecipeDetailScreen from "./screens/RecipeDetailScreen";
import RecipeFormScreen from "./screens/RecipeFormScreen";
import MealPlanScreen from "./screens/MealPlanScreen";
import ShoppingListScreen from "./screens/ShoppingListScreen";
import RecipePickerScreen from "./screens/RecipePickerScreen";
import CalorieBookScreen from "./screens/CalorieBookScreen";
import { useColors } from "./theme";
import { useLanguage } from "../../../i18n";
import { useIconMode } from "../../../settings";
import AnimatedTabBar from "../../../components/AnimatedTabBar";

const Stack = createNativeStackNavigator<MealPlannerStackParamList>();
const Tab = createBottomTabNavigator<MealPlannerTabParamList>();

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
				name="MPRecipes"
				component={RecipeListScreen}
				options={{
					tabBarLabel: t("mpRecipes"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="restaurant-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="MPMealPlan"
				component={MealPlanScreen}
				options={{
					tabBarLabel: t("mpMealPlan"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="calendar-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="MPShopping"
				component={ShoppingListScreen}
				options={{
					tabBarLabel: t("mpShopping"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="cart-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="MPCalorieBook"
				component={CalorieBookScreen}
				options={{
					tabBarLabel: t("mpCalorieBook"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="flame-outline" color={color} focused={focused} />,
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
