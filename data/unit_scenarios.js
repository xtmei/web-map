window.BATTLE_SCENARIO_LIBRARY = {
  stalingrad_volga_anvil: {
    id: 'stalingrad_volga_anvil',
    name: '1942 冬季 · 伏尔加铁砧',
    mapId: 'stalingrad_grand_1942',
    briefing: '德军自西向东压迫，苏军依托河岸与工厂群层层阻击。',
    maxTurn: 20,
    supportBase: {
      GER: { arty: 1, air: 1, supply: 1 },
      SOV: { arty: 1, air: 0, supply: 1 }
    },
    objectives: [
      { id: 'MAMAYEV', q: 19, r: 18, vp: 3, name: '马马耶夫岗', owner: null },
      { id: 'STATION', q: 17, r: 16, vp: 2, name: '中央火车站', owner: null },
      { id: 'REDOCT', q: 25, r: 13, vp: 3, name: '红十月工厂', owner: null },
      { id: 'BARRIKADY', q: 27, r: 11, vp: 3, name: '街垒工厂', owner: null },
      { id: 'TRAKTOR', q: 24, r: 9, vp: 2, name: '拖拉机厂', owner: null },
      { id: 'ELEVATOR', q: 15, r: 24, vp: 2, name: '粮仓高地', owner: null },
      { id: 'LANDING', q: 37, r: 18, vp: 2, name: '中央渡口', owner: null },
      { id: 'NORTHRIDGE', q: 18, r: 8, vp: 2, name: '北部棱线', owner: null },
      { id: 'SOUTHCROSS', q: 20, r: 32, vp: 2, name: '南部十字路', owner: null }
    ],
    units: [
      { side: 'GER', name: '71步兵师 / I营', q: 4, r: 14, atk: 7, def: 6, mp: 5, hp: 6, morale: 7, army: '6集团军' },
      { side: 'GER', name: '24装甲师 / 战斗群', q: 6, r: 18, atk: 9, def: 6, mp: 7, hp: 5, morale: 7, armor: 1, army: '6集团军' },
      { side: 'GER', name: '100猎兵师 / I营', q: 5, r: 22, atk: 7, def: 7, mp: 5, hp: 6, morale: 8, army: '6集团军' },
      { side: 'GER', name: '305步兵师 / II营', q: 3, r: 19, atk: 6, def: 6, mp: 5, hp: 6, morale: 6, army: '6集团军' },
      { side: 'GER', name: '14装甲师 / 先遣连', q: 7, r: 12, atk: 8, def: 6, mp: 6, hp: 5, morale: 7, armor: 1, army: '6集团军' },
      { side: 'GER', name: '94步兵师 / 城区群', q: 4, r: 28, atk: 7, def: 7, mp: 5, hp: 6, morale: 7, army: '6集团军' },
      { side: 'GER', name: '389步兵师 / 突击群', q: 8, r: 24, atk: 8, def: 6, mp: 5, hp: 6, morale: 7, army: '6集团军' },

      { side: 'SOV', name: '62集团军 / NKVD营', q: 33, r: 18, atk: 7, def: 8, mp: 5, hp: 6, morale: 8, army: '62集团军' },
      { side: 'SOV', name: '13近卫师 / II营', q: 43, r: 12, atk: 8, def: 7, mp: 5, hp: 6, morale: 8, army: '62集团军' },
      { side: 'SOV', name: '海军步兵营', q: 45, r: 22, atk: 8, def: 6, mp: 5, hp: 5, morale: 7, army: '62集团军' },
      { side: 'SOV', name: '284步兵师 / 街区守备', q: 30, r: 12, atk: 7, def: 8, mp: 5, hp: 6, morale: 8, army: '62集团军' },
      { side: 'SOV', name: '37近卫师 / 反击群', q: 37, r: 27, atk: 8, def: 7, mp: 5, hp: 6, morale: 8, army: '64集团军' },
      { side: 'SOV', name: '工人民兵 / 北工厂', q: 31, r: 9, atk: 6, def: 7, mp: 5, hp: 5, morale: 6, army: '工人营' },
      { side: 'SOV', name: '95步兵师 / 预备队', q: 39, r: 18, atk: 7, def: 7, mp: 5, hp: 6, morale: 7, army: '62集团军' }
    ]
  },
  stalingrad_factory_furnace: {
    id: 'stalingrad_factory_furnace',
    name: '1942 北工厂 · 烈焰走廊',
    mapId: 'factory_corridor_1942',
    briefing: '围绕北工厂三大区块争夺，战线更短、突击节奏更快。',
    maxTurn: 16,
    supportBase: {
      GER: { arty: 2, air: 1, supply: 1 },
      SOV: { arty: 1, air: 0, supply: 1 }
    },
    objectives: [
      { id: 'TRACTOR', q: 20, r: 9, vp: 3, name: '拖拉机厂', owner: null },
      { id: 'BARRIKADY', q: 21, r: 14, vp: 3, name: '街垒工厂', owner: null },
      { id: 'REDOCT', q: 19, r: 18, vp: 3, name: '红十月工厂', owner: null },
      { id: 'NORTHRAIL', q: 17, r: 11, vp: 2, name: '北铁路枢纽', owner: null },
      { id: 'SOUTHCROSS', q: 17, r: 24, vp: 2, name: '南部路口', owner: null },
      { id: 'LANDING', q: 33, r: 16, vp: 2, name: '河岸补给点', owner: null }
    ],
    units: [
      { side: 'GER', name: '14装甲师 / 突击群', q: 4, r: 13, atk: 9, def: 6, mp: 7, hp: 5, morale: 7, armor: 1, army: '6集团军' },
      { side: 'GER', name: '24装甲师 / 机动群', q: 5, r: 17, atk: 9, def: 6, mp: 7, hp: 5, morale: 7, armor: 1, army: '6集团军' },
      { side: 'GER', name: '71步兵师 / 攻坚营', q: 3, r: 16, atk: 7, def: 6, mp: 5, hp: 6, morale: 7, army: '6集团军' },
      { side: 'GER', name: '305步兵师 / 街区营', q: 4, r: 21, atk: 6, def: 6, mp: 5, hp: 6, morale: 6, army: '6集团军' },
      { side: 'GER', name: '389步兵师 / 预备营', q: 6, r: 24, atk: 7, def: 6, mp: 5, hp: 6, morale: 7, army: '6集团军' },

      { side: 'SOV', name: '13近卫师 / 防御群', q: 28, r: 10, atk: 8, def: 8, mp: 5, hp: 6, morale: 8, army: '62集团军' },
      { side: 'SOV', name: '284步兵师 / 街区守备', q: 24, r: 15, atk: 7, def: 8, mp: 5, hp: 6, morale: 8, army: '62集团军' },
      { side: 'SOV', name: '海军步兵营', q: 31, r: 19, atk: 8, def: 6, mp: 5, hp: 5, morale: 7, army: '62集团军' },
      { side: 'SOV', name: '工人民兵 / 厂区营', q: 25, r: 21, atk: 6, def: 7, mp: 5, hp: 5, morale: 6, army: '工人营' },
      { side: 'SOV', name: '95步兵师 / 反突击群', q: 33, r: 16, atk: 7, def: 7, mp: 5, hp: 6, morale: 7, army: '62集团军' }
    ]
  }
};

window.DEFAULT_SCENARIO_ID = 'stalingrad_volga_anvil';
