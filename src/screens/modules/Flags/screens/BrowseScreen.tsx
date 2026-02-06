import React, { useState, useMemo, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	Modal,
	TouchableOpacity,
	SafeAreaView,
	Dimensions,
} from "react-native";
import { Continent, countries, Country } from "../data/countries";
import { useColors, Colors, spacing } from "../theme";
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
			paddingHorizontal: spacing.lg,
			paddingTop: spacing.md,
			paddingBottom: spacing.xs,
		},
		title: {
			fontSize: 34,
			fontWeight: "700",
			color: colors.textPrimary,
		},
		subtitle: {
			fontSize: 15,
			color: colors.textSecondary,
			marginTop: 2,
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
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.header}>
				<Text style={styles.title}>{t("flModuleName")}</Text>
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
