import React, { memo } from "react";
import { SvgXml } from "react-native-svg";
import * as flags from "country-flag-icons/string/3x2";

type CountryCode = keyof typeof flags;

type Props = {
	code: string;
	width: number;
};

function CountryFlag({ code, width }: Props) {
	const svg = flags[code as CountryCode];
	if (!svg) return null;
	// 3:2 aspect ratio
	return <SvgXml xml={svg} width={width} height={width * (2 / 3)} />;
}

export default memo(CountryFlag);
