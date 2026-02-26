import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { FlagsTabParamList, FlagsQuizStackParamList } from "../../../types/navigation";
import BrowseScreen from "./screens/BrowseScreen";
import QuizStartScreen from "./screens/QuizStartScreen";
import QuizPlayScreen from "./screens/QuizPlayScreen";
import QuizResultScreen from "./screens/QuizResultScreen";
import { useColors } from "./theme";
import { useLanguage } from "./i18n";
import { useIconMode } from "../../../settings";
import AnimatedTabBar from "../../../components/AnimatedTabBar";

const Tab = createBottomTabNavigator<FlagsTabParamList>();
const QuizStack = createNativeStackNavigator<FlagsQuizStackParamList>();

function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
	return <Ionicons name={name} size={24} color={color} style={{ opacity: focused ? 1 : 0.6 }} />;
}

function QuizStackNavigator() {
	return (
		<QuizStack.Navigator screenOptions={{ headerShown: false }}>
			<QuizStack.Screen name="FlagsQuizStart" component={QuizStartScreen} />
			<QuizStack.Screen name="FlagsQuizPlay" component={QuizPlayScreen} />
			<QuizStack.Screen name="FlagsQuizResult" component={QuizResultScreen} />
		</QuizStack.Navigator>
	);
}

export default function FlagsNavigator() {
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
				name="FlagsBrowse"
				component={BrowseScreen}
				options={{
					tabBarLabel: t("flBrowse"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="globe-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="FlagsQuizStack"
				component={QuizStackNavigator}
				options={{
					tabBarLabel: t("flQuiz"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="school-outline" color={color} focused={focused} />,
				}}
			/>
		</Tab.Navigator>
	);
}
