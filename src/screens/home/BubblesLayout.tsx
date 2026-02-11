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

// Bubble sizes by index
const BUBBLE_SIZES = [98, 96, 94, 96, 98, 94, 96, 94, 92];

// Animation params per bubble — different durations for organic feel
const ANIM_PARAMS = [
	{ driftX: 12, driftY: 18, durX: 4200, durY: 3400 },
	{ driftX: 10, driftY: 15, durX: 3800, durY: 4600 },
	{ driftX: 14, driftY: 12, durX: 5000, durY: 3200 },
	{ driftX: 8, driftY: 20, durX: 3600, durY: 5200 },
	{ driftX: 11, driftY: 14, durX: 4800, durY: 3000 },
	{ driftX: 15, driftY: 10, durX: 3400, durY: 4400 },
	{ driftX: 9, driftY: 16, durX: 5400, durY: 3800 },
	{ driftX: 13, driftY: 11, durX: 4000, durY: 5000 },
	{ driftX: 10, driftY: 13, durX: 4400, durY: 3600 },
];

// Pre-computed positions — staggered 2-column honeycomb, last bubble centered, vertically centered
function computePositions(): { x: number; y: number }[] {
	const usableWidth = SCREEN_WIDTH - 40;
	const usableHeight = SCREEN_HEIGHT - 200; // Account for safe area + settings
	const colWidth = usableWidth / 2;
	const numRows = 5; // 4 rows of 2 + 1 centered
	const rowHeight = 115; // Fixed row height for consistent spacing
	const gridHeight = numRows * rowHeight;
	const topOffset = (usableHeight - gridHeight) / 2; // Center vertically

	const jitter = [
		{ jx: 8, jy: -5 },
		{ jx: -12, jy: 10 },
		{ jx: 15, jy: 5 },
		{ jx: -8, jy: -12 },
		{ jx: 5, jy: 8 },
		{ jx: -15, jy: -3 },
		{ jx: 10, jy: 12 },
		{ jx: -5, jy: -8 },
		{ jx: 7, jy: -10 },
	];

	const positions: { x: number; y: number }[] = [];

	// First 8: 4 rows x 2 columns, odd rows offset right for honeycomb feel
	for (let i = 0; i < 8; i++) {
		const col = i % 2;
		const row = Math.floor(i / 2);
		const size = BUBBLE_SIZES[i];
		const staggerOffset = row % 2 === 1 ? 25 : -25;
		positions.push({
			x: 20 + col * colWidth + (colWidth - size) / 2 + staggerOffset + jitter[i].jx,
			y: topOffset + row * rowHeight + (rowHeight - size) / 2 + jitter[i].jy,
		});
	}

	// 9th bubble: centered at the bottom
	const lastSize = BUBBLE_SIZES[8];
	positions.push({
		x: (SCREEN_WIDTH - lastSize) / 2 + jitter[8].jx,
		y: topOffset + 4 * rowHeight + (rowHeight - lastSize) / 2 + jitter[8].jy,
	});

	return positions;
}

/** Lighten a hex color by a percentage (0-1) */
function lightenColor(hex: string, amount: number): string {
	const h = hex.replace("#", "");
	const r = Math.min(255, parseInt(h.substring(0, 2), 16) + Math.round(255 * amount));
	const g = Math.min(255, parseInt(h.substring(2, 4), 16) + Math.round(255 * amount));
	const b = Math.min(255, parseInt(h.substring(4, 6), 16) + Math.round(255 * amount));
	return `rgb(${r},${g},${b})`;
}

function Bubble({
	module,
	index,
	position,
	onPress,
}: {
	module: Module;
	index: number;
	position: { x: number; y: number };
	onPress: (route: keyof RootStackParamList) => void;
}) {
	const size = BUBBLE_SIZES[index];
	const params = ANIM_PARAMS[index];

	const offsetX = useSharedValue(0);
	const offsetY = useSharedValue(0);
	const scale = useSharedValue(1);
	const glowPulse = useSharedValue(0.5);

	useEffect(() => {
		// Start with opposite direction for even indices for variety
		const dirX = index % 2 === 0 ? 1 : -1;
		const dirY = index % 3 === 0 ? 1 : -1;

		offsetX.value = withRepeat(
			withTiming(dirX * params.driftX, {
				duration: params.durX,
				easing: Easing.inOut(Easing.sin),
			}),
			-1,
			true
		);

		offsetY.value = withRepeat(
			withTiming(dirY * params.driftY, {
				duration: params.durY,
				easing: Easing.inOut(Easing.sin),
			}),
			-1,
			true
		);

		// Subtle glow pulsing
		glowPulse.value = withRepeat(
			withTiming(1, {
				duration: 2000 + index * 300,
				easing: Easing.inOut(Easing.sin),
			}),
			-1,
			true
		);
	}, []);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: offsetX.value },
			{ translateY: offsetY.value },
			{ scale: scale.value },
		],
	}));

	const glowAnimatedStyle = useAnimatedStyle(() => ({
		opacity: 0.25 + glowPulse.value * 0.2,
		transform: [{ scale: 1 + glowPulse.value * 0.08 }],
	}));

	const handlePress = () => {
		scale.value = withSequence(
			withSpring(1.15, { damping: 8 }),
			withSpring(1, { damping: 10 }),
		);
		setTimeout(() => onPress(module.route), 200);
	};

	const highlightColor = lightenColor(module.color, 0.35);

	return (
		<Animated.View
			style={[
				styles.bubbleWrapper,
				{
					width: size + 30,
					height: size + 30,
					left: position.x - 15,
					top: position.y - 15,
				},
				animatedStyle,
			]}
		>
			{/* Outer glow halo */}
			<Animated.View
				style={[
					styles.glowHalo,
					{
						width: size + 30,
						height: size + 30,
						borderRadius: (size + 30) / 2,
						backgroundColor: module.color + "30",
						shadowColor: module.color,
					},
					glowAnimatedStyle,
				]}
			/>

			{/* Main bubble with 3D gradient layers */}
			<View
				style={[
					styles.bubble,
					{
						width: size,
						height: size,
						borderRadius: size / 2,
						backgroundColor: module.color + "EE",
						shadowColor: module.color,
					},
				]}
			>
				{/* 3D highlight — top-left specular reflection */}
				<View
					style={[
						styles.specularHighlight,
						{
							width: size * 0.55,
							height: size * 0.35,
							borderRadius: size * 0.3,
							top: size * 0.08,
							left: size * 0.12,
							backgroundColor: highlightColor,
						},
					]}
				/>

				{/* Inner light gradient — bottom fill for depth */}
				<View
					style={[
						styles.bottomShade,
						{
							width: size,
							height: size * 0.5,
							borderBottomLeftRadius: size / 2,
							borderBottomRightRadius: size / 2,
							bottom: 0,
						},
					]}
				/>

				{/* Rim light — thin bright edge at top */}
				<View
					style={[
						styles.rimLight,
						{
							width: size - 4,
							height: size - 4,
							borderRadius: (size - 4) / 2,
						},
					]}
				/>

				{/* Content */}
				<TouchableBubble onPress={handlePress}>
					<Text style={[styles.icon, { fontSize: size * 0.35 }]}>{module.icon}</Text>
					<Text style={[styles.name, { fontSize: size * 0.12 }]} numberOfLines={1}>
						{module.name}
					</Text>
				</TouchableBubble>
			</View>
		</Animated.View>
	);
}

// Separate touchable to avoid Animated.View tap issues
function TouchableBubble({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
	return (
		<View style={styles.touchArea} onTouchEnd={onPress}>
			{children}
		</View>
	);
}

export default function BubblesLayout({ modules, onModulePress, colors }: Props) {
	const positions = useMemo(() => computePositions(), []);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{modules.map((module, index) => (
				<Bubble
					key={module.id}
					module={module}
					index={index}
					position={positions[index]}
					onPress={onModulePress}
				/>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: "relative",
	},
	bubbleWrapper: {
		position: "absolute",
		justifyContent: "center",
		alignItems: "center",
	},
	glowHalo: {
		position: "absolute",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.7,
		shadowRadius: 25,
		elevation: 0,
	},
	bubble: {
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.25)",
		// 3D shadow — colored shadow matching the bubble
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.5,
		shadowRadius: 18,
		elevation: 12,
		overflow: "hidden",
	},
	specularHighlight: {
		position: "absolute",
		opacity: 0.35,
		zIndex: 2,
	},
	bottomShade: {
		position: "absolute",
		backgroundColor: "rgba(0,0,0,0.15)",
		zIndex: 1,
	},
	rimLight: {
		position: "absolute",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.12)",
		borderTopColor: "rgba(255,255,255,0.35)",
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
		marginBottom: 4,
		// Text shadow for depth
		textShadowColor: "rgba(0,0,0,0.3)",
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	name: {
		color: "#FFFFFF",
		fontWeight: "700",
		textAlign: "center",
		paddingHorizontal: 4,
		textShadowColor: "rgba(0,0,0,0.5)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 3,
	},
});
