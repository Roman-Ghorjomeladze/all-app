import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
	View,
	Text,
	Modal,
	Pressable,
	TouchableOpacity,
	StyleSheet,
	Dimensions,
	FlatList,
	NativeSyntheticEvent,
	NativeScrollEvent,
} from "react-native";
import { useThemeMode } from "../theme";
import { useLanguage } from "../i18n";

type TimePickerProps = {
	visible: boolean;
	value: { hour: number; minute: number };
	onSelect: (hour: number, minute: number) => void;
	onCancel: () => void;
	accentColor: string;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MODAL_WIDTH = Math.min(SCREEN_WIDTH - 48, 320);
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

type WheelProps = {
	data: number[];
	selected: number;
	onChange: (value: number) => void;
	accentColor: string;
	textColor: string;
	secondaryColor: string;
};

function Wheel({ data, selected, onChange, accentColor, textColor, secondaryColor }: WheelProps) {
	const flatListRef = useRef<FlatList>(null);
	const isScrolling = useRef(false);

	// Pad with empty items for centering
	const paddedData = useMemo(() => {
		const padding = Math.floor(VISIBLE_ITEMS / 2);
		const topPad = Array.from({ length: padding }, (_, i) => -1 - i);
		const bottomPad = Array.from({ length: padding }, (_, i) => -100 - i);
		return [...topPad, ...data, ...bottomPad];
	}, [data]);

	useEffect(() => {
		if (!isScrolling.current) {
			const index = data.indexOf(selected);
			if (index >= 0) {
				flatListRef.current?.scrollToOffset({
					offset: index * ITEM_HEIGHT,
					animated: false,
				});
			}
		}
	}, [selected, data]);

	const handleScrollEnd = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			isScrolling.current = false;
			const offset = event.nativeEvent.contentOffset.y;
			const index = Math.round(offset / ITEM_HEIGHT);
			const clamped = Math.max(0, Math.min(index, data.length - 1));
			if (data[clamped] !== selected) {
				onChange(data[clamped]);
			}
		},
		[data, selected, onChange],
	);

	const handleScrollBegin = useCallback(() => {
		isScrolling.current = true;
	}, []);

	const getItemLayout = useCallback((_: unknown, index: number) => ({
		length: ITEM_HEIGHT,
		offset: ITEM_HEIGHT * index,
		index,
	}), []);

	const renderItem = useCallback(
		({ item }: { item: number }) => {
			if (item < 0) {
				return <View style={{ height: ITEM_HEIGHT }} />;
			}
			const isSelected = item === selected;
			return (
				<TouchableOpacity
					style={styles.wheelItem}
					onPress={() => onChange(item)}
					activeOpacity={0.7}
				>
					<Text
						style={[
							styles.wheelItemText,
							{ color: isSelected ? accentColor : secondaryColor },
							isSelected && styles.wheelItemTextSelected,
						]}
					>
						{pad(item)}
					</Text>
				</TouchableOpacity>
			);
		},
		[selected, accentColor, textColor, secondaryColor, onChange],
	);

	return (
		<View style={{ height: WHEEL_HEIGHT }}>
			<FlatList
				ref={flatListRef}
				data={paddedData}
				keyExtractor={(item, index) => `${item}-${index}`}
				renderItem={renderItem}
				getItemLayout={getItemLayout}
				showsVerticalScrollIndicator={false}
				snapToInterval={ITEM_HEIGHT}
				decelerationRate="fast"
				onMomentumScrollEnd={handleScrollEnd}
				onScrollBeginDrag={handleScrollBegin}
				contentContainerStyle={{ paddingVertical: 0 }}
			/>
			{/* Selection highlight band */}
			<View style={[styles.selectionBand, { borderColor: accentColor + "30" }]} pointerEvents="none" />
		</View>
	);
}

export default function TimePicker({
	visible,
	value,
	onSelect,
	onCancel,
	accentColor,
}: TimePickerProps) {
	const { mode } = useThemeMode();
	const { t } = useLanguage();
	const isDark = mode === "dark";

	const palette = useMemo(() => ({
		overlay: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
		cardBackground: isDark ? "#2A273F" : "#FFFFFF",
		textPrimary: isDark ? "#D9E0EE" : "#1C1C1E",
		textSecondary: isDark ? "#6C6F93" : "#8E8E93",
		border: isDark ? "#3A375C" : "#E5E5EA",
		white: "#FFFFFF",
	}), [isDark]);

	const [selectedHour, setSelectedHour] = useState(value.hour);
	const [selectedMinute, setSelectedMinute] = useState(value.minute);

	useEffect(() => {
		if (visible) {
			setSelectedHour(value.hour);
			setSelectedMinute(value.minute);
		}
	}, [visible]);

	const handleSelect = useCallback(() => {
		onSelect(selectedHour, selectedMinute);
	}, [onSelect, selectedHour, selectedMinute]);

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			supportedOrientations={["portrait", "landscape"]}
			onRequestClose={onCancel}
		>
			<Pressable
				style={[styles.overlay, { backgroundColor: palette.overlay }]}
				onPress={onCancel}
			>
				<Pressable
					style={[styles.card, { backgroundColor: palette.cardBackground }]}
					onPress={() => {}}
				>
					{/* Time Display */}
					<View style={styles.timeDisplay}>
						<Text style={[styles.timeText, { color: accentColor }]}>
							{pad(selectedHour)}:{pad(selectedMinute)}
						</Text>
					</View>

					{/* Wheels */}
					<View style={styles.wheelsContainer}>
						<View style={styles.wheelColumn}>
							<Text style={[styles.wheelLabel, { color: palette.textSecondary }]}>
								{t("tdHour") || "Hour"}
							</Text>
							<Wheel
								data={HOURS}
								selected={selectedHour}
								onChange={setSelectedHour}
								accentColor={accentColor}
								textColor={palette.textPrimary}
								secondaryColor={palette.textSecondary}
							/>
						</View>

						<Text style={[styles.separator, { color: palette.textSecondary }]}>:</Text>

						<View style={styles.wheelColumn}>
							<Text style={[styles.wheelLabel, { color: palette.textSecondary }]}>
								{t("tdMinute") || "Min"}
							</Text>
							<Wheel
								data={MINUTES}
								selected={selectedMinute}
								onChange={setSelectedMinute}
								accentColor={accentColor}
								textColor={palette.textPrimary}
								secondaryColor={palette.textSecondary}
							/>
						</View>
					</View>

					{/* Bottom Buttons */}
					<View style={[styles.buttonRow, { borderTopColor: palette.border }]}>
						<TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={styles.button}>
							<Text style={[styles.cancelText, { color: palette.textSecondary }]}>
								{t("cancel")}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={handleSelect} activeOpacity={0.7} style={styles.button}>
							<Text style={[styles.selectText, { color: accentColor }]}>
								{t("calendarSelect")}
							</Text>
						</TouchableOpacity>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	card: {
		width: MODAL_WIDTH,
		borderRadius: 20,
		paddingTop: 20,
		paddingBottom: 16,
		paddingHorizontal: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.15,
		shadowRadius: 20,
		elevation: 10,
	},
	timeDisplay: {
		alignItems: "center",
		marginBottom: 16,
	},
	timeText: {
		fontSize: 40,
		fontWeight: "700",
		fontVariant: ["tabular-nums"],
	},
	wheelsContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	wheelColumn: {
		alignItems: "center",
		width: 80,
	},
	wheelLabel: {
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
		marginBottom: 8,
	},
	separator: {
		fontSize: 28,
		fontWeight: "600",
		marginHorizontal: 12,
		marginTop: 20,
	},
	wheelItem: {
		height: ITEM_HEIGHT,
		justifyContent: "center",
		alignItems: "center",
	},
	wheelItemText: {
		fontSize: 20,
		fontWeight: "400",
		fontVariant: ["tabular-nums"],
	},
	wheelItemTextSelected: {
		fontSize: 24,
		fontWeight: "700",
	},
	selectionBand: {
		position: "absolute",
		top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
		left: 0,
		right: 0,
		height: ITEM_HEIGHT,
		borderTopWidth: 1.5,
		borderBottomWidth: 1.5,
		borderRadius: 8,
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "center",
		gap: 24,
		paddingTop: 8,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	button: {
		paddingVertical: 8,
		paddingHorizontal: 4,
	},
	cancelText: {
		fontSize: 16,
		fontWeight: "500",
	},
	selectText: {
		fontSize: 16,
		fontWeight: "600",
	},
});
