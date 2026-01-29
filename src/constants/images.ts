import type { PropertyIndex, PropertyLevel } from "@/constants/properties";
import type { ServiceIndex } from "@/constants/services";

const BASE_URL = "https://i.ibb.co";

export const PROPERTY_IMAGES: Record<
  PropertyIndex,
  Record<PropertyLevel, string>
> = {
  0: {
    1: `${BASE_URL}/Dfcv0gXt/Casa-Blanca1.png`,
    2: `${BASE_URL}/SwJjVgxc/Casa-Blanca2.png`,
    3: `${BASE_URL}/xtGTyJGY/Casa-Blanca3.png`,
    4: `${BASE_URL}/G40wZNf7/Casa-Blanca4.png`,
  },
  1: {
    1: `${BASE_URL}/Z62qbjHg/Casa-de-Anne-Frank1.png`,
    2: `${BASE_URL}/MDFrjZX4/Casa-de-Anne-Frank2.png`,
    3: `${BASE_URL}/RR0hQ0K/Casa-de-Anne-Frank3.png`,
    4: `${BASE_URL}/vxSvRRxC/Casa-de-Anne-Frank4.png`,
  },
  2: {
    1: `${BASE_URL}/VYycKckk/Fallingwater-House1.png`,
    2: `${BASE_URL}/RGT33b9J/Fallingwater-House2.png`,
    3: `${BASE_URL}/dwxLX7HF/Fallingwater-House3.png`,
    4: `${BASE_URL}/8Lwh2Qq8/Fallingwater-House4.png`,
  },
  3: {
    1: `${BASE_URL}/chNpxKHq/C-Winchester-Mystery-House1.png`,
    2: `${BASE_URL}/tM0Kdyz7/C-Winchester-Mystery-House2.png`,
    3: `${BASE_URL}/cXSnhfdM/C-Winchester-Mystery-House3.png`,
    4: `${BASE_URL}/B25Qnqct/C-Winchester-Mystery-House4.png`,
  },
  4: {
    1: `${BASE_URL}/27cgs3C0/Marina-Bay-Sands1.png`,
    2: `${BASE_URL}/kg9HWxqT/Marina-Bay-Sands2.png`,
    3: `${BASE_URL}/G44pMsmc/Marina-Bay-Sands3.png`,
    4: `${BASE_URL}/N6WS1vzN/Marina-Bay-Sands4.png`,
  },
  5: {
    1: `${BASE_URL}/QFrLJMD6/Sydney-Opera-House1.png`,
    2: `${BASE_URL}/TBMCP5jg/Sydney-Opera-House2.png`,
    3: `${BASE_URL}/q38ykRhw/Sydney-Opera-House3.png`,
    4: `${BASE_URL}/n8nGdjDB/Sydney-Opera-House4.png`,
  },
  6: {
    1: `${BASE_URL}/997TzNjm/Residencial-Rohrmoser1.png`,
    2: `${BASE_URL}/pj84Jx4G/Residencial-Rohrmoser2.png`,
    3: `${BASE_URL}/RGDcvD7q/Residencial-Rohrmoser3.png`,
    4: `${BASE_URL}/p6P06FN7/Residencial-Rohrmoser4.png`,
  },
  7: {
    1: `${BASE_URL}/d4Zk8dcF/Burj-Khalifa1.png`,
    2: `${BASE_URL}/zVSRrx1P/Burj-Khalifa2.png`,
    3: `${BASE_URL}/0y4mJ4vr/Burj-Khalifa3.png`,
    4: `${BASE_URL}/ZRcLCd7s/Burj-Khalifa4.png`,
  },
  8: {
    1: `${BASE_URL}/Gvjc0H3V/Taipei-1011.png`,
    2: `${BASE_URL}/tMmM8f4q/Taipei-1012.png`,
    3: `${BASE_URL}/1fVfPxjx/Taipei-1013.png`,
    4: `${BASE_URL}/3m9xgcmZ/Taipei-1014.png`,
  },
  9: {
    1: `${BASE_URL}/tT61d2mq/Hacienda-Santa-Rosa1.png`,
    2: `${BASE_URL}/Q7mQZLR2/Hacienda-Santa-Rosa2.png`,
    3: `${BASE_URL}/B2rwv19G/Hacienda-Santa-Rosa3.png`,
    4: `${BASE_URL}/dJrW7hMq/Hacienda-Santa-Rosa4.png`,
  },
  10: {
    1: `${BASE_URL}/fYpb3x6y/One-World-Trade-Center1.png`,
    2: `${BASE_URL}/MyBHF9vn/One-World-Trade-Center2.png`,
    3: `${BASE_URL}/9RBgYmS/One-World-Trade-Center3.png`,
    4: `${BASE_URL}/BH739gp0/One-World-Trade-Center4.png`,
  },
  11: {
    1: `${BASE_URL}/yB0qSrfh/The-Shard1.png`,
    2: `${BASE_URL}/zTFFBJ5K/The-Shard2.png`,
    3: `${BASE_URL}/RkjJ8fJk/The-Shard3.png`,
    4: `${BASE_URL}/kFhh2B7/The-Shard4.png`,
  },
  12: {
    1: "https://i.ibb.co/Z1RRvJQp/Oficina-Emprender.png",
    2: "https://i.ibb.co/Z1RRvJQp/Oficina-Emprender.png",
    3: "https://i.ibb.co/Z1RRvJQp/Oficina-Emprender.png",
    4: "https://i.ibb.co/Z1RRvJQp/Oficina-Emprender.png",
  },
};

export const SERVICE_IMAGES: Record<ServiceIndex, string> = {
  0: `${BASE_URL}/cSGqH3wm/Orient-Express.png`,
  1: `${BASE_URL}/Y7KK6KDh/Transiberiano.png`,
  2: `${BASE_URL}/XrpBGPBx/Bullet-Train.png`,
  3: `${BASE_URL}/WW7kT2rs/Expreso-Polar.png`,
  4: `${BASE_URL}/gLLNqKq6/Central-de-Itaipu.png`,
  5: `${BASE_URL}/9mTchJXq/Central-de-Chernobyl.png`,
  6: `${BASE_URL}/bgWrT80b/Acueducto-de-Segovia.png`,
  7: `${BASE_URL}/LXXJFXF4/Acueducto-de-los-Arcos.png`,
  8: `${BASE_URL}/Qvhfz4bk/Grauman-s-Chinese-Theatre.png`,
  9: `${BASE_URL}/TDYPNnyK/American-Museum-of-Natural-History.png`,
  10: `${BASE_URL}/BV5g5QPc/Shell-Station.png`,
  11: `${BASE_URL}/NdZ4nqLz/CVS-Pharmacy.png`,
};
