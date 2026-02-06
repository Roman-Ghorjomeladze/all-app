import React, { useMemo } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useColors, Colors, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import { CyclePhase } from "../utils/cycleCalculations";

type CircleWheelProps = {
	currentDay: number;
	cycleLength: number;
	periodLength: number;
	phase: CyclePhase;
};

const { width } = Dimensions.get("window");
const SIZE = width - 80;
const STROKE_WIDTH = 24;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CENTER = SIZE / 2;

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			width: SIZE,
			height: SIZE,
			alignItems: "center",
			justifyContent: "center",
		},
		centerContent: {
			position: "absolute",
			alignItems: "center",
			justifyContent: "center",
		},
		dayNumber: {
			...typography.largeTitle,
			color: colors.textPrimary,
		},
		phaseText: {
			...typography.callout,
			color: colors.textSecondary,
			marginTop: 4,
			textAlign: "center",
		},
	}), [colors]);
}

export default function CircleWheel({ currentDay, cycleLength, periodLength, phase }: CircleWheelProps) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const ovulationDay = cycleLength - 14;
	const fertileStart = ovulationDay - 5;
	const fertileEnd = ovulationDay + 1;

	// Calculate arc segments
	const dayAngle = 360 / cycleLength;
	const startAngle = -90; // Start from top

	const getArcPath = (startDay: number, endDay: number): string => {
		const start = startAngle + (startDay - 1) * dayAngle;
		const end = startAngle + endDay * dayAngle;
		return describeArc(CENTER, CENTER, RADIUS, start, end);
	};

	const getPhaseLabel = (p: CyclePhase): string => {
		switch (p) {
			case "period":
				return t("phasePeriod");
			case "fertile":
				return t("phaseFertile");
			case "ovulation":
				return t("phaseOvulation");
			default:
				return t("phaseRegular");
		}
	};

	const getPhaseColor = (p: CyclePhase): string => {
		switch (p) {
			case "period":
				return colors.period;
			case "fertile":
				return colors.fertile;
			case "ovulation":
				return colors.ovulation;
			default:
				return colors.textSecondary;
		}
	};

	return (
		<View style={styles.container}>
			<Svg width={SIZE} height={SIZE}>
				{/* Background circle */}
				<Circle
					cx={CENTER}
					cy={CENTER}
					r={RADIUS}
					stroke={colors.regular}
					strokeWidth={STROKE_WIDTH}
					fill="none"
				/>

				{/* Period arc */}
				<Path d={getArcPath(1, periodLength)} stroke={colors.period} strokeWidth={STROKE_WIDTH} fill="none" />

				{/* Fertile window arc */}
				<Path
					d={getArcPath(fertileStart, fertileEnd)}
					stroke={colors.fertile}
					strokeWidth={STROKE_WIDTH}
					fill="none"
				/>

				{/* Ovulation day marker */}
				<G>
					{(() => {
						const angle = (startAngle + (ovulationDay - 0.5) * dayAngle) * (Math.PI / 180);
						const x = CENTER + RADIUS * Math.cos(angle);
						const y = CENTER + RADIUS * Math.sin(angle);
						return <Circle cx={x} cy={y} r={STROKE_WIDTH / 2 + 4} fill={colors.ovulation} />;
					})()}
				</G>

				{/* Current day marker */}
				{currentDay > 0 && currentDay <= cycleLength && (
					<G>
						{(() => {
							const angle = (startAngle + (currentDay - 0.5) * dayAngle) * (Math.PI / 180);
							const x = CENTER + RADIUS * Math.cos(angle);
							const y = CENTER + RADIUS * Math.sin(angle);
							return (
								<>
									<Circle cx={x} cy={y} r={STROKE_WIDTH / 2 + 8} fill={colors.white} opacity={0.9} />
									<Circle cx={x} cy={y} r={STROKE_WIDTH / 2 + 4} fill={getPhaseColor(phase)} />
								</>
							);
						})()}
					</G>
				)}
			</Svg>

			{/* Center content */}
			<View style={styles.centerContent}>
				<Text style={styles.dayNumber}>
					{currentDay > 0 ? t("dayOf", { current: currentDay, total: cycleLength }).split("/")[0].trim() : "\u2014"}
				</Text>
				<Text style={styles.phaseText}>
					{currentDay > 0 ? getPhaseLabel(phase) : t("logToStart")}
				</Text>
			</View>
		</View>
	);
}

// Helper function to describe an arc path
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
	const start = polarToCartesian(x, y, radius, endAngle);
	const end = polarToCartesian(x, y, radius, startAngle);
	const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

	return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
}

function polarToCartesian(
	centerX: number,
	centerY: number,
	radius: number,
	angleInDegrees: number
): { x: number; y: number } {
	const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
	return {
		x: centerX + radius * Math.cos(angleInRadians),
		y: centerY + radius * Math.sin(angleInRadians),
	};
}
