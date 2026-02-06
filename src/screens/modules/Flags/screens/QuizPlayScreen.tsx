import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlagsQuizStackParamList } from "../../../../types/navigation";
import { countries, Country } from "../data/countries";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../i18n";
import QuizOption from "../components/QuizOption";

type Props = NativeStackScreenProps<FlagsQuizStackParamList, "FlagsQuizPlay">;

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
	country: Country;
	options: Country[];
};

function generateQuestions(count: number, pool: Country[]): Question[] {
	const shuffled = shuffle(pool);
	const selected = shuffled.slice(0, Math.min(count, pool.length));

	return selected.map((country) => {
		// Pick wrong options from the same pool so all options feel relevant
		const wrongPool = pool.filter((c) => c.code !== country.code);
		const wrongOptions = shuffle(wrongPool).slice(0, 3);
		const options = shuffle([country, ...wrongOptions]);
		return { country, options };
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
		flagContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},
		flag: {
			fontSize: 120,
		},
		feedbackText: {
			fontSize: 22,
			fontWeight: "700",
			marginTop: spacing.md,
		},
		optionsContainer: {
			paddingBottom: spacing.xl,
		},
	}), [colors]);
}

export default function QuizPlayScreen({ navigation, route }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { language, t } = useLanguage();
	const { questionCount, continent } = route.params;

	const pool = useMemo(() => {
		if (!continent) return countries;
		return countries.filter((c) => c.continent === continent);
	}, [continent]);

	const questions = useMemo(() => generateQuestions(questionCount, pool), [questionCount, pool]);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [answered, setAnswered] = useState(false);
	const [selectedCode, setSelectedCode] = useState<string | null>(null);

	// Use ref for score to avoid stale closure issues in useEffect
	const scoreRef = useRef(0);

	const currentQuestion = questions[currentIndex];
	const progress = (currentIndex + 1) / questions.length;

	const handleAnswer = useCallback(
		(optionCode: string) => {
			if (answered) return;

			setSelectedCode(optionCode);
			setAnswered(true);

			const isCorrect = optionCode === currentQuestion.country.code;
			if (isCorrect) {
				scoreRef.current += 1;
			}
		},
		[answered, currentQuestion],
	);

	useEffect(() => {
		if (!answered) return;

		const timer = setTimeout(() => {
			if (currentIndex < questions.length - 1) {
				setCurrentIndex((prev) => prev + 1);
				setAnswered(false);
				setSelectedCode(null);
			} else {
				navigation.replace("FlagsQuizResult", {
					correct: scoreRef.current,
					total: questions.length,
				});
			}
		}, 1200);

		return () => clearTimeout(timer);
	}, [answered]);

	const getOptionState = (optionCode: string): OptionState => {
		if (!answered) return "default";
		if (optionCode === currentQuestion.country.code) return "correct";
		if (optionCode === selectedCode) return "incorrect";
		return "default";
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				{/* Progress */}
				<View style={styles.progressContainer}>
					<Text style={styles.progressText}>
						{currentIndex + 1} / {questions.length}
					</Text>
					<View style={styles.progressBar}>
						<View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
					</View>
				</View>

				{/* Flag */}
				<View style={styles.flagContainer}>
					<Text style={styles.flag}>{currentQuestion.country.flag}</Text>
					{answered && (
						<Text
							style={[
								styles.feedbackText,
								{
									color:
										selectedCode === currentQuestion.country.code
											? colors.correct
											: colors.incorrect,
								},
							]}
						>
							{selectedCode === currentQuestion.country.code
								? t("flCorrect")
								: t("flIncorrect")}
						</Text>
					)}
				</View>

				{/* Options */}
				<View style={styles.optionsContainer}>
					{currentQuestion.options.map((option) => (
						<QuizOption
							key={option.code}
							label={option.name[language]}
							state={getOptionState(option.code)}
							disabled={answered}
							onPress={() => handleAnswer(option.code)}
						/>
					))}
				</View>
			</View>
		</SafeAreaView>
	);
}
