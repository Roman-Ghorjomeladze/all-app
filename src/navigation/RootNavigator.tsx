import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeMode } from "../theme";
import { RootStackParamList } from "../types/navigation";
import HomeScreen from "../screens/HomeScreen";
import CircleFlowNavigator from "../screens/modules/CircleFlow/CircleFlowNavigator";
import FamilyTreeNavigator from "../screens/modules/FamilyTree/FamilyTreeNavigator";
import FlagsNavigator from "../screens/modules/Flags/FlagsNavigator";
import LinguaFlipNavigator from "../screens/modules/LinguaFlip/LinguaFlipNavigator";
import BirthdaysNavigator from "../screens/modules/Birthdays/BirthdaysNavigator";
import TodoNavigator from "../screens/modules/Todo/TodoNavigator";
import PocketManagerNavigator from "../screens/modules/PocketManager/PocketManagerNavigator";
import MealPlannerNavigator from "../screens/modules/MealPlanner/MealPlannerNavigator";
import FitLogNavigator from "../screens/modules/FitLog/FitLogNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

const PurpleDarkNavTheme: Theme = {
	dark: true,
	colors: {
		primary: "#BD93F9",
		background: "#1E1E2E",
		card: "#2A273F",
		text: "#D9E0EE",
		border: "#3A375C",
		notification: "#FF79C6",
	},
	fonts: DarkTheme.fonts,
};

export default function RootNavigator() {
	const { mode } = useThemeMode();

	return (
		<NavigationContainer theme={mode === "dark" ? PurpleDarkNavTheme : DefaultTheme}>
			<Stack.Navigator
				initialRouteName="Home"
				screenOptions={{
					headerShown: true,
					headerBackTitle: "Back",
				}}
			>
				<Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
				<Stack.Screen name="CircleFlow" component={CircleFlowNavigator} options={{ headerShown: false }} />
				<Stack.Screen name="FamilyTree" component={FamilyTreeNavigator} options={{ headerShown: false }} />
				<Stack.Screen name="Flags" component={FlagsNavigator} options={{ headerShown: false }} />
				<Stack.Screen name="LinguaFlip" component={LinguaFlipNavigator} options={{ headerShown: false }} />
				<Stack.Screen name="Birthdays" component={BirthdaysNavigator} options={{ headerShown: false }} />
				<Stack.Screen name="Todo" component={TodoNavigator} options={{ headerShown: false }} />
				<Stack.Screen name="PocketManager" component={PocketManagerNavigator} options={{ headerShown: false }} />
				<Stack.Screen name="MealPlanner" component={MealPlannerNavigator} options={{ headerShown: false }} />
				<Stack.Screen name="FitLog" component={FitLogNavigator} options={{ headerShown: false }} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
