/* ===== 群芳谱 · 108 张写实花卡 =====
 * 固定卡池，与学科/年级无关：新增学科不增加卡牌。
 * 不分组，按编号 001-108 平铺；已发过的卡不再发，天然无重复。
 *
 * form  = 该花种的真实形态（js/flowerart.js 内 FORMS 的绘制器 key）
 * opt   = 形态参数（瓣数、花序、茎叶类型等）
 * c1    = 花瓣主色   c2 = 花瓣阴影/描边   c3 = 花心/花蕊
 * leaf  = 叶或枝色   alt = 副色（斑点、白斑、异色唇瓣等）
 * 配色依据常见栽培品种的真实花色，别名/稀有度/花语保持不变。
 * 由 .workbuddy/tmp/update_flower_looks.js 生成。
 */
window.FLOWERS = [
  {
    "n": 1,
    "name": "梅花",
    "saying": "高洁、坚强、傲骨",
    "rarity": "普通",
    "c1": "#F7DDE6",
    "c2": "#D581A4",
    "c3": "#F0C44E",
    "leaf": "#6B4A3C",
    "deco": "none",
    "form": "prunus",
    "opt": {
      "p": 5,
      "style": "round",
      "stem": "branch",
      "cluster": 3,
      "stamens": "long"
    }
  },
  {
    "n": 2,
    "name": "兰花",
    "saying": "高雅、淡泊、坚贞",
    "rarity": "普通",
    "c1": "#DDEAC4",
    "c2": "#8DA668",
    "c3": "#E8C86A",
    "leaf": "#4E7A38",
    "deco": "none",
    "form": "orchid",
    "alt": "#A8689B",
    "opt": {
      "lip": "slipper"
    }
  },
  {
    "n": 3,
    "name": "菊花",
    "saying": "高洁、隐逸、长寿",
    "rarity": "普通",
    "c1": "#F5D349",
    "c2": "#D4A21C",
    "c3": "#C08A12",
    "leaf": "#4E7A38",
    "deco": "none",
    "form": "chrys",
    "opt": {
      "n": 34,
      "curl": true
    }
  },
  {
    "n": 4,
    "name": "荷花",
    "saying": "纯洁、坚贞、出淤泥不染",
    "rarity": "珍稀",
    "c1": "#FAD8E4",
    "c2": "#E08AAC",
    "c3": "#EFC052",
    "leaf": "#4E8A46",
    "deco": "none",
    "form": "lotus",
    "opt": {
      "pad": true
    }
  },
  {
    "n": 5,
    "name": "桂花",
    "saying": "崇高、友好、荣誉",
    "rarity": "普通",
    "c1": "#F6DC8C",
    "c2": "#D2A63A",
    "c3": "#F8E7AE",
    "leaf": "#3F6B2C",
    "deco": "none",
    "form": "umbel",
    "opt": {
      "floret": "c4",
      "shape": "scatter",
      "count": 14
    }
  },
  {
    "n": 6,
    "name": "桃花",
    "saying": "爱情的俘虏、长寿",
    "rarity": "普通",
    "c1": "#F9C0D0",
    "c2": "#E0789C",
    "c3": "#EFC25A",
    "leaf": "#5A7A38",
    "deco": "none",
    "form": "prunus",
    "opt": {
      "p": 5,
      "style": "point",
      "stem": "branch",
      "cluster": 2,
      "stamens": "long"
    }
  },
  {
    "n": 7,
    "name": "杏花",
    "saying": "少女的娇羞、幸运",
    "rarity": "普通",
    "c1": "#FBE7EA",
    "c2": "#DC93AC",
    "c3": "#E6B44C",
    "leaf": "#5A7A38",
    "deco": "dew",
    "form": "prunus",
    "opt": {
      "p": 5,
      "style": "round",
      "stem": "branch",
      "cluster": 2,
      "stamens": "long"
    }
  },
  {
    "n": 8,
    "name": "梨花",
    "saying": "纯真、永不分离",
    "rarity": "珍稀",
    "c1": "#FCFAF3",
    "c2": "#C6CBB8",
    "c3": "#8A3F66",
    "leaf": "#5A7A38",
    "deco": "dew",
    "form": "prunus",
    "opt": {
      "p": 5,
      "style": "round",
      "stem": "branch",
      "cluster": 3,
      "stamens": "dark"
    }
  },
  {
    "n": 9,
    "name": "牡丹",
    "saying": "富贵、圆满、国色天香",
    "rarity": "普通",
    "c1": "#E9699C",
    "c2": "#B12F68",
    "c3": "#F2C644",
    "leaf": "#4E7A38",
    "deco": "dew",
    "form": "peony",
    "opt": {
      "tone": "deep"
    }
  },
  {
    "n": 10,
    "name": "芍药",
    "saying": "友谊、情有独钟、离别",
    "rarity": "普通",
    "c1": "#F6C6D8",
    "c2": "#D56B99",
    "c3": "#F1CB55",
    "leaf": "#4E7A38",
    "deco": "dew",
    "form": "peony",
    "opt": {
      "tone": "pale"
    }
  },
  {
    "n": 11,
    "name": "月季",
    "saying": "坚韧、希望、纯洁的爱",
    "rarity": "普通",
    "c1": "#E54A6C",
    "c2": "#A82045",
    "c3": "#EFCA5C",
    "leaf": "#4E7A38",
    "deco": "dew",
    "form": "rose",
    "opt": {
      "layers": 4,
      "thorn": true
    }
  },
  {
    "n": 12,
    "name": "玫瑰",
    "saying": "爱情、勇气、热烈",
    "rarity": "传说",
    "c1": "#D32B42",
    "c2": "#8C1428",
    "c3": "#7A1A2C",
    "leaf": "#4E7A38",
    "deco": "dew",
    "form": "rose",
    "opt": {
      "layers": 5,
      "thorn": true,
      "curl": true
    }
  },
  {
    "n": 13,
    "name": "蔷薇",
    "saying": "爱的思念、甜蜜",
    "rarity": "普通",
    "c1": "#F2A2BE",
    "c2": "#CE5D88",
    "c3": "#EFC64E",
    "leaf": "#4E7A38",
    "deco": "dew",
    "form": "rose",
    "opt": {
      "layers": 3,
      "cluster": 3,
      "thorn": true,
      "flat": true
    }
  },
  {
    "n": 14,
    "name": "茉莉",
    "saying": "忠贞、质朴、清纯",
    "rarity": "普通",
    "c1": "#FBF9F0",
    "c2": "#D8D5C0",
    "c3": "#EFD67E",
    "leaf": "#4A7A34",
    "deco": "star",
    "form": "gardenia",
    "opt": {
      "double": true
    }
  },
  {
    "n": 15,
    "name": "栀子",
    "saying": "永恒的爱、喜悦、坚强",
    "rarity": "普通",
    "c1": "#FBF8EC",
    "c2": "#DCD5B8",
    "c3": "#E7C25C",
    "leaf": "#3F6B2C",
    "deco": "star",
    "form": "gardenia",
    "opt": {
      "double": false
    }
  },
  {
    "n": 16,
    "name": "丁香",
    "saying": "青春的爱、初恋",
    "rarity": "珍稀",
    "c1": "#C9A6E6",
    "c2": "#8B62BC",
    "c3": "#E9CAF0",
    "leaf": "#4E7A38",
    "deco": "star",
    "form": "umbel",
    "opt": {
      "floret": "c4",
      "shape": "cone",
      "count": 18
    }
  },
  {
    "n": 17,
    "name": "海棠",
    "saying": "温和、美丽、思乡",
    "rarity": "普通",
    "c1": "#F4AFC6",
    "c2": "#D4628E",
    "c3": "#EFC254",
    "leaf": "#5A7A38",
    "deco": "star",
    "form": "prunus",
    "opt": {
      "p": 5,
      "style": "round",
      "stem": "branch",
      "cluster": 3,
      "bud": true
    }
  },
  {
    "n": 18,
    "name": "白玉兰",
    "saying": "纯洁的爱、感恩",
    "rarity": "普通",
    "c1": "#FBF9F1",
    "c2": "#D3D0BC",
    "c3": "#E3C666",
    "leaf": "#6B4A3C",
    "deco": "star",
    "form": "magnolia",
    "opt": {
      "p": 9,
      "stem": "branch"
    }
  },
  {
    "n": 19,
    "name": "木兰花",
    "saying": "高尚、真挚、典雅",
    "rarity": "普通",
    "c1": "#E9C8E0",
    "c2": "#B37AAD",
    "c3": "#EACB6E",
    "leaf": "#6B4A3C",
    "deco": "star",
    "form": "magnolia",
    "opt": {
      "p": 9,
      "stem": "branch"
    }
  },
  {
    "n": 20,
    "name": "紫藤",
    "saying": "执着的爱、思念",
    "rarity": "珍稀",
    "c1": "#A79BDC",
    "c2": "#6A59B4",
    "c3": "#F2E3A6",
    "leaf": "#4E7A38",
    "deco": "star",
    "form": "raceme",
    "opt": {
      "floret": "pea",
      "count": 11
    }
  },
  {
    "n": 21,
    "name": "杜鹃",
    "saying": "繁荣、节制、永远属于你",
    "rarity": "普通",
    "c1": "#E5537F",
    "c2": "#B02C58",
    "c3": "#F0C25A",
    "leaf": "#3F6B2C",
    "deco": "butterfly",
    "form": "azalea",
    "alt": "#8E2340",
    "opt": {
      "cluster": 3
    }
  },
  {
    "n": 22,
    "name": "山茶",
    "saying": "谦逊、理想的爱、美德",
    "rarity": "普通",
    "c1": "#E23B52",
    "c2": "#A91530",
    "c3": "#F2CE5A",
    "leaf": "#3F6B2C",
    "deco": "butterfly",
    "form": "rose",
    "opt": {
      "layers": 4,
      "flat": true
    }
  },
  {
    "n": 23,
    "name": "水仙",
    "saying": "纯洁、吉祥、自爱",
    "rarity": "普通",
    "c1": "#FBF8EE",
    "c2": "#DAD6BE",
    "c3": "#F5B930",
    "leaf": "#5E8C3E",
    "deco": "butterfly",
    "form": "narcissus",
    "opt": {}
  },
  {
    "n": 24,
    "name": "百合",
    "saying": "百年好合、纯洁、伟大的爱与祝福",
    "rarity": "传说",
    "c1": "#FBF6F1",
    "c2": "#D9C6C0",
    "c3": "#C4742C",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "lily",
    "alt": "#B5543E",
    "opt": {
      "spots": true
    }
  },
  {
    "n": 25,
    "name": "郁金香",
    "saying": "永恒的爱、博爱、喜悦",
    "rarity": "普通",
    "c1": "#E4414F",
    "c2": "#A81D33",
    "c3": "#3F3324",
    "leaf": "#5E8C3E",
    "deco": "butterfly",
    "form": "tulip",
    "opt": {}
  },
  {
    "n": 26,
    "name": "风信子",
    "saying": "燃放生命、喜悦、永远怀念",
    "rarity": "普通",
    "c1": "#AFA0E2",
    "c2": "#7058B8",
    "c3": "#EADCF5",
    "leaf": "#5E8C3E",
    "deco": "butterfly",
    "form": "spike",
    "opt": {
      "floret": "star",
      "dense": true
    }
  },
  {
    "n": 27,
    "name": "铃兰",
    "saying": "幸福的归来、纯洁",
    "rarity": "普通",
    "c1": "#FBFBF5",
    "c2": "#D2D8C2",
    "c3": "#EDE5CC",
    "leaf": "#5E8C3E",
    "deco": "butterfly",
    "form": "bell",
    "opt": {
      "count": 7,
      "star": false
    }
  },
  {
    "n": 28,
    "name": "雏菊",
    "saying": "天真、和平、希望",
    "rarity": "珍稀",
    "c1": "#FCFBF5",
    "c2": "#D8DBC9",
    "c3": "#F2BE31",
    "leaf": "#5E8C3E",
    "deco": "none",
    "form": "daisy",
    "opt": {
      "n": 20,
      "L": 32,
      "W": 5,
      "style": "strap",
      "disk": "dot"
    }
  },
  {
    "n": 29,
    "name": "向日葵",
    "saying": "沉默的爱、忠诚、阳光",
    "rarity": "普通",
    "c1": "#F5B722",
    "c2": "#D18A0C",
    "c3": "#6B3F1D",
    "leaf": "#4E7A38",
    "deco": "none",
    "form": "daisy",
    "opt": {
      "n": 22,
      "L": 38,
      "W": 7,
      "style": "point",
      "disk": "grid"
    }
  },
  {
    "n": 30,
    "name": "满天星",
    "saying": "思念、关怀、纯洁",
    "rarity": "普通",
    "c1": "#FBFBF6",
    "c2": "#D6D9CD",
    "c3": "#E8D78A",
    "leaf": "#6E8C5A",
    "deco": "none",
    "form": "umbel",
    "opt": {
      "floret": "c5",
      "shape": "scatter",
      "count": 16
    }
  },
  {
    "n": 31,
    "name": "勿忘我",
    "saying": "永恒的爱、勿忘我",
    "rarity": "普通",
    "c1": "#8FC5EC",
    "c2": "#4A87BF",
    "c3": "#F4D24E",
    "leaf": "#5E8C3E",
    "deco": "none",
    "form": "umbel",
    "opt": {
      "floret": "c5",
      "shape": "flat",
      "count": 9
    }
  },
  {
    "n": 32,
    "name": "薰衣草",
    "saying": "等待爱情、宁静、平和",
    "rarity": "珍稀",
    "c1": "#B49ADB",
    "c2": "#7A5AAE",
    "c3": "#D9C6EE",
    "leaf": "#6E8C5A",
    "deco": "none",
    "form": "spike",
    "opt": {
      "floret": "lip",
      "dense": true
    }
  },
  {
    "n": 33,
    "name": "三色堇",
    "saying": "思念、请思念我",
    "rarity": "普通",
    "c1": "#7B52B6",
    "c2": "#4A2C82",
    "c3": "#F3C53E",
    "leaf": "#4E7A38",
    "deco": "none",
    "form": "pansy",
    "alt": "#F6E7B0",
    "opt": {}
  },
  {
    "n": 34,
    "name": "虞美人",
    "saying": "安慰、顺从、忠贞",
    "rarity": "普通",
    "c1": "#E2403C",
    "c2": "#A81D22",
    "c3": "#2B2422",
    "leaf": "#6E8C5A",
    "deco": "none",
    "form": "poppy",
    "opt": {
      "n": 4
    }
  },
  {
    "n": 35,
    "name": "波斯菊",
    "saying": "纯洁的心、永远的快乐",
    "rarity": "普通",
    "c1": "#F2A7C6",
    "c2": "#CE6296",
    "c3": "#F0BF3C",
    "leaf": "#5E8C3E",
    "deco": "dew",
    "form": "daisy",
    "opt": {
      "n": 8,
      "L": 34,
      "W": 12,
      "style": "wide",
      "disk": "dot"
    }
  },
  {
    "n": 36,
    "name": "矢车菊",
    "saying": "纤细、优雅、遇见幸福",
    "rarity": "传说",
    "c1": "#5C8FD6",
    "c2": "#2F5AA8",
    "c3": "#3B3E86",
    "leaf": "#6E8C5A",
    "deco": "dew",
    "form": "daisy",
    "opt": {
      "n": 12,
      "L": 30,
      "W": 9,
      "style": "fringe",
      "disk": "fringe"
    }
  },
  {
    "n": 37,
    "name": "金盏花",
    "saying": "怜惜、别离、绝望的爱",
    "rarity": "普通",
    "c1": "#F2A02A",
    "c2": "#CE6C10",
    "c3": "#B4530A",
    "leaf": "#5E8C3E",
    "deco": "dew",
    "form": "daisy",
    "opt": {
      "n": 24,
      "L": 30,
      "W": 5,
      "style": "strap",
      "disk": "dark"
    }
  },
  {
    "n": 38,
    "name": "万寿菊",
    "saying": "健康、长寿、平安",
    "rarity": "普通",
    "c1": "#EF8A15",
    "c2": "#B95C08",
    "c3": "#D8750B",
    "leaf": "#4E7A38",
    "deco": "dew",
    "form": "chrys",
    "opt": {
      "n": 26,
      "curl": false
    }
  },
  {
    "n": 39,
    "name": "百日草",
    "saying": "友谊地久天长、想念",
    "rarity": "普通",
    "c1": "#E4526E",
    "c2": "#AC2547",
    "c3": "#8A5A24",
    "leaf": "#5E8C3E",
    "deco": "dew",
    "form": "daisy",
    "opt": {
      "n": 20,
      "L": 31,
      "W": 8,
      "style": "wide",
      "disk": "ring"
    }
  },
  {
    "n": 40,
    "name": "牵牛花",
    "saying": "爱情永固、顽强",
    "rarity": "珍稀",
    "c1": "#6E72CE",
    "c2": "#4149A0",
    "c3": "#FBF6E8",
    "leaf": "#5E8C3E",
    "deco": "dew",
    "form": "trumpet",
    "opt": {
      "cluster": 2,
      "throat": true
    }
  },
  {
    "n": 41,
    "name": "金银花",
    "saying": "爱的奉献、无私",
    "rarity": "普通",
    "c1": "#F7E7B0",
    "c2": "#D9B35C",
    "c3": "#FBF8EC",
    "leaf": "#4E7A38",
    "deco": "dew",
    "form": "honeysuckle",
    "opt": {}
  },
  {
    "n": 42,
    "name": "凌霄花",
    "saying": "钦佩、敬爱、执着",
    "rarity": "普通",
    "c1": "#EE7A34",
    "c2": "#BC4A16",
    "c3": "#F3C06A",
    "leaf": "#4E7A38",
    "deco": "star",
    "form": "trumpet",
    "opt": {
      "cluster": 4,
      "throat": true
    }
  },
  {
    "n": 43,
    "name": "木棉花",
    "saying": "珍惜眼前人、英雄",
    "rarity": "普通",
    "c1": "#E23B26",
    "c2": "#A91E14",
    "c3": "#C9341C",
    "leaf": "#6B4A3C",
    "deco": "star",
    "form": "bombax",
    "opt": {
      "stem": "branch"
    }
  },
  {
    "n": 44,
    "name": "凤凰花",
    "saying": "火热青春、离别与思念",
    "rarity": "珍稀",
    "c1": "#E8342B",
    "c2": "#AD1B18",
    "c3": "#F0D05A",
    "leaf": "#4E7A38",
    "deco": "star",
    "form": "bombax",
    "alt": "#F5DC74",
    "opt": {
      "flag": true
    }
  },
  {
    "n": 45,
    "name": "紫荆花",
    "saying": "兄弟和睦、团圆",
    "rarity": "普通",
    "c1": "#C4549C",
    "c2": "#8E2F70",
    "c3": "#F0D3E6",
    "leaf": "#4E7A38",
    "deco": "star",
    "form": "bombax",
    "opt": {}
  },
  {
    "n": 46,
    "name": "樱花",
    "saying": "纯洁、高尚、生命之美",
    "rarity": "普通",
    "c1": "#F8D3DF",
    "c2": "#E39BB6",
    "c3": "#EFC267",
    "leaf": "#6B4A3C",
    "deco": "star",
    "form": "prunus",
    "opt": {
      "p": 5,
      "style": "notch",
      "stem": "branch",
      "cluster": 3,
      "stamens": "long"
    }
  },
  {
    "n": 47,
    "name": "合欢花",
    "saying": "夫妻恩爱、永远相爱",
    "rarity": "普通",
    "c1": "#F3AEC6",
    "c2": "#D97199",
    "c3": "#FBE0EB",
    "leaf": "#4E7A38",
    "deco": "star",
    "form": "ball",
    "opt": {
      "type": "silk"
    }
  },
  {
    "n": 48,
    "name": "槐花",
    "saying": "春之深意、守护",
    "rarity": "传说",
    "c1": "#F6F4E4",
    "c2": "#CFD4B4",
    "c3": "#E9D98C",
    "leaf": "#4E7A38",
    "deco": "star",
    "form": "raceme",
    "opt": {
      "floret": "pea",
      "count": 9
    }
  },
  {
    "n": 49,
    "name": "泡桐花",
    "saying": "永恒的守候、期待",
    "rarity": "普通",
    "c1": "#CDB4E6",
    "c2": "#9671BE",
    "c3": "#F0DEA8",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "trumpet",
    "opt": {
      "cluster": 3,
      "throat": true,
      "up": true
    }
  },
  {
    "n": 50,
    "name": "木槿",
    "saying": "温柔的坚持、坚韧",
    "rarity": "普通",
    "c1": "#F3BDD2",
    "c2": "#D0719C",
    "c3": "#F2D05C",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "hibiscus",
    "opt": {}
  },
  {
    "n": 51,
    "name": "扶桑",
    "saying": "新鲜的爱、微妙的恋情",
    "rarity": "普通",
    "c1": "#E4403F",
    "c2": "#AA1F27",
    "c3": "#F3CC5C",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "hibiscus",
    "opt": {}
  },
  {
    "n": 52,
    "name": "芙蓉",
    "saying": "纯洁、娇艳、一日三变",
    "rarity": "珍稀",
    "c1": "#F6D3DC",
    "c2": "#D98BA8",
    "c3": "#EDC45C",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "hibiscus",
    "opt": {}
  },
  {
    "n": 53,
    "name": "睡莲",
    "saying": "圣洁、纯真、出淤泥不染",
    "rarity": "普通",
    "c1": "#F7CBD9",
    "c2": "#D986A8",
    "c3": "#F1C247",
    "leaf": "#4E8A46",
    "deco": "butterfly",
    "form": "lotus",
    "opt": {
      "pad": true,
      "flat": true
    }
  },
  {
    "n": 54,
    "name": "并蒂莲",
    "saying": "夫妻同心、天长地久",
    "rarity": "普通",
    "c1": "#F4B9CE",
    "c2": "#D4709B",
    "c3": "#EFC04A",
    "leaf": "#4E8A46",
    "deco": "butterfly",
    "form": "lotus",
    "opt": {
      "pad": true,
      "twin": true
    }
  },
  {
    "n": 55,
    "name": "鸢尾",
    "saying": "爱、美丽、思念",
    "rarity": "普通",
    "c1": "#7B63C4",
    "c2": "#4B3A91",
    "c3": "#EFC044",
    "leaf": "#5E8C3E",
    "deco": "butterfly",
    "form": "iris",
    "opt": {}
  },
  {
    "n": 56,
    "name": "蝴蝶兰",
    "saying": "幸福的爱情、似蝶飞舞",
    "rarity": "珍稀",
    "c1": "#F7E4EE",
    "c2": "#D9A6C2",
    "c3": "#B03C77",
    "leaf": "#4E7A38",
    "deco": "none",
    "form": "orchid",
    "opt": {
      "lip": "butterfly",
      "count": 2
    }
  },
  {
    "n": 57,
    "name": "石斛兰",
    "saying": "慈爱、勇敢、纯洁",
    "rarity": "普通",
    "c1": "#F2E6F4",
    "c2": "#B48CC8",
    "c3": "#F0C85A",
    "leaf": "#4E7A38",
    "deco": "none",
    "form": "orchid",
    "opt": {
      "lip": "slipper"
    }
  },
  {
    "n": 58,
    "name": "君子兰",
    "saying": "君子之风、谦谦有礼",
    "rarity": "普通",
    "c1": "#EE8340",
    "c2": "#BC4A1C",
    "c3": "#F3CE67",
    "leaf": "#3F6B2C",
    "deco": "none",
    "form": "umbel",
    "opt": {
      "floret": "funnel",
      "shape": "loose",
      "count": 7
    }
  },
  {
    "n": 59,
    "name": "文心兰",
    "saying": "无忧无虑、快乐无忧",
    "rarity": "普通",
    "c1": "#F2C53C",
    "c2": "#C08A15",
    "c3": "#B0562A",
    "leaf": "#5E8C3E",
    "deco": "none",
    "form": "orchid",
    "opt": {
      "lip": "dancing"
    }
  },
  {
    "n": 60,
    "name": "鹤望兰",
    "saying": "自由、潇洒、思乡",
    "rarity": "传说",
    "c1": "#EE8B26",
    "c2": "#B95A12",
    "c3": "#2E4FA8",
    "leaf": "#4E7A38",
    "deco": "none",
    "form": "bird",
    "opt": {}
  },
  {
    "n": 61,
    "name": "马蹄莲",
    "saying": "永结同心、高雅纯洁",
    "rarity": "普通",
    "c1": "#FBF9F1",
    "c2": "#D7D6C2",
    "c3": "#F0C540",
    "leaf": "#4E7A38",
    "deco": "none",
    "form": "calla",
    "opt": {}
  },
  {
    "n": 62,
    "name": "一品红",
    "saying": "祝福、热情、永不言败",
    "rarity": "普通",
    "c1": "#D92D3A",
    "c2": "#9C1524",
    "c3": "#E8C24A",
    "leaf": "#3F6B2C",
    "deco": "none",
    "form": "poinsettia",
    "opt": {}
  },
  {
    "n": 63,
    "name": "仙客来",
    "saying": "害羞、内向、喜迎贵宾",
    "rarity": "普通",
    "c1": "#EE79A6",
    "c2": "#B8386C",
    "c3": "#F0D8E4",
    "leaf": "#4E7A38",
    "deco": "dew",
    "form": "cyclamen",
    "opt": {}
  },
  {
    "n": 64,
    "name": "报春花",
    "saying": "初恋、希望、幸福的到来",
    "rarity": "珍稀",
    "c1": "#E9B6D6",
    "c2": "#B46EA2",
    "c3": "#F3D24E",
    "leaf": "#5E8C3E",
    "deco": "dew",
    "form": "umbel",
    "opt": {
      "floret": "c5",
      "shape": "flat",
      "count": 7
    }
  },
  {
    "n": 65,
    "name": "迎春花",
    "saying": "希望、相爱到永远",
    "rarity": "普通",
    "c1": "#F4C82E",
    "c2": "#CBA017",
    "c3": "#E8A918",
    "leaf": "#5E9A3C",
    "deco": "dew",
    "form": "umbel",
    "opt": {
      "floret": "funnel",
      "shape": "scatter",
      "count": 6,
      "stem": "cane"
    }
  },
  {
    "n": 66,
    "name": "连翘",
    "saying": "预言、神秘、希望",
    "rarity": "普通",
    "c1": "#F2BE22",
    "c2": "#C58D0C",
    "c3": "#DEA010",
    "leaf": "#6B4A3C",
    "deco": "dew",
    "form": "umbel",
    "opt": {
      "floret": "c4",
      "shape": "scatter",
      "count": 8,
      "stem": "branch"
    }
  },
  {
    "n": 67,
    "name": "腊梅",
    "saying": "慈爱、悲悯、堅贞",
    "rarity": "普通",
    "c1": "#EFCB62",
    "c2": "#C39A2C",
    "c3": "#A8412F",
    "leaf": "#6B4A3C",
    "deco": "dew",
    "form": "wintersweet",
    "opt": {}
  },
  {
    "n": 68,
    "name": "结香",
    "saying": "喜结良缘、心想事成",
    "rarity": "珍稀",
    "c1": "#EFD488",
    "c2": "#C7A34A",
    "c3": "#F5E7B8",
    "leaf": "#6B4A3C",
    "deco": "dew",
    "form": "ball",
    "opt": {
      "type": "cluster"
    }
  },
  {
    "n": 69,
    "name": "瑞香",
    "saying": "祥瑞、吉祥、灵性",
    "rarity": "普通",
    "c1": "#E5C1DC",
    "c2": "#B27EA6",
    "c3": "#F3E2C0",
    "leaf": "#4E7A38",
    "deco": "dew",
    "form": "umbel",
    "opt": {
      "floret": "c4",
      "shape": "ball",
      "count": 14
    }
  },
  {
    "n": 70,
    "name": "含笑花",
    "saying": "含蓄、矜持、端庄",
    "rarity": "普通",
    "c1": "#EBDBA6",
    "c2": "#BFA268",
    "c3": "#E7C77A",
    "leaf": "#3F6B2C",
    "deco": "star",
    "form": "magnolia",
    "opt": {
      "p": 6,
      "small": true
    }
  },
  {
    "n": 71,
    "name": "白兰花",
    "saying": "真挚、纯洁的爱",
    "rarity": "普通",
    "c1": "#F7F3E4",
    "c2": "#D3CDAE",
    "c3": "#E8D49A",
    "leaf": "#3F6B2C",
    "deco": "star",
    "form": "magnolia",
    "opt": {
      "p": 6,
      "slim": true
    }
  },
  {
    "n": 72,
    "name": "米兰",
    "saying": "有爱就有希望、勇敢",
    "rarity": "传说",
    "c1": "#F0CE5C",
    "c2": "#C1A02F",
    "c3": "#F6E49E",
    "leaf": "#3F6B2C",
    "deco": "star",
    "form": "umbel",
    "opt": {
      "floret": "tiny",
      "shape": "cone",
      "count": 20
    }
  },
  {
    "n": 73,
    "name": "素馨",
    "saying": "温柔、纯洁、爱情",
    "rarity": "普通",
    "c1": "#FBF8F2",
    "c2": "#D8D5C2",
    "c3": "#EFD68A",
    "leaf": "#4E7A38",
    "deco": "star",
    "form": "umbel",
    "opt": {
      "floret": "c5",
      "shape": "flat",
      "count": 8
    }
  },
  {
    "n": 74,
    "name": "鸡蛋花",
    "saying": "孕育希望、豁达",
    "rarity": "普通",
    "c1": "#FBF7EA",
    "c2": "#DED5B0",
    "c3": "#F2BE3C",
    "leaf": "#4E7A38",
    "deco": "star",
    "form": "plumeria",
    "opt": {}
  },
  {
    "n": 75,
    "name": "夹竹桃",
    "saying": "有警戒但不忘美、危险的美",
    "rarity": "普通",
    "c1": "#EE93B4",
    "c2": "#C1547E",
    "c3": "#F6DDE8",
    "leaf": "#4E7A38",
    "deco": "star",
    "form": "plumeria",
    "opt": {
      "frill": true
    }
  },
  {
    "n": 76,
    "name": "石榴花",
    "saying": "多子多福、成熟的美丽",
    "rarity": "珍稀",
    "c1": "#E5542C",
    "c2": "#AE2E15",
    "c3": "#EFC254",
    "leaf": "#4E7A38",
    "deco": "star",
    "form": "urn",
    "opt": {}
  },
  {
    "n": 77,
    "name": "紫薇",
    "saying": "沉迷的爱、好运",
    "rarity": "普通",
    "c1": "#D58FC6",
    "c2": "#A34F98",
    "c3": "#F0CE6A",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "bombax",
    "opt": {
      "frill": true
    }
  },
  {
    "n": 78,
    "name": "木香",
    "saying": "清雅、高洁",
    "rarity": "普通",
    "c1": "#F6EFC9",
    "c2": "#D2C48A",
    "c3": "#EDC34A",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "prunus",
    "opt": {
      "p": 5,
      "style": "round",
      "cluster": 4,
      "stamens": "long"
    }
  },
  {
    "n": 79,
    "name": "荼蘼",
    "saying": "末路之美、离别",
    "rarity": "普通",
    "c1": "#FBF8F0",
    "c2": "#DAD5BE",
    "c3": "#EFC85A",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "rose",
    "opt": {
      "layers": 3,
      "cluster": 3,
      "flat": true,
      "thorn": true
    }
  },
  {
    "n": 80,
    "name": "琼花",
    "saying": "不朽、永恒、圣洁",
    "rarity": "珍稀",
    "c1": "#FCFAF4",
    "c2": "#D8D8C6",
    "c3": "#E8DC9C",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "umbel",
    "opt": {
      "floret": "big4",
      "shape": "ring",
      "count": 8
    }
  },
  {
    "n": 81,
    "name": "绣球",
    "saying": "希望、团圆、浪漫",
    "rarity": "普通",
    "c1": "#8FA9DE",
    "c2": "#5C76B8",
    "c3": "#E8ECF7",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "umbel",
    "opt": {
      "floret": "c4",
      "shape": "ball",
      "count": 19
    }
  },
  {
    "n": 82,
    "name": "铁线莲",
    "saying": "高洁、美丽、心花怒放",
    "rarity": "普通",
    "c1": "#9B7AD0",
    "c2": "#6749A6",
    "c3": "#E9D06A",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "prunus",
    "opt": {
      "p": 8,
      "style": "point",
      "stamens": "tuft",
      "cluster": 1
    }
  },
  {
    "n": 83,
    "name": "桔梗",
    "saying": "永恒不变的爱、诚实",
    "rarity": "普通",
    "c1": "#8C8FD4",
    "c2": "#565CB0",
    "c3": "#EAE4F0",
    "leaf": "#5E8C3E",
    "deco": "butterfly",
    "form": "bell",
    "opt": {
      "count": 3,
      "star": true,
      "up": true
    }
  },
  {
    "n": 84,
    "name": "龙胆",
    "saying": "爱上忧伤的你",
    "rarity": "珍稀",
    "c1": "#4674C4",
    "c2": "#254E96",
    "c3": "#E8EFF8",
    "leaf": "#5E8C3E",
    "deco": "none",
    "form": "bell",
    "opt": {
      "count": 3,
      "up": true
    }
  },
  {
    "n": 85,
    "name": "雪莲",
    "saying": "纯洁、坚毅、圣洁",
    "rarity": "普通",
    "c1": "#F2F4EC",
    "c2": "#C8CEB8",
    "c3": "#7C5A6E",
    "leaf": "#6E8C5A",
    "deco": "none",
    "form": "bract",
    "opt": {}
  },
  {
    "n": 86,
    "name": "绿绒蒿",
    "saying": "隐逸、宁静、守望",
    "rarity": "普通",
    "c1": "#8FB8DE",
    "c2": "#4F82B8",
    "c3": "#D9A83E",
    "leaf": "#6E8C5A",
    "deco": "none",
    "form": "poppy",
    "opt": {
      "n": 4
    }
  },
  {
    "n": 87,
    "name": "蓝雪花",
    "saying": "冷淡、忧郁、宁静的心",
    "rarity": "普通",
    "c1": "#91BCE6",
    "c2": "#4E88C4",
    "c3": "#EAF3FB",
    "leaf": "#5E8C3E",
    "deco": "none",
    "form": "umbel",
    "opt": {
      "floret": "c5",
      "shape": "ball",
      "count": 11
    }
  },
  {
    "n": 88,
    "name": "蓝花楹",
    "saying": "宁静、深远、哀伤",
    "rarity": "珍稀",
    "c1": "#8E7AD2",
    "c2": "#5F4BA8",
    "c3": "#D6C9F0",
    "leaf": "#4E7A38",
    "deco": "none",
    "form": "raceme",
    "opt": {
      "floret": "tube",
      "count": 10
    }
  },
  {
    "n": 89,
    "name": "风铃草",
    "saying": "感恩、温柔、可爱",
    "rarity": "普通",
    "c1": "#B8A0DE",
    "c2": "#7D62B8",
    "c3": "#EFE4F6",
    "leaf": "#5E8C3E",
    "deco": "none",
    "form": "bell",
    "opt": {
      "count": 5,
      "star": false
    }
  },
  {
    "n": 90,
    "name": "飞燕草",
    "saying": "轻盈、自由、无拘无束",
    "rarity": "普通",
    "c1": "#7B91D8",
    "c2": "#455CB4",
    "c3": "#EDF0FA",
    "leaf": "#5E8C3E",
    "deco": "none",
    "form": "spike",
    "opt": {
      "floret": "spur",
      "dense": false
    }
  },
  {
    "n": 91,
    "name": "翠雀",
    "saying": "淡薄、清雅、惹人怜爱",
    "rarity": "普通",
    "c1": "#5E82D2",
    "c2": "#2F51A6",
    "c3": "#EFF3FC",
    "leaf": "#5E8C3E",
    "deco": "dew",
    "form": "spike",
    "opt": {
      "floret": "spur",
      "dense": true
    }
  },
  {
    "n": 92,
    "name": "花毛茛",
    "saying": "高贵、典雅、魅力",
    "rarity": "珍稀",
    "c1": "#F2A0B2",
    "c2": "#C65C7E",
    "c3": "#EFC968",
    "leaf": "#5E8C3E",
    "deco": "dew",
    "form": "rose",
    "opt": {
      "layers": 7,
      "ball": true
    }
  },
  {
    "n": 93,
    "name": "银莲花",
    "saying": "期待、凋零的美、脆弱",
    "rarity": "普通",
    "c1": "#F4D7E2",
    "c2": "#C4779B",
    "c3": "#3A3450",
    "leaf": "#5E8C3E",
    "deco": "dew",
    "form": "poppy",
    "opt": {
      "n": 8,
      "darkcore": true
    }
  },
  {
    "n": 94,
    "name": "白头翁",
    "saying": "勇敢、坚毅、守护",
    "rarity": "普通",
    "c1": "#A98AD4",
    "c2": "#6B4FA6",
    "c3": "#EFC64E",
    "leaf": "#6E8C5A",
    "deco": "dew",
    "form": "poppy",
    "opt": {
      "n": 6
    }
  },
  {
    "n": 95,
    "name": "石竹",
    "saying": "纯洁的爱、才能大胆",
    "rarity": "普通",
    "c1": "#E87BA2",
    "c2": "#B23F6B",
    "c3": "#F2E0EA",
    "leaf": "#6E8C5A",
    "deco": "dew",
    "form": "carnation",
    "opt": {
      "double": false
    }
  },
  {
    "n": 96,
    "name": "康乃馨",
    "saying": "温馨、母爱、感恩",
    "rarity": "传说",
    "c1": "#EE8DA8",
    "c2": "#C15276",
    "c3": "#F3D8E2",
    "leaf": "#6E8C5A",
    "deco": "dew",
    "form": "carnation",
    "opt": {
      "double": true
    }
  },
  {
    "n": 97,
    "name": "补血草",
    "saying": "平凡而长久、不离不弃",
    "rarity": "普通",
    "c1": "#C9A4DC",
    "c2": "#8E67B8",
    "c3": "#F1E4F6",
    "leaf": "#6E8C5A",
    "deco": "dew",
    "form": "spike",
    "opt": {
      "floret": "paper",
      "dense": false
    }
  },
  {
    "n": 98,
    "name": "千日红",
    "saying": "永恒的爱、不朽",
    "rarity": "普通",
    "c1": "#C25396",
    "c2": "#8C2C6C",
    "c3": "#EBA7CB",
    "leaf": "#5E8C3E",
    "deco": "star",
    "form": "ball",
    "opt": {
      "type": "globe"
    }
  },
  {
    "n": 99,
    "name": "鸡冠花",
    "saying": "真爱、永恒的爱",
    "rarity": "普通",
    "c1": "#D8445C",
    "c2": "#A01C3C",
    "c3": "#E8758C",
    "leaf": "#5E8C3E",
    "deco": "star",
    "form": "cockscomb",
    "opt": {}
  },
  {
    "n": 100,
    "name": "一串红",
    "saying": "喜庆、热烈、吉祥",
    "rarity": "珍稀",
    "c1": "#DE3B42",
    "c2": "#A51C28",
    "c3": "#EFC98A",
    "leaf": "#4E7A38",
    "deco": "star",
    "form": "spike",
    "opt": {
      "floret": "lip",
      "dense": true
    }
  },
  {
    "n": 101,
    "name": "矮牵牛",
    "saying": "安心、与你同心",
    "rarity": "普通",
    "c1": "#C36BC0",
    "c2": "#8B3C91",
    "c3": "#F5E9F2",
    "leaf": "#5E8C3E",
    "deco": "star",
    "form": "trumpet",
    "opt": {
      "cluster": 2,
      "throat": true,
      "round": true
    }
  },
  {
    "n": 102,
    "name": "六倍利",
    "saying": "可怜、同情",
    "rarity": "普通",
    "c1": "#5D83D0",
    "c2": "#3355A6",
    "c3": "#F0F4FD",
    "leaf": "#5E8C3E",
    "deco": "star",
    "form": "umbel",
    "opt": {
      "floret": "lip",
      "shape": "ball",
      "count": 14
    }
  },
  {
    "n": 103,
    "name": "香雪球",
    "saying": "甜蜜、回忆、纯真",
    "rarity": "普通",
    "c1": "#FBF9F2",
    "c2": "#D8D5C2",
    "c3": "#E9D58A",
    "leaf": "#6E8C5A",
    "deco": "star",
    "form": "umbel",
    "opt": {
      "floret": "c4",
      "shape": "ball",
      "count": 18
    }
  },
  {
    "n": 104,
    "name": "荷包牡丹",
    "saying": "招财、爱心、思念的心",
    "rarity": "珍稀",
    "c1": "#E9799F",
    "c2": "#B84471",
    "c3": "#FBF2F4",
    "leaf": "#5E8C3E",
    "deco": "star",
    "form": "heart",
    "opt": {}
  },
  {
    "n": 105,
    "name": "紫罗兰",
    "saying": "永恒的美丽、质朴",
    "rarity": "普通",
    "c1": "#B99BDD",
    "c2": "#8062B6",
    "c3": "#F0D77A",
    "leaf": "#6E8C5A",
    "deco": "butterfly",
    "form": "spike",
    "opt": {
      "floret": "c4",
      "dense": false
    }
  },
  {
    "n": 106,
    "name": "夜来香",
    "saying": "危险的浪漫、诱惑",
    "rarity": "普通",
    "c1": "#E9E7AE",
    "c2": "#B9B77C",
    "c3": "#F2EFCB",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "umbel",
    "opt": {
      "floret": "tube",
      "shape": "flat",
      "count": 9
    }
  },
  {
    "n": 107,
    "name": "昙花",
    "saying": "刹那的美丽、转瞬即逝",
    "rarity": "普通",
    "c1": "#FBF9F0",
    "c2": "#DAD6BE",
    "c3": "#EED98C",
    "leaf": "#4E7A38",
    "deco": "butterfly",
    "form": "epiphyllum",
    "opt": {}
  },
  {
    "n": 108,
    "name": "优昙花",
    "saying": "千年难得、福慧双全",
    "rarity": "传说",
    "c1": "#F4F7EA",
    "c2": "#C6D2B4",
    "c3": "#EDD98A",
    "leaf": "#5E8C3E",
    "deco": "butterfly",
    "form": "bract",
    "opt": {
      "star": true
    }
  }
];
