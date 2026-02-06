import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LLQuizStackParamList } from "../../../../types/navigation";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../i18n";
import { getQuizPool, updateCardMastery, saveMistake, Card } from "../database";
import QuizOption from "../components/QuizOption";

type Props = NativeStackScreenProps<LLQuizStackParamList, "LLQuizPlay">;
type OptionState = "default" | "correct" | "incorrect";

function shuffle<T>(array: T[]): T[] {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

type Question = {
	card: Card;
	options: Card[];
};

function generateQuestions(allCards: Card[], count: number, mode: "easy" | "medium" | "hard"): Question[] {
	const selected = allCards.slice(0, Math.min(count, allCards.length));

	return selected.map((card) => {
		if (mode === "hard") {
			return { card, options: [] };
		}

		const wrongPool = allCards.filter((c) => c.id !== card.id);
		const wrongOptions = shuffle(wrongPool).slice(0, 3);
		const options = shuffle([card, ...wrongOptions]);
		return { card, options };
	});
}

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		safeArea: {
			flex: 1,
			backgroundColor: colors.background,
		},
		container: {
			flex: 1,
			paddingHorizontal: spacing.lg,
		},
		loadingText: {
			fontSize: 17,
			color: colors.textSecondary,
			textAlign: "center",
			marginTop: 100,
		},
		progressContainer: {
			paddingTop: spacing.md,
			marginBottom: spacing.md,
		},
		progressText: {
			fontSize: 15,
			fontWeight: "600",
			color: colors.textSecondary,
			textAlign: "center",
			marginBottom: spacing.sm,
		},
		progressBar: {
			height: 6,
			backgroundColor: colors.progressBackground,
			borderRadius: 3,
			overflow: "hidden",
		},
		progressFill: {
			height: "100%",
			backgroundColor: colors.progressFill,
			borderRadius: 3,
		},
		questionContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},
		modeLabel: {
			fontSize: 13,
			fontWeight: "600",
			color: colors.textSecondary,
			letterSpacing: 1,
			marginBottom: spacing.sm,
			textTransform: "uppercase",
		},
		questionText: {
			fontSize: 36,
			fontWeight: "700",
			color: colors.textPrimary,
			textAlign: "center",
		},
		feedbackText: {
			fontSize: 22,
			fontWeight: "700",
			marginTop: spacing.md,
		},
		optionsContainer: {
			paddingBottom: spacing.xl,
		},
		typeInput: {
			backgroundColor: colors.cardBackground,
			padding: spacing.md,
			borderRadius: 14,
			borderWidth: 2,
			borderColor: colors.border,
			fontSize: 18,
			color: colors.textPrimary,
			textAlign: "center",
			marginBottom: spacing.md,
		},
		typeInputCorrect: {
			borderColor: colors.correct,
			backgroundColor: colors.correct + "10",
		},
		typeInputIncorrect: {
			borderColor: colors.incorrect,
			backgroundColor: colors.incorrect + "10",
		},
		correctAnswerText: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.correct,
			textAlign: "center",
			marginBottom: spacing.md,
		},
		submitButton: {
			backgroundColor: colors.accent,
			paddingVertical: 16,
			borderRadius: 14,
			alignItems: "center",
			shadowColor: colors.accent,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.3,
			shadowRadius: 8,
			elevation: 6,
		},
		submitButtonText: {
			fontSize: 18,
			fontWeight: "700",
			color: colors.white,
		},
	}), [colors]);
}

export default function QuizPlayScreen({ navigation, route }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const { projectId, mode, questionCount, tagId } = route.params;

	const [cards, setCards] = useState<Card[]>([]);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answered, setAnswered] = useState(false);
	const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
	const [typedAnswer, setTypedAnswer] = useState("");
	const [typedCorrect, setTypedCorrect] = useState<boolean | null>(null);

	const scoreRef = useRef(0);
	const mistakeCountRef = useRef(0);

	useEffect(() => {
		loadQuiz();
	}, []);

	const loadQuiz = async () => {
		const pool = await getQuizPool(projectId, tagId);
		setCards(pool);
		const qs = generateQuestions(pool, questionCount, mode);
		setQuestions(qs);
	};

	const currentQuestion = questions[currentIndex];
	const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;

	const handleMCAnswer = useCallback(
		async (optionCardId: number) => {
			if (answered || !currentQuestion) return;

			setSelectedCardId(optionCardId);
			setAnswered(true);

			const isCorrect = optionCardId === currentQuestion.card.id;
			if (isCorrect) {
				scoreRef.current += 1;
			} else {
				mistakeCountRef.current += 1;
				const selectedCard = currentQuestion.options.find((c) => c.id === optionCardId);
				const userAnswer = mode === "easy"
					? selectedCard?.back_text || ""
					: selectedCard?.front_text || "";
				const correctAnswer = mode === "easy"
					? currentQuestion.card.back_text
					: currentQuestion.card.front_text;

				await saveMistake(currentQuestion.card.id, mode, userAnswer, correctAnswer);
			}

			await updateCardMastery(currentQuestion.card.id, isCorrect);
		},
		[answered, currentQuestion, mode],
	);

	const handleTypedSubmit = useCallback(async () => {
		if (answered || !currentQuestion || !typedAnswer.trim()) return;

		setAnswered(true);

		const correctAnswer = currentQuestion.card.front_text;
		const isCorrect = typedAnswer.trim().toLowerCase() === correctAnswer.toLowerCase();
		setTypedCorrect(isCorrect);

		if (isCorrect) {
			scoreRef.current += 1;
		} else {
			mistakeCountRef.current += 1;
			await saveMistake(currentQuestion.card.id, mode, typedAnswer.trim(), correctAnswer);
		}

		await updateCardMastery(currentQuestion.card.id, isCorrect);
	}, [answered, currentQuestion, typedAnswer, mode]);

	useEffect(() => {
		if (!answered) return;

		const timer = setTimeout(() => {
			if (currentIndex < questions.length - 1) {
				setCurrentIndex((prev) => prev + 1);
				setAnswered(false);
				setSelectedCardId(null);
				setTypedAnswer("");
				setTypedCorrect(null);
			} else {
				navigation.replace("LLQuizResult", {
					correct: scoreRef.current,
					total: questions.length,
					mistakeCount: mistakeCountRef.current,
				});
			}
		}, 1200);

		return () => clearTimeout(timer);
	}, [answered]);

	const getMCOptionState = (optionCardId: number): OptionState => {
		if (!answered) return "default";
		if (optionCardId === currentQuestion?.card.id) return "correct";
		if (optionCardId === selectedCardId) return "incorrect";
		return "default";
	};

	if (!currentQuestion) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.container}>
					<Text style={styles.loadingText}>{t("loading")}</Text>
				</View>
			</SafeAreaView>
		);
	}

	const questionText = mode === "easy"
		? currentQuestion.card.front_text
		: currentQuestion.card.back_text;

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				{/* Progress */}
				<View style={styles.progressContainer}>
					<Text style={styles.progressText}>
						{currentIndex + 1} / {questions.length}
					</Text>
					<View style={styles.progressBar}>
						<View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
					</View>
				</View>

				{/* Question word */}
				<View style={styles.questionContainer}>
					<Text style={styles.modeLabel}>
						{mode === "easy" ? t("llEasyDesc") : mode === "medium" ? t("llMediumDesc") : t("llHardDesc")}
					</Text>
					<Text style={styles.questionText}>{questionText}</Text>
					{answered && (
						<Text
							style={[
								styles.feedbackText,
								{
									color: mode === "hard"
										? typedCorrect
											? colors.correct
											: colors.incorrect
										: selectedCardId === currentQuestion.card.id
											? colors.correct
											: colors.incorrect,
								},
							]}
						>
							{(mode === "hard" ? typedCorrect : selectedCardId === currentQuestion.card.id)
								? t("llCorrect")
								: t("llIncorrect")}
						</Text>
					)}
				</View>

				{/* Options */}
				<View style={styles.optionsContainer}>
					{mode === "hard" ? (
						<>
							<TextInput
								style={[
									styles.typeInput,
									answered && typedCorrect === true && styles.typeInputCorrect,
									answered && typedCorrect === false && styles.typeInputIncorrect,
								]}
								value={typedAnswer}
								onChangeText={setTypedAnswer}
								placeholder={t("llTypeAnswer")}
								placeholderTextColor={colors.textSecondary}
								editable={!answered}
								autoFocus
								onSubmitEditing={handleTypedSubmit}
							/>
							{answered && typedCorrect === false && (
								<Text style={styles.correctAnswerText}>
									{currentQuestion.card.front_text}
								</Text>
							)}
							{!answered && (
								<TouchableOpacity
									style={[styles.submitButton, !typedAnswer.trim() && { opacity: 0.4 }]}
									onPress={handleTypedSubmit}
									disabled={!typedAnswer.trim()}
									activeOpacity={0.8}
								>
									<Text style={styles.submitButtonText}>{t("llSubmit")}</Text>
								</TouchableOpacity>
							)}
						</>
					) : (
						currentQuestion.options.map((option) => (
							<QuizOption
								key={option.id}
								label={mode === "easy" ? option.back_text : option.front_text}
								state={getMCOptionState(option.id)}
								disabled={answered}
								onPress={() => handleMCAnswer(option.id)}
							/>
						))
					)}
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
