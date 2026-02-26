import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
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
import { useColors } from "./theme";
import { useLanguage } from "./i18n";
import { useIconMode } from "../../../settings";
import AnimatedTabBar from "../../../components/AnimatedTabBar";

const Stack = createNativeStackNavigator<LinguaFlipStackParamList>();
const Tab = createBottomTabNavigator<LinguaFlipTabParamList>();
const QuizStack = createNativeStackNavigator<LLQuizStackParamList>();

function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
	return <Ionicons name={name} size={24} color={color} style={{ opacity: focused ? 1 : 0.6 }} />;
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
	const { iconMode } = useIconMode();
	const projectId = route.params?.projectId;

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
				name="LLReview"
				component={ReviewScreen}
				initialParams={{ projectId }}
				options={{
					tabBarLabel: t("llReview"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="book-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="LLQuizStack"
				component={QuizStackNavigator}
				initialParams={{ projectId }}
				options={{
					tabBarLabel: t("llQuiz"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="school-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="LLMistakes"
				component={MistakesScreen}
				initialParams={{ projectId }}
				options={{
					tabBarLabel: t("llMistakes"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="document-text-outline" color={color} focused={focused} />,
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
				gestureEnabled: true,
				fullScreenGestureEnabled: true,
				animation: "slide_from_right",
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

