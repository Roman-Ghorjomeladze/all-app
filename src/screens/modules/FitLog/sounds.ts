import { Audio } from "expo-av";

// ── Sound definitions ──────────────────────────────────

export const SOUND_NAMES = [
	"High Beep",
	"Medium Beep",
	"Low Beep",
	"Sharp Ping",
	"Long Tone",
	"Quick Chirp",
	"Deep Buzz",
	"Bright Ding",
	"Mellow Bell",
	"Short Blip",
];

const SOUND_SOURCES = [
	require("../../../../assets/sounds/beep_0.wav"),
	require("../../../../assets/sounds/beep_1.wav"),
	require("../../../../assets/sounds/beep_2.wav"),
	require("../../../../assets/sounds/beep_3.wav"),
	require("../../../../assets/sounds/beep_4.wav"),
	require("../../../../assets/sounds/beep_5.wav"),
	require("../../../../assets/sounds/beep_6.wav"),
	require("../../../../assets/sounds/beep_7.wav"),
	require("../../../../assets/sounds/beep_8.wav"),
	require("../../../../assets/sounds/beep_9.wav"),
];

// ── Event types ────────────────────────────────────────

export type SoundEventType =
	| "workout_start"
	| "ten_sec_warning"
	| "exercise_end"
	| "rest_end"
	| "workout_complete";

export const SOUND_EVENT_TYPES: SoundEventType[] = [
	"workout_start",
	"ten_sec_warning",
	"exercise_end",
	"rest_end",
	"workout_complete",
];

// ── Playback ───────────────────────────────────────────

let loadedSounds: (Audio.Sound | null)[] = Array(10).fill(null);
let isLoaded = false;

export async function loadSounds(): Promise<void> {
	if (isLoaded) return;
	try {
		await Audio.setAudioModeAsync({
			playsInSilentModeIOS: true,
			staysActiveInBackground: true,
		});
		for (let i = 0; i < SOUND_SOURCES.length; i++) {
			const { sound } = await Audio.Sound.createAsync(SOUND_SOURCES[i]);
			loadedSounds[i] = sound;
		}
		isLoaded = true;
	} catch (e) {
		console.warn("Failed to load sounds:", e);
	}
}

export async function playSound(index: number): Promise<void> {
	if (index < 0 || index >= 10) return;
	try {
		if (!isLoaded) await loadSounds();
		const sound = loadedSounds[index];
		if (sound) {
			await sound.setPositionAsync(0);
			await sound.playAsync();
		}
	} catch (e) {
		console.warn("Failed to play sound:", e);
	}
}

export async function unloadSounds(): Promise<void> {
	for (const sound of loadedSounds) {
		if (sound) {
			try {
				await sound.unloadAsync();
			} catch (_) {}
		}
	}
	loadedSounds = Array(10).fill(null);
	isLoaded = false;
}
