import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FitLogStackParamList, FitLogTabParamList } from "../../../types/navigation";
import { useColors, Colors } from "./theme";
import { useLanguage } from "../../../i18n";
import { useIconMode } from "../../../settings";

import WorkoutListScreen from "./screens/WorkoutListScreen";
import HistoryScreen from "./screens/HistoryScreen";
import StatsScreen from "./screens/StatsScreen";
import SoundSettingsScreen from "./screens/SoundSettingsScreen";
import WorkoutFormScreen from "./screens/WorkoutFormScreen";
import ExerciseFormScreen from "./screens/ExerciseFormScreen";
import PlayerScreen from "./screens/PlayerScreen";
import YouTubePreviewScreen from "./screens/YouTubePreviewScreen";

const Stack = createNativeStackNavigator<FitLogStackParamList>();
const Tab = createBottomTabNavigator<FitLogTabParamList>();

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
	const styles = useTabStyles(colors, insets.bottom);

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
				name="FLWorkouts"
				component={WorkoutListScreen}
				options={{
					tabBarLabel: t("fitWorkouts"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon="🏋️" ionicon="barbell-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="FLHistory"
				component={HistoryScreen}
				options={{
					tabBarLabel: t("fitHistory"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon="📋" ionicon="time-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="FLStats"
				component={StatsScreen}
				options={{
					tabBarLabel: t("fitStats"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon="📊" ionicon="stats-chart-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="FLSounds"
				component={SoundSettingsScreen}
				options={{
					tabBarLabel: t("fitSounds"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon="🔔" ionicon="volume-high-outline" iconMode={iconMode} color={color} />,
				}}
			/>
		</Tab.Navigator>
	);
}

export default function FitLogNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: true, animation: "slide_from_right" }}>
			<Stack.Screen name="FitLogTabs" component={TabNavigator} />
			<Stack.Screen
				name="FLWorkoutForm"
				component={WorkoutFormScreen}
				options={{ presentation: "modal" }}
			/>
			<Stack.Screen
				name="FLExerciseForm"
				component={ExerciseFormScreen}
				options={{ presentation: "modal" }}
			/>
			<Stack.Screen
				name="FLPlayer"
				component={PlayerScreen}
				options={{ presentation: "fullScreenModal", gestureEnabled: false }}
			/>
			<Stack.Screen
				name="FLYouTubePreview"
				component={YouTubePreviewScreen}
				options={{ presentation: "modal" }}
			/>
		</Stack.Navigator>
	);
}

function useTabStyles(colors: Colors, bottomInset: number) {
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
