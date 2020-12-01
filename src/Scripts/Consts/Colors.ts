export enum BackgroundColors
{
    Red = 0xF84031,
    DarkBlue = 0x324464,
    Violet = 0x3B2C54,
    Green = 0x196840,
    Orange = 0xEF7D3C,
    Dark = 0x1c1c1c,
    LightGray = 0xe0e0e0,
    DarkGray = 0x65596c,
    Gray = 0x4a3a52,
    White = 0xfcfcfc
};

export enum BubbleColors
{
    None = 0x000000,
    Blue = 0x060095,
    White = 0xfcfcfc,
    Green = 0x00c202,
    Pink = 0xab00a2,
    Yellow = 0xa1c201,
    Red = 0xaa0000,
    Black = 0x25241c
};

export function randomEnum<T>(anEnum: T, exclude?: number[]): T[keyof T]
{
    let enumValues = Object.keys(anEnum)
      .map(n => Number.parseInt(n))
      .filter(n => !Number.isNaN(n) && !exclude.includes(n)) as unknown as T[keyof T][];

    let randomIndex = Math.floor(Math.random() * (enumValues.length));
    return enumValues[randomIndex];
}