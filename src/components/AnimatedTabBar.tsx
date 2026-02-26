import React, { useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	interpolate,
} from "react-native-reanimated";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabBarColors = {
	background: string;
	cardBackground: string;
	border: string;
	tabActive: string;
	tabInactive: string;
};

type AnimatedTabBarProps = BottomTabBarProps & {
	colors: TabBarColors;
	iconMode: boolean;
};

const SPRING_CONFIG = { damping: 16, stiffness: 140, mass: 0.8 };

// Circle dimensions
const OUTER_RING = 62;
const INNER_CIRCLE = 54;
const CIRCLE_RISE = -22; // how far the circle rises above the bar

function AnimatedTabItem({
	focused,
	icon,
	label,
	showLabel,
	activeColor,
	inactiveColor,
	bgColor,
	barColor,
	borderColor,
	onPress,
	onLongPress,
	accessibilityLabel,
	testID,
}: {
	focused: boolean;
	icon: React.ReactNode;
	label: string;
	showLabel: boolean;
	activeColor: string;
	inactiveColor: string;
	bgColor: string; // screen background — used for outer ring
	barColor: string; // cardBackground — used for inner circle
	borderColor: string;
	onPress: () => void;
	onLongPress: () => void;
	accessibilityLabel?: string;
	testID?: string;
}) {
	const progress = useSharedValue(focused ? 1 : 0);

	useEffect(() => {
		progress.value = withSpring(focused ? 1 : 0, SPRING_CONFIG);
	}, [focused]);

	// Icon: when active, lift up into the circle
	const iconStyle = useAnimatedStyle(() => {
		const translateY = interpolate(progress.value, [0, 1], [0, CIRCLE_RISE + 4]);
		const scale = interpolate(progress.value, [0, 1], [1, 1.15]);
		return {
			transform: [{ translateY }, { scale }],
		};
	});

	// Outer ring (screen bg color) — creates the "notch" gap
	const outerRingStyle = useAnimatedStyle(() => {
		const scale = interpolate(progress.value, [0, 0.3, 1], [0, 0.5, 1]);
		const translateY = interpolate(progress.value, [0, 1], [10, CIRCLE_RISE]);
		return {
			transform: [{ scale }, { translateY }],
			opacity: progress.value,
		};
	});

	// Inner circle (bar bg color) — the visible "bubble"
	const innerCircleStyle = useAnimatedStyle(() => {
		const scale = interpolate(progress.value, [0, 0.3, 1], [0, 0.5, 1]);
		const translateY = interpolate(progress.value, [0, 1], [10, CIRCLE_RISE]);
		return {
			transform: [{ scale }, { translateY }],
			opacity: progress.value,
		};
	});

	// Label opacity
	const labelStyle = useAnimatedStyle(() => ({
		opacity: interpolate(progress.value, [0, 1], [0.6, 1]),
	}));

	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			accessibilityRole="button"
			accessibilityState={focused ? { selected: true } : {}}
			accessibilityLabel={accessibilityLabel}
			testID={testID}
			style={styles.tabItem}
		>
			{/* Outer ring — screen bg color, creates the gap/cutout illusion */}
			<Animated.View
				style={[
					styles.outerRing,
					{ backgroundColor: bgColor },
					outerRingStyle,
				]}
			/>

			{/* Inner circle — same color as bar, the "bubble" */}
			<Animated.View
				style={[
					styles.innerCircle,
					{
						backgroundColor: barColor,
						borderColor: borderColor,
					},
					innerCircleStyle,
				]}
			/>

			{/* Icon */}
			<Animated.View style={[styles.iconWrap, iconStyle]}>
				{icon}
			</Animated.View>

			{/* Label */}
			{showLabel && (
				<Animated.Text
					style={[
						styles.label,
						{ color: focused ? activeColor : inactiveColor },
						labelStyle,
					]}
					numberOfLines={1}
				>
					{label}
				</Animated.Text>
			)}
		</Pressable>
	);
}

export default function AnimatedTabBar({
	state,
	descriptors,
	navigation,
	colors,
	iconMode,
}: AnimatedTabBarProps) {
	const insets = useSafeAreaInsets();
	const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

	return (
		<View style={[styles.outerContainer, { paddingBottom: bottomPadding, backgroundColor: colors.background }]}>
			<View
				style={[
					styles.bar,
					{
						backgroundColor: colors.cardBackground,
						borderColor: colors.border,
					},
				]}
			>
				{state.routes.map((route, index) => {
					const { options } = descriptors[route.key];
					const focused = state.index === index;

					const label =
						typeof options.tabBarLabel === "string"
							? options.tabBarLabel
							: typeof options.title === "string"
								? options.title
								: route.name;

					const icon = options.tabBarIcon
						? options.tabBarIcon({
								focused,
								color: focused ? colors.tabActive : colors.tabInactive,
								size: 24,
							})
						: null;

					const onPress = () => {
						const event = navigation.emit({
							type: "tabPress",
							target: route.key,
							canPreventDefault: true,
						});
						if (!focused && !event.defaultPrevented) {
							navigation.navigate(route.name, route.params);
						}
					};

					const onLongPress = () => {
						navigation.emit({
							type: "tabLongPress",
							target: route.key,
						});
					};

					return (
						<AnimatedTabItem
							key={route.key}
							focused={focused}
							icon={icon}
							label={label}
							showLabel={!iconMode}
							activeColor={colors.tabActive}
							inactiveColor={colors.tabInactive}
							bgColor={colors.background}
							barColor={colors.cardBackground}
							borderColor={colors.border}
							onPress={onPress}
							onLongPress={onLongPress}
							accessibilityLabel={options.tabBarAccessibilityLabel}
							testID={options.tabBarButtonTestID}
						/>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	outerContainer: {
		overflow: "visible",
	},
	bar: {
		flexDirection: "row",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingVertical: 10,
		borderTopWidth: 0.5,
		borderLeftWidth: 0.5,
		borderRightWidth: 0.5,
		overflow: "visible",
	},
	tabItem: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		overflow: "visible",
		height: 36,
	},
	outerRing: {
		position: "absolute",
		width: OUTER_RING,
		height: OUTER_RING,
		borderRadius: OUTER_RING / 2,
	},
	innerCircle: {
		position: "absolute",
		width: INNER_CIRCLE,
		height: INNER_CIRCLE,
		borderRadius: INNER_CIRCLE / 2,
		borderWidth: 0.5,
	},
	iconWrap: {
		zIndex: 2,
	},
	label: {
		fontSize: 11,
		fontWeight: "500",
		marginTop: 2,
		zIndex: 2,
	},
});
