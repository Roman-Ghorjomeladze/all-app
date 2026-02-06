import React, { useMemo } from "react";
import { Text, View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
	LinguaFlipStackParamList,
	LinguaFlipTabParamList,
	LLQuizStackParamList,
} from "../../../types/navigation";
import ProjectSelectScreen from "./screens/ProjectSelectScreen";
import CardFormScreen from "./screens/CardFormScreen";
import ReviewScreen from "./screens/ReviewScreen";
import QuizStartScreen from "./screens/QuizStartScreen";
import QuizPlayScreen from "./screens/QuizPlayScreen";
import QuizResultScreen from "./screens/QuizResultScreen";
import MistakesScreen from "./screens/MistakesScreen";
import { useColors, Colors } from "./theme";
import { useLanguage } from "./i18n";

const Stack = createNativeStackNavigator<LinguaFlipStackParamList>();
const Tab = createBottomTabNavigator<LinguaFlipTabParamList>();
const QuizStack = createNativeStackNavigator<LLQuizStackParamList>();

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

type QuizStackProps = {
	route: { params?: { projectId: number } };
};

function QuizStackNavigator({ route }: QuizStackProps) {
	const projectId = route.params?.projectId;

	return (
		<QuizStack.Navigator screenOptions={{ headerShown: false }}>
			<QuizStack.Screen
				name="LLQuizStart"
				component={QuizStartScreen}
				initialParams={{ projectId }}
			/>
			<QuizStack.Screen name="LLQuizPlay" component={QuizPlayScreen} />
			<QuizStack.Screen name="LLQuizResult" component={QuizResultScreen} />
		</QuizStack.Navigator>
	);
}

type TabsProps = {
	route: { params?: { projectId: number } };
};

function TabNavigator({ route }: TabsProps) {
	const { t } = useLanguage();
	const colors = useColors();
	const styles = useStyles(colors);
	const projectId = route.params?.projectId;

	return (
		<Tab.Navigator
			screenOptions={{
				tabBarActiveTintColor: colors.tabActive,
				tabBarInactiveTintColor: colors.tabInactive,
				headerShown: true,
				headerStyle: { backgroundColor: colors.cardBackground },
				headerTintColor: colors.textPrimary,
				headerTitleStyle: { fontWeight: "600" },
				tabBarStyle: styles.tabBar,
				tabBarLabelStyle: layoutStyles.tabLabel,
			}}
		>
			<Tab.Screen
				name="LLReview"
				component={ReviewScreen}
				initialParams={{ projectId }}
				options={{
					title: t("llReview"),
					tabBarLabel: t("llReview"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F4DA}"} />,
				}}
			/>
			<Tab.Screen
				name="LLQuizStack"
				component={QuizStackNavigator}
				initialParams={{ projectId }}
				options={{
					title: t("llQuiz"),
					tabBarLabel: t("llQuiz"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F9E0}"} />,
				}}
			/>
			<Tab.Screen
				name="LLMistakes"
				component={MistakesScreen}
				initialParams={{ projectId }}
				options={{
					title: t("llMistakes"),
					tabBarLabel: t("llMistakes"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={"\u{1F4DD}"} />,
				}}
			/>
		</Tab.Navigator>
	);
}

export default function LinguaFlipNavigator() {
	const colors = useColors();

	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: colors.background },
			}}
		>
			<Stack.Screen name="LLProjectSelect" component={ProjectSelectScreen} />
			<Stack.Screen name="LLTabs" component={TabNavigator} />
			<Stack.Screen
				name="LLCardForm"
				component={CardFormScreen}
				options={{ presentation: "modal" }}
			/>
		</Stack.Navigator>
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
