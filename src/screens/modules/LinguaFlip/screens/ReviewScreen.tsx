import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Switch, FlatList, Alert } from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	useDerivedValue,
	withTiming,
	withSpring,
	interpolate,
	Extrapolation,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabScreenProps, BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { LinguaFlipTabParamList, LinguaFlipStackParamList } from "../../../../types/navigation";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../i18n";
import {
	getCardsByProject,
	getCardsByTag,
	getTagsByProject,
	updateCardMastery,
	resetCardStats,
	resetAllCardStats,
	Card,
	Tag,
} from "../database";
import FlashCard from "../components/FlashCard";
import TagFilter from "../components/TagFilter";
import CardListItem from "../components/CardListItem";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;

type Props = BottomTabScreenProps<LinguaFlipTabParamList, "LLReview">;

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				navHeaderButton: {
					paddingHorizontal: 6,
					paddingVertical: 4,
				},
				navHeaderRightButtons: {
					flexDirection: "row",
					alignItems: "center",
					gap: 8,
				},
				navManageText: {
					fontSize: 22,
					color: colors.accent,
				},
				navAddText: {
					fontSize: 28,
					color: colors.accent,
					fontWeight: "400",
				},
				navBackText: {
					fontSize: 16,
					color: colors.accent,
					fontWeight: "500",
				},
				navSettingsText: {
					fontSize: 22,
					color: colors.accent,
				},
				toggleRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.sm,
				},
				toggleLabel: {
					fontSize: 15,
					color: colors.textSecondary,
				},
				counter: {
					textAlign: "center",
					fontSize: 15,
					fontWeight: "600",
					color: colors.textSecondary,
					marginTop: spacing.sm,
				},
				feedbackContainer: {
					alignItems: "center",
					marginTop: spacing.xs,
					height: 24,
				},
				feedbackText: {
					fontSize: 18,
					fontWeight: "700",
					lineHeight: 24,
				},
				cardArea: {
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
				},
				cardWrapper: {
					position: "absolute",
				},
				hintsRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					paddingHorizontal: spacing.xl,
					paddingBottom: spacing.lg,
				},
				hintText: {
					fontSize: 13,
					fontWeight: "600",
				},
				listContent: {
					padding: spacing.md,
					paddingBottom: 40,
				},
				emptyContainer: {
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					paddingBottom: 60,
				},
				emptyEmoji: {
					fontSize: 72,
					marginBottom: spacing.lg,
				},
				emptyTitle: {
					fontSize: 22,
					fontWeight: "600",
					color: colors.textPrimary,
					marginBottom: spacing.sm,
				},
				emptyHint: {
					fontSize: 15,
					color: colors.textSecondary,
					textAlign: "center",
				},
			}),
		[colors],
	);
}

// ── Swipeable card wrapper ──
// Each card gets its OWN animated values.
// The top card can be dragged; the behind card is static with scale/opacity.
// When swiped away, this component stays mounted off-screen until parent unmounts it.
type SwipeableCardProps = {
	card: Card;
	isTop: boolean;
	showBothSides: boolean;
	onSwiped: (direction: "right" | "left") => void;
};

function SwipeableCard({ card, isTop, showBothSides, onSwiped }: SwipeableCardProps) {
	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const scale = useSharedValue(isTop ? 1 : 0.95);
	const opacity = useSharedValue(isTop ? 1 : 0.7);
	const isSwiping = useSharedValue(false);

	// When this card gets promoted from behind → top, animate scale/opacity up
	const wasTop = useRef(isTop);
	useEffect(() => {
		if (isTop && !wasTop.current) {
			scale.value = withSpring(1);
			opacity.value = withSpring(1);
		}
		wasTop.current = isTop;
	}, [isTop, scale, opacity]);

	const rotateZ = useDerivedValue(() => {
		return `${interpolate(
			translateX.value,
			[-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
			[-15, 0, 15],
			Extrapolation.CLAMP,
		)}deg`;
	});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: translateX.value },
			{ translateY: translateY.value },
			{ rotateZ: rotateZ.value },
			{ scale: scale.value },
		],
		opacity: opacity.value,
	}));

	const swipe = useCallback(
		(direction: "right" | "left") => {
			"worklet";
			const toX = direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
			translateX.value = withTiming(toX, { duration: 250 }, () => {
				scheduleOnRN(onSwiped, direction);
			});
		},
		[translateX, onSwiped],
	);

	const resetCard = useCallback(() => {
		"worklet";
		translateX.value = withSpring(0);
		translateY.value = withSpring(0);
	}, [translateX, translateY]);

	const panGesture = useMemo(
		() =>
			Gesture.Pan()
				.enabled(isTop)
				.activeOffsetX([-10, 10])
				.failOffsetY([-10, 10])
				.onStart(() => {
					isSwiping.value = true;
				})
				.onUpdate((event) => {
					translateX.value = event.translationX;
					translateY.value = event.translationY * 0.3;
				})
				.onEnd((event) => {
					if (event.translationX > SWIPE_THRESHOLD || (event.translationX > 40 && event.velocityX > 500)) {
						swipe("right");
					} else if (
						event.translationX < -SWIPE_THRESHOLD ||
						(event.translationX < -40 && event.velocityX < -500)
					) {
						swipe("left");
					} else {
						resetCard();
					}
					isSwiping.value = false;
				}),
		[isTop, translateX, translateY, isSwiping, swipe, resetCard],
	);

	return (
		<GestureDetector gesture={panGesture}>
			<Animated.View style={animatedStyle}>
				<FlashCard
					frontText={card.front_text}
					backText={card.back_text}
					mastery={card.mastery}
					showBothSides={showBothSides}
				/>
			</Animated.View>
		</GestureDetector>
	);
}

export default function ReviewScreen(_props: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const stackNavigation = useNavigation<NativeStackNavigationProp<LinguaFlipStackParamList>>();
	const tabNavigation = useNavigation<BottomTabNavigationProp<LinguaFlipTabParamList>>();
	const route = useRoute();
	const projectId = (route.params as any)?.projectId as number;

	const [cards, setCards] = useState<Card[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [showBothSides, setShowBothSides] = useState(false);
	const [showManage, setShowManage] = useState(false);
	const [swipeFeedback, setSwipeFeedback] = useState<"know" | "learning" | null>(null);

	const selectedTagIdRef = useRef<number | null>(null);
	selectedTagIdRef.current = selectedTagId;

	const loadData = useCallback(
		async (tagIdOverride?: number | null) => {
			const tagIdToUse = tagIdOverride !== undefined ? tagIdOverride : selectedTagIdRef.current;

			const allTags = await getTagsByProject(projectId);
			setTags(allTags);

			let loadedCards: Card[];
			if (tagIdToUse) {
				loadedCards = await getCardsByTag(projectId, tagIdToUse);
			} else {
				loadedCards = await getCardsByProject(projectId);
			}
			setCards(loadedCards);
			setCurrentIndex(0);
		},
		[projectId],
	);

	useFocusEffect(
		useCallback(() => {
			loadData(selectedTagId);
		}, [selectedTagId, loadData]),
	);

	// When a card is swiped, just advance the index.
	// The swiped card stays mounted off-screen, the behind card
	// (already showing correct data) becomes the new top — zero flicker.
	const onCardSwiped = useCallback(
		(direction: "right" | "left") => {
			const currentCard = cards[currentIndex];
			if (!currentCard) return;

			const isCorrect = direction === "right";
			setSwipeFeedback(isCorrect ? "know" : "learning");
			updateCardMastery(currentCard.id, isCorrect);

			const nextIndex = currentIndex + 1;
			if (nextIndex < cards.length) {
				setCurrentIndex(nextIndex);
				// Clear feedback after a short delay
				setTimeout(() => setSwipeFeedback(null), 300);
			} else {
				// End of deck — reload
				setSwipeFeedback(null);
				loadData();
			}
		},
		[cards, currentIndex, loadData],
	);

	// We render only 2 cards at a time: current (top) and current+1 (behind).
	// Each has its OWN FlashCard instance with fixed data — no prop swapping.
	// The current card keeps animating off-screen after swipe, then React
	// unmounts it on the next render when currentIndex advances.
	const visibleCards = useMemo(() => {
		const result: { card: Card; isTop: boolean }[] = [];
		// Behind card first (renders underneath)
		if (cards[currentIndex + 1]) {
			result.push({ card: cards[currentIndex + 1], isTop: false });
		}
		// Top card last (renders on top)
		if (cards[currentIndex]) {
			result.push({ card: cards[currentIndex], isTop: true });
		}
		return result;
	}, [cards, currentIndex]);

	const handleCardPress = (card: Card) => {
		stackNavigation.navigate("LLCardForm", {
			projectId,
			mode: "edit",
			cardId: card.id,
		});
	};

	const handleCardLongPress = (card: Card) => {
		Alert.alert(
			card.front_text,
			`${t("llTimesSeen")}: ${card.times_seen}\n${t("llTimesCorrect")}: ${card.times_correct}\n${t("llMastery")}: ${card.mastery}/5`,
			[
				{
					text: t("llResetCardStats"),
					onPress: () => {
						Alert.alert(t("llResetCardStats"), t("llResetCardStatsConfirm"), [
							{ text: t("cancel"), style: "cancel" },
							{
								text: t("llResetStats"),
								style: "destructive",
								onPress: async () => {
									await resetCardStats(card.id);
									loadData();
									Alert.alert(t("llStatsReset"));
								},
							},
						]);
					},
				},
				{
					text: t("edit"),
					onPress: () => handleCardPress(card),
				},
				{ text: t("cancel"), style: "cancel" },
			],
		);
	};

	const handleResetAllStats = useCallback(() => {
		Alert.alert(t("llResetAllStats"), t("llResetAllStatsConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("llResetStats"),
				style: "destructive",
				onPress: async () => {
					await resetAllCardStats(projectId);
					loadData();
					Alert.alert(t("llStatsReset"));
				},
			},
		]);
	}, [t, projectId, loadData]);

	// Update header buttons based on manage mode
	useEffect(() => {
		if (showManage) {
			tabNavigation.setOptions({
				headerLeft: () => (
					<TouchableOpacity style={styles.navHeaderButton} onPress={() => setShowManage(false)}>
						<Text style={styles.navBackText}>
							{"\u2039"} {t("llReview")}
						</Text>
					</TouchableOpacity>
				),
				headerRight: () => (
					<View style={styles.navHeaderRightButtons}>
						<TouchableOpacity style={styles.navHeaderButton} onPress={handleResetAllStats}>
							<Ionicons name="trash-outline" size={24} color="red" />
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.navHeaderButton}
							onPress={() => stackNavigation.navigate("LLCardForm", { projectId, mode: "create" })}
						>
							<Ionicons name="add-circle-outline" size={24} color="green" />
						</TouchableOpacity>
					</View>
				),
				title: t("llManageCards"),
			});
		} else {
			tabNavigation.setOptions({
				headerLeft: () => (
					<TouchableOpacity style={styles.navHeaderButton} onPress={() => setShowManage(true)}>
						<Text style={styles.navManageText}>{"\u2630"}</Text>
					</TouchableOpacity>
				),
				headerRight: () => (
					<TouchableOpacity
						style={styles.navHeaderButton}
						onPress={() => stackNavigation.navigate("LLCardForm", { projectId, mode: "create" })}
					>
						<Ionicons name="add-circle-outline" size={24} color="green" />
					</TouchableOpacity>
				),
				title: t("llReview"),
			});
		}
	}, [showManage, t, projectId, stackNavigation, tabNavigation, handleResetAllStats, styles]);

	if (showManage) {
		return (
			<View style={styles.container}>
				<TagFilter tags={tags} selectedTagId={selectedTagId} onSelect={setSelectedTagId} />

				<FlatList
					data={cards}
					keyExtractor={(item) => String(item.id)}
					contentContainerStyle={styles.listContent}
					renderItem={({ item }) => (
						<CardListItem
							card={item}
							onPress={() => handleCardPress(item)}
							onLongPress={() => handleCardLongPress(item)}
						/>
					)}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyEmoji}>{"\u{1F4DA}"}</Text>
							<Text style={styles.emptyTitle}>{t("llNoCards")}</Text>
							<Text style={styles.emptyHint}>{t("llNoCardsHint")}</Text>
						</View>
					}
				/>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Tag filter */}
			<TagFilter tags={tags} selectedTagId={selectedTagId} onSelect={setSelectedTagId} />

			{/* Show both sides toggle */}
			<View style={styles.toggleRow}>
				<Text style={styles.toggleLabel}>{t("llShowTranslations")}</Text>
				<Switch
					value={showBothSides}
					onValueChange={setShowBothSides}
					trackColor={{ false: colors.progressBackground, true: colors.accentLight }}
					thumbColor={colors.white}
				/>
			</View>

			{cards.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyEmoji}>{"\u{1F4DA}"}</Text>
					<Text style={styles.emptyTitle}>{t("llNoCards")}</Text>
					<Text style={styles.emptyHint}>{t("llNoCardsHint")}</Text>
				</View>
			) : cards[currentIndex] ? (
				<>
					{/* Counter */}
					<Text style={styles.counter}>
						{currentIndex + 1} / {cards.length}
					</Text>

					{/* Swipe feedback */}
					<View style={styles.feedbackContainer}>
						<Text
							style={[
								styles.feedbackText,
								{
									color: swipeFeedback === "know" ? colors.knowIt : colors.stillLearning,
									opacity: swipeFeedback ? 1 : 0,
								},
							]}
						>
							{swipeFeedback === "know" ? t("llKnowIt") : t("llStillLearning")}
						</Text>
					</View>

					{/* Card Stack */}
					<View style={styles.cardArea}>
						{visibleCards.map(({ card, isTop }) => (
							<View
								key={card.id}
								style={[styles.cardWrapper, isTop ? { zIndex: 2 } : { zIndex: 1 }]}
								pointerEvents={isTop ? "auto" : "none"}
							>
								<SwipeableCard
									card={card}
									isTop={isTop}
									showBothSides={showBothSides}
									onSwiped={onCardSwiped}
								/>
							</View>
						))}
					</View>

					{/* Swipe hints */}
					<View style={styles.hintsRow}>
						<Text style={[styles.hintText, { color: colors.stillLearning }]}>
							{"\u2190"} {t("llStillLearning")}
						</Text>
						<Text style={[styles.hintText, { color: colors.knowIt }]}>
							{t("llKnowIt")} {"\u2192"}
						</Text>
					</View>
				</>
			) : null}
		</View>
	);
}
