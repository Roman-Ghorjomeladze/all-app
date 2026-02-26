import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { CircleFlowTabParamList } from "../../../types/navigation";
import HomeScreen from "./HomeScreen";
import LogScreen from "./LogScreen";
import HistoryScreen from "./HistoryScreen";
import { useColors } from "./theme";
import { useLanguage } from "../../../i18n";
import { useIconMode } from "../../../settings";
import AnimatedTabBar from "../../../components/AnimatedTabBar";

const Tab = createBottomTabNavigator<CircleFlowTabParamList>();

function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
	return <Ionicons name={name} size={24} color={color} style={{ opacity: focused ? 1 : 0.6 }} />;
}

export default function CircleFlowNavigator() {
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
				name="CircleFlowHome"
				component={HomeScreen}
				options={{
					tabBarLabel: t("cfHome"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="home-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="CircleFlowLog"
				component={LogScreen}
				options={{
					tabBarLabel: t("cfLog"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="create-outline" color={color} focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="CircleFlowHistory"
				component={HistoryScreen}
				options={{
					tabBarLabel: t("cfHistory"),
					tabBarIcon: ({ focused, color }) => <TabIcon name="bar-chart-outline" color={color} focused={focused} />,
				}}
			/>
		</Tab.Navigator>
	);
}
