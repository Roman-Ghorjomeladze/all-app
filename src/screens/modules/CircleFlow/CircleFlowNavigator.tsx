import React, { useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CircleFlowTabParamList } from "../../../types/navigation";
import HomeScreen from "./HomeScreen";
import LogScreen from "./LogScreen";
import HistoryScreen from "./HistoryScreen";
import { useColors, Colors } from "./theme";
import { useLanguage } from "../../../i18n";
import { useIconMode } from "../../../settings";

const Tab = createBottomTabNavigator<CircleFlowTabParamList>();

type TabIconProps = {
	focused: boolean;
	icon: string;
	ionicon?: keyof typeof Ionicons.glyphMap;
	iconMode?: boolean;
	color?: string;
};

function TabIcon({ focused, icon, ionicon, iconMode, color }: TabIconProps) {
	if (iconMode && ionicon) {
		return (
			<Ionicons
				name={ionicon}
				size={24}
				color={color}
				style={{ opacity: focused ? 1 : 0.6 }}
			/>
		);
	}
	return (
		<View style={layoutStyles.iconContainer}>
			<Text style={[layoutStyles.icon, focused && layoutStyles.iconFocused]}>{icon}</Text>
		</View>
	);
}

export default function CircleFlowNavigator() {
	const { t } = useLanguage();
	const colors = useColors();
	const insets = useSafeAreaInsets();
	const { iconMode } = useIconMode();
	const styles = useStyles(colors, insets.bottom);

	return (
		<Tab.Navigator
			screenOptions={{
				tabBarActiveTintColor: colors.tabActive,
				tabBarInactiveTintColor: colors.tabInactive,
				headerShown: false,
				tabBarStyle: styles.tabBar,
				tabBarLabelStyle: layoutStyles.tabLabel,
				tabBarShowLabel: !iconMode,
			}}
		>
			<Tab.Screen
				name="CircleFlowHome"
				component={HomeScreen}
				options={{
					tabBarLabel: t("cfHome"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon="🏠" ionicon="home-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="CircleFlowLog"
				component={LogScreen}
				options={{
					tabBarLabel: t("cfLog"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon="📝" ionicon="create-outline" iconMode={iconMode} color={color} />,
				}}
			/>
			<Tab.Screen
				name="CircleFlowHistory"
				component={HistoryScreen}
				options={{
					tabBarLabel: t("cfHistory"),
					tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} icon="📊" ionicon="bar-chart-outline" iconMode={iconMode} color={color} />,
				}}
			/>
		</Tab.Navigator>
	);
}

function useStyles(colors: Colors, bottomInset: number) {
	return useMemo(() => StyleSheet.create({
		tabBar: {
			backgroundColor: colors.cardBackground,
			borderTopColor: colors.border,
			borderTopWidth: 0.5,
			paddingTop: 8,
			paddingBottom: bottomInset > 0 ? bottomInset : 8,
			height: 60 + (bottomInset > 0 ? bottomInset : 8),
		},
	}), [colors, bottomInset]);
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
