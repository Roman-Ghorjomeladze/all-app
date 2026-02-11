import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withSequence,
	withRepeat,
	withTiming,
	useFrameCallback,
	SharedValue,
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

// Smaller bubbles to fit inside the hexagon
const BUBBLE_SIZES = [82, 80, 78, 80, 82, 78, 80, 78, 76];

// Hexagon geometry — flat-top regular hexagon, nearly full screen width
const HEX_CENTER_X = SCREEN_WIDTH / 2;
const HEX_CENTER_Y = (SCREEN_HEIGHT - 160) / 2; // Account for safe area + settings
const HEX_RADIUS = (SCREEN_WIDTH - 30) / 2; // Full width minus ~15px padding each side

// 6 vertices of a flat-top regular hexagon
function getHexVertices(cx: number, cy: number, r: number) {
	const vertices: { x: number; y: number }[] = [];
	for (let i = 0; i < 6; i++) {
		const angle = (Math.PI / 3) * i;
		vertices.push({
			x: cx + r * Math.cos(angle),
			y: cy + r * Math.sin(angle),
		});
	}
	return vertices;
}

// 6 edge normals pointing inward for collision detection
function getHexEdges(vertices: { x: number; y: number }[], cx: number, cy: number) {
	const edges: { nx: number; ny: number; d: number }[] = [];
	for (let i = 0; i < 6; i++) {
		const a = vertices[i];
		const b = vertices[(i + 1) % 6];
		// Edge direction
		const ex = b.x - a.x;
		const ey = b.y - a.y;
		// Outward normal (perpendicular)
		let nx = ey;
		let ny = -ex;
		const len = Math.sqrt(nx * nx + ny * ny);
		nx /= len;
		ny /= len;
		// Make sure normal points inward (toward center)
		const toCenterX = cx - a.x;
		const toCenterY = cy - a.y;
		if (nx * toCenterX + ny * toCenterY < 0) {
			nx = -nx;
			ny = -ny;
		}
		// Distance from origin along normal
		const d = nx * a.x + ny * a.y;
		edges.push({ nx, ny, d });
	}
	return edges;
}

const HEX_VERTICES = getHexVertices(HEX_CENTER_X, HEX_CENTER_Y, HEX_RADIUS);
const HEX_EDGES = getHexEdges(HEX_VERTICES, HEX_CENTER_X, HEX_CENTER_Y);

// Place 9 bubbles inside the hex: 3 rows (3-3-3) centered
function computePositions(): { x: number; y: number }[] {
	const positions: { x: number; y: number }[] = [];
	const rowOffsets = [-100, 0, 100]; // 3 rows
	const colConfigs = [
		[-90, 0, 90],   // row 0: 3 bubbles
		[-90, 0, 90],   // row 1: 3 bubbles
		[-90, 0, 90],   // row 2: 3 bubbles
	];

	for (let row = 0; row < 3; row++) {
		for (let col = 0; col < 3; col++) {
			const idx = row * 3 + col;
			const size = BUBBLE_SIZES[idx];
			positions.push({
				x: HEX_CENTER_X + colConfigs[row][col] - size / 2,
				y: HEX_CENTER_Y + rowOffsets[row] - size / 2,
			});
		}
	}
	return positions;
}

// Initial velocities — gentle drifts
const INITIAL_VELOCITIES = [
	{ vx: 0.2, vy: 0.15 },
	{ vx: -0.18, vy: 0.2 },
	{ vx: 0.15, vy: -0.18 },
	{ vx: -0.2, vy: -0.12 },
	{ vx: 0.18, vy: 0.2 },
	{ vx: -0.15, vy: 0.18 },
	{ vx: 0.2, vy: -0.15 },
	{ vx: -0.18, vy: 0.15 },
	{ vx: 0.15, vy: -0.2 },
];

const DAMPING = 0.9992;
const MIN_SPEED = 0.12;
const COLLISION_BOUNCE = 0.85;
const WALL_BOUNCE = 0.75;

/** Lighten a hex color by a percentage (0-1) */
function lightenColor(hex: string, amount: number): string {
	const h = hex.replace("#", "");
	const r = Math.min(255, parseInt(h.substring(0, 2), 16) + Math.round(255 * amount));
	const g = Math.min(255, parseInt(h.substring(2, 4), 16) + Math.round(255 * amount));
	const b = Math.min(255, parseInt(h.substring(4, 6), 16) + Math.round(255 * amount));
	return `rgb(${r},${g},${b})`;
}

// Glowing hexagon border component
function HexagonBorder() {
	const glowPulse = useSharedValue(0);

	React.useEffect(() => {
		glowPulse.value = withRepeat(
			withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
			-1,
			true,
		);
	}, []);

	const glowStyle = useAnimatedStyle(() => ({
		opacity: 0.3 + glowPulse.value * 0.2,
	}));

	// Render 6 line segments
	const lines = [];
	for (let i = 0; i < 6; i++) {
		const a = HEX_VERTICES[i];
		const b = HEX_VERTICES[(i + 1) % 6];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const length = Math.sqrt(dx * dx + dy * dy);
		const angle = Math.atan2(dy, dx) * (180 / Math.PI);

		lines.push(
			<Animated.View
				key={`hex-edge-${i}`}
				style={[
					styles.hexEdge,
					{
						width: length,
						left: a.x,
						top: a.y,
						transform: [{ rotate: `${angle}deg` }],
					},
					glowStyle,
				]}
			/>,
		);
	}

	// Glow layer behind the edges
	const glowLines = [];
	for (let i = 0; i < 6; i++) {
		const a = HEX_VERTICES[i];
		const b = HEX_VERTICES[(i + 1) % 6];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const length = Math.sqrt(dx * dx + dy * dy);
		const angle = Math.atan2(dy, dx) * (180 / Math.PI);

		glowLines.push(
			<Animated.View
				key={`hex-glow-${i}`}
				style={[
					styles.hexEdgeGlow,
					{
						width: length + 10,
						left: a.x - 5,
						top: a.y - 4,
						transform: [{ rotate: `${angle}deg` }],
					},
					glowStyle,
				]}
			/>,
		);
	}

	return (
		<>
			{glowLines}
			{lines}
		</>
	);
}

function Bubble({
	module,
	offsetX,
	offsetY,
	index,
	position,
	onPress,
}: {
	module: Module;
	offsetX: SharedValue<number>;
	offsetY: SharedValue<number>;
	index: number;
	position: { x: number; y: number };
	onPress: (route: keyof RootStackParamList) => void;
}) {
	const size = BUBBLE_SIZES[index];
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: offsetX.value },
			{ translateY: offsetY.value },
			{ scale: scale.value },
		],
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
			<View
				style={[
					styles.glowHalo,
					{
						width: size + 30,
						height: size + 30,
						borderRadius: (size + 30) / 2,
						backgroundColor: module.color + "30",
						shadowColor: module.color,
					},
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
	const count = Math.min(modules.length, BUBBLE_SIZES.length);

	// Shared values for each bubble's offset
	const offsetsX: SharedValue<number>[] = [];
	const offsetsY: SharedValue<number>[] = [];
	for (let i = 0; i < count; i++) {
		offsetsX.push(useSharedValue(0));
		offsetsY.push(useSharedValue(0));
	}

	// Velocities stored as shared values for UI thread mutation
	const velocitiesX: SharedValue<number>[] = [];
	const velocitiesY: SharedValue<number>[] = [];
	for (let i = 0; i < count; i++) {
		velocitiesX.push(useSharedValue(INITIAL_VELOCITIES[i].vx));
		velocitiesY.push(useSharedValue(INITIAL_VELOCITIES[i].vy));
	}

	// Pre-compute hex edge data for worklet (plain arrays, no objects)
	const hexNx = useMemo(() => HEX_EDGES.map(e => e.nx), []);
	const hexNy = useMemo(() => HEX_EDGES.map(e => e.ny), []);
	const hexD = useMemo(() => HEX_EDGES.map(e => e.d), []);

	// Physics simulation running on UI thread
	useFrameCallback(() => {
		"worklet";

		// Update positions
		for (let i = 0; i < count; i++) {
			offsetsX[i].value += velocitiesX[i].value;
			offsetsY[i].value += velocitiesY[i].value;

			// Apply damping
			velocitiesX[i].value *= DAMPING;
			velocitiesY[i].value *= DAMPING;

			// Re-nudge if too slow
			const speed = Math.sqrt(
				velocitiesX[i].value * velocitiesX[i].value +
				velocitiesY[i].value * velocitiesY[i].value
			);
			if (speed < MIN_SPEED) {
				const pseudo = (offsetsX[i].value * 7 + offsetsY[i].value * 13 + i * 31) % 6.28;
				velocitiesX[i].value = Math.cos(pseudo) * MIN_SPEED * 1.5;
				velocitiesY[i].value = Math.sin(pseudo) * MIN_SPEED * 1.5;
			}

			// Hexagon wall collision
			const r = BUBBLE_SIZES[i] / 2;
			const cx = positions[i].x + r + offsetsX[i].value;
			const cy = positions[i].y + r + offsetsY[i].value;

			for (let e = 0; e < 6; e++) {
				const nx = hexNx[e];
				const ny = hexNy[e];
				const d = hexD[e];
				// Signed distance from bubble center to edge (positive = inside)
				const dist = nx * cx + ny * cy - d;
				if (dist < r) {
					// Push bubble back inside
					const pushBack = r - dist;
					offsetsX[i].value += nx * pushBack;
					offsetsY[i].value += ny * pushBack;

					// Reflect velocity off the edge
					const vDotN = velocitiesX[i].value * nx + velocitiesY[i].value * ny;
					if (vDotN < 0) {
						velocitiesX[i].value -= 2 * vDotN * nx * WALL_BOUNCE;
						velocitiesY[i].value -= 2 * vDotN * ny * WALL_BOUNCE;
					}
				}
			}
		}

		// Collision detection & elastic response between all pairs
		for (let i = 0; i < count; i++) {
			for (let j = i + 1; j < count; j++) {
				const ri = BUBBLE_SIZES[i] / 2;
				const rj = BUBBLE_SIZES[j] / 2;

				const cix = positions[i].x + ri + offsetsX[i].value;
				const ciy = positions[i].y + ri + offsetsY[i].value;
				const cjx = positions[j].x + rj + offsetsX[j].value;
				const cjy = positions[j].y + rj + offsetsY[j].value;

				const dx = cjx - cix;
				const dy = cjy - ciy;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const minDist = ri + rj;

				if (dist < minDist && dist > 0) {
					const nx = dx / dist;
					const ny = dy / dist;

					const overlap = (minDist - dist) / 2;
					offsetsX[i].value -= nx * overlap;
					offsetsY[i].value -= ny * overlap;
					offsetsX[j].value += nx * overlap;
					offsetsY[j].value += ny * overlap;

					const dvx = velocitiesX[i].value - velocitiesX[j].value;
					const dvy = velocitiesY[i].value - velocitiesY[j].value;
					const dvDotN = dvx * nx + dvy * ny;

					if (dvDotN > 0) {
						const massi = ri * ri;
						const massj = rj * rj;
						const totalMass = massi + massj;

						const impulseI = (2 * massj * dvDotN) / totalMass * COLLISION_BOUNCE;
						const impulseJ = (2 * massi * dvDotN) / totalMass * COLLISION_BOUNCE;

						velocitiesX[i].value -= impulseI * nx;
						velocitiesY[i].value -= impulseI * ny;
						velocitiesX[j].value += impulseJ * nx;
						velocitiesY[j].value += impulseJ * ny;
					}
				}
			}
		}
	});

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<HexagonBorder />
			{modules.slice(0, count).map((module, index) => (
				<Bubble
					key={module.id}
					module={module}
					offsetX={offsetsX[index]}
					offsetY={offsetsY[index]}
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
	hexEdge: {
		position: "absolute",
		height: 1.5,
		backgroundColor: "rgba(255,255,255,0.4)",
		transformOrigin: "left center",
	},
	hexEdgeGlow: {
		position: "absolute",
		height: 10,
		borderRadius: 5,
		backgroundColor: "rgba(255,255,255,0.06)",
		transformOrigin: "left center",
		shadowColor: "#FFFFFF",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.3,
		shadowRadius: 12,
		elevation: 0,
	},
	bubbleWrapper: {
		position: "absolute",
		justifyContent: "center",
		alignItems: "center",
	},
	glowHalo: {
		position: "absolute",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.5,
		shadowRadius: 20,
		elevation: 0,
	},
	bubble: {
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.25)",
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
