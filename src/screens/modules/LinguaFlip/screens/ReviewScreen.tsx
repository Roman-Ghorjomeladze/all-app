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
	runOnJS,
} from "react-native-reanimated";
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
				behindCard: {
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
	const [isAnimating, setIsAnimating] = useState(false);

	// Double-buffer card data
	const [topCard, setTopCard] = useState<Card | null>(null);
	const [behindCard, setBehindCard] = useState<Card | null>(null);

	// Reanimated shared values
	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const behindScale = useSharedValue(0.95);
	const behindOpacity = useSharedValue(0.7);

	// Refs for worklet access
	const cardsRef = useRef<Card[]>([]);
	const currentIndexRef = useRef(0);
	const selectedTagIdRef = useRef<number | null>(null);
	const isAnimatingRef = useRef(false);

	cardsRef.current = cards;
	currentIndexRef.current = currentIndex;
	selectedTagIdRef.current = selectedTagId;

	// Derived rotation
	const rotateZ = useDerivedValue(() => {
		return `${interpolate(
			translateX.value,
			[-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
			[-15, 0, 15],
			Extrapolation.CLAMP,
		)}deg`;
	});

	// Animated styles
	const topCardStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotateZ: rotateZ.value }],
	}));

	const behindCardStyle = useAnimatedStyle(() => ({
		transform: [{ scale: behindScale.value }],
		opacity: behindOpacity.value,
	}));

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
			setTopCard(loadedCards[0] || null);
			setBehindCard(loadedCards[1] || null);
			translateX.value = 0;
			translateY.value = 0;
			behindScale.value = 0.95;
			behindOpacity.value = 0.7;
		},
		[projectId, translateX, translateY, behindScale, behindOpacity],
	);

	useFocusEffect(
		useCallback(() => {
			loadData(selectedTagId);
		}, [selectedTagId, loadData]),
	);

	// Sync buffer when cards change from external sources (tag filter, etc.)
	const lastSyncRef = useRef({ cards: [] as Card[], index: 0 });
	useEffect(() => {
		if (lastSyncRef.current.cards !== cards || lastSyncRef.current.index !== currentIndex) {
			lastSyncRef.current = { cards, index: currentIndex };
			if (!isAnimatingRef.current) {
				setTopCard(cards[currentIndex] || null);
				setBehindCard(cards[currentIndex + 1] || null);
			}
		}
	}, [cards, currentIndex]);

	// Called from the UI thread via runOnJS after swipe animation completes
	const onSwipeComplete = useCallback(
		(direction: "right" | "left") => {
			const currentCards = cardsRef.current;
			const index = currentIndexRef.current;
			const currentCard = currentCards[index];
			if (!currentCard) return;

			const isCorrect = direction === "right";
			setSwipeFeedback(isCorrect ? "know" : "learning");
			updateCardMastery(currentCard.id, isCorrect);

			const nextIndex = index + 1;

			if (nextIndex < currentCards.length) {
				const newTopCard = currentCards[nextIndex];
				const newBehindCard = currentCards[nextIndex + 1] || null;

				// Reset shared values synchronously
				translateX.value = 0;
				translateY.value = 0;
				behindScale.value = 0.95;
				behindOpacity.value = 0.7;

				// Batch all state updates
				setTopCard(newTopCard);
				setBehindCard(newBehindCard);
				setCurrentIndex(nextIndex);
				setSwipeFeedback(null);
				setIsAnimating(false);
				isAnimatingRef.current = false;
			} else {
				// End of deck — reload
				setTopCard(null);
				setBehindCard(null);
				setSwipeFeedback(null);
				setCurrentIndex(0);

				loadData().then(() => {
					setIsAnimating(false);
					isAnimatingRef.current = false;
				});
			}
		},
		[translateX, translateY, behindScale, behindOpacity, loadData],
	);

	// Swipe animation (runs on UI thread, calls JS when done)
	const swipe = useCallback(
		(direction: "right" | "left") => {
			"worklet";
			const toX = direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
			translateX.value = withTiming(toX, { duration: 250 }, () => {
				runOnJS(onSwipeComplete)(direction);
			});
		},
		[translateX, onSwipeComplete],
	);

	const resetCard = useCallback(() => {
		"worklet";
		translateX.value = withSpring(0);
		translateY.value = withSpring(0);
		behindScale.value = withSpring(0.95);
		behindOpacity.value = withSpring(0.7);
	}, [translateX, translateY, behindScale, behindOpacity]);

	const setAnimatingTrue = useCallback(() => {
		setIsAnimating(true);
		isAnimatingRef.current = true;
	}, []);

	// Gesture handler
	const panGesture = useMemo(
		() =>
			Gesture.Pan()
				.activeOffsetX([-10, 10])
				.failOffsetY([-10, 10])
				.onStart(() => {
					runOnJS(setAnimatingTrue)();
				})
				.onUpdate((event) => {
					translateX.value = event.translationX;
					translateY.value = event.translationY * 0.3;

					const progress = Math.min(Math.abs(event.translationX) / SWIPE_THRESHOLD, 1);
					behindScale.value = 0.95 + progress * 0.05;
					behindOpacity.value = 0.7 + progress * 0.3;
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
						runOnJS(setIsAnimating)(false);
						isAnimatingRef.current = false;
					}
				}),
		[translateX, translateY, behindScale, behindOpacity, swipe, resetCard, setAnimatingTrue],
	);

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
			) : topCard ? (
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
						{/* Behind card (preview of next) */}
						{behindCard && (
							<Animated.View pointerEvents="none" style={[styles.behindCard, behindCardStyle]}>
								<FlashCard
									frontText={behindCard.front_text}
									backText={behindCard.back_text}
									mastery={behindCard.mastery}
									showBothSides={showBothSides}
								/>
							</Animated.View>
						)}

						{/* Top card (swipeable) */}
						<GestureDetector gesture={panGesture}>
							<Animated.View style={topCardStyle}>
								<FlashCard
									frontText={topCard.front_text}
									backText={topCard.back_text}
									mastery={topCard.mastery}
									showBothSides={showBothSides}
								/>
							</Animated.View>
						</GestureDetector>
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
