import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withTiming,
	withSpring,
	withSequence,
	Easing,
} from "react-native-reanimated";
import { RootStackParamList } from "../../types/navigation";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Module = {
	id: string;
	name: string;
	color: string;
	icon: string;
	route: keyof RootStackParamList;
};

type HomeColors = {
	background: string;
	textPrimary: string;
	textSecondary: string;
	moduleNameColor: string;
	shadow: string;
};

type Props = {
	modules: Module[];
	onModulePress: (route: keyof RootStackParamList) => void;
	colors: HomeColors;
};

// Orbit configuration: which modules go on which ring
const ORBIT_CONFIG = [
	// Ring 1 (inner) — 2 icons
	{ ring: 0, radius: 75, period: 8000, startAngle: 0 },
	{ ring: 0, radius: 75, period: 8000, startAngle: Math.PI },
	// Ring 2 (middle) — 3 icons
	{ ring: 1, radius: 135, period: 14000, startAngle: 0 },
	{ ring: 1, radius: 135, period: 14000, startAngle: (2 * Math.PI) / 3 },
	{ ring: 1, radius: 135, period: 14000, startAngle: (4 * Math.PI) / 3 },
	// Ring 3 (outer) — 4 icons
	{ ring: 2, radius: 190, period: 22000, startAngle: 0 },
	{ ring: 2, radius: 190, period: 22000, startAngle: Math.PI / 2 },
	{ ring: 2, radius: 190, period: 22000, startAngle: Math.PI },
	{ ring: 2, radius: 190, period: 22000, startAngle: (3 * Math.PI) / 2 },
];

const ICON_SIZE = 66;
const CENTER_SIZE = 56;

/** Lighten a hex color by a percentage (0-1) */
function lightenColor(hex: string, amount: number): string {
	const h = hex.replace("#", "");
	const r = Math.min(255, parseInt(h.substring(0, 2), 16) + Math.round(255 * amount));
	const g = Math.min(255, parseInt(h.substring(2, 4), 16) + Math.round(255 * amount));
	const b = Math.min(255, parseInt(h.substring(4, 6), 16) + Math.round(255 * amount));
	return `rgb(${r},${g},${b})`;
}

function OrbitingIcon({
	module,
	config,
	centerX,
	centerY,
	onPress,
}: {
	module: Module;
	config: (typeof ORBIT_CONFIG)[0];
	centerX: number;
	centerY: number;
	onPress: (route: keyof RootStackParamList) => void;
}) {
	const angle = useSharedValue(config.startAngle);
	const scale = useSharedValue(1);
	const glowPulse = useSharedValue(0.4);

	useEffect(() => {
		angle.value = withRepeat(
			withTiming(config.startAngle + 2 * Math.PI, {
				duration: config.period,
				easing: Easing.linear,
			}),
			-1,
			false
		);

		// Glow pulsing animation
		glowPulse.value = withRepeat(
			withTiming(1, {
				duration: 2500 + config.ring * 500,
				easing: Easing.inOut(Easing.sin),
			}),
			-1,
			true
		);
	}, []);

	const animatedStyle = useAnimatedStyle(() => {
		const x = config.radius * Math.cos(angle.value);
		const y = config.radius * Math.sin(angle.value);
		return {
			transform: [
				{ translateX: centerX + x - ICON_SIZE / 2 },
				{ translateY: centerY + y - ICON_SIZE / 2 },
				{ scale: scale.value },
			],
		};
	});

	const glowStyle = useAnimatedStyle(() => ({
		opacity: 0.3 + glowPulse.value * 0.25,
		transform: [{ scale: 1 + glowPulse.value * 0.1 }],
	}));

	const handlePress = () => {
		scale.value = withSequence(
			withSpring(1.3, { damping: 8 }),
			withSpring(1, { damping: 10 }),
		);
		setTimeout(() => onPress(module.route), 200);
	};

	const highlightColor = lightenColor(module.color, 0.3);

	return (
		<Animated.View
			style={[
				styles.orbitIconWrapper,
				{
					width: ICON_SIZE + 24,
					height: ICON_SIZE + 24,
				},
				animatedStyle,
			]}
		>
			{/* Glow halo behind the planet */}
			<Animated.View
				style={[
					styles.planetGlow,
					{
						width: ICON_SIZE + 24,
						height: ICON_SIZE + 24,
						borderRadius: (ICON_SIZE + 24) / 2,
						backgroundColor: module.color + "25",
						shadowColor: module.color,
					},
					glowStyle,
				]}
			/>

			{/* Main planet body */}
			<View
				style={[
					styles.orbitIcon,
					{
						width: ICON_SIZE,
						height: ICON_SIZE,
						borderRadius: ICON_SIZE / 2,
						backgroundColor: module.color,
						shadowColor: module.color,
					},
				]}
			>
				{/* 3D specular highlight — top-left shine */}
				<View
					style={[
						styles.planetHighlight,
						{
							width: ICON_SIZE * 0.5,
							height: ICON_SIZE * 0.3,
							borderRadius: ICON_SIZE * 0.25,
							top: ICON_SIZE * 0.08,
							left: ICON_SIZE * 0.1,
							backgroundColor: highlightColor,
						},
					]}
				/>

				{/* Bottom shadow for 3D depth */}
				<View
					style={[
						styles.planetBottomShade,
						{
							width: ICON_SIZE,
							height: ICON_SIZE * 0.45,
							borderBottomLeftRadius: ICON_SIZE / 2,
							borderBottomRightRadius: ICON_SIZE / 2,
						},
					]}
				/>

				{/* Rim light ring */}
				<View
					style={[
						styles.planetRim,
						{
							width: ICON_SIZE - 3,
							height: ICON_SIZE - 3,
							borderRadius: (ICON_SIZE - 3) / 2,
						},
					]}
				/>

				{/* Content */}
				<View style={styles.touchArea} onTouchEnd={handlePress}>
					<Text style={styles.icon}>{module.icon}</Text>
					<Text style={styles.name} numberOfLines={1}>{module.name}</Text>
				</View>
			</View>
		</Animated.View>
	);
}

/** Animated center "sun" with pulsing glow */
function CenterSun({ centerX, centerY, colors }: { centerX: number; centerY: number; colors: HomeColors }) {
	const pulse = useSharedValue(0);

	useEffect(() => {
		pulse.value = withRepeat(
			withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
			-1,
			true
		);
	}, []);

	const sunGlowStyle = useAnimatedStyle(() => ({
		opacity: 0.15 + pulse.value * 0.2,
		transform: [{ scale: 1 + pulse.value * 0.15 }],
	}));

	const sunRayStyle = useAnimatedStyle(() => ({
		opacity: 0.08 + pulse.value * 0.1,
		transform: [{ scale: 1 + pulse.value * 0.25 }],
	}));

	return (
		<>
			{/* Outer ray glow */}
			<Animated.View
				style={[
					styles.sunRay,
					{
						left: centerX - CENTER_SIZE * 1.2,
						top: centerY - CENTER_SIZE * 1.2,
						width: CENTER_SIZE * 2.4,
						height: CENTER_SIZE * 2.4,
						borderRadius: CENTER_SIZE * 1.2,
					},
					sunRayStyle,
				]}
			/>
			{/* Middle glow ring */}
			<Animated.View
				style={[
					styles.sunGlow,
					{
						left: centerX - CENTER_SIZE * 0.85,
						top: centerY - CENTER_SIZE * 0.85,
						width: CENTER_SIZE * 1.7,
						height: CENTER_SIZE * 1.7,
						borderRadius: CENTER_SIZE * 0.85,
					},
					sunGlowStyle,
				]}
			/>
			{/* Center sun body */}
			<View
				style={[
					styles.centerDot,
					{
						left: centerX - CENTER_SIZE / 2,
						top: centerY - CENTER_SIZE / 2,
					},
				]}
			>
				{/* Highlight */}
				<View style={styles.sunHighlight} />
				<Text style={styles.centerEmoji}>{"\u2B50"}</Text>
			</View>
		</>
	);
}

export default function OrbitLayout({ modules, onModulePress, colors }: Props) {
	// Center of orbit area (account for settings row + tab bar)
	const centerX = SCREEN_WIDTH / 2;
	const centerY = (SCREEN_HEIGHT - 200) / 2;

	const ringRadii = [75, 135, 190];

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Orbit ring indicators with glow */}
			{ringRadii.map((radius, i) => (
				<View key={`ring-${i}`}>
					{/* Glowing ring trail */}
					<View
						style={[
							styles.ringGlow,
							{
								width: radius * 2 + 8,
								height: radius * 2 + 8,
								borderRadius: radius + 4,
								left: centerX - radius - 4,
								top: centerY - radius - 4,
								borderColor: colors.textSecondary + "10",
								shadowColor: colors.textSecondary,
							},
						]}
					/>
					{/* Main ring line */}
					<View
						style={[
							styles.ringIndicator,
							{
								width: radius * 2,
								height: radius * 2,
								borderRadius: radius,
								left: centerX - radius,
								top: centerY - radius,
								borderColor: colors.textSecondary + "18",
							},
						]}
					/>
				</View>
			))}

			{/* Center sun with animated glow */}
			<CenterSun centerX={centerX} centerY={centerY} colors={colors} />

			{/* Orbiting icons */}
			{modules.map((module, index) => {
				if (index >= ORBIT_CONFIG.length) return null;
				return (
					<OrbitingIcon
						key={module.id}
						module={module}
						config={ORBIT_CONFIG[index]}
						centerX={centerX}
						centerY={centerY}
						onPress={onModulePress}
					/>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: "relative",
	},
	ringIndicator: {
		position: "absolute",
		borderWidth: 1,
		borderStyle: "dashed",
	},
	ringGlow: {
		position: "absolute",
		borderWidth: 2,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 0,
	},
	// Center sun styles
	sunRay: {
		position: "absolute",
		backgroundColor: "#FFD700",
	},
	sunGlow: {
		position: "absolute",
		backgroundColor: "#FFA500",
	},
	centerDot: {
		position: "absolute",
		width: CENTER_SIZE,
		height: CENTER_SIZE,
		borderRadius: CENTER_SIZE / 2,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#FFC107",
		borderWidth: 1.5,
		borderColor: "rgba(255,255,255,0.3)",
		shadowColor: "#FFA500",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.8,
		shadowRadius: 20,
		elevation: 15,
		overflow: "hidden",
	},
	sunHighlight: {
		position: "absolute",
		width: CENTER_SIZE * 0.55,
		height: CENTER_SIZE * 0.3,
		borderRadius: CENTER_SIZE * 0.2,
		top: CENTER_SIZE * 0.08,
		left: CENTER_SIZE * 0.1,
		backgroundColor: "rgba(255,255,255,0.35)",
	},
	centerEmoji: {
		fontSize: 26,
		textShadowColor: "rgba(0,0,0,0.2)",
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	// Orbiting planet styles
	orbitIconWrapper: {
		position: "absolute",
		justifyContent: "center",
		alignItems: "center",
	},
	planetGlow: {
		position: "absolute",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.6,
		shadowRadius: 20,
		elevation: 0,
	},
	orbitIcon: {
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.2)",
		// Colored 3D shadow
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.5,
		shadowRadius: 14,
		elevation: 10,
		overflow: "hidden",
	},
	planetHighlight: {
		position: "absolute",
		opacity: 0.35,
		zIndex: 2,
	},
	planetBottomShade: {
		position: "absolute",
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.18)",
		zIndex: 1,
	},
	planetRim: {
		position: "absolute",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.1)",
		borderTopColor: "rgba(255,255,255,0.3)",
		zIndex: 3,
	},
	touchArea: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		zIndex: 10,
	},
	icon: {
		fontSize: 22,
		marginBottom: 1,
		textShadowColor: "rgba(0,0,0,0.3)",
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	name: {
		fontSize: 8,
		fontWeight: "700",
		color: "#FFFFFF",
		textAlign: "center",
		paddingHorizontal: 2,
		textShadowColor: "rgba(0,0,0,0.5)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 3,
	},
});
