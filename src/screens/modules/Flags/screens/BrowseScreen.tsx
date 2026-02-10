import React, { useState, useMemo, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	Modal,
	TouchableOpacity,
	Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Continent, countries, Country } from "../data/countries";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../i18n";
import ContinentFilter from "../components/ContinentFilter";
import FlagCard from "../components/FlagCard";
import CountryDetail from "../components/CountryDetail";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.75;
const SNAP_INTERVAL = CARD_WIDTH + spacing.sm * 2;

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		safeArea: {
			flex: 1,
			backgroundColor: colors.background,
		},
		header: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			paddingHorizontal: spacing.lg,
			paddingVertical: spacing.md,
		},
		title: {
			...typography.largeTitle,
			color: colors.textPrimary,
			flex: 1,
			marginRight: spacing.sm,
		},
		subtitle: {
			...typography.subhead,
			color: colors.textSecondary,
		},
		listContainer: {
			flex: 1,
			justifyContent: "center",
		},
		listContent: {
			paddingHorizontal: (width - CARD_WIDTH) / 2 - spacing.sm,
			alignItems: "center",
		},
		modalOverlay: {
			flex: 1,
			backgroundColor: colors.overlay,
			justifyContent: "center",
			alignItems: "center",
		},
	}), [colors]);
}

export default function BrowseScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
	const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
	const flatListRef = useRef<FlatList>(null);

	const filteredCountries = useMemo(() => {
		if (!selectedContinent) return countries;
		return countries.filter((c) => c.continent === selectedContinent);
	}, [selectedContinent]);

	const handleContinentChange = (continent: Continent | null) => {
		setSelectedContinent(continent);
		flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>{t("flModuleName")}</Text>
				<Text style={styles.subtitle}>
					{t("flCountries", { count: filteredCountries.length })}
				</Text>
			</View>

			<ContinentFilter selected={selectedContinent} onSelect={handleContinentChange} />

			<View style={styles.listContainer}>
				<FlatList
					ref={flatListRef}
					data={filteredCountries}
					keyExtractor={(item) => item.code}
					horizontal
					showsHorizontalScrollIndicator={false}
					snapToInterval={SNAP_INTERVAL}
					decelerationRate="fast"
					contentContainerStyle={styles.listContent}
					renderItem={({ item }) => (
						<FlagCard country={item} onPress={setSelectedCountry} />
					)}
				/>
			</View>

			{/* Country Detail Modal */}
			<Modal
				visible={selectedCountry !== null}
				transparent
				animationType="fade"
				supportedOrientations={["portrait", "landscape"]}
				onRequestClose={() => setSelectedCountry(null)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setSelectedCountry(null)}
				>
					<TouchableOpacity activeOpacity={1}>
						{selectedCountry && (
							<CountryDetail
								country={selectedCountry}
								onClose={() => setSelectedCountry(null)}
							/>
						)}
					</TouchableOpacity>
				</TouchableOpacity>
			</Modal>
		</SafeAreaView>
	);
}
