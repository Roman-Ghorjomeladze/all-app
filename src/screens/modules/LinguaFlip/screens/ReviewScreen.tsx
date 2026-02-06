import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Animated,
	PanResponder,
	Dimensions,
	Switch,
	FlatList,
	Alert,
} from "react-native";
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
	return useMemo(() => StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background,
		},
		// Nav header button styles (used in setOptions)
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
			height: 24, // Fixed height to prevent layout shift
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
		nextCardContainer: {
			position: "absolute",
		},
		currentCardContainer: {
			// Current card is on top
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
	}), [colors]);
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

	// Animation values for current card
	const position = useRef(new Animated.ValueXY()).current;
	const currentCardOpacity = useRef(new Animated.Value(1)).current;
	const nextCardScale = useRef(new Animated.Value(0.95)).current;
	const nextCardOpacity = useRef(new Animated.Value(0.7)).current;

	// Use refs to always access current state values in panResponder
	const cardsRef = useRef<Card[]>([]);
	const currentIndexRef = useRef(0);
	const selectedTagIdRef = useRef<number | null>(null);

	// Keep refs in sync with state
	cardsRef.current = cards;
	currentIndexRef.current = currentIndex;
	selectedTagIdRef.current = selectedTagId;

	// Rotation interpolation based on horizontal position
	const rotate = position.x.interpolate({
		inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
		outputRange: ["-15deg", "0deg", "15deg"],
		extrapolate: "clamp",
	});

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
			position.setValue({ x: 0, y: 0 });
			currentCardOpacity.setValue(1);
			nextCardScale.setValue(0.95);
			nextCardOpacity.setValue(0.7);
		},
		[projectId, position, currentCardOpacity, nextCardScale, nextCardOpacity],
	);

	useFocusEffect(
		useCallback(() => {
			loadData(selectedTagId);
		}, [selectedTagId, loadData]),
	);

	const handleSwipeComplete = useCallback(
		(direction: "right" | "left", velocity: number = 0) => {
			const currentCards = cardsRef.current;
			const index = currentIndexRef.current;
			const currentCard = currentCards[index];
			if (!currentCard || isAnimating) return;

			setIsAnimating(true);
			const isCorrect = direction === "right";
			setSwipeFeedback(isCorrect ? "know" : "learning");

			// Update mastery in background
			updateCardMastery(currentCard.id, isCorrect);

			const toX = direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
			const toY = Math.abs(velocity) > 0.5 ? velocity * 50 : 0;

			Animated.timing(position, {
				toValue: { x: toX, y: toY },
				duration: 280,
				useNativeDriver: true,
			}).start(() => {
				// Reset animation values BEFORE any state changes
				position.setValue({ x: 0, y: 0 });
				nextCardScale.setValue(1);
				nextCardOpacity.setValue(1);
				// Start current card opacity at 0 for fade-in effect
				currentCardOpacity.setValue(0);

				if (index < currentCards.length - 1) {
					setSwipeFeedback(null);
					setCurrentIndex(index + 1);

					// Fade in the new current card to mask any re-render flicker
					setTimeout(() => {
						Animated.timing(currentCardOpacity, {
							toValue: 1,
							duration: 150,
							useNativeDriver: true,
						}).start(() => {
							nextCardScale.setValue(0.95);
							nextCardOpacity.setValue(0.7);
							setIsAnimating(false);
						});
					}, 10);
				} else {
					// When reloading, clear cards first to avoid showing stale data
					setCards([]);
					setCurrentIndex(0);
					setSwipeFeedback(null);

					// Then load fresh data
					loadData().then(() => {
						// Fade in the first card of new deck
						Animated.timing(currentCardOpacity, {
							toValue: 1,
							duration: 150,
							useNativeDriver: true,
						}).start(() => {
							nextCardScale.setValue(0.95);
							nextCardOpacity.setValue(0.7);
							setIsAnimating(false);
						});
					});
				}
			});
		},
		[isAnimating, position, currentCardOpacity, nextCardScale, nextCardOpacity, loadData],
	);

	// Use ref to always have access to latest handleSwipeComplete
	const handleSwipeCompleteRef = useRef(handleSwipeComplete);
	handleSwipeCompleteRef.current = handleSwipeComplete;

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => false,
			onMoveShouldSetPanResponder: (_, gestureState) => {
				return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
			},
			onPanResponderMove: (_, gestureState) => {
				position.setValue({ x: gestureState.dx, y: gestureState.dy * 0.3 }); // Reduced vertical movement

				// Scale up next card as user drags
				const progress = Math.min(Math.abs(gestureState.dx) / SWIPE_THRESHOLD, 1);
				nextCardScale.setValue(0.95 + progress * 0.05);
				nextCardOpacity.setValue(0.7 + progress * 0.3);
			},
			onPanResponderRelease: (_, gestureState) => {
				if (gestureState.dx > SWIPE_THRESHOLD || (gestureState.dx > 40 && gestureState.vx > 0.5)) {
					handleSwipeCompleteRef.current("right", gestureState.vy);
				} else if (gestureState.dx < -SWIPE_THRESHOLD || (gestureState.dx < -40 && gestureState.vx < -0.5)) {
					handleSwipeCompleteRef.current("left", gestureState.vy);
				} else {
					// Snap back
					Animated.parallel([
						Animated.spring(position, {
							toValue: { x: 0, y: 0 },
							friction: 5,
							useNativeDriver: true,
						}),
						Animated.spring(nextCardScale, {
							toValue: 0.95,
							friction: 5,
							useNativeDriver: true,
						}),
						Animated.spring(nextCardOpacity, {
							toValue: 0.7,
							friction: 5,
							useNativeDriver: true,
						}),
					]).start();
				}
			},
		}),
	).current;

	const currentCard = cards[currentIndex];

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
			) : currentCard ? (
				<>
					{/* Counter */}
					<Text style={styles.counter}>
						{currentIndex + 1} / {cards.length}
					</Text>

					{/* Swipe feedback - always rendered with fixed height to prevent layout shift */}
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
						{/* Next card (behind) - pointerEvents none to prevent touch */}
						{cards[currentIndex + 1] && (
							<Animated.View
								pointerEvents="none"
								style={[
									styles.nextCardContainer,
									{
										transform: [{ scale: nextCardScale }],
										opacity: nextCardOpacity,
									},
								]}
							>
								<FlashCard
									frontText={cards[currentIndex + 1].front_text}
									backText={cards[currentIndex + 1].back_text}
									mastery={cards[currentIndex + 1].mastery}
									showBothSides={showBothSides}
								/>
							</Animated.View>
						)}

						{/* Current card (on top) */}
						<Animated.View
							style={[
								styles.currentCardContainer,
								{
									transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
								},
							]}
							{...panResponder.panHandlers}
						>
							<FlashCard
								frontText={currentCard.front_text}
								backText={currentCard.back_text}
								mastery={currentCard.mastery}
								showBothSides={showBothSides}
							/>
						</Animated.View>
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
