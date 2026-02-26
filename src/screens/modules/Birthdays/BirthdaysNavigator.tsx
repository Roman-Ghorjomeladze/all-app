import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BirthdaysStackParamList, BirthdaysTabParamList } from "../../../types/navigation";
import ListScreen from "./screens/ListScreen";
import CalendarScreen from "./screens/CalendarScreen";
import SearchScreen from "./screens/SearchScreen";
import EventFormScreen from "./screens/EventFormScreen";
import { useColors } from "./theme";
import { useLanguage } from "../../../i18n";
import { useIconMode } from "../../../settings";
import AnimatedTabBar from "../../../components/AnimatedTabBar";

const Stack = createNativeStackNavigator<BirthdaysStackParamList>();
const Tab = createBottomTabNavigator<BirthdaysTabParamList>();

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
				name="BirthdaysList"
				component={ListScreen}
				options={{
					tabBarLabel: t("bdList"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="list-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="BirthdaysCalendar"
				component={CalendarScreen}
				options={{
					tabBarLabel: t("bdCalendar"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="calendar-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="BirthdaysSearch"
				component={SearchScreen}
				options={{
					tabBarLabel: t("bdSearch"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="search-outline" color={color} focused={focused} />,
				}}
			/>
		</Tab.Navigator>
	);
}

export default function BirthdaysNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: true, animation: "slide_from_right" }}>
			<Stack.Screen name="BirthdaysTabs" component={TabNavigator} />
			<Stack.Screen
				name="BirthdaysEventForm"
				component={EventFormScreen}
				options={{ presentation: "modal" }}
			/>
		</Stack.Navigator>
	);
}
