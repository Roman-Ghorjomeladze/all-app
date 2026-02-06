import React, { useMemo } from "react";
import { Text, View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FlagsTabParamList, FlagsQuizStackParamList } from "../../../types/navigation";
import BrowseScreen from "./screens/BrowseScreen";
import QuizStartScreen from "./screens/QuizStartScreen";
import QuizPlayScreen from "./screens/QuizPlayScreen";
import QuizResultScreen from "./screens/QuizResultScreen";
import { useColors, Colors } from "./theme";
import { useLanguage } from "./i18n";

const Tab = createBottomTabNavigator<FlagsTabParamList>();
const QuizStack = createNativeStackNavigator<FlagsQuizStackParamList>();

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
				name="FlagsBrowse"
				component={BrowseScreen}
				options={{
					tabBarLabel: t("flBrowse"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F30D}"} />,
				}}
			/>
			<Tab.Screen
				name="FlagsQuizStack"
				component={QuizStackNavigator}
				options={{
					tabBarLabel: t("flQuiz"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F9E0}"} />,
				}}
			/>
		</Tab.Navigator>
	);
}

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		tabBar: {
			backgroundColor: colors.cardBackground,
			borderTopColor: colors.border,
			borderTopWidth: 0.5,
			paddingTop: 8,
			height: 88,
		},
	}), [colors]);
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
