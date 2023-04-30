export function makeFixedLengthString(inString: string, length: number) {
    if (inString.length >= length) return inString;
    return inString + " ".repeat(length - inString.length);
}