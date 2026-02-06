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

const Stack = createNativeStackNavigator<RootStackParamList>();

const MonokaiNavTheme: Theme = {
	dark: true,
	colors: {
		primary: "#A6E22E",
		background: "#272822",
		card: "#3E3D32",
		text: "#F8F8F2",
		border: "#49483E",
		notification: "#F92672",
	},
	fonts: DarkTheme.fonts,
};

export default function RootNavigator() {
	const { mode } = useThemeMode();

	return (
		<NavigationContainer theme={mode === "dark" ? MonokaiNavTheme : DefaultTheme}>
			<Stack.Navigator
				initialRouteName="Home"
				screenOptions={{
					headerShown: true,
					headerBackTitle: "Back",
				}}
			>
				<Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
				<Stack.Screen name="CircleFlow" component={CircleFlowNavigator} options={{ title: "CircleFlow" }} />
				<Stack.Screen name="FamilyTree" component={FamilyTreeNavigator} options={{ headerShown: false }} />
				<Stack.Screen name="Flags" component={FlagsNavigator} options={{ title: "Flags" }} />
				<Stack.Screen name="LinguaFlip" component={LinguaFlipNavigator} options={{ headerShown: false }} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
