import { type ServiceType } from "@/constants/services";

export interface ServiceData {
  index: number;
  name: string;
  type: ServiceType;
  cost: number;
  boost_percentage: number;
  image_url: string;
  description: string;
}

export const SERVICES_DATA: ServiceData[] = [
  // TRENES (índices 0-3)
  {
    index: 0,
    name: "Orient Express",
    type: "train",
    cost: 3000,
    boost_percentage: 0.05,
    image_url: "https://cdn.monopoly-bot.com/services/train/orient-express.jpg",
    description: "El tren de lujo más famoso de Europa.",
  },
  {
    index: 1,
    name: "Transiberiano",
    type: "train",
    cost: 3000,
    boost_percentage: 0.05,
    image_url: "https://cdn.monopoly-bot.com/services/train/transiberiano.jpg",
    description: "El trayecto en tren más largo del mundo.",
  },
  {
    index: 2,
    name: "Bullet Train",
    type: "train",
    cost: 3000,
    boost_percentage: 0.05,
    image_url: "https://cdn.monopoly-bot.com/services/train/bullet-train.jpg",
    description: "Tren de alta velocidad japonés.",
  },
  {
    index: 3,
    name: "Expreso Polar",
    type: "train",
    cost: 3000,
    boost_percentage: 0.05,
    image_url: "https://cdn.monopoly-bot.com/services/train/expreso-polar.jpg",
    description: "Tren mágico hacia el Polo Norte.",
  },
  // LUZ (índices 4-5)
  {
    index: 4,
    name: "Central de Itaipú",
    type: "light",
    cost: 3000,
    boost_percentage: 0.05,
    image_url: "https://cdn.monopoly-bot.com/services/light/itaipu.jpg",
    description: "Una de las mayores hidroeléctricas del mundo.",
  },
  {
    index: 5,
    name: "Central de Chernobyl",
    type: "light",
    cost: 3000,
    boost_percentage: 0.05,
    image_url: "https://cdn.monopoly-bot.com/services/light/chernobyl.jpg",
    description: "Central nuclear histórica.",
  },
  // AGUA (índices 6-7)
  {
    index: 6,
    name: "Acueducto de Segovia",
    type: "water",
    cost: 3000,
    boost_percentage: 0.05,
    image_url:
      "https://cdn.monopoly-bot.com/services/water/acueducto-segovia.jpg",
    description: "Obra romana de ingeniería milenaria.",
  },
  {
    index: 7,
    name: "Acueducto de los Arcos",
    type: "water",
    cost: 3000,
    boost_percentage: 0.05,
    image_url:
      "https://cdn.monopoly-bot.com/services/water/acueducto-arcos.jpg",
    description: "Acueducto histórico de piedra.",
  },
  // CINE (índice 8)
  {
    index: 8,
    name: "Grauman's Chinese Theatre",
    type: "cinema",
    cost: 5000,
    boost_percentage: 0.07,
    image_url:
      "https://cdn.monopoly-bot.com/services/cinema/chinese-theatre.jpg",
    description: "Teatro icónico de Hollywood.",
  },
  // MUSEO (índice 9)
  {
    index: 9,
    name: "American Museum of Natural History",
    type: "museum",
    cost: 5000,
    boost_percentage: 0.07,
    image_url:
      "https://cdn.monopoly-bot.com/services/museum/natural-history.jpg",
    description: "Museo de historia natural en Nueva York.",
  },
  // GASOLINERA (índice 10)
  {
    index: 10,
    name: "Shell Station",
    type: "gas_station",
    cost: 4000,
    boost_percentage: 0.06,
    image_url: "https://cdn.monopoly-bot.com/services/gas/shell-station.jpg",
    description: "Estación de servicio global.",
  },
  // FARMACIA (índice 11)
  {
    index: 11,
    name: "CVS Pharmacy",
    type: "pharmacy",
    cost: 4000,
    boost_percentage: 0.06,
    image_url:
      "https://cdn.monopoly-bot.com/services/pharmacy/cvs-pharmacy.jpg",
    description: "Cadena de farmacias estadounidense.",
  },
];

export function getServiceByIndex(index: number): ServiceData | undefined {
  return SERVICES_DATA[index];
}

export function getServicesByType(type: ServiceType): ServiceData[] {
  return SERVICES_DATA.filter((s) => s.type === type);
}
