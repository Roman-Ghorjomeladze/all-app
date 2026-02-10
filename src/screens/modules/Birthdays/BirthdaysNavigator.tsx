import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import { BirthdaysStackParamList, BirthdaysTabParamList } from "../../../types/navigation";
import ListScreen from "./screens/ListScreen";
import CalendarScreen from "./screens/CalendarScreen";
import SearchScreen from "./screens/SearchScreen";
import EventFormScreen from "./screens/EventFormScreen";
import { useColors, Colors } from "./theme";
import { useLanguage } from "../../../i18n";

const Stack = createNativeStackNavigator<BirthdaysStackParamList>();
const Tab = createBottomTabNavigator<BirthdaysTabParamList>();

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
				name="BirthdaysList"
				component={ListScreen}
				options={{
					tabBarLabel: t("bdList"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F4CB}"} />,
				}}
			/>
			<Tab.Screen
				name="BirthdaysCalendar"
				component={CalendarScreen}
				options={{
					tabBarLabel: t("bdCalendar"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F4C5}"} />,
				}}
			/>
			<Tab.Screen
				name="BirthdaysSearch"
				component={SearchScreen}
				options={{
					tabBarLabel: t("bdSearch"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F50D}"} />,
				}}
			/>
		</Tab.Navigator>
	);
}

export default function BirthdaysNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="BirthdaysTabs" component={TabNavigator} />
			<Stack.Screen
				name="BirthdaysEventForm"
				component={EventFormScreen}
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
