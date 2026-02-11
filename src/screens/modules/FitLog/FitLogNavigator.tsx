import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import { FitLogStackParamList, FitLogTabParamList } from "../../../types/navigation";
import { useColors, Colors } from "./theme";
import { useLanguage } from "../../../i18n";

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
	const styles = useTabStyles(colors);

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
				name="FLWorkouts"
				component={WorkoutListScreen}
				options={{
					tabBarLabel: t("fitWorkouts"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="🏋️" />,
				}}
			/>
			<Tab.Screen
				name="FLHistory"
				component={HistoryScreen}
				options={{
					tabBarLabel: t("fitHistory"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="📋" />,
				}}
			/>
			<Tab.Screen
				name="FLStats"
				component={StatsScreen}
				options={{
					tabBarLabel: t("fitStats"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="📊" />,
				}}
			/>
			<Tab.Screen
				name="FLSounds"
				component={SoundSettingsScreen}
				options={{
					tabBarLabel: t("fitSounds"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="🔔" />,
				}}
			/>
		</Tab.Navigator>
	);
}

export default function FitLogNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
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

function useTabStyles(colors: Colors) {
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
