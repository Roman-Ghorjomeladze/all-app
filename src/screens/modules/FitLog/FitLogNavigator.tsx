import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { FitLogStackParamList, FitLogTabParamList } from "../../../types/navigation";
import { useColors } from "./theme";
import { useLanguage } from "../../../i18n";
import { useIconMode } from "../../../settings";
import AnimatedTabBar from "../../../components/AnimatedTabBar";

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
				name="FLWorkouts"
				component={WorkoutListScreen}
				options={{
					tabBarLabel: t("fitWorkouts"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="barbell-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="FLHistory"
				component={HistoryScreen}
				options={{
					tabBarLabel: t("fitHistory"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="time-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="FLStats"
				component={StatsScreen}
				options={{
					tabBarLabel: t("fitStats"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="stats-chart-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="FLSounds"
				component={SoundSettingsScreen}
				options={{
					tabBarLabel: t("fitSounds"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="volume-high-outline" color={color} focused={focused} />,
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
