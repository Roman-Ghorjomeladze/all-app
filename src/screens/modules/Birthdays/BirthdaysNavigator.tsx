import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BirthdaysStackParamList, BirthdaysTabParamList } from "../../../types/navigation";
import ListScreen from "./screens/ListScreen";
import CalendarScreen from "./screens/CalendarScreen";
import SearchScreen from "./screens/SearchScreen";
import EventFormScreen from "./screens/EventFormScreen";
import { useColors, Colors } from "./theme";
import { useLanguage } from "../../../i18n";
import { useIconMode } from "../../../settings";

const Stack = createNativeStackNavigator<BirthdaysStackParamList>();
const Tab = createBottomTabNavigator<BirthdaysTabParamList>();

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
				name="BirthdaysList"
				component={ListScreen}
				options={{
					tabBarLabel: t("bdList"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u{1F4CB}"} ionicon="list-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="BirthdaysCalendar"
				component={CalendarScreen}
				options={{
					tabBarLabel: t("bdCalendar"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u{1F4C5}"} ionicon="calendar-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="BirthdaysSearch"
				component={SearchScreen}
				options={{
					tabBarLabel: t("bdSearch"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon={"\u{1F50D}"} ionicon="search-outline" iconMode={iconMode} color={color} />,
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
