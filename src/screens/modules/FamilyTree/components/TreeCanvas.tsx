import React, { useImperativeHandle, forwardRef, useState, useEffect, useCallback, useMemo } from "react";
import { StyleSheet, LayoutChangeEvent } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withDecay, withTiming } from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Svg from "react-native-svg";
import { TreeLayout } from "../utils/treeLayout";
import { useColors, Colors } from "../theme";
import PersonNode from "./PersonNode";
import ConnectorLine from "./ConnectorLine";

type TreeCanvasProps = {
	layout: TreeLayout;
	onPersonPress: (id: number) => void;
	onAddChild: (parentId: number) => void;
};

export type TreeCanvasHandle = {
	recenter: () => void;
};

const MIN_SCALE = 0.3;
const MAX_SCALE = 3.0;

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.canvasBackground,
			overflow: "hidden",
		},
		canvas: {
			flex: 1,
		},
	}), [colors]);
}

const TreeCanvas = forwardRef<TreeCanvasHandle, TreeCanvasProps>(function TreeCanvas(
	{ layout, onPersonPress, onAddChild },
	ref,
) {
	const colors = useColors();
	const styles = useStyles(colors);

	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const scale = useSharedValue(1);

	const savedTranslateX = useSharedValue(0);
	const savedTranslateY = useSharedValue(0);
	const savedScale = useSharedValue(1);

	const [containerSize, setContainerSize] = useState({ width: 400, height: 600 });

	const handleLayout = useCallback((event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		if (width > 0 && height > 0) {
			setContainerSize({ width, height });
		}
	}, []);

	const recenter = useCallback(() => {
		const contentWidth = layout.width;
		const contentHeight = layout.height;

		if (contentWidth === 0 || contentHeight === 0) {
			translateX.value = withTiming(0, { duration: 400 });
			translateY.value = withTiming(0, { duration: 400 });
			scale.value = withTiming(1, { duration: 400 });
			return;
		}

		// Calculate scale to fit the entire tree in the viewport
		const scaleX = containerSize.width / contentWidth;
		const scaleY = containerSize.height / contentHeight;
		const fitScale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 1x
		const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, fitScale));

		// Calculate translation to center the tree in the viewport
		const scaledWidth = contentWidth * clampedScale;
		const scaledHeight = contentHeight * clampedScale;
		const targetTX = (containerSize.width - scaledWidth) / 2;
		const targetTY = (containerSize.height - scaledHeight) / 2;

		const timingConfig = { duration: 400 };
		translateX.value = withTiming(targetTX, timingConfig);
		translateY.value = withTiming(targetTY, timingConfig);
		scale.value = withTiming(clampedScale, timingConfig);
	}, [layout.width, layout.height, containerSize.width, containerSize.height]);

	useImperativeHandle(ref, () => ({ recenter }), [recenter]);

	// Auto-recenter when layout changes (new data loaded)
	useEffect(() => {
		if (layout.nodes.length > 0 && containerSize.width > 0) {
			const timer = setTimeout(() => {
				recenter();
			}, 150);
			return () => clearTimeout(timer);
		}
	}, [layout.nodes.length, containerSize.width]);

	const panGesture = Gesture.Pan()
		.onStart(() => {
			savedTranslateX.value = translateX.value;
			savedTranslateY.value = translateY.value;
		})
		.onUpdate((event) => {
			translateX.value = savedTranslateX.value + event.translationX;
			translateY.value = savedTranslateY.value + event.translationY;
		})
		.onEnd((event) => {
			translateX.value = withDecay({
				velocity: event.velocityX,
				deceleration: 0.997,
			});
			translateY.value = withDecay({
				velocity: event.velocityY,
				deceleration: 0.997,
			});
		});

	const pinchGesture = Gesture.Pinch()
		.onStart(() => {
			savedScale.value = scale.value;
		})
		.onUpdate((event) => {
			const newScale = savedScale.value * event.scale;
			scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
		});

	const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: translateX.value },
			{ translateY: translateY.value },
			{ scale: scale.value },
		],
	}));

	// Calculate SVG viewport size (at least container size)
	const svgWidth = Math.max(layout.width, containerSize.width);
	const svgHeight = Math.max(layout.height, containerSize.height);

	return (
		<GestureHandlerRootView style={styles.container} onLayout={handleLayout}>
			<GestureDetector gesture={composedGesture}>
				<Animated.View style={[styles.canvas, animatedStyle]}>
					<Svg width={svgWidth} height={svgHeight}>
						{/* Render edges first (behind nodes) */}
						{layout.edges.map((edge) => (
							<ConnectorLine key={edge.id} edge={edge} />
						))}

						{/* Render nodes on top */}
						{layout.nodes.map((node) => (
							<PersonNode
								key={node.id}
								node={node}
								onPress={onPersonPress}
								onAddChild={onAddChild}
							/>
						))}
					</Svg>
				</Animated.View>
			</GestureDetector>
		</GestureHandlerRootView>
	);
});

export default TreeCanvas;
