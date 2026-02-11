import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
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

type Module = {
	id: string;
	name: string;
	color: string;
	icon: string;
	route: keyof RootStackParamList;
};

type Props = {
	modules: Module[];
	onModulePress: (route: keyof RootStackParamList) => void;
	colors: { background: string; textPrimary: string; textSecondary: string; moduleNameColor: string; shadow: string };
};

const BG_COLOR = "#0B0D21";

// Constellation positions (percentages of usable area)
const STAR_POSITIONS = [
	{ xPct: 0.22, yPct: 0.1 },
	{ xPct: 0.72, yPct: 0.08 },
	{ xPct: 0.47, yPct: 0.22 },
	{ xPct: 0.18, yPct: 0.38 },
	{ xPct: 0.76, yPct: 0.35 },
	{ xPct: 0.47, yPct: 0.5 },
	{ xPct: 0.20, yPct: 0.65 },
	{ xPct: 0.74, yPct: 0.62 },
	{ xPct: 0.47, yPct: 0.82 },
];

// Which stars to connect — creating a constellation shape
const CONNECTIONS: [number, number][] = [
	[0, 2],
	[2, 1],
	[0, 3],
	[1, 4],
	[3, 5],
	[4, 5],
	[5, 6],
	[5, 7],
	[3, 6],
	[4, 7],
	[6, 8],
	[7, 8],
];

const ICON_SIZE = 69;

const NUM_PARTICLES = 35;

function generateParticles(containerWidth: number, containerHeight: number) {
	return Array.from({ length: NUM_PARTICLES }, (_, i) => ({
		x: Math.random() * containerWidth,
		y: Math.random() * containerHeight,
		size: 1.5 + Math.random() * 2.5,
		duration: 1000 + Math.random() * 3000,
		delay: Math.random() * 2000,
	}));
}

function TwinklingStar({ particle }: { particle: ReturnType<typeof generateParticles>[0] }) {
	const opacity = useSharedValue(0.2);

	useEffect(() => {
		const timeout = setTimeout(() => {
			opacity.value = withRepeat(
				withTiming(0.9, {
					duration: particle.duration,
					easing: Easing.inOut(Easing.sin),
				}),
				-1,
				true,
			);
		}, particle.delay);
		return () => clearTimeout(timeout);
	}, []);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	return (
		<Animated.View
			style={[
				styles.particle,
				{
					left: particle.x,
					top: particle.y,
					width: particle.size,
					height: particle.size,
					borderRadius: particle.size / 2,
				},
				animatedStyle,
			]}
		/>
	);
}

function ConstellationLine({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const length = Math.sqrt(dx * dx + dy * dy);
	const angle = Math.atan2(dy, dx) * (180 / Math.PI);

	return (
		<View
			style={[
				styles.line,
				{
					width: length,
					left: from.x,
					top: from.y,
					transform: [{ rotate: `${angle}deg` }],
				},
			]}
		/>
	);
}

function ConstellationStar({
	module,
	x,
	y,
	onPress,
}: {
	module: Module;
	x: number;
	y: number;
	onPress: (route: keyof RootStackParamList) => void;
}) {
	const scale = useSharedValue(1);
	const glowOpacity = useSharedValue(0.4);

	useEffect(() => {
		glowOpacity.value = withRepeat(
			withTiming(0.8, { duration: 2000 + Math.random() * 2000, easing: Easing.inOut(Easing.sin) }),
			-1,
			true,
		);
	}, []);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const glowStyle = useAnimatedStyle(() => ({
		opacity: glowOpacity.value,
	}));

	const handlePress = () => {
		scale.value = withSequence(withSpring(1.3, { damping: 8 }), withSpring(1, { damping: 10 }));
		setTimeout(() => onPress(module.route), 200);
	};

	return (
		<Animated.View
			style={[styles.starContainer, { left: x - ICON_SIZE / 2, top: y - ICON_SIZE / 2 }, animatedStyle]}
		>
			<Animated.View
				style={[
					styles.glow,
					{
						backgroundColor: module.color,
						shadowColor: module.color,
					},
					glowStyle,
				]}
			/>
			<View style={styles.starTouchArea} onTouchEnd={handlePress}>
				<View style={[styles.starIcon, { borderColor: module.color + "80" }]}>
					<Text style={styles.starEmoji}>{module.icon}</Text>
				</View>
				<Text style={styles.starName} numberOfLines={1}>
					{module.name}
				</Text>
			</View>
		</Animated.View>
	);
}

// Inner component — remounts on layout change to regenerate particles
function ConstellationInner({
	modules,
	onModulePress,
	containerWidth,
	containerHeight,
}: {
	modules: Module[];
	onModulePress: (route: keyof RootStackParamList) => void;
	containerWidth: number;
	containerHeight: number;
}) {
	const particles = useMemo(
		() => generateParticles(containerWidth, containerHeight),
		[containerWidth, containerHeight],
	);

	const driftX = useSharedValue(0);

	useEffect(() => {
		driftX.value = withRepeat(withTiming(5, { duration: 20000, easing: Easing.inOut(Easing.sin) }), -1, true);
	}, []);

	const driftStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: driftX.value }],
	}));

	// Convert percentage positions to absolute positions — centered in the container
	const constellationWidth = containerWidth * 0.82;
	const horizontalPad = (containerWidth - constellationWidth) / 2;

	const minY = Math.min(...STAR_POSITIONS.map((p) => p.yPct));
	const maxY = Math.max(...STAR_POSITIONS.map((p) => p.yPct));
	const constellationSpan = (maxY - minY) * containerHeight;
	const verticalPad = (containerHeight - constellationSpan) / 2 - minY * containerHeight;

	const positions = useMemo(
		() =>
			STAR_POSITIONS.map((pos) => ({
				x: horizontalPad + pos.xPct * constellationWidth,
				y: verticalPad + pos.yPct * containerHeight,
			})),
		[containerWidth, containerHeight],
	);

	return (
		<>
			{particles.map((p, i) => (
				<TwinklingStar key={`p-${i}`} particle={p} />
			))}

			<Animated.View style={[styles.constellationContainer, driftStyle]}>
				{CONNECTIONS.map(([fromIdx, toIdx], i) => (
					<ConstellationLine key={`line-${i}`} from={positions[fromIdx]} to={positions[toIdx]} />
				))}

				{modules.map((module, index) => {
					if (index >= positions.length) return null;
					return (
						<ConstellationStar
							key={module.id}
							module={module}
							x={positions[index].x}
							y={positions[index].y}
							onPress={onModulePress}
						/>
					);
				})}
			</Animated.View>
		</>
	);
}

export default function ConstellationLayout({ modules, onModulePress }: Props) {
	const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);

	const handleLayout = (e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		setLayout({ width, height });
	};

	const layoutKey = layout ? `${Math.round(layout.width)}_${Math.round(layout.height)}` : "init";

	return (
		<View style={styles.container} onLayout={handleLayout}>
			{layout && (
				<ConstellationInner
					key={layoutKey}
					modules={modules}
					onModulePress={onModulePress}
					containerWidth={layout.width}
					containerHeight={layout.height}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: BG_COLOR,
		position: "relative",
	},
	particle: {
		position: "absolute",
		backgroundColor: "#FFFFFF",
	},
	constellationContainer: {
		...StyleSheet.absoluteFillObject,
	},
	line: {
		position: "absolute",
		height: 1,
		backgroundColor: "rgba(255,255,255,0.12)",
		transformOrigin: "left center",
	},
	starContainer: {
		position: "absolute",
		width: ICON_SIZE,
		height: ICON_SIZE + 18,
		alignItems: "center",
	},
	glow: {
		position: "absolute",
		width: ICON_SIZE + 20,
		height: ICON_SIZE + 20,
		borderRadius: (ICON_SIZE + 20) / 2,
		left: -10,
		top: -10,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.6,
		shadowRadius: 15,
		elevation: 0,
	},
	starTouchArea: {
		alignItems: "center",
	},
	starIcon: {
		width: ICON_SIZE,
		height: ICON_SIZE,
		borderRadius: ICON_SIZE / 2,
		backgroundColor: "rgba(255,255,255,0.08)",
		borderWidth: 1.5,
		justifyContent: "center",
		alignItems: "center",
	},
	starEmoji: {
		fontSize: 24,
	},
	starName: {
		fontSize: 10,
		fontWeight: "600",
		color: "rgba(255,255,255,0.8)",
		marginTop: 3,
		textAlign: "center",
	},
});
