import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FamilyTreeStackParamList } from "../../../types/navigation";
import TreeSelectScreen from "./TreeSelectScreen";
import TreeScreen from "./TreeScreen";
import PersonScreen from "./PersonScreen";
import ListScreen from "./ListScreen";
import { useColors } from "./theme";

const Stack = createNativeStackNavigator<FamilyTreeStackParamList>();

export default function FamilyTreeNavigator() {
	const colors = useColors();

	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: colors.background },
			}}
		>
			<Stack.Screen name="FamilyTreeSelect" component={TreeSelectScreen} />
			<Stack.Screen name="FamilyTreeMain" component={TreeScreen} />
			<Stack.Screen
				name="FamilyTreePerson"
				component={PersonScreen}
				options={{ presentation: "modal" }}
			/>
			<Stack.Screen name="FamilyTreeList" component={ListScreen} />
		</Stack.Navigator>
	);
}
