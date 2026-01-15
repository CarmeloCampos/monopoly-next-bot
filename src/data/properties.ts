import {
  type PropertyColor,
  type PropertyLevel,
  PROPERTY_LEVELS,
  getPropertyCost,
  getPropertyHourlyIncome,
} from "@/constants/properties";
import { STARTER_PROPERTY_HOURLY_INCOME } from "@/constants/game";

export interface PropertyLevelData {
  level: PropertyLevel;
  name: string;
  image_url: string;
}

export interface PropertyData {
  index: number;
  name: string;
  color: PropertyColor | "starter";
  location: string;
  country: string;
  description: string;
  levels: PropertyLevelData[];
}

function generateLevelImages(
  basePath: string,
  slug: string,
): PropertyLevelData[] {
  return PROPERTY_LEVELS.map((level) => ({
    level,
    name: getLevelName(level),
    image_url: `https://cdn.monopoly-bot.com/properties/${basePath}/${slug}-lvl${level}.jpg`,
  }));
}

function getLevelName(level: PropertyLevel): string {
  switch (level) {
    case 1:
      return "Base";
    case 2:
      return "Mejorado";
    case 3:
      return "Premium";
    case 4:
      return "Máximo";
  }
}

export const PROPERTIES_DATA: PropertyData[] = [
  // AZUL (índices 0-1)
  {
    index: 0,
    name: "One World Trade Center",
    color: "blue",
    location: "Nueva York",
    country: "EE.UU.",
    description: "Rascacielos más alto de Nueva York, símbolo de resiliencia.",
    levels: generateLevelImages("blue", "onewtc"),
  },
  {
    index: 1,
    name: "The Shard",
    color: "blue",
    location: "Londres",
    country: "Reino Unido",
    description: "Edificio más alto del Reino Unido, arquitectura de cristal.",
    levels: generateLevelImages("blue", "shard"),
  },
  // ROJA (índices 2-4)
  {
    index: 2,
    name: "Burj Khalifa",
    color: "red",
    location: "Dubái",
    country: "EAU",
    description: "Edificio más alto del mundo, con vista al desierto.",
    levels: generateLevelImages("red", "burjkhalifa"),
  },
  {
    index: 3,
    name: "Taipei 101",
    color: "red",
    location: "Taiwán",
    country: "Taiwán",
    description: "Torre icónica inspirada en bambú flexible.",
    levels: generateLevelImages("red", "taipei101"),
  },
  {
    index: 4,
    name: "Hacienda Santa Rosa",
    color: "red",
    location: "Guanacaste",
    country: "Costa Rica",
    description: "Hacienda histórica convertida en resort de lujo.",
    levels: generateLevelImages("red", "santarosa"),
  },
  // NARANJA (índices 5-7)
  {
    index: 5,
    name: "Marina Bay Sands",
    color: "orange",
    location: "Singapur",
    country: "Singapur",
    description: "Complejo de lujo con piscina infinita en el cielo.",
    levels: generateLevelImages("orange", "marinabay"),
  },
  {
    index: 6,
    name: "Sydney Opera House",
    color: "orange",
    location: "Sídney",
    country: "Australia",
    description: "Icono arquitectónico con velas de concreto.",
    levels: generateLevelImages("orange", "opera"),
  },
  {
    index: 7,
    name: "Residencial Rohrmoser",
    color: "orange",
    location: "San José",
    country: "Costa Rica",
    description: "Complejo residencial moderno en el corazón de San José.",
    levels: generateLevelImages("orange", "rohrmoser"),
  },
  // MARRÓN (índices 8-11)
  {
    index: 8,
    name: "Casa Blanca",
    color: "brown",
    location: "Washington D.C.",
    country: "EE.UU.",
    description: "Residencia oficial del Presidente de los EE.UU.",
    levels: generateLevelImages("brown", "whitehouse"),
  },
  {
    index: 9,
    name: "Casa de Anne Frank",
    color: "brown",
    location: "Ámsterdam",
    country: "Países Bajos",
    description: "Refugio histórico donde Anne Frank escribió su diario.",
    levels: generateLevelImages("brown", "annefrank"),
  },
  {
    index: 10,
    name: "Fallingwater House",
    color: "brown",
    location: "Pennsylvania",
    country: "EE.UU.",
    description: "Obra maestra de Frank Lloyd Wright sobre cascada.",
    levels: generateLevelImages("brown", "fallingwater"),
  },
  {
    index: 11,
    name: "Winchester Mystery House",
    color: "brown",
    location: "California",
    country: "EE.UU.",
    description:
      "Mansión misteriosa con pasillos secretos y escaleras a nowhere.",
    levels: generateLevelImages("brown", "winchester"),
  },
  // STARTER (índice 12)
  {
    index: 12,
    name: "Apartamento Emprender",
    color: "starter",
    location: "Ciudad Virtual",
    country: "Monopolia",
    description:
      "Propiedad exclusiva para nuevos emprendedores. Genera 1,000 MC/mes.",
    levels: [
      {
        level: 1,
        name: "Inicial",
        image_url:
          "https://cdn.monopoly-bot.com/properties/starter/apartment-lvl1.jpg",
      },
    ],
  },
];

export function getPropertyByIndex(index: number): PropertyData | undefined {
  return PROPERTIES_DATA[index];
}

export function getPropertiesByColor(color: PropertyColor): PropertyData[] {
  return PROPERTIES_DATA.filter((p) => p.color === color);
}

export function getPropertyLevelData(
  property: PropertyData,
  level: PropertyLevel,
): { cost: number; hourlyIncome: number; imageUrl: string } | undefined {
  if (property.color === "starter") {
    if (level !== 1) return undefined;
    const [starterLevel] = property.levels;
    if (!starterLevel) return undefined;
    return {
      cost: 0,
      hourlyIncome: STARTER_PROPERTY_HOURLY_INCOME,
      imageUrl: starterLevel.image_url,
    };
  }

  const levelData = property.levels.find((l) => l.level === level);
  if (!levelData) return undefined;

  return {
    cost: getPropertyCost(property.color, level),
    hourlyIncome: getPropertyHourlyIncome(property.color, level),
    imageUrl: levelData.image_url,
  };
}
