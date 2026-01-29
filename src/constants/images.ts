import type { PropertyIndex, PropertyLevel } from "@/constants/properties";
import type { ServiceIndex } from "@/constants/services";

const BASE_URL =
  "https://pub-2aa286eff6ca4ef8ac8403c007dbfefb.r2.dev/monopoly/img%202";

export const PROPERTY_IMAGES: Record<
  PropertyIndex,
  Record<PropertyLevel, string>
> = {
  0: {
    1: `${BASE_URL}/Marrones/Casa%20Blanca1.png`,
    2: `${BASE_URL}/Marrones/Casa%20Blanca2.png`,
    3: `${BASE_URL}/Marrones/Casa%20Blanca3.png`,
    4: `${BASE_URL}/Marrones/Casa%20Blanca4.png`,
  },
  1: {
    1: `${BASE_URL}/Marrones/Casa%20de%20Anne%20Frank1.png`,
    2: `${BASE_URL}/Marrones/Casa%20de%20Anne%20Frank2.png`,
    3: `${BASE_URL}/Marrones/Casa%20de%20Anne%20Frank3.png`,
    4: `${BASE_URL}/Marrones/Casa%20de%20Anne%20Frank4.png`,
  },
  2: {
    1: `${BASE_URL}/Marrones/Fallingwater%20House1.png`,
    2: `${BASE_URL}/Marrones/Fallingwater%20House2.png`,
    3: `${BASE_URL}/Marrones/Fallingwater%20House3.png`,
    4: `${BASE_URL}/Marrones/Fallingwater%20House4.png`,
  },
  3: {
    1: `${BASE_URL}/Marrones/C%20Winchester%20Mystery%20House1.png`,
    2: `${BASE_URL}/Marrones/C%20Winchester%20Mystery%20House2.png`,
    3: `${BASE_URL}/Marrones/C%20Winchester%20Mystery%20House3.png`,
    4: `${BASE_URL}/Marrones/C%20Winchester%20Mystery%20House4.png`,
  },
  4: {
    1: `${BASE_URL}/Naranjas/Marina%20Bay%20Sands1.png`,
    2: `${BASE_URL}/Naranjas/Marina%20Bay%20Sands2.png`,
    3: `${BASE_URL}/Naranjas/Marina%20Bay%20Sands3.png`,
    4: `${BASE_URL}/Naranjas/Marina%20Bay%20Sands4.png`,
  },
  5: {
    1: `${BASE_URL}/Naranjas/Sydney%20Opera%20House1.png`,
    2: `${BASE_URL}/Naranjas/Sydney%20Opera%20House2.png`,
    3: `${BASE_URL}/Naranjas/Sydney%20Opera%20House3.png`,
    4: `${BASE_URL}/Naranjas/Sydney%20Opera%20House4.png`,
  },
  6: {
    1: `${BASE_URL}/Naranjas/Residencial%20Rohrmoser1.png`,
    2: `${BASE_URL}/Naranjas/Residencial%20Rohrmoser2.png`,
    3: `${BASE_URL}/Naranjas/Residencial%20Rohrmoser3.png`,
    4: `${BASE_URL}/Naranjas/Residencial%20Rohrmoser4.png`,
  },
  7: {
    1: `${BASE_URL}/Azules/Burj%20Khalifa1.png`,
    2: `${BASE_URL}/Azules/Burj%20Khalifa2.png`,
    3: `${BASE_URL}/Azules/Burj%20Khalifa3.png`,
    4: `${BASE_URL}/Azules/Burj%20Khalifa4.png`,
  },
  8: {
    1: `${BASE_URL}/Azules/Taipei%201011.png`,
    2: `${BASE_URL}/Azules/Taipei%201012.png`,
    3: `${BASE_URL}/Azules/Taipei%201013.png`,
    4: `${BASE_URL}/Azules/Taipei%201014.png`,
  },
  9: {
    1: `${BASE_URL}/Azules/Hacienda%20Santa%20Rosa1.png`,
    2: `${BASE_URL}/Azules/Hacienda%20Santa%20Rosa2.png`,
    3: `${BASE_URL}/Azules/Hacienda%20Santa%20Rosa3.png`,
    4: `${BASE_URL}/Azules/Hacienda%20Santa%20Rosa4.png`,
  },
  10: {
    1: `${BASE_URL}/Rojas/One%20World%20Trade%20Center1.png`,
    2: `${BASE_URL}/Rojas/One%20World%20Trade%20Center2.png`,
    3: `${BASE_URL}/Rojas/One%20World%20Trade%20Center3.png`,
    4: `${BASE_URL}/Rojas/One%20World%20Trade%20Center4.png`,
  },
  11: {
    1: `${BASE_URL}/Rojas/The%20Shard1.png`,
    2: `${BASE_URL}/Rojas/The%20Shard2.png`,
    3: `${BASE_URL}/Rojas/The%20Shard3.png`,
    4: `${BASE_URL}/Rojas/The%20Shard4.png`,
  },
  12: {
    1: `${BASE_URL}/Oficina%20Emprender.png`,
    2: `${BASE_URL}/Oficina%20Emprender.png`,
    3: `${BASE_URL}/Oficina%20Emprender.png`,
    4: `${BASE_URL}/Oficina%20Emprender.png`,
  },
};

export const SERVICE_IMAGES: Record<ServiceIndex, string> = {
  0: `${BASE_URL}/Trenes/Orient%20Express.png`,
  1: `${BASE_URL}/Trenes/Transiberiano.png`,
  2: `${BASE_URL}/Trenes/Bullet%20Train.png`,
  3: `${BASE_URL}/Trenes/Expreso%20Polar.png`,
  4: `${BASE_URL}/Servicios/Central%20de%20Itaipu.png`,
  5: `${BASE_URL}/Servicios/Central%20de%20Chernobyl.png`,
  6: `${BASE_URL}/Servicios/Acueducto%20de%20Segovia.png`,
  7: `${BASE_URL}/Servicios/Acueducto%20de%20los%20Arcos.png`,
  8: `${BASE_URL}/Servicios/Grauman's%20Chinese%20Theatre.png`,
  9: `${BASE_URL}/Servicios/American%20Museum%20of%20Natural%20History.png`,
  10: `${BASE_URL}/Servicios/Shell%20Station.png`,
  11: `${BASE_URL}/Servicios/CVS%20Pharmacy.png`,
};
