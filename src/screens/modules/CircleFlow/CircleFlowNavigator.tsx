import React, { useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import { CircleFlowTabParamList } from "../../../types/navigation";
import HomeScreen from "./HomeScreen";
import LogScreen from "./LogScreen";
import HistoryScreen from "./HistoryScreen";
import { useColors, Colors } from "./theme";
import { useLanguage } from "../../../i18n";

const Tab = createBottomTabNavigator<CircleFlowTabParamList>();

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

export default function CircleFlowNavigator() {
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
				name="CircleFlowHome"
				component={HomeScreen}
				options={{
					tabBarLabel: t("tabHome"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="🏠" />,
				}}
			/>
			<Tab.Screen
				name="CircleFlowLog"
				component={LogScreen}
				options={{
					tabBarLabel: t("tabLog"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="📝" />,
				}}
			/>
			<Tab.Screen
				name="CircleFlowHistory"
				component={HistoryScreen}
				options={{
					tabBarLabel: t("tabHistory"),
					tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="📊" />,
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
