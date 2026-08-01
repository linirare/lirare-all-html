(() => {
  window.__DSV20__ = true;

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const intro = document.querySelector("#intro");
  const buildOverlay = document.querySelector("#build");
  const result = document.querySelector("#result");
  const buildCards = document.querySelector("#build-cards");
  const currentBuild = document.querySelector("#current-build");
  const synergyHint = document.querySelector("#synergy-hint");
  const buildEyebrow = document.querySelector("#build .eyebrow");
  const debug = document.querySelector("#debug-state");
  const pauseButton = document.querySelector("#pause-button");
  const pauseOverlay = document.querySelector("#pause-overlay");
  const skillButton = document.querySelector("#skill-button");
  const scrollCount = document.querySelector("#scroll-count");
  const highestStage = document.querySelector("#highest-stage");
  const growthScrollCount = document.querySelector("#growth-scroll-count");
  const stageGrid = document.querySelector("#stage-grid");
  const chapterTitle = document.querySelector("#chapter-title");
  const chapterProgress = document.querySelector("#chapter-progress");
  const chapterPrev = document.querySelector("#chapter-prev");
  const chapterNext = document.querySelector("#chapter-next");
  const stageMainRoster = document.querySelector("#stage-main-roster");
  const growthRoster = document.querySelector("#growth-roster");
  const growthDetail = document.querySelector("#growth-detail");
  const partnerList = document.querySelector("#partner-list");
  const W = 390, H = 760, lanes = [76, 195, 314];
  function fit(){
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const s = Math.min(window.innerWidth/W, window.innerHeight/H, 430/W, 820/H);
    const dw = Math.max(1, Math.round(W*s)), dh = Math.max(1, Math.round(H*s));
    document.querySelector("main").style.width = dw + "px";
    document.querySelector("main").style.height = dh + "px";
    canvas.width = Math.round(dw*dpr);
    canvas.height = Math.round(dh*dpr);
    canvas.style.width = dw + "px";
    canvas.style.height = dh + "px";
    ctx.setTransform(dw*dpr/W, 0, 0, dh*dpr/H, 0, 0);
  }
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", fit);
  fit();
  const speed = Math.max(1, Math.min(6, Number(new URLSearchParams(location.search).get("speed")) || 1));
  const C = {
    gold:"#ffd15b", orange:"#ff8b46", red:"#ff5f70", jade:"#68e6bd",
    purple:"#b887ff", cyan:"#6de8ff", pink:"#ff91bd", text:"#fff9ea", muted:"#b9adbd"
  };
  const elements = {
    metal:{name:"金",color:"#ffe07a"},
    wood:{name:"木",color:"#79e49d"},
    water:{name:"水",color:"#6dcfff"},
    fire:{name:"火",color:"#ff784f"},
    earth:{name:"土",color:"#d8aa72"},
    neutral:{name:"无",color:"#c9becb"}
  };
  // 木克土、土克水、水克火、火克金、金克木
  const overcomes = {wood:"earth",earth:"water",water:"fire",fire:"metal",metal:"wood"};
  // 木生火、火生土、土生金、金生水、水生木
  const generates = {wood:"fire",fire:"earth",earth:"metal",metal:"water",water:"wood"};
  const typeResist = {armor:"metal",split:"wood",shaman:"water",bomber:"fire",healer:"earth"};
  const elementStyle = document.createElement("style");
  elementStyle.textContent = `
    .element-pill{display:inline-flex;align-items:center;justify-content:center;min-width:23px;height:23px;
      margin-right:7px;border-radius:999px;font-weight:950;color:#171020;background:var(--el);
      box-shadow:0 0 0 2px color-mix(in srgb,var(--el) 28%,transparent)}
    .build-card .element-note{display:inline-flex;align-items:center;gap:5px;margin-top:5px;
      font-size:10px;font-weight:900;color:var(--el)}
    .chip.element-chip{border-color:color-mix(in srgb,var(--el) 45%,transparent)}
  `;
  document.head.appendChild(elementStyle);

  const bgArt = new Image();
  bgArt.src = "assets/journey-road-bg-v1.png";
  const heroArtSources={
    tang:"assets/hero-tangseng-v2.png",
    wukong:"assets/hero-wukong-v1.png",
    longma:"assets/hero-longma-v1.png",
    bajie:"assets/hero-bajie-v1.png",
    wujing:"assets/hero-wujing-v1.png"
  };
  const heroArts=Object.fromEntries(Object.entries(heroArtSources).map(([id,src])=>{
    const image=new Image();image.src=src;return [id,image];
  }));
  const tangArt=heroArts.tang,wukongArt=heroArts.wukong;

  const META_KEY="dasheng-dianyao-meta-v3";
  const characterIds=["tang","wukong","longma","bajie","wujing"];
  const blankGrowth=()=>Object.fromEntries(characterIds.map(id=>[id,{attack:0,health:0}]));
  const defaultLineup=["tang","wukong","longma","bajie","wujing"];
  const defaultMeta={scrolls:0,highest:0,selectedPage:1,mainCharacter:"tang",lineup:defaultLineup.slice(),growth:blankGrowth(),treasures:[],wuxing:{pow:{fire:0,metal:0,wood:0,water:0,earth:0},total:0,tier:0}};
  let meta=loadMeta();
  function loadMeta(){
    try{
      const raw=JSON.parse(localStorage.getItem(META_KEY)||"{}"),growth=blankGrowth();
      for(const id of characterIds)Object.assign(growth[id],raw.growth?.[id]||{});
      const lineup=Array.isArray(raw.lineup)?raw.lineup.filter(id=>characterIds.includes(id)):defaultLineup.slice();
      if(!raw.mainCharacter&&!lineup.includes("tang"))lineup.push("tang");
      const mainCharacter=characterIds.includes(raw.mainCharacter)?raw.mainCharacter:"tang";
      return {...defaultMeta,...raw,mainCharacter,lineup,growth};
    }catch{return {...defaultMeta,lineup:defaultLineup.slice(),growth:blankGrowth()}}
  }
  function saveMeta(){
    try{localStorage.setItem(META_KEY,JSON.stringify(meta))}catch{}
  }

  const schoolMeta = {
    monkey:{name:"猴群流", color:C.purple, element:"wood",stages:["万猴阵","十万天兵","齐天大圣"]},
    staff:{name:"金箍棒流", color:C.gold, element:"metal",stages:["擎天神针","大闹天宫","定海归一"]},
    fire:{name:"火法流", color:C.orange, element:"fire",stages:["火链焚妖","火眼焚天","焚世真火"]}
  };

  const cards = {
    rootMonkey:{icon:"猴",name:"身外身法",tag:"本命",school:"monkey",element:"wood",root:true,max:1,
      desc:()=>`召出毫毛分身协战`,visual:"常驻分身、紫色多源弹道"},
    clone:{icon:"分",name:"毫毛化身",tag:"猴群",school:"monkey",max:4,
      desc:l=>`常驻分身增加到 ${l+1} 个`,visual:"每层增加一个真实站场分身"},
    transform:{icon:"变",name:"七十二变",tag:"猴群",school:"monkey",max:4,
      desc:l=>`锁定上限 +1，锁定范围 +${l*4}`,visual:"目标周围出现猴影与残像"},
    command:{icon:"令",name:"猴王号令",tag:"猴群",school:"monkey",max:3,
      desc:l=>`四连锁召唤 ${l} 个坠地分身`,visual:"分身从天而降并震出紫环"},
    echo:{icon:"影",name:"真假猴影",tag:"猴群",school:"monkey",max:3,
      desc:l=>`每 ${Math.max(2,5-l)} 次齐射复制整条锁定链`,visual:"第二条镜像弹道延迟追击"},

    rootStaff:{icon:"棒",name:"如意金箍棒",tag:"本命",school:"staff",element:"metal",root:true,max:1,
      desc:()=>`末位目标受到额外重击`,visual:"齐射结尾出现巨大金箍棒"},
    staffPower:{icon:"重",name:"如意重击",tag:"重击",school:"staff",max:4,
      desc:l=>`末位重击额外伤害 +${l}`,visual:"金箍棒逐层变粗并震屏"},
    sweep:{icon:"扫",name:"横扫千军",tag:"重击",school:"staff",max:4,
      desc:l=>`末位砸击造成 ${l} 点范围伤害`,visual:"横扫锁定路线并掀起金色弧光"},
    ocean:{icon:"震",name:"定海神针",tag:"重击",school:"staff",max:3,
      desc:l=>`每第三个锁定点震荡 ${l} 点`,visual:"青色地裂冲击环"},
    pierce:{icon:"破",name:"破甲神棒",tag:"重击",school:"staff",max:3,
      desc:l=>`每次命中先击碎 ${l} 层护盾并击退`,visual:"白金破甲碎片与后退轨迹"},

    rootFire:{icon:"火",name:"三昧真火",tag:"本命",school:"fire",element:"fire",root:true,max:1,
      desc:()=>`所有命中附加延迟灼烧`,visual:"弹道变成火链，妖怪持续燃烧"},
    fire:{icon:"焰",name:"真火炼妖",tag:"火法",school:"fire",max:4,
      desc:l=>`灼烧伤害提升到 ${l+1}`,visual:"火链加粗，燃烧光环扩大"},
    eyes:{icon:"眼",name:"火眼金睛",tag:"火法",school:"fire",max:4,
      desc:l=>`首位目标额外伤害 +${l}`,visual:"首位目标被橙色眼光贯穿"},
    explode:{icon:"爆",name:"爆燃",tag:"火法",school:"fire",max:3,
      desc:l=>`燃烧目标死亡爆炸 ${l} 点`,visual:"击杀触发橙红连爆"},
    cinder:{icon:"烬",name:"余烬蔓延",tag:"火法",school:"fire",max:3,
      desc:l=>`爆燃向附近 ${l+1} 个目标传播灼烧`,visual:"火星从尸体飞向周围妖怪"},

    cloud:{icon:"云",name:"筋斗云",tag:"辅助",school:"support",max:4,
      desc:l=>`法力恢复速度 +${l*25}%`,visual:"英雄脚下出现加速云气"},
    frenzy:{icon:"战",name:"斗战连击",tag:"辅助",school:"support",max:4,
      desc:l=>`四连锁以上返还 ${l} 格法力`,visual:"法力光点飞回能量格"},
    vajra:{icon:"甲",name:"金刚不坏",tag:"辅助",school:"support",max:3,
      desc:l=>`无伤过关修复 ${l} 颗佛珠`,visual:"师父周围出现多层金盾"},
    peach:{icon:"桃",name:"蟠桃续命",tag:"辅助",school:"support",max:2,
      desc:l=>`佛珠上限 +1，并立即恢复 ${l+1}`,visual:"粉色花瓣与治疗光柱"},
    mantra:{icon:"咒",name:"紧箍咒",tag:"辅助",school:"support",max:3,
      desc:l=>`锁定中的妖怪额外减速 ${l*12}%`,visual:"锁定环变成旋转金箍"},
    chainMaster:{icon:"锁",name:"锁妖诀",tag:"辅助",school:"support",max:3,
      desc:l=>`手势吸附范围 +${l*8}`,visual:"锁定时出现更大的金色吸附环"},
    waterRune:{icon:"水",name:"定海水诀",tag:"五行",school:"support",element:"water",max:3,
      desc:l=>`每第三个锁定点追加 ${1+Math.floor(l/2)} 点水伤并击退`,visual:"蓝色水浪冲开火抗妖"},
    earthRune:{icon:"土",name:"地煞土印",tag:"五行",school:"support",element:"earth",max:3,
      desc:l=>`长连锁隔轮震击全部目标 ${1+Math.floor(l/2)} 点`,visual:"棕金地环克制水抗妖"},
    sutraAttack:{icon:"音",name:"梵音锡杖",tag:"唐僧",school:"support",max:3,
      desc:l=>`唐僧基础梵音伤害 +${l*25}%`,visual:"唐僧锡杖震出逐层变粗的金色音环"},
    kasaya:{icon:"裟",name:"锦襕袈裟",tag:"护盾",school:"support",max:3,
      desc:l=>`超度诵经额外获得 ${l} 层袈裟护盾`,visual:"唐僧周围出现红金袈裟结界"},
    stillMind:{icon:"定",name:"不动禅心",tag:"戒律",school:"support",max:2,
      desc:l=>`唐僧静止2秒后，全队伤害 +${l*20}%`,visual:"脚下禅定金莲由暗转亮"},
    pureMind:{icon:"心",name:"清心寡欲",tag:"诵经",school:"support",max:3,
      desc:l=>`超度诵经冷却缩短 ${l*15}%`,visual:"主动技能外圈加速旋转"},
    silentVow:{icon:"戒",name:"闭口禅",tag:"戒律",school:"support",max:1,
      desc:()=>`封印超度诵经，但全队伤害 +60%`,visual:"技能按钮封印，所有攻击转为金色戒律光"},

    bajiePower:{icon:"耙",name:"九齿重耙",tag:"八戒",school:"support",max:3,
      desc:l=>`猪八戒基础伤害 +${l*30}%`,visual:"九齿钉耙逐层变大，命中震出土环"},
    bajieSweep:{icon:"扫",name:"横扫高老庄",tag:"八戒",school:"support",max:2,
      desc:l=>`八戒每第3次攻击横扫周围，造成 ${l} 点土伤`,visual:"棕金钉耙横扫前排一片妖怪"},
    bajieGuard:{icon:"挡",name:"皮糙肉厚",tag:"八戒",school:"support",max:2,
      desc:l=>`每次漏怪伤害减少 ${l} 点`,visual:"八戒冲到唐僧身前举耙挡击"},

    wujingPower:{icon:"杖",name:"降妖宝杖",tag:"悟净",school:"support",max:3,
      desc:l=>`沙悟净基础伤害 +${l*30}%`,visual:"蓝色宝杖水纹逐层加粗"},
    wujingUndertow:{icon:"浪",name:"流沙回卷",tag:"悟净",school:"support",max:3,
      desc:l=>`悟净每次命中将目标击退 ${l*8} 距离`,visual:"水浪把靠近师父的妖怪向后卷"},
    wujingWave:{icon:"河",name:"流沙连潮",tag:"悟净",school:"support",max:2,
      desc:l=>`悟净每第3次攻击追加 ${l} 个水浪目标`,visual:"蓝色水线在多个妖怪间连续弹射"},

    longmaPower:{icon:"龙",name:"白龙吐息",tag:"白龙马",school:"support",max:3,
      desc:l=>`白龙马基础伤害 +${l*30}%`,visual:"白金龙息弹道变粗并留下龙影"},
    longmaRapid:{icon:"驰",name:"踏云疾驰",tag:"白龙马",school:"support",max:3,
      desc:l=>`白龙马攻击间隔缩短 ${l*15}%`,visual:"右下坑位出现连续白色残影"},
    longmaExecute:{icon:"穿",name:"龙牙穿心",tag:"白龙马",school:"support",max:2,
      desc:l=>`攻击生命低于30%的目标时额外造成 ${l} 点伤害`,visual:"残血妖怪被白金龙牙贯穿"},

    // ---- 五行轴：服务全队 5 英雄 ----
    metalAura:{icon:"刃",name:"金罡附刃",tag:"五行",school:"support",element:"metal",max:4,
      desc:l=>`全队攻击附加 ${l} 点金伤`,visual:"金色锋刃透体而出"},
    woodVine:{icon:"藤",name:"缠绕木藤",tag:"五行",school:"support",element:"wood",max:4,
      desc:l=>`全队攻击附加 ${l} 点木伤并减速 ${l*6}%`,visual:"翠藤缠住妖怪"},
    waterPulse:{icon:"潮",name:"连潮汹涌",tag:"五行",school:"support",element:"water",max:3,
      desc:l=>`全队攻击附加 ${1+Math.floor(l/2)} 点水伤`,visual:"青色潮线冲刷全场"},
    fireForge:{icon:"熔",name:"熔金炽火",tag:"五行",school:"support",element:"fire",max:4,
      desc:l=>`全队攻击附加 ${l} 点火伤，对带盾目标额外 ${l}`,visual:"金甲被熔穿起火"},

    metalVoid:{icon:"归",name:"万金归元",tag:"五行",school:"support",element:"metal",max:2,
      desc:l=>`对分裂妖额外 ${l*2} 点穿透伤，且击杀后不再分裂`,visual:"金光吞没分裂残体"},
    metalCut:{icon:"裂",name:"裂空金斩",tag:"五行",school:"support",element:"metal",max:3,
      desc:l=>`击杀分裂妖时扩散 ${1+Math.floor(l/2)} 点金伤`,visual:"金刃劈开分身四散"},
    woodBind:{icon:"缚",name:"缚灵藤蔓",tag:"五行",school:"support",element:"wood",max:3,
      desc:l=>`对治疗妖额外 ${1+Math.floor(l/2)} 点，且其治疗暂停 ${l} 秒`,visual:"翠藤封住妖口"},
    waterReverse:{icon:"逆",name:"逆水反潮",tag:"五行",school:"support",element:"water",max:2,
      desc:l=>`爆裂妖死亡不再自爆，改为水浪全场击退`,visual:"青色水墙反推全场"},
    earthShatter:{icon:"镇",name:"裂地镇魔",tag:"五行",school:"support",element:"earth",max:3,
      desc:l=>`对巫术妖额外 ${1+Math.floor(l/2)} 点，且无视其护盾 ${l} 层`,visual:"地刺穿透妖术护罩"},
    fireBurst:{icon:"焚",name:"焚山裂甲",tag:"五行",school:"support",element:"fire",max:3,
      desc:l=>`命中先碎 ${l} 层护盾并附加 ${1+Math.floor(l/2)} 点火伤`,visual:"火链熔穿护甲"},
    earthStone:{icon:"岳",name:"泰山压顶",tag:"五行",school:"support",element:"earth",max:2,
      desc:l=>`每第4次齐射全场震击 ${1+Math.floor(l/2)} 点土伤`,visual:"巨岩砸落震动三路"},
    earthWall:{icon:"垣",name:"厚土护阵",tag:"五行",school:"support",element:"earth",max:3,
      desc:l=>`每难首次漏怪免伤并震退全场 ${l} 格`,visual:"金色土墙拱起护住师父"},

    metalShield:{icon:"御",name:"金精护体",tag:"五行",school:"support",element:"metal",max:2,
      desc:l=>`五行连携触发时给主位套 ${l} 层金盾`,visual:"五色金光凝成护甲"},
    woodBloom:{icon:"春",name:"万木回春",tag:"五行",school:"support",element:"wood",max:2,
      desc:l=>`相生连携触发时返还 ${l} 格法力`,visual:"绿色法光飞回能量格"},
    waterMirror:{icon:"镜",name:"逆水行舟",tag:"五行",school:"support",element:"water",max:2,
      desc:l=>`五行克制触发时追加 ${l} 点水伤`,visual:"镜面水光折射追击"},
    fireDew:{icon:"烛",name:"烛龙炎息",tag:"五行",school:"support",element:"fire",max:2,
      desc:l=>`五行连携触发时全场灼烧 ${l} 层`,visual:"烛火燎原蔓延三路"},
    wuxingFlow:{icon:"环",name:"五行流转",tag:"五行",school:"support",max:3,
      desc:l=>`五行之力获取 +${l*25}%`,visual:"五色气流入体流转"},
    wuxingComb:{icon:"振",name:"生克共振",tag:"五行",school:"support",max:2,
      desc:l=>`五行连携伤害 +${l}`,visual:"五色共振环叠加增伤"}
  };
  const roots = ["rootMonkey","rootStaff","rootFire"];
  const schoolCards = {
    monkey:["clone","transform","command","echo"],
    staff:["staffPower","sweep","ocean","pierce"],
    fire:["fire","eyes","explode","cinder"]
  };
  const supportCards = ["cloud","frenzy","vajra","peach","mantra","chainMaster","waterRune","earthRune","sutraAttack","kasaya","stillMind","pureMind","silentVow"];
  const characterCardPools={
    tang:["sutraAttack","kasaya","stillMind","pureMind","silentVow","mantra","vajra"],
    wukong:["cloud","frenzy","chainMaster"],
    bajie:["bajiePower","bajieSweep","bajieGuard"],
    wujing:["wujingPower","wujingUndertow","wujingWave"],
    longma:["longmaPower","longmaRapid","longmaExecute"]
  };
  const universalCards=["peach","waterRune","earthRune"];
  const wuxingCards=["metalAura","woodVine","waterPulse","fireForge","metalVoid","metalCut","woodBind","waterReverse","earthShatter","fireBurst","earthStone","earthWall","metalShield","woodBloom","waterMirror","fireDew","wuxingFlow","wuxingComb","waterRune","earthRune","peach"];
  const typeNames={imp:"小妖",runner:"疾妖",armor:"甲妖",split:"分身妖",shaman:"妖术师",healer:"治疗妖",bomber:"爆裂妖",boss:"首领"};
  const ownerMeta={
    tang:{name:"唐僧",icon:"唐",color:elements.fire.color},
    wukong:{name:"孙悟空",icon:"悟",color:C.purple},
    bajie:{name:"猪八戒",icon:"戒",color:elements.earth.color},
    wujing:{name:"沙悟净",icon:"沙",color:elements.water.color},
    longma:{name:"白龙马",icon:"龙",color:elements.metal.color},
    all:{name:"全队",icon:"众",color:C.gold}
  };
  const mainSkillMeta={
    tang:{icon:"经",name:"超度"},
    wukong:{icon:"棒",name:"横扫"},
    longma:{icon:"龙",name:"穿心"},
    bajie:{icon:"耙",name:"护驾"},
    wujing:{icon:"浪",name:"逆流"}
  };
  function cardOwner(id){
    if(roots.includes(id)||Object.values(schoolCards).some(pool=>pool.includes(id))||characterCardPools.wukong.includes(id))return "wukong";
    for(const owner of ["tang","bajie","wujing","longma"])if(characterCardPools[owner].includes(id))return owner;
    return "all";
  }

  const relics = {
    fan:{icon:"扇",name:"芭蕉扇",tag:"控场",element:"wood",desc:"四连锁掀起狂风，将全场妖怪向后推",visual:"青色风墙横扫战场"},
    bell:{icon:"铃",name:"紫金铃",tag:"雷击",element:"fire",desc:"每第三次齐射召唤三段连锁雷",visual:"紫金闪电在妖怪间跳跃"},
    mirror:{icon:"镜",name:"照妖镜",tag:"复制",element:"metal",desc:"每轮首个目标受到一次镜像追击",visual:"天顶镜光复制首发弹道"},
    gourd:{icon:"葫",name:"紫金葫芦",tag:"收妖",element:"water",desc:"每降伏六妖，吸住最靠前目标并重创",visual:"紫色漩涡把妖怪向中心吸拽"},
    lotus:{icon:"莲",name:"净世莲台",tag:"续航",element:"wood",desc:"无伤过关恢复佛珠并充满法力",visual:"粉金莲瓣铺满英雄脚下"},
    ring:{icon:"琢",name:"金刚琢",tag:"破盾",element:"metal",desc:"五连锁击碎全场护盾并造成震荡",visual:"白金圆环扩散并炸碎护盾"}
  };
  const specializations = {
    monkey:[
      {id:"monkeySwarm",icon:"众",name:"万象分身",tag:"分身海",desc:"五连锁额外召出三名分身，分身伤害提高",visual:"三道木色猴影同时坠场"},
      {id:"monkeyTrick",icon:"幻",name:"斗战幻术",tag:"镜像链",desc:"每两次齐射复制整条锁定链，并强化元素连携",visual:"镜像弹道从战场两侧交叉追击"}
    ],
    staff:[
      {id:"staffCrush",icon:"破",name:"破天重棒",tag:"斩首",desc:"末位重击对精英与Boss造成双倍伤害",visual:"末位目标出现贯穿天幕的巨棒"},
      {id:"staffSweep",icon:"荡",name:"扫荡乾坤",tag:"清场",desc:"四连锁必定触发全路线横扫与击退",visual:"金色巨棒横贯三路"}
    ],
    fire:[
      {id:"fireInferno",icon:"业",name:"焚天业火",tag:"灼烧",desc:"灼烧可叠两层，对Boss持续增伤",visual:"目标脚下形成持续旋转的火莲"},
      {id:"fireWild",icon:"燎",name:"燎原百爆",tag:"尸爆",desc:"爆燃范围扩大，必向周围传播余烬",visual:"击杀连续引爆橙红火球"}
    ]
  };
  const characters = [
    {id:"tang",name:"唐僧",icon:"唐",element:"fire",unlock:0,role:"梵音护持 · 主动超度并获得护盾",skill:"超度",auto:true,interval:2.7,damage:.18,target:"front"},
    {id:"wukong",name:"孙悟空",icon:"悟",element:"wood",unlock:1,role:"锁妖连击 · 主动大圣横扫",skill:"横扫",auto:true,interval:2.2,damage:.18,target:"front"},
    {id:"longma",name:"白龙马",icon:"龙",element:"metal",unlock:9,role:"龙牙补刀 · 主动穿心追击",skill:"穿心",auto:true,interval:1.8,damage:.12,target:"low"},
    {id:"bajie",name:"猪八戒",icon:"戒",element:"earth",unlock:18,role:"重耙护阵 · 主动护驾震退",skill:"护驾",auto:true,interval:3,damage:.25,target:"front"},
    {id:"wujing",name:"沙悟净",icon:"沙",element:"water",unlock:27,role:"流沙回卷 · 主动逆流清场",skill:"逆流",auto:true,interval:2.6,damage:.2,target:"fire"}
  ];
  const attackers=characters.filter(c=>c.auto);
  const selectedMain=()=>characters.find(c=>c.id===meta.mainCharacter)||characters[0];
  const sideSlots=[{x:34,y:400},{x:356,y:400},{x:34,y:515},{x:356,y:515}];
  const companionPosition=id=>{
    const index=characters.filter(c=>c.id!==state.mainCharacter).findIndex(c=>c.id===id);
    return sideSlots[Math.max(0,index)]||sideSlots[0];
  };
  const chapters = [
    {name:"第一章 · 五行山",range:"第1—9难",boss:"收服白龙马",short:"五行山",unlock:"白龙马",resist:"metal",color:"#e7f4ff",
      stages:["五行山下","揭帖救圣","虎啸山门","双叉岭口","熊山夜火","蛇盘山径","鹰愁涧前","白浪化龙","收服白龙马"]},
    {name:"第二章 · 高老庄",range:"第10—18难",boss:"收服猪八戒",short:"高老庄",unlock:"猪八戒",resist:"earth",color:"#e4b074",
      stages:["乌斯藏界","高家招婿","夜探后院","刚鬣现形","钉耙拦路","云栈洞口","月下追妖","天蓬旧梦","收服猪八戒"]},
    {name:"第三章 · 流沙河",range:"第19—27难",boss:"收服沙悟净",short:"流沙河",unlock:"沙悟净",resist:"water",color:"#6dcfff",
      stages:["黄风岭口","三昧神风","定风珠现","八百流沙","弱水无舟","河妖食经","宝杖飞旋","木叉劝戒","收服沙悟净"]},
    {name:"第四章 · 白骨岭",range:"第28—36难",boss:"三打白骨精",short:"白骨岭",resist:"wood",color:"#e7dcff",
      stages:["白骨荒村","一变村姑","饭篮藏蛆","二变老妪","哭子寻女","三变老翁","尸魔离间","悟空归队","三打白骨精"]},
    {name:"第五章 · 火云洞",range:"第37—45难",boss:"收服红孩儿",short:"火云洞",resist:"fire",color:"#ff704f",
      stages:["枯松涧口","红云掠影","圣婴索战","五行车阵","三昧真火","八戒请兵","假观音计","莲台诱敌","收服红孩儿"]},
    {name:"第六章 · 车迟国",range:"第46—54难",boss:"车迟破邪",short:"车迟国",resist:"metal",color:"#f6c857",
      stages:["智渊寺门","和尚苦役","夜盗三清","云梯显圣","隔板猜枚","求雨斗法","油锅洗垢","羊鹿虎现","车迟破邪"]},
    {name:"第七章 · 狮驼岭",range:"第55—63难",boss:"金翅鹏王",short:"狮驼岭",resist:"wood",color:"#c58aff",
      stages:["八百里尸山","小钻风巡山","阴阳二气瓶","青狮张口","白象卷鼻","群妖封城","狮驼国宴","大鹏展翅","金翅鹏王"]},
    {name:"第八章 · 火焰山",range:"第64—72难",boss:"力战牛魔王",short:"火焰山",resist:"earth",color:"#ff4058",
      stages:["火云千里","铁扇仙踪","芭蕉扇计","翠云山战","积雷山寻","玉面狐局","牛王变形","借扇熄火","力战牛魔王"]},
    {name:"第九章 · 灵山终劫",range:"第73—81难",boss:"九九归一",short:"灵山",resist:"fire",color:"#ffd15b",
      stages:["铜台府寇","凌云渡口","无底船来","雷音寺门","假经无字","燃灯点破","通天河落","八十一难","九九归一"]}
  ];
  let selectedGrowthId="wukong";
  const isUnlocked=id=>meta.highest>=(characters.find(c=>c.id===id)?.unlock||0);
  const attackCost=id=>4+meta.growth[id].attack*3;
  const healthCost=id=>4+meta.growth[id].health*4;
  const unlockedPages=()=>Math.min(9,Math.floor(meta.highest/9)+1);
  const setLobbyTab=tab=>{
    document.querySelectorAll(".lobby-view").forEach(v=>v.hidden=v.id!==`view-${tab}`);
    document.querySelectorAll("[data-lobby-tab]").forEach(b=>b.classList.toggle("active",b.dataset.lobbyTab===tab));
  };
  function setMainCharacter(next){
    if(!isUnlocked(next)||next===meta.mainCharacter)return;
    const previous=meta.mainCharacter;
    if(isUnlocked(previous)&&!meta.lineup.includes(previous))meta.lineup.push(previous);
    meta.mainCharacter=next;
    meta.lineup=meta.lineup.filter(id=>id!==next);
    saveMeta();refreshLobby();
  }
  function refreshLobby(){
    if(!isUnlocked(meta.mainCharacter))meta.mainCharacter="tang";
    scrollCount.textContent=meta.scrolls;
    growthScrollCount.textContent=meta.scrolls;
    highestStage.textContent=`${meta.highest}/81`;
    meta.selectedPage=Math.min(Math.max(1,meta.selectedPage||1),unlockedPages());
    const chapter=chapters[meta.selectedPage-1],start=(meta.selectedPage-1)*9+1;
    chapterTitle.textContent=chapter.name;chapterProgress.textContent=chapter.range;
    chapterPrev.disabled=meta.selectedPage<=1;chapterNext.disabled=meta.selectedPage>=unlockedPages();
    stageGrid.innerHTML=Array.from({length:9},(_,i)=>{
      const n=start+i,cleared=n<=meta.highest,open=i===0?start<=meta.highest+1:n<=meta.highest+1;
      return `<div class="stage-node ${i===8?"boss":""} ${cleared?"cleared":open?"current":"locked"}">
        <strong>${cleared?"✓":n}</strong><span>${chapter.stages[i]}</span>
      </div>`;
    }).join("");
    stageMainRoster.innerHTML=characters.map(c=>{
      const open=isUnlocked(c.id),active=meta.mainCharacter===c.id,el=elements[c.element];
      return `<button class="stage-main ${active?"active":""}" data-stage-main="${c.id}" style="--el:${el.color}" ${open?"":"disabled"} aria-label="${open?`选择${c.name}为主位`:`${c.name}尚未解锁`}">
        <img src="${heroArtSources[c.id]}" alt=""><span>${open?c.name:`${c.unlock}难`}</span>
      </button>`;
    }).join("");
    const nextStage=Math.min((meta.highest||0)+1,81);
    document.querySelector("#start").textContent=meta.highest>=81?"圆满已达 · 再战第 81 难":`挑战第 ${nextStage}/81 难`;
    growthRoster.innerHTML=characters.map(c=>{
      const open=isUnlocked(c.id),el=elements[c.element];
      return `<button class="character-pill ${selectedGrowthId===c.id?"selected":""}" data-growth-character="${c.id}" style="--el:${el.color}" ${open?"":"disabled"}><img src="${heroArtSources[c.id]}" alt="">${open?c.name:"未解锁"}</button>`;
    }).join("");
    renderGrowthDetail();
    partnerList.innerHTML=characters.map(c=>{
      const open=isUnlocked(c.id),el=elements[c.element],g=meta.growth[c.id];
      const isMain=meta.mainCharacter===c.id,active=isMain||meta.lineup.includes(c.id);
      return `<div class="partner-row ${open?"":"locked"} ${isMain?"is-main":""}" style="--el:${el.color}">
        <div class="partner-icon"><img src="${heroArtSources[c.id]}" alt="${c.name}"></div>
        <div><strong>${c.name}${open?` · 攻${g.attack} 体${g.health}`:""}</strong><span>${open?c.role:`打赢第 ${c.unlock} 难后加入师门`}</span></div>
        ${open?`<div class="partner-actions">
          <button class="main-toggle ${isMain?"active":""}" data-main="${c.id}" ${isMain?"disabled":""}>${isMain?"当前主位":"设为主位"}</button>
          ${isMain?"":`<button class="lineup-toggle ${active?"active":""}" data-lineup="${c.id}">${active?"已上阵":"休息"}</button>`}
        </div>`:`<em>第${c.unlock}难</em>`}
      </div>`;
    }).join("");
    saveMeta();
  }
  function renderGrowthDetail(){
    const c=characters.find(x=>x.id===selectedGrowthId)||characters[1],g=meta.growth[c.id],el=elements[c.element];
    const attackMax=g.attack>=10,healthMax=g.health>=5;
    const healthEffect=c.id==="tang"?`唐僧佛珠 +${g.health}`:`${c.name}体魄 ${g.health} · 全队每2层+1佛珠`;
    growthDetail.innerHTML=`<div class="growth-name"><strong style="color:${el.color}">${el.name} · ${c.name}</strong><em>${c.role}</em></div>
      <p class="growth-copy">经书只强化这个人物。攻伐提升其基础输出；护道提升队伍生存，唐僧护道直接增加佛珠。</p>
      <div class="growth-actions">
        <button class="scripture" data-grow="attack"><strong>攻伐经 · Lv.${g.attack}</strong><small>${c.name}基础伤害 +${g.attack*4}%</small><em>${attackMax?"已满级":`消耗 ${attackCost(c.id)} 残卷`}</em></button>
        <button class="scripture" data-grow="health"><strong>护道经 · Lv.${g.health}</strong><small>${healthEffect}</small><em>${healthMax?"已满级":`消耗 ${healthCost(c.id)} 残卷`}</em></button>
      </div>`;
    growthDetail.querySelector('[data-grow="attack"]').disabled=!isUnlocked(selectedGrowthId)||attackMax||meta.scrolls<attackCost(c.id);
    growthDetail.querySelector('[data-grow="health"]').disabled=!isUnlocked(selectedGrowthId)||healthMax||meta.scrolls<healthCost(c.id);
  }
  function buyScripture(kind){
    const g=meta.growth[selectedGrowthId],cost=kind==="attack"?attackCost(selectedGrowthId):healthCost(selectedGrowthId),max=kind==="attack"?10:5;
    if(!isUnlocked(selectedGrowthId)||g[kind]>=max||meta.scrolls<cost)return;
    meta.scrolls-=cost;g[kind]++;saveMeta();refreshLobby();
  }

  const P = (t,l,y,extra={}) => ({t,l,y,...extra});
  const baseStages = [
    {name:"山门初试",act:"东土启程",score:1,hp:1,spd:1,pack:[P("imp",0,190),P("imp",1,235),P("imp",2,190)]},
    {name:"双路疾妖",act:"东土启程",score:3,hp:1,spd:1,pack:[P("runner",0,145),P("runner",2,145),P("imp",1,205),P("imp",0,70),P("imp",2,70)]},
    {name:"铁甲拦路",act:"东土启程",score:5,hp:1,spd:1,pack:[P("armor",0,175),P("armor",2,175),P("runner",1,130),P("imp",1,45)]},
    {name:"分身迷阵",act:"东土启程",score:7,hp:1.05,spd:1.02,pack:[P("split",0,175),P("split",2,175),P("armor",1,125),P("runner",1,45)]},
    {name:"白骨夫人",act:"东土启程",score:10,hp:1.1,spd:1.03,boss:true,pack:[P("boss",1,125,{hp:13,name:"白骨夫人",color:"#e7dcff",resist:"earth"}),P("runner",0,190),P("runner",2,190)]},

    {name:"火云小卒",act:"火云洞",score:13,hp:1.2,spd:1.05,pack:[P("shaman",1,190),P("runner",0,165),P("runner",2,165),P("armor",0,75),P("armor",2,75)]},
    {name:"爆裂山道",act:"火云洞",score:16,hp:1.25,spd:1.06,pack:[P("bomber",0,185),P("bomber",2,185),P("runner",1,150),P("imp",0,70),P("imp",2,70)]},
    {name:"妖术护阵",act:"火云洞",score:19,hp:1.3,spd:1.06,modifier:"妖术护盾",pack:[P("healer",1,205),P("armor",0,175),P("armor",2,175),P("shaman",1,75)]},
    {name:"火线夹击",act:"火云洞",score:22,hp:1.35,spd:1.08,pack:[P("runner",0,205),P("runner",2,205),P("bomber",1,175),P("split",0,90),P("split",2,90),P("armor",1,45)]},
    {name:"红孩儿",act:"火云洞",score:26,hp:1.4,spd:1.08,boss:true,pack:[P("boss",1,115,{hp:20,name:"红孩儿",color:"#ff704f",resist:"fire"}),P("bomber",0,190),P("bomber",2,190),P("shaman",1,45)]},

    {name:"狮驼前哨",act:"狮驼岭",score:30,hp:1.5,spd:1.1,modifier:"全员护盾",shield:1,pack:[P("imp",0,210),P("armor",1,210),P("imp",2,210),P("runner",0,105),P("runner",2,105),P("healer",1,55)]},
    {name:"金角援军",act:"狮驼岭",score:34,hp:1.58,spd:1.1,pack:[P("healer",0,205),P("healer",2,205),P("armor",1,185),P("shaman",0,95),P("shaman",2,95),P("runner",1,45)]},
    {name:"精英混阵",act:"狮驼岭",score:38,hp:1.65,spd:1.12,modifier:"精英强化",pack:[P("armor",0,205,{elite:true}),P("split",1,205,{elite:true}),P("armor",2,205,{elite:true}),P("runner",0,85),P("runner",2,85)]},
    {name:"群妖回春",act:"狮驼岭",score:42,hp:1.72,spd:1.12,modifier:"持续恢复",regen:true,pack:[P("healer",1,220),P("split",0,190),P("split",2,190),P("armor",0,80),P("armor",2,80),P("bomber",1,45)]},
    {name:"金角银角",act:"狮驼岭",score:48,hp:1.8,spd:1.13,boss:true,pack:[P("boss",0,135,{hp:16,name:"金角大王",color:"#f6c857",resist:"metal"}),P("boss",2,135,{hp:16,name:"银角大王",color:"#d8e7ff",resist:"water"}),P("healer",1,210),P("runner",1,60)]},

    {name:"火焰山口",act:"终局西行",score:55,hp:1.9,spd:1.16,modifier:"疾行",pack:[P("runner",0,220,{elite:true}),P("runner",2,220,{elite:true}),P("bomber",1,190),P("armor",0,90),P("armor",2,90),P("shaman",1,45)]},
    {name:"十妖压境",act:"终局西行",score:62,hp:2,spd:1.18,pack:[P("imp",0,230),P("imp",1,250),P("imp",2,230),P("runner",0,160),P("runner",2,160),P("armor",1,145),P("split",0,70),P("split",2,70),P("healer",1,35)]},
    {name:"无间分裂",act:"终局西行",score:70,hp:2.15,spd:1.18,modifier:"分裂增殖",pack:[P("split",0,225,{elite:true}),P("split",1,245,{elite:true}),P("split",2,225,{elite:true}),P("healer",0,90),P("healer",2,90),P("bomber",1,45)]},
    {name:"牛魔先锋",act:"终局西行",score:80,hp:2.3,spd:1.2,modifier:"精英护盾",shield:1,pack:[P("armor",0,225,{elite:true}),P("armor",2,225,{elite:true}),P("bomber",1,205,{elite:true}),P("shaman",0,105),P("shaman",2,105),P("runner",1,45,{elite:true})]},
    {name:"牛魔王",act:"终局西行",score:100,hp:2.5,spd:1.22,boss:true,modifier:"三阶段首领",pack:[P("boss",1,120,{hp:42,name:"牛魔王",color:"#ff4058",phases:3,resist:"earth"}),P("armor",0,205,{elite:true}),P("armor",2,205,{elite:true}),P("healer",1,55)]}
  ];

  const regularTemplates=baseStages.filter(s=>!s.boss).slice(0,8);
  const stages=Array.from({length:81},(_,index)=>{
    const chapterIndex=Math.floor(index/9),local=index%9+1,chapter=chapters[chapterIndex];
    const hp=+(1+chapterIndex*.3+(local-1)*.055).toFixed(2);
    const spd=+(1+Math.min(.34,chapterIndex*.035+(local-1)*.007)).toFixed(2);
    if(local===9){
      return {
        name:chapter.stages[8],act:chapter.name,score:Math.round(1+index*1.7),hp,spd,boss:true,bossResist:chapter.resist,
        modifier:chapter.unlock?`剧情收服 · ${chapter.unlock}`:"章节首领",
        pack:[
          P(chapterIndex%2?"bomber":"runner",0,205,{elite:chapterIndex>=4}),
          P(chapterIndex%3?"armor":"healer",2,205,{elite:chapterIndex>=5}),
          P("shaman",chapterIndex%2?2:0,65)
        ]
      };
    }
    const template=regularTemplates[(local-1)%regularTemplates.length];
    return {
      ...template,
      name:chapter.stages[local-1],act:chapter.name,
      score:Math.round(1+index*1.7),hp,spd,boss:true,bossResist:chapter.resist,
      modifier:local===4?"五行抗性":local===7?"精英压境":template.modifier,
      shield:local>=7&&chapterIndex>=2?1:(template.shield||0),
      pack:template.pack.map(entry=>({...entry,elite:entry.elite||(local===7&&chapterIndex>=3)}))
    };
  });
  const specs = {
    imp:{r:15,hp:1,speed:34,color:"#72dcff"},
    runner:{r:13,hp:1,speed:60,color:"#ff6575"},
    armor:{r:19,hp:3,speed:25,color:"#ffd45f",shield:1},
    split:{r:17,hp:2,speed:30,color:"#c58aff"},
    shaman:{r:16,hp:2,speed:29,color:"#52e8c1"},
    healer:{r:17,hp:3,speed:26,color:"#86ef8f"},
    bomber:{r:16,hp:2,speed:42,color:"#ff914d",missDamage:2},
    boss:{r:31,hp:18,speed:18,color:"#ff4968",missDamage:3}
  };

  let nextId = 1;
  const state = {
    mode:"intro", stage:0, maxStage:81, page:1, pageStart:1, pageEnd:9, masterHp:6, maxMasterHp:6, kills:0,
    charges:5, maxCharges:5, recharge:.82, selecting:false, pointer:{x:195,y:350},
    path:[], locked:[], enemies:[], hazards:[], arcs:[], rings:[], sparks:[], sweeps:[], elementFx:[],
    flameTrails:[], cloneJumps:[], windWaves:[], lightnings:[], vortices:[], petals:[],
    stageClock:0, toast:"", toastClock:0, leaksThisStage:0, seed:20260731,
    offered:[], rewardType:"", levels:{}, mainSchool:"", schoolPoints:0,
    evolutionStage:0, evolutions:[], relics:[], specialization:"", shake:0, volleyCount:0,
    stageStartHp:6, currentStage:null,wave:0,wavesTotal:0,bossSpawned:false,mainCharacter:"tang",attackMult:1,runCompanions:[],companionTimers:{},earnedScrolls:0,rewardQueue:[],
    runLevel:1,xp:0,xpNeed:3,pendingLevelUps:0,
    masterX:195,movingMaster:false,masterStill:0,masterShield:0,skillCooldown:0,skillMax:12,
    wuxingMult:1,wuxing:{pow:{fire:0,metal:0,wood:0,water:0,earth:0},total:0,tier:0},wuxingLeakUsed:false,
    focusOwner:"wukong",ownerPicks:{tang:0,wukong:0,longma:0,bajie:0,wujing:0},companionShots:{},
    stats:{enemyDefeats:0,correctFocuses:0,minDoor:6,volleys:0,maxChain:0,targetsLocked:0,buildPicks:0,relicPicks:0,stagesCleared:0,elementCombos:0}
  };

  const level = id => state.levels[id] || 0;
  const ownsRelic = id => state.relics.includes(id);
  const hasSpec = id => state.specialization===id;
  const rand = () => {
    state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
    return state.seed / 4294967296;
  };
  const shuffle = arr => {
    const out = arr.slice();
    for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
    return out;
  };
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const toast = (t,d=2.4) => {state.toast=t;state.toastClock=d};
  const roundRect = (x,y,w,h,r,fill,stroke) => {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);
    if(fill){ctx.fillStyle=fill;ctx.fill()}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}
  };
  const burst = (x,y,color,n=10) => {
    for(let i=0;i<n;i++)state.sparks.push({x,y,vx:(Math.random()-.5)*135,vy:(Math.random()-.72)*125,life:.45+Math.random()*.5,color,size:2+Math.random()*3});
  };
  const ring = (x,y,color,r=20) => state.rings.push({x,y,color,r,life:.44});

  function reset(){
    nextId=1;
    const target=Math.min((meta.highest||0)+1,81),page=Math.min(1+Math.floor((target-1)/9),unlockedPages()),pageStart=(page-1)*9+1,pageEnd=pageStart+8;
    const carryWx=meta.wuxing&&meta.wuxing.total!==undefined?meta.wuxing:{pow:{fire:0,metal:0,wood:0,water:0,earth:0},total:0,tier:0};
    const main=selectedMain(),mainId=main.id;
    const supportHealth=characterIds.filter(id=>id!==mainId&&meta.lineup.includes(id)&&isUnlocked(id)).reduce((sum,id)=>sum+meta.growth[id].health,0);
    const startHp=6+meta.growth[mainId].health+Math.floor(supportHealth/2);
    const available=attackers.filter(c=>c.id!==mainId&&isUnlocked(c.id)&&meta.lineup.includes(c.id));
    Object.assign(state,{
      mode:"play",stage:target-1,maxStage:81,page,pageStart,pageEnd,masterHp:startHp,maxMasterHp:startHp,kills:0,charges:5,maxCharges:5,recharge:.82,
      selecting:false,pointer:{x:195,y:350},path:[],locked:[],enemies:[],hazards:[],arcs:[],rings:[],sparks:[],sweeps:[],elementFx:[],
      flameTrails:[],cloneJumps:[],windWaves:[],lightnings:[],vortices:[],petals:[],
      stageClock:.55,toast:`${main.name}主位 · 上半屏划线点妖 · 底部拖动闪避`,toastClock:4.5,leaksThisStage:0,seed:20260731,
      offered:[],rewardType:"",levels:{},mainSchool:"",schoolPoints:0,evolutionStage:0,evolutions:[],relics:[],specialization:"",
      shake:0,volleyCount:0,stageStartHp:startHp,currentStage:null,wave:0,wavesTotal:0,bossSpawned:false,mainCharacter:mainId,attackMult:1+meta.growth[mainId].attack*.04,
      runCompanions:available.map(c=>c.id),companionTimers:Object.fromEntries(available.map((c,i)=>[c.id,.55+i*.2])),earnedScrolls:0,rewardQueue:[],pendingFinish:false,
      runLevel:1,xp:0,xpNeed:3,pendingLevelUps:0,
      masterX:195,movingMaster:false,masterStill:0,masterShield:0,skillCooldown:0,skillMax:12,
      wuxingMult:carryWx.tier>=2?1.4:carryWx.tier>=1?1.15:1,wuxing:{pow:{...carryWx.pow},total:carryWx.total,tier:carryWx.tier},wuxingLeakUsed:false,
      focusOwner:mainId,ownerPicks:{tang:0,wukong:0,longma:0,bajie:0,wujing:0},companionShots:{},
      stats:{enemyDefeats:0,correctFocuses:0,minDoor:6,volleys:0,maxChain:0,targetsLocked:0,buildPicks:0,relicPicks:0,stagesCleared:0,elementCombos:0}
    });
    result.hidden=true;buildOverlay.hidden=true;
    pauseOverlay.hidden=true;pauseButton.hidden=false;skillButton.hidden=false;
  }

  function addEnemy(entry,cfg,waveMult=1){
    const s=specs[entry.t];
    const hpBase=entry.hp ?? s.hp;
    const elite=!!entry.elite;
    const maxHp=Math.max(1,Math.ceil(hpBase*(entry.hp?1:cfg.hp)*(elite?1.45:1)*waveMult));
    const shield=(s.shield||0)+(cfg.shield||0)+(elite?1:0);
    state.enemies.push({
      id:nextId++,type:entry.t,name:entry.name||entry.t,x:lanes[entry.l],y:entry.y,
      r:s.r+(elite?3:0),hp:maxHp,maxHp,speed:s.speed*cfg.spd*(elite?1.07:1),
      color:entry.color||s.color,locked:false,lockOrder:0,hit:0,alive:true,burn:0,burnClock:0,
      shield,healClock:2.8+rand(),abilityClock:3.2+rand(),regenClock:2.5,
      missDamage:entry.missDamage||s.missDamage||1,elite,phases:entry.phases||0,phase:0,
      resist:entry.resist||typeResist[entry.t]||null,lastElement:null,lastElementSource:null,elementClock:0
    });
  }

  function spawnStage(n){
    const cfg=stages[n-1];
    state.stage=n;state.currentStage=cfg;state.charges=state.maxCharges;state.leaksThisStage=0;state.wuxingLeakUsed=false;state.stageStartHp=state.masterHp;
    state.wave=1;state.wavesTotal=Math.max(2,Math.min(5,1+Math.floor((n-1)/4.5)));state.bossSpawned=false;
    spawnWave(1);
  }

  function spawnWave(w){
    const cfg=state.currentStage;
    cfg.pack.forEach(entry=>addEnemy(entry,cfg,1+(w-1)*.15));
    const seenResists=[...new Set(state.enemies.map(e=>e.resist).filter(Boolean))];
    const resistText=seenResists.length?` · ${seenResists.map(id=>elements[id].name).join("")}抗`:"";
    toast(`第 ${state.stage}/81 难 · ${cfg.name}${resistText} · 第 ${w}/${state.wavesTotal} 波`,2.6);
  }

  function spawnBoss(){
    const cfg=state.currentStage,local=state.stage-state.pageStart+1,chapter=chapters[state.page-1],chapterIndex=state.page-1;
    const bossResist=cfg.bossResist||chapter.resist;
    const entry=local===9
      ?P("boss",1,112,{hp:14+chapterIndex*7,name:cfg.name,color:chapter.color,resist:bossResist,phases:chapterIndex>=7?3:0,missDamage:3})
      :P("boss",1,118,{hp:3+chapterIndex*3+Math.floor(local/2),name:cfg.name,color:chapter.color,resist:bossResist,missDamage:2});
    addEnemy(entry,cfg);
    toast(`妖王现世：${entry.name} · ${elements[bossResist].name}抗`,3);
    burst(195,240,chapter.color,32);state.shake=Math.max(state.shake,10);
  }

  function nextStagePreview(){
    const n=state.stage;
    if(n>state.pageEnd||!stages[n-1])return null;
    const cfg=stages[n-1];
    const tally={metal:0,wood:0,water:0,fire:0,earth:0};
    const types=[];
    for(const entry of cfg.pack){
      const resist=entry.resist||typeResist[entry.t]||null;
      const val=(entry.elite?2:1);
      types.push({t:entry.t,name:entry.name||entry.t,resist,elite:!!entry.elite,boss:false});
      if(!resist)continue;
      for(const el of Object.keys(overcomes))if(overcomes[el]===resist)tally[el]+=val;
      if(tally[resist]!==undefined)tally[resist]-=val*.5;
    }
    if(cfg.bossResist){
      for(const el of Object.keys(overcomes))if(overcomes[el]===cfg.bossResist)tally[el]+=3;
      tally[cfg.bossResist]-=1.5;
      types.push({t:"boss",name:cfg.name,resist:cfg.bossResist,elite:false,boss:true});
    }
    return {name:cfg.name,act:cfg.act,types,tally};
  }

  function wuxingWeightedPick(tally,exclude=[]){
    const pool=wuxingCards.filter(id=>level(id)<cards[id].max&&!exclude.includes(id));
    if(!pool.length)return null;
    const hasNeed=Object.values(tally||{}).some(v=>v>0);
    if(!hasNeed)return shuffle(pool)[0];
    const weights=pool.map(id=>{
      const el=cards[id].element;
      return el&&tally[el]?Math.max(.25,tally[el]):1;
    });
    const total=weights.reduce((a,b)=>a+b,0);
    let r=rand()*total;
    for(let i=0;i<pool.length;i++){r-=weights[i];if(r<=0)return pool[i]}
    return pool[pool.length-1];
  }

  function pickUniversalSlot(tally,exclude=[]){
    const treasures=(meta.treasures||[]).filter(id=>!state.relics.includes(id)&&!exclude.includes(id));
    if(!treasures.length)return wuxingWeightedPick(tally,exclude);
    const wuxPool=wuxingCards.filter(id=>level(id)<cards[id].max&&!exclude.includes(id));
    if(!wuxPool.length)return treasures[Math.floor(rand()*treasures.length)];
    const items=treasures.map(id=>({id,weight:2}));
    const hasNeed=Object.values(tally||{}).some(v=>v>0);
    if(hasNeed){
      for(const id of wuxPool){
        const el=cards[id].element;
        items.push({id,weight:el&&tally[el]?Math.max(.25,tally[el]):1});
      }
    }else wuxPool.forEach(id=>items.push({id,weight:1}));
    const total=items.reduce((a,b)=>a+b.weight,0);
    let r=rand()*total;
    for(const it of items){r-=it.weight;if(r<=0)return it.id}
    return items[items.length-1].id;
  }

  function cardChoices(){
    if(state.mainCharacter==="wukong"&&!state.mainSchool)return roots.slice();
    if(state.mainCharacter!=="wukong"&&state.stats.buildPicks===0){
      return shuffle(characterCardPools[state.mainCharacter]||[]).slice(0,3);
    }
    const activeOwners=[...new Set([state.mainCharacter,...state.runCompanions])];
    const availableFor=owner=>{
      const pool=owner==="wukong"&&state.mainSchool?[...schoolCards[state.mainSchool],...characterCardPools.wukong]:(characterCardPools[owner]||[]);
      return shuffle(pool.filter(id=>level(id)<cards[id].max));
    };
    const focus=activeOwners.includes(state.focusOwner)?state.focusOwner:state.mainCharacter;
    const choices=[];
    const focusCard=availableFor(focus)[0];if(focusCard)choices.push(focusCard);
    const otherOwners=shuffle(activeOwners.filter(id=>id!==focus&&availableFor(id).length));
    if(otherOwners.length){
      const otherCard=availableFor(otherOwners[0]).find(id=>!choices.includes(id));
      if(otherCard)choices.push(otherCard);
    }
    const globalCard=pickUniversalSlot(nextStagePreview()?.tally,choices);
    if(globalCard)choices.push(globalCard);
    if(choices.length<3){
      const rest=shuffle(activeOwners.flatMap(availableFor).filter(id=>!choices.includes(id)));
      choices.push(...rest.slice(0,3-choices.length));
    }
    return choices.slice(0,3);
  }

  function treasureChoices(){
    return shuffle(Object.keys(relics).filter(id=>!meta.treasures.includes(id))).slice(0,3);
  }

  function fusionName(){
    if(state.mainSchool==="monkey"&&ownsRelic("mirror"))return "真假猴王";
    if(state.mainSchool==="monkey"&&ownsRelic("fan"))return "筋斗猴阵";
    if(state.mainSchool==="staff"&&ownsRelic("bell"))return "雷霆神针";
    if(state.mainSchool==="staff"&&ownsRelic("ring"))return "金刚神棒";
    if(state.mainSchool==="fire"&&ownsRelic("fan"))return "火借风势";
    if(state.mainSchool==="fire"&&ownsRelic("gourd"))return "炼妖葫芦";
    return "";
  }

  function renderOwned(){
    const owned=Object.keys(cards).filter(id=>level(id)>0);
    const currentSpec=Object.values(specializations).flat().find(s=>s.id===state.specialization);
    const chips=[
      ...owned.map(id=>{
        const p=cards[id],el=p.element||(schoolMeta[p.school]?.element),owner=cardOwner(id);
        return `<span class="chip ${el?"element-chip":""}"${el?` style="--el:${elements[el].color}"`:""}>${ownerMeta[owner].icon} ${el?`${elements[el].name} · `:""}${p.name} ${level(id)}</span>`;
      }),
      ...state.relics.map(id=>`<span class="chip element-chip" style="--el:${elements[relics[id].element].color}">${elements[relics[id].element].name} · ${relics[id].name}</span>`),
      ...(currentSpec?[`<span class="chip" style="border-color:${schoolMeta[state.mainSchool].color};color:${schoolMeta[state.mainSchool].color}">专精 · ${currentSpec.name}</span>`]:[])
    ];
    currentBuild.innerHTML=chips.length?chips.join(""):`<span class="chip">尚未获得神通</span>`;
  }

  function showPowerReward(){
    state.mode="build";state.rewardType="power";state.offered=cardChoices();
    pauseButton.hidden=true;skillButton.hidden=true;
    buildEyebrow.textContent=`修为升级 · Lv.${state.runLevel}`;
    const main=characters.find(c=>c.id===state.mainCharacter)||characters[0];
    document.querySelector("#build-title").textContent=state.stats.buildPicks?"升级获得一个新词条":`${main.name}主位 · 选择本命词条`;
    buildCards.innerHTML=state.offered.map(id=>{
      if(!cards[id]&&relics[id]){
        const r=relics[id],el=r.element;
        return `<button class="build-card" data-treasure="${id}" style="--el:${elements[el].color}">
          <span class="element-pill">${elements[el].name}</span>
          <span><strong>${r.name}</strong><small>${r.desc}</small><span class="visual">表现：${r.visual}</span></span>
          <em>${elements[el].name} · 法宝 · ${r.tag}</em>
        </button>`;
      }
      const p=cards[id],next=level(id)+1,el=p.element||(schoolMeta[p.school]?.element),owner=cardOwner(id),ownerInfo=ownerMeta[owner];
      return `<button class="build-card school-${p.school}" data-power="${id}" data-school="${p.school}" style="--owner:${ownerInfo.color};${el?`--el:${elements[el].color}`:""}">
        <span class="${el?"element-pill":"icon"}">${el?elements[el].name:p.icon}</span>
        <span><span class="owner-badge">${ownerInfo.icon} · ${ownerInfo.name}</span><strong>${p.name}${p.root?"":` · ${next}层`}</strong><small>${p.desc(next)}</small><span class="visual">表现：${p.visual}</span></span>
        <em>${el?`${elements[el].name} · `:""}${p.tag}</em>
      </button>`;
    }).join("");
    const preview=nextStagePreview();
    const previewEl=document.querySelector("#build-preview");
    if(previewEl){
      if(preview){
        const top=Object.entries(preview.tally).filter(([k,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,2);
        const rec=top.length?`<div class="preview-row">克制推荐：${top.map(([el])=>`<span class="chip element-chip" style="--el:${elements[el].color}">${elements[el].name}伤克制</span>`).join("")}</div>`:"";
        const types=preview.types.map(t=>{const nm=typeNames[t.name]||t.name;return `<span class="chip">${t.elite?"精英·":""}${t.boss?"首领·":""}${nm}${t.resist?` · ${elements[t.resist].name}抗`:""}</span>`}).join("");
        previewEl.innerHTML=`<div class="preview-row"><span class="preview-label">下一关 ${preview.name}${preview.act?` · ${preview.act}`:""}</span></div><div class="preview-row">${types}</div>${rec}`;
        previewEl.hidden=false;
      }else previewEl.hidden=true;
    }
    renderOwned();
    if(state.mainSchool){
      const meta=schoolMeta[state.mainSchool];
      const next=state.evolutionStage===0?`再选 ${Math.max(0,3-state.schoolPoints)} 次本流派 → ${meta.stages[0]}`:
        state.evolutionStage===1?`再选 ${Math.max(0,5-state.schoolPoints)} 次本流派 → ${meta.stages[1]}`:
        state.evolutionStage===2?`再选 ${Math.max(0,8-state.schoolPoints)} 次本流派 → ${meta.stages[2]}`:
        `神话觉醒：${meta.stages[2]}`;
      const focusText=ownerMeta[state.focusOwner]?`当前主修：${ownerMeta[state.focusOwner].name} · `:"";
      synergyHint.textContent=focusText+(fusionName()?`${next} · 融合：${fusionName()}`:next);
    }else synergyHint.textContent=`${main.name}专属词条优先出现；其余卡位来自已上阵伙伴`;
    buildOverlay.hidden=false;
  }

  function showTreasureReward(){
    state.mode="build";state.rewardType="treasure";state.offered=treasureChoices();
    pauseButton.hidden=true;skillButton.hidden=true;
    buildEyebrow.textContent="妖王法宝 · 三选一";
    document.querySelector("#build-title").textContent="降服妖王 · 得一件法宝";
    buildCards.innerHTML=state.offered.map(id=>{
      const r=relics[id],el=r.element;
      return `<button class="build-card" data-treasure="${id}" style="--el:${elements[el].color}">
        <span class="element-pill">${elements[el].name}</span>
        <span><strong>${r.name}</strong><small>${r.desc}</small><span class="visual">表现：${r.visual}</span></span>
        <em>${elements[el].name} · ${r.tag}</em>
      </button>`;
    }).join("");
    renderOwned();
    synergyHint.textContent="法宝永久解锁 · 已解锁法宝会出现在后续词条池";
    buildOverlay.hidden=false;
  }

  function showSpecializationReward(){
    const choices=specializations[state.mainSchool]||[];
    state.mode="build";state.rewardType="spec";state.offered=choices.map(s=>s.id);
    pauseButton.hidden=true;skillButton.hidden=true;
    buildEyebrow.textContent="本章第五难突破 · 路线定型";
    document.querySelector("#build-title").textContent="选择终极专精";
    buildCards.innerHTML=choices.map(s=>`<button class="build-card school-${state.mainSchool}" data-spec="${s.id}" data-school="${state.mainSchool}">
      <span class="icon">${s.icon}</span>
      <span><strong>${s.name}</strong><small>${s.desc}</small><span class="visual">表现：${s.visual}</span></span>
      <em>${s.tag}</em>
    </button>`).join("");
    renderOwned();
    synergyHint.textContent="专精不可更换：一条强化单体/持续，一条强化群体/连锁";
    buildOverlay.hidden=false;
  }

  function checkEvolution(){
    if(!state.mainSchool)return;
    const meta=schoolMeta[state.mainSchool];
    let target=state.schoolPoints>=8?3:state.schoolPoints>=5?2:state.schoolPoints>=3?1:0;
    if(target>state.evolutionStage){
      state.evolutionStage=target;state.evolutions=meta.stages.slice(0,target);
      state.shake=target===3?20:target===2?15:10;
      toast(`${target===3?"神话觉醒":target===2?"终极进化":"神通质变"}：${meta.stages[target-1]}！`,3.3);
      burst(195,650,meta.color,35+target*10);
    }
  }

  function choosePower(id){
    if(state.rewardType!=="power"||!state.offered.includes(id)||!cards[id])return;
    const p=cards[id];state.levels[id]=level(id)+1;state.stats.buildPicks++;
    const owner=cardOwner(id);
    if(owner!=="all"){state.focusOwner=owner;state.ownerPicks[owner]=(state.ownerPicks[owner]||0)+1}
    if(p.root){state.mainSchool=p.school;state.schoolPoints=1}
    else if(p.school===state.mainSchool)state.schoolPoints++;
    if(id==="transform")state.maxCharges=5+level("transform");
    if(id==="cloud")state.recharge=.82*(1+.25*level("cloud"));
    if(id==="longmaRapid"&&state.mainCharacter==="longma")state.recharge=.82*(1+level("longmaRapid")*.2);
    if(id==="peach"){
      state.maxMasterHp+=1;
      state.masterHp=Math.min(state.maxMasterHp,state.masterHp+level("peach")+1);
      for(let i=0;i<16;i++)state.petals.push({x:195+(Math.random()-.5)*150,y:650-Math.random()*90,life:1+Math.random(),vx:(Math.random()-.5)*24});
    }
    state.charges=state.maxCharges;checkEvolution();resumeAfterReward();
  }

  function chooseTreasure(id){
    if(!state.offered.includes(id)||!relics[id])return;
    const fresh=!meta.treasures.includes(id);
    if(fresh)meta.treasures.push(id);
    if(!state.relics.includes(id))state.relics.push(id);
    state.stats.relicPicks++;saveMeta();
    burst(195,650,elements[relics[id].element].color,30);
    toast(fresh?`降服妖王 · 得法宝「${relics[id].name}」· 永久解锁${fusionName()?` · 融合「${fusionName()}」`:""}`:`法宝入手：「${relics[id].name}」${fusionName()?` · 融合「${fusionName()}」`:""}`,3);
    resumeAfterReward();
  }

  function chooseSpecialization(id){
    const spec=(specializations[state.mainSchool]||[]).find(s=>s.id===id);
    if(state.rewardType!=="spec"||!state.offered.includes(id)||!spec)return;
    state.specialization=id;state.stats.buildPicks++;state.shake=18;
    toast(`终极专精：${spec.name}！`,3.2);burst(195,650,schoolMeta[state.mainSchool].color,55);
    resumeAfterReward();
  }

  function resumeAfterReward(){
    const completedType=state.rewardType;
    buildOverlay.hidden=true;
    if(state.rewardQueue.length){showNextReward();return}
    if(state.pendingFinish){state.pendingFinish=false;finish(true);return}
    state.mode="play";state.stageClock=completedType==="power"?0:.75;
    if(completedType!=="power")state.charges=state.maxCharges;
    pauseButton.hidden=false;skillButton.hidden=false;
  }

  function showNextReward(){
    const next=state.rewardQueue.shift();
    if(next==="power")showPowerReward();
    else if(next==="treasure")showTreasureReward();
    else if(next==="spec")showSpecializationReward();
    else{state.mode="play";state.stageClock=.75;pauseButton.hidden=false;skillButton.hidden=false}
  }

  function pauseGame(){
    if(state.mode!=="play")return;
    state.mode="paused";pauseButton.hidden=true;skillButton.hidden=true;pauseOverlay.hidden=false;
  }

  function resumeGame(){
    if(state.mode!=="paused")return;
    state.mode="play";pauseOverlay.hidden=true;pauseButton.hidden=false;skillButton.hidden=false;
  }

  function castSutra(){
    if(state.mode!=="play"||state.skillCooldown>0)return;
    const mainId=state.mainCharacter,main=characters.find(c=>c.id===mainId)||characters[0];
    if(mainId==="tang"&&level("silentVow")){toast("闭口禅：主动诵经已封印",1.8);return}
    const cooldown=mainId==="tang"?Math.max(4,state.skillMax*(1-level("pureMind")*.15)):state.skillMax;
    state.skillCooldown=cooldown;
    const growthMult=1+meta.growth[mainId].attack*.04,alive=state.enemies.filter(e=>e.alive);
    if(mainId==="tang"){
      state.masterShield=Math.min(6,state.masterShield+1+level("kasaya"));
      state.rings.push({x:state.masterX,y:650,color:C.gold,r:24,life:.9});
      state.rings.push({x:state.masterX,y:650,color:C.jade,r:42,life:1.1});
      alive.forEach(e=>{e.y=Math.max(108,e.y-26-level("kasaya")*5);damage(e,1+Math.floor(state.runLevel/5),C.gold,"sutra","fire",growthMult*(1+level("sutraAttack")*.25))});
      toast(`超度诵经 · 袈裟护盾 ${state.masterShield}`,2.2);
    }else if(mainId==="wukong"){
      state.sweeps.push({x1:26,y1:650,x2:364,y2:300,life:.65,width:15});
      alive.forEach(e=>{e.y=Math.max(108,e.y-22);damage(e,2+Math.floor(state.runLevel/6),C.purple,"wukong-main","wood",growthMult)});
      toast("大圣横扫 · 全场木伤击退",2.2);
    }else if(mainId==="longma"){
      alive.sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp).slice(0,5).forEach((e,i)=>{
        state.arcs.push({x1:state.masterX,y1:655,x2:e.x,y2:e.y,life:.46,delay:i*.06,color:elements.metal.color});
        damage(e,3+(e.hp/e.maxHp<.3?2:0),elements.metal.color,"longma-main","metal",growthMult);
      });
      toast("龙牙穿心 · 追斩五名残血妖",2.2);
    }else if(mainId==="bajie"){
      state.masterShield=Math.min(6,state.masterShield+2);
      alive.sort((a,b)=>b.y-a.y).slice(0,6).forEach(e=>{e.y=Math.max(108,e.y-34);damage(e,2,elements.earth.color,"bajie-main","earth",growthMult)});
      state.sweeps.push({x1:35,y1:675,x2:355,y2:480,life:.6,width:17});
      toast(`天蓬护驾 · 震退前排 · 盾×${state.masterShield}`,2.2);
    }else{
      alive.forEach(e=>{e.y=Math.max(108,e.y-58);damage(e,1.5+Math.floor(state.runLevel/8),elements.water.color,"wujing-main","water",growthMult)});
      state.windWaves.push({y:480,life:.9,width:14});
      toast("流沙逆卷 · 全场水伤大击退",2.2);
    }
    burst(state.masterX,650,elements[main.element].color,28);state.shake=10;
  }

  function hitMaster(amount,label="妖术命中"){
    let remaining=amount;
    if(state.masterShield>0){
      const blocked=Math.min(state.masterShield,remaining);
      state.masterShield-=blocked;remaining-=blocked;
      ring(state.masterX,650,C.gold,30);burst(state.masterX,650,C.gold,12);
    }
    if(remaining>0)state.masterHp=Math.max(0,state.masterHp-remaining);
    state.stats.minDoor=Math.min(state.stats.minDoor,state.masterHp);
    toast(remaining>0?`${label} · 佛珠 -${remaining}`:"锦襕袈裟挡下伤害！",1.8);
    if(state.masterHp<=0)finish(false);
  }

  function launchHazard(source,color=C.purple,damage=1){
    const tx=state.masterX,ty=654,dx=tx-source.x,dy=ty-source.y,len=Math.max(1,Math.hypot(dx,dy)),speed=118;
    state.hazards.push({x:source.x,y:source.y,vx:dx/len*speed,vy:dy/len*speed,r:8,damage,color,life:5});
  }

  function lockNearby(){
    if(!state.selecting||state.charges<1)return;
    const radiusBonus=level("chainMaster")*8+level("transform")*4;
    for(const e of state.enemies){
      if(!e.alive||e.locked)continue;
      if(Math.hypot(e.x-state.pointer.x,e.y-state.pointer.y)<=e.r+25+radiusBonus){
        if(state.locked.length>=state.maxCharges||state.charges<1)break;
        e.locked=true;e.lockOrder=state.locked.length+1;state.locked.push(e.id);
        state.charges-=1;state.stats.targetsLocked++;burst(e.x,e.y,C.gold,7);
      }
    }
  }

  function elementMultiplier(attack,resist){
    if(!attack||attack==="neutral"||!resist)return 1;
    if(attack===resist)return .55;
    if(overcomes[attack]===resist)return 1.5;
    return 1;
  }

  function wuxingGain(amount,el){
    const mult=1+level("wuxingFlow")*.25;
    if(el&&state.wuxing.pow[el]!==undefined)state.wuxing.pow[el]+=amount*mult;
    state.wuxing.total+=amount*mult;
    wuxingCheck();
    meta.wuxing={pow:{...state.wuxing.pow},total:state.wuxing.total,tier:state.wuxing.tier};
  }
  function topWuxingEl(){
    const entries=Object.entries(state.wuxing.pow);
    if(!entries.length)return "metal";
    entries.sort((a,b)=>b[1]-a[1]);
    return entries[0][0];
  }
  function wuxingBonusFor(resist){
    const held=[];
    if(level("metalAura"))held.push({el:"metal",amt:level("metalAura")});
    if(level("woodVine"))held.push({el:"wood",amt:level("woodVine")});
    if(level("waterPulse"))held.push({el:"water",amt:1+Math.floor(level("waterPulse")/2)});
    if(level("fireForge"))held.push({el:"fire",amt:level("fireForge")});
    if(state.wuxing.tier>=2)held.push({el:topWuxingEl(),amt:1});
    if(!held.length)return null;
    if(resist){const counter=held.find(x=>overcomes[x.el]===resist);if(counter)return counter}
    held.sort((a,b)=>b.amt-a.amt);
    return held[0];
  }
  function wuxingCheck(){
    const t=state.wuxing.total;
    const target=t>=70?3:t>=45?2:t>=20?1:0;
    if(target>state.wuxing.tier){
      state.wuxing.tier=target;
      state.wuxingMult=target>=2?1.4:1.15;
      const names={1:"五行流转",2:"五行大成",3:"阴阳相济"};
      toast(`五行之成 · ${names[target]}！${target===3?"连携+1 · 每难免一次漏怪":target===2?"全队伤害 +40%":"全队伤害 +15%"}`,3.2);
      burst(195,650,target===3?C.purple:C.gold,45+target*8);
      state.shake=Math.max(state.shake,target*6);
    }
  }

  function damage(e,amount,color=C.gold,cause="hit",attackElement="neutral",sourceMult=state.attackMult,skipElement=false){
    if(!e||!e.alive||amount<=0)return 0;
    amount*=sourceMult||1;
    amount*=state.wuxingMult||1;
    if(level("stillMind")&&state.masterStill>=2)amount*=1+level("stillMind")*.2;
    if(level("silentVow"))amount*=1.6;
    if(!String(cause).startsWith("wuxing-")){
      if(level("fireBurst")&&e.shield>0){e.shield=Math.max(0,e.shield-level("fireBurst"));burst(e.x,e.y,C.orange,7)}
      if(e.type==="shaman"&&level("earthShatter"))e.shield=Math.max(0,e.shield-level("earthShatter"));
    }
    if(e.shield>0){
      const broken=Math.min(e.shield,Math.ceil(amount));e.shield-=broken;amount=Math.max(0,amount-broken);
      burst(e.x,e.y,"#e8f5ff",6+broken*3);ring(e.x,e.y,"#e8f5ff",e.r+3);
    }
    if(amount<=0)return 0;
    const multiplier=elementMultiplier(attackElement,e.resist);
    amount=+(amount*multiplier).toFixed(2);
    let combo="";
    if(attackElement&&attackElement!=="neutral"&&!skipElement){
      const previous=e.lastElement,companionHit=String(cause).startsWith("companion-");
      const companionChain=companionHit&&e.lastElementSource==="companion";
      if(previous&&previous!==attackElement&&!companionChain){
        if(generates[previous]===attackElement)combo="相生";
        else if(overcomes[attackElement]===previous)combo="破相";
      }
      e.lastElement=attackElement;e.lastElementSource=companionHit?"companion":"player";e.elementClock=2.6;
    }
    if(multiplier!==1){
      const strong=multiplier>1,el=elements[attackElement];
      state.elementFx.push({x:e.x,y:e.y+e.r+22,text:strong?"克制 ×1.5":"抗性 ×0.55",color:strong?el.color:elements[e.resist].color,life:1.15});
      ring(e.x,e.y,strong?el.color:elements[e.resist].color,e.r+5);
    }
    if(combo){
      const bonus=(combo==="破相"?1.5:1)+(hasSpec("monkeyTrick") ? .5 : 0)+level("wuxingComb")+(state.wuxing.tier>=3?1:0);
      amount=+(amount+bonus).toFixed(2);state.stats.elementCombos++;wuxingGain(1);
      const el=elements[attackElement];
      state.elementFx.push({x:e.x,y:e.y+e.r+35,text:`五行${combo} +${bonus}`,color:el.color,life:1.25});
      ring(e.x,e.y,el.color,e.r+12);burst(e.x,e.y,el.color,12);
      if(combo==="相生"&&level("woodBloom")){
        state.charges=Math.min(state.maxCharges,state.charges+level("woodBloom"));
        for(let i=0;i<level("woodBloom")*3;i++)burst(195,48,C.cyan,1);
      }
      if(level("fireDew")){
        state.enemies.filter(x=>x.alive).forEach(x=>{x.burn=Math.max(x.burn,level("fireDew"));x.burnClock=.55});
        state.flameTrails.push({points:[{x:e.x-30,y:e.y},{x:e.x+30,y:e.y}],life:.4,width:6});
      }
      if(level("metalShield"))state.masterShield=Math.min(6,state.masterShield+level("metalShield"));
    }
    if(multiplier>1&&level("waterMirror")){
      state.arcs.push({x1:e.x,y1:e.y-20,x2:e.x+e.r+14,y2:e.y,life:.3,color:elements.water.color});
      damage(e,level("waterMirror"),elements.water.color,"wuxing-water","water",1,true);
    }
    e.hp-=amount;e.hit=.18;burst(e.x,e.y,color,5);
    if(e.hp<=0){kill(e,cause);return amount}
    if(!String(cause).startsWith("wuxing-")){
      const typeBonus=(e.type==="split"&&level("metalVoid"))?2*level("metalVoid"):(e.type==="healer"&&level("woodBind"))?1+Math.floor(level("woodBind")/2):(e.type==="shaman"&&level("earthShatter"))?1+Math.floor(level("earthShatter")/2):0;
      if(typeBonus&&e.resist){
        const counter=Object.keys(overcomes).find(el=>overcomes[el]===e.resist);
        damage(e,typeBonus,elements[counter].color,`wuxing-${counter}`,counter,1,true);
      }
      if(e.type==="healer"&&level("woodBind"))e.healPause=Math.max(e.healPause||0,level("woodBind"));
      if(level("fireBurst"))damage(e,1+Math.floor(level("fireBurst")/2),elements.fire.color,"wuxing-fire","fire",1,true);
      const bonusAtk=wuxingBonusFor(e.resist);
      if(bonusAtk){
        if(bonusAtk.el==="wood"&&level("woodVine")){e.slow=Math.max(e.slow||0,level("woodVine")*.06);e.slowClock=2}
        damage(e,bonusAtk.amt,elements[bonusAtk.el].color,`wuxing-${bonusAtk.el}`,bonusAtk.el,1,true);
      }
    }
    return amount;
  }

  function aoe(source,amount,radius,color,cause="aoe",attackElement="neutral"){
    if(amount<=0)return;
    ring(source.x,source.y,color,22);
    state.enemies.filter(e=>e.alive&&e.id!==source.id&&Math.hypot(e.x-source.x,e.y-source.y)<=radius)
      .forEach(e=>damage(e,amount,color,cause,attackElement));
  }

  function gourdTrigger(){
    if(!ownsRelic("gourd")||state.kills%6!==0)return;
    const target=state.enemies.filter(e=>e.alive).sort((a,b)=>b.y-a.y)[0];
    if(!target)return;
    state.vortices.push({x:target.x,y:target.y,life:.8,r:15});
    target.y=Math.max(105,target.y-45);damage(target,3,C.purple,"gourd","water");
  }

  function gainExperience(amount,x,y){
    if(amount<=0)return;
    state.xp+=amount;
    state.elementFx.push({x,y:y-18,text:`修为 +${amount}`,color:C.jade,life:1.05});
    while(state.xp>=state.xpNeed){
      state.xp-=state.xpNeed;state.runLevel++;
      state.xpNeed=3+Math.floor(state.runLevel*1.4);
      state.pendingLevelUps++;
    }
  }

  function kill(e,cause="hit"){
    if(!e||!e.alive)return;
    const wasBurning=cause==="burn"||e.burn>0;
    e.alive=false;state.kills++;state.stats.enemyDefeats=state.kills;burst(e.x,e.y,e.color,17);
    gainExperience(e.type==="boss"?0:e.elite?2:1,e.x,e.y);
    const counterEl=e.resist?Object.keys(overcomes).find(el=>overcomes[el]===e.resist):null;
    wuxingGain(e.type==="boss"?3:e.elite?2:1,counterEl);
    if(e.type==="bomber"&&cause!=="miss"){
      if(level("waterReverse")){
        state.windWaves.push({y:e.y,life:.6,width:24});
        state.enemies.filter(x=>x.alive).forEach(x=>{x.y=Math.max(95,x.y-32)});
        ring(e.x,e.y,elements.water.color,34);burst(e.x,e.y,elements.water.color,14);
      }else aoe(e,1,72,C.orange,"bomber","fire");
    }
    if(state.mainSchool==="fire"&&(level("explode")>0||hasSpec("fireWild"))&&(wasBurning||state.evolutionStage>=2)){
      state.flameTrails.push({points:[{x:e.x-20,y:e.y},{x:e.x+20,y:e.y}],life:.44,width:12+level("explode")*3});
      const blast=Math.max(1,level("explode"))+(state.evolutionStage>=3?1:0)+(hasSpec("fireWild")?1:0);
      aoe(e,blast,65+level("explode")*12+(hasSpec("fireWild")?28:0),C.orange,"explosion","fire");
      const spread=Math.max(level("cinder"),hasSpec("fireWild")?2:0);
      if(spread){
        state.enemies.filter(x=>x.alive).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y)).slice(0,spread+1)
          .forEach(x=>{x.burn=Math.max(x.burn,1+level("fire"));x.burnClock=.5;state.flameTrails.push({points:[{x:e.x,y:e.y},{x:x.x,y:x.y}],life:.38,width:5})});
      }
    }
    if(e.type==="split"){
      if(level("metalCut"))aoe(e,1+Math.floor(level("metalCut")/2),78,C.gold,"metalCut","metal");
      if(level("metalVoid"))burst(e.x,e.y,C.gold,14);
      else{
        const cfg=state.currentStage,s=specs.runner;
        [-30,30].forEach(dx=>state.enemies.push({
          id:nextId++,type:"runner",name:"裂生疾妖",x:clamp(e.x+dx,42,348),y:e.y,r:10,
          hp:Math.max(1,Math.ceil(cfg.hp)),maxHp:Math.max(1,Math.ceil(cfg.hp)),speed:s.speed*cfg.spd*1.08,color:s.color,
          locked:false,lockOrder:0,hit:0,alive:true,burn:0,burnClock:0,shield:0,healClock:3,abilityClock:3,regenClock:2.5,missDamage:1,elite:false,phases:0,phase:0,resist:"wood",lastElement:null,lastElementSource:null,elementClock:0
        }));
        toast("分身妖裂成两个疾妖！");
      }
    }
    gourdTrigger();
  }

  function relicCombat(chain,targetSnapshots){
    if(ownsRelic("fan")&&chain>=4){
      state.windWaves.push({y:390,life:.7,width:20});
      const push=50+(fusionName()==="火借风势"?25:0);
      state.enemies.filter(e=>e.alive).forEach(e=>{e.y=Math.max(95,e.y-push);if(fusionName()==="火借风势"){e.burn=Math.max(e.burn,2);e.burnClock=.55}});
    }
    if(ownsRelic("bell")&&state.volleyCount%3===0){
      const targets=state.enemies.filter(e=>e.alive).sort((a,b)=>b.y-a.y).slice(0,3);
      if(targets.length){
        state.lightnings.push({points:[{x:195,y:90},...targets.map(e=>({x:e.x,y:e.y}))],life:.48});
        targets.forEach(e=>damage(e,fusionName()==="雷霆神针"?2:1,C.purple,"lightning","fire"));
      }
    }
    if(ownsRelic("mirror")&&targetSnapshots.length){
      const first=state.enemies.find(e=>e.id===targetSnapshots[0].id&&e.alive);
      if(first){
        state.arcs.push({x1:195,y1:92,x2:first.x,y2:first.y,life:.35,delay:.1,color:"#fff4b0"});
        damage(first,fusionName()==="真假猴王"?2:1,"#fff4b0","mirror","metal");
      }
    }
    if(ownsRelic("ring")&&chain>=5){
      state.rings.push({x:195,y:360,color:"#f3f7ff",r:35,life:.75});
      state.enemies.filter(e=>e.alive).forEach(e=>{e.shield=0;damage(e,fusionName()==="金刚神棒"?2:1,"#f3f7ff","ring","metal")});
    }
  }

  function fireAttack(){
    if(!state.selecting)return;
    state.selecting=false;
    if(!state.locked.length){state.path=[];return}
    const ids=state.locked.slice(),chain=ids.length;
    const snapshots=ids.map(id=>state.enemies.find(e=>e.id===id)).filter(Boolean).map(e=>({id:e.id,x:e.x,y:e.y}));
    state.stats.volleys++;state.volleyCount++;state.stats.maxChain=Math.max(state.stats.maxChain,chain);
    if(chain>=2)state.stats.correctFocuses++;

    ids.forEach((id,i)=>{
      const e=state.enemies.find(x=>x.id===id&&x.alive);if(!e)return;
      const main=characters.find(c=>c.id===state.mainCharacter)||characters[0];
      const from={x:state.masterX+(i%3-1)*12,y:660};
      const shotElement=state.mainSchool?schoolMeta[state.mainSchool].element:main.element;
      const color=shotElement!=="neutral"?elements[shotElement].color:elements[main.element].color;
      state.arcs.push({x1:from.x,y1:from.y,x2:e.x,y2:e.y,life:.31,delay:i*.04,color});
      if(state.mainSchool==="monkey"){
        const origins=[90,130,170,220,260,300];
        state.arcs.push({x1:origins[i%origins.length],y1:674,x2:e.x,y2:e.y,life:.3,delay:i*.04+.06,color});
      }
      let hit=1;
      const ownerPower=state.mainCharacter==="bajie"?level("bajiePower"):state.mainCharacter==="wujing"?level("wujingPower"):state.mainCharacter==="longma"?level("longmaPower"):0;
      if(state.mainSchool==="staff"&&i===chain-1)hit+=1+level("staffPower");
      if(state.mainSchool==="fire"&&i===0)hit+=level("eyes");
      if(state.mainCharacter==="longma"&&e.hp/e.maxHp<.3)hit+=level("longmaExecute");
      if(hasSpec("staffCrush")&&i===chain-1&&(e.elite||e.type==="boss"))hit*=2;
      if(state.mainSchool==="staff"&&level("pierce")){e.shield=Math.max(0,e.shield-level("pierce"));e.y=Math.max(95,e.y-8*level("pierce"))}
      if(state.mainCharacter==="wujing"&&level("wujingUndertow"))e.y=Math.max(95,e.y-level("wujingUndertow")*8);
      damage(e,hit,color,"shot",shotElement,state.attackMult*(1+ownerPower*.3));
      if(e.alive&&state.mainSchool==="fire"){
        const burnHit=1+level("fire")+(state.evolutionStage>=1?1:0)+(hasSpec("fireInferno")&&e.type==="boss"?1:0);
        e.burn=hasSpec("fireInferno")?Math.min(burnHit*2,e.burn+burnHit):Math.max(e.burn,burnHit);e.burnClock=.62;
      }
      if((i+1)%3===0&&level("ocean"))aoe(e,level("ocean"),55+level("ocean")*9,C.jade,"ocean","water");
      if((i+1)%3===0&&level("waterRune")){
        const waterHit=1+Math.floor(level("waterRune")/2);
        state.windWaves.push({y:e.y,life:.45,width:7+level("waterRune")*3});
        e.y=Math.max(95,e.y-10*level("waterRune"));damage(e,waterHit,elements.water.color,"waterRune","water");
      }
      e.locked=false;e.lockOrder=0;
    });

    if(state.mainCharacter==="bajie"&&level("bajieSweep")&&state.volleyCount%3===0&&snapshots.length){
      const anchor=state.enemies.find(e=>e.id===snapshots[snapshots.length-1].id&&e.alive)||snapshots[snapshots.length-1];
      state.sweeps.push({x1:state.masterX,y1:665,x2:anchor.x,y2:anchor.y,life:.48,width:10+level("bajieSweep")*4});
      aoe(anchor,level("bajieSweep"),78,C.gold,"bajieSweep","earth");
    }
    if(state.mainCharacter==="wujing"&&level("wujingWave")&&state.volleyCount%3===0){
      state.enemies.filter(e=>e.alive).sort((a,b)=>b.y-a.y).slice(0,level("wujingWave")+1).forEach((e,i)=>{
        state.arcs.push({x1:state.masterX,y1:660,x2:e.x,y2:e.y,life:.36,delay:i*.05,color:elements.water.color});
        damage(e,1,elements.water.color,"wujingWave","water");
      });
    }

    if(state.mainSchool==="monkey"){
      const count=1+level("clone"),targets=state.evolutionStage>=1?ids:ids.slice(-count);
      targets.forEach((id,i)=>{
        const e=state.enemies.find(x=>x.id===id&&x.alive);if(!e)return;
        state.arcs.push({x1:92+(i%6)*42,y1:678,x2:e.x,y2:e.y,life:.32,delay:.12+i*.02,color:C.purple});
        damage(e,1+(state.evolutionStage>=3?1:0)+(hasSpec("monkeySwarm")?1:0),C.purple,"clone","wood");
      });
      const echoEvery=hasSpec("monkeyTrick")?2:(level("echo")?Math.max(2,5-level("echo")):0);
      if(echoEvery&&state.volleyCount%echoEvery===0){
        snapshots.forEach((t,i)=>{const e=state.enemies.find(x=>x.id===t.id&&x.alive);if(e){state.arcs.push({x1:W-t.x,y1:120,x2:e.x,y2:e.y,life:.4,delay:.18+i*.025,color:"#e5caff"});damage(e,1,C.purple,"echo","wood")}});      
      }
      if(hasSpec("monkeySwarm")&&chain>=5){
        state.enemies.filter(e=>e.alive).sort((a,b)=>b.y-a.y).slice(0,3).forEach((e,i)=>{
          state.cloneJumps.push({x:e.x,y:e.y,life:.62,delay:i*.06});damage(e,1,C.jade,"swarm","wood");
        });
      }
      if(chain>=4&&level("command")){
        state.enemies.filter(e=>e.alive).sort((a,b)=>b.y-a.y).slice(0,level("command")).forEach((e,i)=>{
          state.cloneJumps.push({x:e.x,y:e.y,life:.55,delay:i*.07});damage(e,1,C.gold,"cloneJump","wood");aoe(e,1,48,C.purple,"cloneJump","wood");
        });
      }
      if(state.evolutionStage>=2&&chain>=4)state.enemies.filter(e=>e.alive).forEach((e,i)=>{state.cloneJumps.push({x:e.x,y:e.y,life:.58,delay:i*.02});damage(e,1,C.purple,"army","wood")});
      if(state.evolutionStage>=3&&chain>=3)state.enemies.filter(e=>e.alive).forEach(e=>damage(e,1,C.gold,"sage","wood"));
    }

    if(state.mainSchool==="staff"&&snapshots.length){
      const first=snapshots[0],last=snapshots[snapshots.length-1],lastEnemy=state.enemies.find(e=>e.id===last.id&&e.alive),anchor=lastEnemy||last;
      state.sweeps.push({x1:first.x,y1:first.y,x2:last.x,y2:last.y,life:.45,width:8+level("staffPower")*3+state.evolutionStage*5});
      if(level("sweep"))aoe(anchor,level("sweep"),58+level("sweep")*13,C.gold,"sweep","metal");
      if(state.evolutionStage>=1){ids.forEach(id=>{const e=state.enemies.find(x=>x.id===id&&x.alive);if(e)damage(e,1,C.gold,"giantStaff","metal")});state.shake=8}
      if(state.evolutionStage>=2){aoe(anchor,2,108,C.orange,"heaven","metal");state.shake=16}
      if(state.evolutionStage>=3){
        state.sweeps.push({x1:25,y1:320,x2:365,y2:320,life:.6,width:25});
        state.enemies.filter(e=>e.alive).forEach(e=>{e.y=Math.max(95,e.y-35);damage(e,2,C.gold,"seaPillar","metal")});state.shake=22;
      }
      if(hasSpec("staffSweep")&&chain>=4){
        state.sweeps.push({x1:22,y1:370,x2:368,y2:370,life:.55,width:18});
        state.enemies.filter(e=>e.alive).forEach(e=>{e.y=Math.max(95,e.y-18);damage(e,1,C.gold,"worldSweep","metal")});
      }
      if(fusionName()==="雷霆神针")state.lightnings.push({points:snapshots.map(t=>({x:t.x,y:t.y})),life:.45});
    }

    if(state.mainSchool==="fire"&&snapshots.length){
      state.flameTrails.push({points:snapshots.map(t=>({x:t.x,y:t.y})),life:.55,width:7+level("fire")*3+state.evolutionStage*4});
      if(state.evolutionStage>=2)snapshots.forEach(t=>{const e=state.enemies.find(x=>x.id===t.id&&x.alive);if(e){e.burn=Math.max(e.burn,2+level("fire"));e.burnClock=.42}});
      if(state.evolutionStage>=3)state.enemies.filter(e=>e.alive).forEach(e=>{e.burn=Math.max(e.burn,2+level("fire"));e.burnClock=.38});
    }

    if(level("earthRune")&&chain>=4&&state.volleyCount%2===0){
      const earthHit=1+Math.floor(level("earthRune")/2);
      state.rings.push({x:195,y:390,color:elements.earth.color,r:35,life:.7});
      snapshots.forEach(t=>{const e=state.enemies.find(x=>x.id===t.id&&x.alive);if(e)damage(e,earthHit,elements.earth.color,"earthRune","earth")});
      state.shake=Math.max(state.shake,7+level("earthRune")*2);
    }
    if(level("earthStone")&&state.volleyCount%4===0){
      state.rings.push({x:195,y:390,color:elements.earth.color,r:42,life:.7});
      state.enemies.filter(e=>e.alive).forEach(e=>damage(e,1+Math.floor(level("earthStone")/2),elements.earth.color,"earthStone","earth"));
      state.shake=Math.max(state.shake,9+level("earthStone")*3);
    }

    if(chain>=4&&level("frenzy")){
      const refund=level("frenzy");state.charges=Math.min(state.maxCharges,state.charges+refund);
      for(let i=0;i<refund*3;i++)burst(195,48,C.cyan,1);
    }
    relicCombat(chain,snapshots);
    state.locked=[];state.path=[];
  }

  function miss(e){
    if(!e.alive)return;
    e.alive=false;state.leaksThisStage++;
    if(state.leaksThisStage===1&&level("earthWall")){
      state.rings.push({x:195,y:390,color:elements.earth.color,r:60,life:.7});
      state.enemies.filter(x=>x.alive).forEach(x=>{x.y=Math.max(95,x.y-level("earthWall")*10)});
      burst(e.x,640,elements.earth.color,26);
      toast("厚土护阵：震退全场！");return;
    }
    if(state.wuxing.tier>=3&&!state.wuxingLeakUsed){
      state.wuxingLeakUsed=true;
      burst(e.x,640,C.purple,26);toast("阴阳相济：化解一次失守！");return;
    }
    const bajieBlock=(state.mainCharacter==="bajie"||state.runCompanions.includes("bajie"))?level("bajieGuard"):0;
    const guard=Math.min(e.missDamage,Math.floor(level("vajra")/2)+bajieBlock);
    const harm=e.missDamage-guard;
    burst(e.x,640,C.red,24);
    if(harm>0)hitMaster(harm,e.type==="bomber"?"爆裂妖近身":"护送失守");
    else toast(bajieBlock?"猪八戒护师挡下漏怪！":"金刚不坏挡下漏怪！");
  }

  function enemyAbilities(dt){
    for(const e of state.enemies){
      if(!e.alive)continue;
      if(e.type==="healer"){
        if(e.healPause>0){e.healPause-=dt;continue}
        e.healClock-=dt;
        if(e.healClock<=0){
          e.healClock=3.1;
          const target=state.enemies.filter(x=>x.alive&&x.hp<x.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
          if(target){target.hp=Math.min(target.maxHp,target.hp+1);ring(target.x,target.y,C.jade,target.r+5);burst(target.x,target.y,C.jade,8)}
        }
      }
      if(e.type==="shaman"){
        e.abilityClock-=dt;
        if(e.abilityClock<=0){
          e.abilityClock=3.6;
          const target=state.enemies.filter(x=>x.alive&&x.id!==e.id).sort((a,b)=>b.y-a.y)[0];
          if(target){target.shield=Math.min(3,target.shield+1);ring(target.x,target.y,"#b8f3ff",target.r+7)}
          launchHazard(e,"#c7a5ff",1);
        }
      }
      if(e.type==="bomber"){
        e.abilityClock-=dt;
        if(e.abilityClock<=0){e.abilityClock=4.2;launchHazard(e,C.orange,1)}
      }
      if(state.currentStage?.regen){
        e.regenClock-=dt;
        if(e.regenClock<=0){e.regenClock=2.5;e.hp=Math.min(e.maxHp,e.hp+.5);burst(e.x,e.y,C.jade,3)}
      }
      if(e.type==="boss"&&e.phases){
        const phase=Math.floor((1-e.hp/e.maxHp)*e.phases);
        if(phase>e.phase&&e.alive){
          e.phase=phase;state.shake=14;toast(`${state.currentStage?.name||"首领"}进入第 ${phase+1} 阶段！`,2.8);
          addEnemy(P("runner",phase%2?0:2,110,{elite:true}),state.currentStage);
          addEnemy(P("bomber",phase%2?2:0,145),state.currentStage);
        }
      }
    }
  }

  function pickCompanionTarget(c){
    const alive=state.enemies.filter(e=>e.alive);
    if(!alive.length)return null;
    if(c.target==="fire")return alive.find(e=>e.resist==="fire")||alive.sort((a,b)=>b.y-a.y)[0];
    if(c.target==="low")return alive.sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
    if(c.target==="armor")return alive.find(e=>e.type==="armor"||e.shield>0)||alive.sort((a,b)=>b.y-a.y)[0];
    return alive.sort((a,b)=>b.y-a.y)[0];
  }

  function companionInterval(c){
    return c.id==="longma"?c.interval*Math.max(.4,1-level("longmaRapid")*.15):c.interval;
  }

  function updateCompanions(dt){
    if(state.mode!=="play"||state.stageClock>0||!state.enemies.length)return;
    for(const id of state.runCompanions){
      const c=attackers.find(x=>x.id===id);if(!c)continue;
      const interval=companionInterval(c);
      state.companionTimers[id]=(state.companionTimers[id]??interval)-dt;
      if(state.companionTimers[id]>0)continue;
      const target=pickCompanionTarget(c);state.companionTimers[id]=interval;
      if(!target)continue;
      state.companionShots[id]=(state.companionShots[id]||0)+1;
      const el=elements[c.element];
      const source=companionPosition(id);
      state.arcs.push({x1:source.x,y1:source.y,x2:target.x,y2:target.y,life:.36,delay:0,color:el.color});
      const sutraMult=id==="tang"?1+level("sutraAttack")*.25:1;
      const ownerPower=id==="bajie"?level("bajiePower"):id==="wujing"?level("wujingPower"):id==="longma"?level("longmaPower"):0;
      const execute=id==="longma"&&target.hp/target.maxHp<.3?level("longmaExecute"):0;
      damage(target,c.damage+execute,el.color,`companion-${id}`,c.element,(1+meta.growth[id].attack*.04)*(1+ownerPower*.3)*sutraMult);
      if(id==="bajie"&&level("bajieSweep")&&state.companionShots[id]%3===0){
        state.sweeps.push({x1:source.x,y1:source.y,x2:target.x,y2:target.y,life:.42,width:9+level("bajieSweep")*4});
        aoe(target,level("bajieSweep"),72,C.gold,"bajieSweep","earth");
      }
      if(id==="wujing"){
        if(level("wujingUndertow"))target.y=Math.max(108,target.y-level("wujingUndertow")*8);
        if(level("wujingWave")&&state.companionShots[id]%3===0){
          state.enemies.filter(e=>e.alive&&e.id!==target.id).sort((a,b)=>b.y-a.y).slice(0,level("wujingWave")).forEach((e,i)=>{
            state.arcs.push({x1:target.x,y1:target.y,x2:e.x,y2:e.y,life:.34,delay:i*.05,color:elements.water.color});
            damage(e,1,elements.water.color,"wujingWave","water",1+meta.growth.wujing.attack*.04);
          });
        }
      }
    }
  }

  function updateHazards(dt){
    for(const h of state.hazards){
      h.x+=h.vx*dt;h.y+=h.vy*dt;h.life-=dt;
      if(Math.hypot(h.x-state.masterX,h.y-654)<24){
        h.life=0;hitMaster(h.damage,"妖术命中");
      }else if(h.y>700||h.x<-20||h.x>410)h.life=0;
    }
    state.hazards=state.hazards.filter(h=>h.life>0);
  }

  function stageClear(){
    const local=state.stage-state.pageStart+1;
    state.stats.stagesCleared=local;
    state.hazards=[];
    const wTally={metal:0,wood:0,water:0,fire:0,earth:0};
    for(const entry of state.currentStage.pack){
      const resist=entry.resist||typeResist[entry.t]||null;
      if(!resist)continue;
      for(const el of Object.keys(overcomes))if(overcomes[el]===resist)wTally[el]+=(entry.elite?2:1);
    }
    if(state.currentStage.bossResist){
      for(const el of Object.keys(overcomes))if(overcomes[el]===state.currentStage.bossResist)wTally[el]+=3;
    }
    const wLead=Object.keys(wTally).sort((a,b)=>wTally[b]-wTally[a])[0];
    if(wTally[wLead]>0)wuxingGain(2,wLead);else wuxingGain(2);
    if(state.leaksThisStage===0&&level("vajra")){
      const heal=Math.min(state.maxMasterHp-state.masterHp,level("vajra"));
      if(heal>0){state.masterHp+=heal;toast(`金刚不坏：修复 ${heal} 颗佛珠`)}
    }
    if(state.leaksThisStage===0&&ownsRelic("lotus")){
      state.masterHp=Math.min(state.maxMasterHp,state.masterHp+1);state.charges=state.maxCharges;
      for(let i=0;i<18;i++)state.petals.push({x:195+(Math.random()-.5)*180,y:640-Math.random()*100,life:1.2+Math.random(),vx:(Math.random()-.5)*28});
    }
    state.rewardQueue=[];
    const unearned=Object.keys(relics).filter(id=>!meta.treasures.includes(id));
    if(unearned.length)state.rewardQueue.push("treasure");
    else{meta.scrolls+=2;saveMeta();toast("法宝已齐 · 妖王赠 +2 残卷",2.6)}
    if(local===5&&state.mainSchool&&!state.specialization)state.rewardQueue.push("spec");
    if(state.rewardQueue.length){state.pendingFinish=true;showNextReward()}
    else finish(true);
  }

  function update(dt){
    state.toastClock=Math.max(0,state.toastClock-dt);state.shake=Math.max(0,state.shake-dt*30);
    state.sparks.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=75*dt;p.life-=dt});state.sparks=state.sparks.filter(p=>p.life>0);
    state.rings.forEach(r=>{r.r+=65*dt;r.life-=dt});state.rings=state.rings.filter(r=>r.life>0);
    state.arcs.forEach(a=>{a.delay-=dt;if(a.delay<=0)a.life-=dt});state.arcs=state.arcs.filter(a=>a.life>0);
    state.sweeps.forEach(s=>s.life-=dt);state.sweeps=state.sweeps.filter(s=>s.life>0);
    state.flameTrails.forEach(f=>f.life-=dt);state.flameTrails=state.flameTrails.filter(f=>f.life>0);
    state.cloneJumps.forEach(j=>{j.delay-=dt;if(j.delay<=0)j.life-=dt});state.cloneJumps=state.cloneJumps.filter(j=>j.life>0);
    state.windWaves.forEach(w=>{w.life-=dt;w.y-=20*dt});state.windWaves=state.windWaves.filter(w=>w.life>0);
    state.lightnings.forEach(l=>l.life-=dt);state.lightnings=state.lightnings.filter(l=>l.life>0);
    state.vortices.forEach(v=>{v.life-=dt;v.r+=45*dt});state.vortices=state.vortices.filter(v=>v.life>0);
    state.petals.forEach(p=>{p.life-=dt;p.y-=18*dt;p.x+=p.vx*dt});state.petals=state.petals.filter(p=>p.life>0);
    state.elementFx.forEach(f=>{f.life-=dt;f.y-=18*dt});state.elementFx=state.elementFx.filter(f=>f.life>0);
    if(state.mode!=="play")return;

    state.skillCooldown=Math.max(0,state.skillCooldown-dt);
    state.masterStill=state.movingMaster?0:state.masterStill+dt;
    state.charges=Math.min(state.maxCharges,state.charges+state.recharge*dt);
    if(state.stageClock>0){
      state.stageClock-=dt;
      if(state.stageClock<=0)spawnStage(state.stage+1);
      return;
    }

    updateHazards(dt);
    updateCompanions(dt);
    enemyAbilities(dt);
    const lockSlow=.48-level("mantra")*.12;
    for(const e of state.enemies){
      if(!e.alive)continue;
      if(e.slow>0){e.slowClock-=dt;if(e.slowClock<=0)e.slow=0}
      e.y+=e.speed*dt*(e.locked?Math.max(.12,lockSlow):1)*(e.slow>0?1-e.slow:1);e.hit=Math.max(0,e.hit-dt);
      if(e.elementClock>0){e.elementClock-=dt;if(e.elementClock<=0){e.lastElement=null;e.lastElementSource=null}}
      if(e.burn>0){e.burnClock-=dt;if(e.burnClock<=0){const burn=e.burn;e.burn=0;damage(e,burn,C.orange,"burn","fire")}}
      if(e.alive&&e.y>642)miss(e);
    }
    state.enemies=state.enemies.filter(e=>e.alive);
    if(state.mode==="play"&&state.stage>0&&!state.enemies.length){
      if(!state.selecting&&state.pendingLevelUps>0){state.pendingLevelUps--;showPowerReward();return}
      if(state.wave<state.wavesTotal){state.wave++;spawnWave(state.wave);return}
      if(!state.bossSpawned){state.bossSpawned=true;spawnBoss();return}
      stageClear();
    }
  }

  function finish(win){
    if(state.mode==="result")return;
    state.mode="result";
    pauseButton.hidden=true;skillButton.hidden=true;pauseOverlay.hidden=true;
    const previousHighest=meta.highest,cleared=state.stats.stagesCleared;
    const furthest=state.pageStart+cleared-1;
    state.earnedScrolls=cleared+(win?4:0);
    meta.scrolls+=state.earnedScrolls;meta.highest=Math.max(meta.highest,furthest);
    meta.selectedPage=Math.min(meta.selectedPage||1,unlockedPages());
    saveMeta();
    const newlyUnlocked=characters.filter(c=>c.unlock>0&&previousHighest<c.unlock&&meta.highest>=c.unlock);
    const chapterUnlocked=Math.floor(meta.highest/9)>Math.floor(previousHighest/9);
    document.querySelector("#result-tag").textContent=win?`第 ${state.stage}/81 难 · ${chapters[state.page-1].name}`:"西行阵线失守";
    document.querySelector("#result-title").textContent=win?(state.stage===81?"八十一难圆满":chapterUnlocked?"新章节已开启":"本关通关"):"本关失守";
    const main=characters.find(c=>c.id===state.mainCharacter)||characters[0];
    const route=state.mainSchool?`${main.name} · ${schoolMeta[state.mainSchool].name}`:`${main.name}主位流`;
    const evo=state.evolutions.length?` · ${state.evolutions.join(" → ")}`:"";
    const fusion=fusionName()?` · ${fusionName()}`:"";
    const spec=Object.values(specializations).flat().find(s=>s.id===state.specialization);
    const unlockText=newlyUnlocked.length?` · 新伙伴：${newlyUnlocked.map(c=>c.name).join("、")}`:"";
    document.querySelector("#result-copy").textContent=win?`第 ${state.stage} 难已过。本局成型：${route}${evo}${spec?` · ${spec.name}`:""}${fusion}${unlockText}`:`第 ${state.stage} 难未守住，带残卷回大厅整备后再来。${unlockText}`;
    document.querySelector("#m-kill").textContent=state.kills;
    document.querySelector("#m-chain").textContent=state.stats.maxChain;
    document.querySelector("#m-build").textContent=state.stats.buildPicks+state.stats.relicPicks;
    document.querySelector("#m-synergy").textContent=state.evolutionStage;
    document.querySelector("#m-scroll").textContent=`+${state.earnedScrolls}`;
    result.hidden=false;
  }

  function showLobby(){
    state.mode="intro";result.hidden=true;buildOverlay.hidden=true;pauseOverlay.hidden=true;pauseButton.hidden=true;skillButton.hidden=true;intro.hidden=false;refreshLobby();
  }

  function drawBackground(){
    if(bgArt.complete&&bgArt.naturalWidth){
      const scale=Math.max(W/bgArt.naturalWidth,H/bgArt.naturalHeight);
      const dw=bgArt.naturalWidth*scale,dh=bgArt.naturalHeight*scale;
      ctx.drawImage(bgArt,(W-dw)/2,(H-dh)/2,dw,dh);
      const veil=ctx.createLinearGradient(0,0,0,H);veil.addColorStop(0,"#17102026");veil.addColorStop(.45,"#120c1840");veil.addColorStop(1,"#100b1873");
      ctx.fillStyle=veil;ctx.fillRect(0,0,W,H);
    }else{
      const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#38214d");bg.addColorStop(.55,"#17111f");bg.addColorStop(1,"#100d18");
      ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    }
  }

  function drawEnemy(e){
    ctx.save();
    const traceBody=()=>{
      ctx.beginPath();
      if(e.type==="runner"){
        ctx.moveTo(e.x,e.y-e.r);ctx.lineTo(e.x+e.r,e.y+e.r);ctx.lineTo(e.x-e.r,e.y+e.r);ctx.closePath();
      }else if(e.type==="armor"){
        for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2,x=e.x+Math.cos(a)*e.r,y=e.y+Math.sin(a)*e.r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();
      }else if(e.type==="bomber"){
        ctx.arc(e.x,e.y,e.r,0,Math.PI*2);
      }else{
        ctx.arc(e.x,e.y,e.r,Math.PI,0);ctx.lineTo(e.x+e.r,e.y+e.r*.86);ctx.lineTo(e.x-e.r,e.y+e.r*.86);ctx.closePath();
      }
    };
    ctx.shadowColor=e.locked?C.gold:"#090711";ctx.shadowBlur=e.locked?24:12;
    ctx.fillStyle=e.hit?C.text:e.color;
    traceBody();ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle="#171020";ctx.lineWidth=e.type==="boss"?5:4;ctx.lineJoin="round";traceBody();ctx.stroke();
    ctx.strokeStyle="#ffffffa8";ctx.lineWidth=2;ctx.lineCap="round";ctx.beginPath();
    ctx.moveTo(e.x-e.r*.38,e.y-e.r*.42);ctx.lineTo(e.x+e.r*.15,e.y-e.r*.62);ctx.stroke();
    if(e.type==="bomber"){
      ctx.strokeStyle="#171020";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(e.x,e.y-e.r);ctx.lineTo(e.x+7,e.y-e.r-10);ctx.stroke();
      ctx.strokeStyle="#ffd45f";ctx.lineWidth=2;ctx.stroke();
    }
    ctx.shadowBlur=0;
    if(["boss","shaman","healer"].includes(e.type)){
      ctx.beginPath();ctx.moveTo(e.x-e.r*.55,e.y-e.r*.65);ctx.lineTo(e.x-e.r*.82,e.y-e.r*1.2);ctx.moveTo(e.x+e.r*.55,e.y-e.r*.65);ctx.lineTo(e.x+e.r*.82,e.y-e.r*1.2);
      ctx.strokeStyle="#171020";ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.stroke();
    }
    ctx.fillStyle=e.type==="armor"?"#2a1b05":"#100d18";ctx.beginPath();ctx.arc(e.x-5,e.y,2.4,0,Math.PI*2);ctx.arc(e.x+5,e.y,2.4,0,Math.PI*2);ctx.fill();
    if(e.maxHp>1){
      roundRect(e.x-e.r,e.y-e.r-11,e.r*2,5,3,"#342839");
      roundRect(e.x-e.r,e.y-e.r-11,e.r*2*Math.max(0,e.hp/e.maxHp),5,3,e.type==="boss"?C.red:e.color);
    }
    if(e.resist){
      const el=elements[e.resist],bx=e.x-e.r-7,by=e.y-e.r-8;
      ctx.fillStyle="#171020";ctx.beginPath();ctx.arc(bx,by,10,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=el.color;ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle=el.color;ctx.font="950 10px system-ui";ctx.textAlign="center";ctx.fillText(el.name,bx,by+4);ctx.textAlign="left";
    }
    if(e.lastElement){
      const el=elements[e.lastElement],bx=e.x+e.r+7,by=e.y-e.r-8;
      ctx.fillStyle=el.color;ctx.beginPath();ctx.arc(bx,by,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#171020";ctx.font="950 9px system-ui";ctx.textAlign="center";ctx.fillText(el.name,bx,by+3);ctx.textAlign="left";
    }
    for(let i=0;i<e.shield;i++){ctx.strokeStyle="#d9f7ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r+5+i*3,0,Math.PI*2);ctx.stroke()}
    if(e.burn>0){ctx.strokeStyle=C.orange;ctx.lineWidth=2+Math.min(4,e.burn);ctx.beginPath();ctx.arc(e.x,e.y,e.r+4,0,Math.PI*2);ctx.stroke()}
    if(e.locked){
      ctx.strokeStyle=C.gold;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,e.r+8+level("chainMaster")*2,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=C.gold;ctx.beginPath();ctx.arc(e.x+e.r+5,e.y-e.r-4,10,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#211308";ctx.font="950 11px system-ui";ctx.textAlign="center";ctx.fillText(e.lockOrder,e.x+e.r+5,e.y-e.r);ctx.textAlign="left";
    }
    if(e.elite){ctx.strokeStyle=C.red;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x-8,e.y-e.r-16);ctx.lineTo(e.x,e.y-e.r-23);ctx.lineTo(e.x+8,e.y-e.r-16);ctx.stroke()}
    ctx.restore();
  }

  function drawCompanions(){
    for(const c of characters.filter(c=>c.id!==state.mainCharacter)){
      const active=state.runCompanions.includes(c.id),el=elements[c.element];
      const pos=companionPosition(c.id),x=pos.x,y=pos.y,art=heroArts[c.id];
      ctx.save();ctx.globalAlpha=active?1:.42;
      ctx.fillStyle="#171020dd";ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=active?el.color:"#7f7286";ctx.lineWidth=active?3:2;ctx.stroke();
      if(active){
        if(art?.complete&&art.naturalWidth)ctx.drawImage(art,x-25,y-25,50,50);
        else{ctx.fillStyle=el.color;ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fill();ctx.fillStyle="#171020";ctx.font="950 13px system-ui";ctx.textAlign="center";ctx.fillText(c.icon,x,y+5)}
        const interval=companionInterval(c),progress=1-Math.min(1,(state.companionTimers[c.id]??interval)/interval);
        ctx.strokeStyle="#fff9ea";ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,28,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();
        ctx.fillStyle=el.color;ctx.font="850 8px system-ui";ctx.textAlign="center";ctx.fillText(`${el.name} · ${c.name}`,x,y+37);
      }else{
        const open=isUnlocked(c.id);
        ctx.fillStyle="#9b8e9f";ctx.font="950 12px system-ui";ctx.textAlign="center";ctx.fillText(open?"休":"锁",x,y+4);
        ctx.font="800 7px system-ui";ctx.fillText(open?"未上阵":`${c.unlock}劫`,x,y+31);
      }
      ctx.textAlign="left";ctx.restore();
    }
  }

  function drawHero(){
    const routeMeta=state.mainSchool?schoolMeta[state.mainSchool]:null;
    const main=characters.find(c=>c.id===state.mainCharacter)||characters[0],mainArt=heroArts[main.id],mainEl=elements[main.element];
    const ground=ctx.createRadialGradient(state.masterX,687,6,state.masterX,687,88);
    ground.addColorStop(0,"#ffd15b38");ground.addColorStop(1,"#ffd15b00");
    ctx.fillStyle=ground;ctx.beginPath();ctx.ellipse(state.masterX,688,96,23,0,0,Math.PI*2);ctx.fill();
    if(level("cloud")){ctx.globalAlpha=.22+.06*level("cloud");ctx.fillStyle=C.jade;ctx.beginPath();ctx.ellipse(195,684,110,17,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
    if(ownsRelic("lotus")||(level("stillMind")&&state.masterStill>=2)){ctx.strokeStyle=level("stillMind")&&state.masterStill>=2?C.gold:C.pink;ctx.lineWidth=3;for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.ellipse(state.masterX+Math.cos(a)*32,681+Math.sin(a)*8,18,6,a,0,Math.PI*2);ctx.stroke()}}
    const cloneCount=state.mainSchool==="monkey"?Math.max(1,1+level("clone"),state.evolutionStage>=1?4:0,state.evolutionStage>=2?6:0,state.evolutionStage>=3?8:0):0;
    if(cloneCount&&wukongArt.complete&&wukongArt.naturalWidth){
      for(let i=0;i<cloneCount;i++){
        const x=55+i*(280/Math.max(1,cloneCount-1));ctx.globalAlpha=.28+(i%2)*.08;
        ctx.drawImage(wukongArt,x-22,646+(i%2)*5,44,44);ctx.globalAlpha=1;
      }
    }
    if(state.mainSchool==="fire"){
      const aura=ctx.createRadialGradient(195,666,8,195,666,64+state.evolutionStage*13);
      aura.addColorStop(0,"#ffcb5b99");aura.addColorStop(.5,"#ff6b3970");aura.addColorStop(1,"#ff493000");
      ctx.fillStyle=aura;ctx.beginPath();ctx.arc(195,666,75+state.evolutionStage*9,0,Math.PI*2);ctx.fill();
    }
    if(state.mainSchool==="staff"){
      ctx.strokeStyle=C.gold;ctx.lineCap="round";ctx.lineWidth=8+level("staffPower")*2+state.evolutionStage*5;
      ctx.beginPath();ctx.moveTo(state.evolutionStage?30:70,696);ctx.lineTo(state.evolutionStage?360:320,642);ctx.stroke();
    }
    if(state.masterShield>0){ctx.strokeStyle="#ffe07acc";ctx.lineWidth=3+Math.min(4,state.masterShield);ctx.beginPath();ctx.arc(state.masterX,669,34,0,Math.PI*2);ctx.stroke()}
    if(mainArt?.complete&&mainArt.naturalWidth)ctx.drawImage(mainArt,state.masterX-38,632,76,76);
    else{
      ctx.fillStyle=mainEl.color;ctx.beginPath();ctx.arc(state.masterX,666,24,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#171020";ctx.textAlign="center";ctx.font="950 18px system-ui";ctx.fillText(main.icon,state.masterX,672);ctx.textAlign="left";
    }
    ctx.fillStyle=routeMeta?routeMeta.color:mainEl.color;ctx.textAlign="center";ctx.font="850 10px system-ui";
    const evo=state.evolutionStage?state.evolutions[state.evolutions.length-1]:"";
    ctx.shadowColor="#100d18";ctx.shadowBlur=6;
    ctx.fillText(routeMeta?`${main.name}主位 · ${routeMeta.name}${evo?` · ${evo}`:""}${fusionName()?` · ${fusionName()}`:""}`:`${main.name}主位 · ${mainEl.name}系本命`,195,632);
    ctx.fillStyle=C.text;ctx.font="900 12px system-ui";ctx.fillText(`${main.name}体力 ${"●".repeat(state.masterHp)}${"○".repeat(state.maxMasterHp-state.masterHp)}${state.masterShield?`  盾×${state.masterShield}`:""}`,195,706);
    ctx.shadowBlur=0;ctx.textAlign="left";
  }

  function drawExperience(){
    const progress=Math.max(0,Math.min(1,state.xp/state.xpNeed));
    roundRect(24,87,342,17,8,"#171020e8","#6ee7bd55");
    if(progress>0)roundRect(26,89,338*progress,13,6,"#68e6bd");
    ctx.fillStyle=progress>.46?"#12211c":C.text;ctx.textAlign="center";ctx.font="950 9px system-ui";
    ctx.fillText(`修为 Lv.${state.runLevel}  ·  ${state.xp}/${state.xpNeed}`,195,99);ctx.textAlign="left";
  }

  function drawEffects(){
    for(const h of state.hazards){
      ctx.strokeStyle=h.color;ctx.globalAlpha=.35;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(h.x-h.vx*.12,h.y-h.vy*.12);ctx.lineTo(h.x,h.y);ctx.stroke();
      ctx.globalAlpha=1;ctx.shadowColor=h.color;ctx.shadowBlur=14;ctx.fillStyle=h.color;ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    }
    for(const f of state.flameTrails){
      if(!f.points.length)continue;ctx.globalAlpha=Math.max(0,f.life*2);ctx.strokeStyle=C.orange;ctx.lineWidth=f.width;ctx.lineCap="round";ctx.lineJoin="round";
      ctx.shadowColor=C.red;ctx.shadowBlur=18;ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;
    }
    for(const s of state.sweeps){ctx.globalAlpha=Math.max(0,s.life*2.3);ctx.strokeStyle=C.gold;ctx.lineWidth=s.width;ctx.lineCap="round";ctx.shadowColor=C.orange;ctx.shadowBlur=16;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1}
    for(const j of state.cloneJumps){if(j.delay>0)continue;ctx.globalAlpha=Math.max(0,j.life*2);ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(j.x,j.y-100*j.life);ctx.lineTo(j.x,j.y);ctx.stroke();if(wukongArt.complete)ctx.drawImage(wukongArt,j.x-16,j.y-100*j.life-16,32,32);ctx.globalAlpha=1}
    for(const w of state.windWaves){ctx.globalAlpha=Math.max(0,w.life*1.5);ctx.strokeStyle=C.cyan;ctx.lineWidth=w.width;ctx.beginPath();ctx.moveTo(25,w.y);ctx.bezierCurveTo(120,w.y-45,270,w.y+45,365,w.y);ctx.stroke();ctx.globalAlpha=1}
    for(const l of state.lightnings){ctx.globalAlpha=Math.max(0,l.life*2.2);ctx.strokeStyle="#e6c5ff";ctx.lineWidth=4;ctx.beginPath();l.points.forEach((p,i)=>{if(!i)ctx.moveTo(p.x,p.y);else{const prev=l.points[i-1],mx=(prev.x+p.x)/2+(Math.random()-.5)*18,my=(prev.y+p.y)/2;ctx.lineTo(mx,my);ctx.lineTo(p.x,p.y)}});ctx.stroke();ctx.globalAlpha=1}
    for(const v of state.vortices){ctx.globalAlpha=Math.max(0,v.life*1.3);ctx.strokeStyle=C.purple;ctx.lineWidth=5;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(v.x,v.y,v.r+i*9,0,Math.PI*1.65);ctx.stroke()}ctx.globalAlpha=1}
    for(const a of state.arcs){if(a.delay>0)continue;ctx.globalAlpha=Math.min(1,a.life*6);ctx.strokeStyle=a.color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(a.x1,a.y1);const mx=(a.x1+a.x2)/2+(Math.random()-.5)*20,my=(a.y1+a.y2)/2;ctx.lineTo(mx,my);ctx.lineTo(a.x2,a.y2);ctx.stroke();ctx.globalAlpha=1}
    for(const r of state.rings){ctx.globalAlpha=Math.max(0,r.life*2.3);ctx.strokeStyle=r.color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1;
    for(const p of state.sparks){ctx.globalAlpha=Math.max(0,p.life*1.8);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size)}ctx.globalAlpha=1;
    for(const p of state.petals){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=C.pink;ctx.beginPath();ctx.ellipse(p.x,p.y,4,2,.4,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
    for(const f of state.elementFx){
      ctx.globalAlpha=Math.min(1,f.life*2);ctx.fillStyle=f.color;ctx.strokeStyle="#171020";ctx.lineWidth=3;
      ctx.font="950 11px system-ui";ctx.textAlign="center";ctx.strokeText(f.text,f.x,f.y);ctx.fillText(f.text,f.x,f.y);
    }
    ctx.textAlign="left";ctx.globalAlpha=1;
  }

  function draw(){
    ctx.clearRect(0,0,W,H);ctx.save();
    if(state.shake>0)ctx.translate((Math.random()-.5)*state.shake,(Math.random()-.5)*state.shake);
    drawBackground();

    roundRect(14,13,362,70,17,"#21162ee8","#8a688c");
    const cfg=state.currentStage||stages[0];
    ctx.fillStyle=C.text;ctx.font="950 20px system-ui";ctx.fillText(`第 ${Math.max(1,state.stage)}/81 难`,28,42);
    ctx.fillStyle=C.gold;ctx.font="800 10px system-ui";ctx.fillText(cfg.act,28,61);
    ctx.fillStyle=C.muted;ctx.font="750 9px system-ui";ctx.textAlign="right";ctx.fillText(`难度 ${cfg.score}`,322,31);ctx.fillText(cfg.name,322,48);
    ctx.fillStyle=state.bossSpawned?C.red:C.jade;ctx.font="800 10px system-ui";ctx.fillText(state.bossSpawned?"妖王战":`第 ${Math.max(1,state.wave)}/${Math.max(1,state.wavesTotal)} 波`,322,63);ctx.textAlign="left";
    const startX=state.maxCharges>7?137:151,cellW=state.maxCharges>7?18:21,gap=6;
    for(let i=0;i<state.maxCharges;i++){const x=startX+i*(cellW+gap);roundRect(x,56,cellW,17,5,i<Math.floor(state.charges)?C.gold:"#423148");if(i===Math.floor(state.charges)&&state.charges%1>0){ctx.save();ctx.beginPath();ctx.rect(x,56,cellW*(state.charges%1),17);ctx.clip();roundRect(x,56,cellW,17,5,C.gold);ctx.restore()}}
    const wx=state.wuxing,tierNeed=[0,20,45,70],tierNames={1:"五行流转",2:"五行大成",3:"阴阳相济"},wxElOrder=["metal","wood","water","fire","earth"];
    const maxPow=Math.max(1,...Object.values(wx.pow));
    ctx.font="800 8px system-ui";ctx.fillStyle=C.muted;ctx.fillText("五行",28,79);
    wxElOrder.forEach((el,i)=>{
      const bx=64+i*15,by=68,bs=12;
      roundRect(bx,by,bs,bs,3,"#171020cc","#ffffff1f");
      const f=wx.pow[el]/maxPow;
      if(f>0){ctx.fillStyle=elements[el].color;roundRect(bx+1,by+1+(bs-2)*(1-f),bs-2,(bs-2)*f,2,elements[el].color)}
    });
    const nextNeed=wx.tier<3?tierNeed[wx.tier+1]:70;
    ctx.fillStyle=wx.tier>=3?C.purple:C.muted;ctx.textAlign="right";ctx.font="800 8px system-ui";
    ctx.fillText(wx.tier>=3?"阴阳相济 圆满":`${tierNames[wx.tier]||"五行之成"} ${Math.floor(wx.total)}/${nextNeed}`,360,79);ctx.textAlign="left";
    ctx.textAlign="right";ctx.fillText(`本章 ${Math.max(1,state.stage-state.pageStart+1)}/9`,360,77);ctx.textAlign="left";

    drawExperience();
    ctx.save();ctx.beginPath();ctx.rect(0,105,W,521);ctx.clip();
    for(const e of state.enemies)drawEnemy(e);
    if(state.selecting){ctx.strokeStyle="#ffd15baa";ctx.lineWidth=5;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();state.path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.fillStyle=C.gold;ctx.beginPath();ctx.arc(state.pointer.x,state.pointer.y,9,0,Math.PI*2);ctx.fill()}
    drawEffects();drawCompanions();ctx.restore();
    let activeElements=[(characters.find(c=>c.id===state.mainCharacter)||characters[0]).element];
    if(state.mainSchool&&!activeElements.includes(schoolMeta[state.mainSchool].element))activeElements.push(schoolMeta[state.mainSchool].element);
    if(level("waterRune"))activeElements.push("water");
    if(level("earthRune"))activeElements.push("earth");
    if(level("metalAura"))activeElements.push("metal");
    if(level("woodVine"))activeElements.push("wood");
    if(level("waterPulse"))activeElements.push("water");
    if(level("fireForge"))activeElements.push("fire");
    if(state.wuxing.tier>=2)activeElements.push(topWuxingEl());
    activeElements=[...new Set(activeElements)];
    if(activeElements.length){
      const activeSpec=Object.values(specializations).flat().find(s=>s.id===state.specialization);
      roundRect(24,585,342,37,12,"#171020df","#ffffff26");
      ctx.font="850 9px system-ui";ctx.textAlign="center";
      const shown=activeElements.slice(0,5),extra=activeElements.length-shown.length;
      const label=shown.map(id=>`${elements[id].name}伤`).join(" + ")+(extra>0?` 等${activeElements.length}系`:"");
      ctx.fillStyle=C.text;ctx.fillText(`当前属性：${label} · 同色抗 / 相克增伤`,195,599);
      ctx.fillStyle=activeSpec?schoolMeta[state.mainSchool].color:C.muted;
      const specText=state.mainSchool?(activeSpec?`专精：${activeSpec.name}`:"专精：本章第5难解锁"):`主位：${ownerMeta[state.mainCharacter].name}`;
      ctx.fillText(`${specText} · 五行连携 ${state.stats.elementCombos}`,195,614);ctx.textAlign="left";
    }
    drawHero();
    if(!skillButton.hidden){
      const skill=mainSkillMeta[state.mainCharacter]||mainSkillMeta.tang;
      const sealed=state.mainCharacter==="tang"&&level("silentVow")>0,cooling=state.skillCooldown>0;
      skillButton.disabled=sealed||cooling;
      skillButton.innerHTML=sealed?`<strong>戒</strong><small>闭口禅</small>`:`<strong>${cooling?Math.ceil(state.skillCooldown):skill.icon}</strong><small>${cooling?"冷却":skill.name}</small>`;
    }

    if(state.toastClock>0){roundRect(46,108,298,45,15,"#171020ed","#ffd15b55");ctx.fillStyle=C.text;ctx.textAlign="center";ctx.font="850 13px system-ui";ctx.fillText(state.toast,195,136);ctx.textAlign="left"}
    if(state.selecting){roundRect(78,716,234,33,15,"#ffd15b1c","#ffd15b66");ctx.fillStyle=C.gold;ctx.textAlign="center";ctx.font="950 13px system-ui";ctx.fillText(state.locked.length?`已点 ${state.locked.length} 妖 · 松手齐打`:"划过群妖进行点名",195,738);ctx.textAlign="left"}
    else if(state.movingMaster){ctx.fillStyle=C.gold;ctx.textAlign="center";ctx.font="850 12px system-ui";ctx.fillText(`左右拖动${ownerMeta[state.mainCharacter].name}躲避妖术`,195,739);ctx.textAlign="left"}
    else if(state.mode==="play"){ctx.fillStyle=C.muted;ctx.textAlign="center";ctx.font="780 11px system-ui";ctx.fillText(`战场划线锁妖 · 底部拖动${ownerMeta[state.mainCharacter].name}`,195,739);ctx.textAlign="left"}
    ctx.restore();

    debug.textContent=JSON.stringify({
      mode:state.mode,stage:state.stage,localStage:state.stage-state.pageStart+1,page:state.page,pageStart:state.pageStart,pageEnd:state.pageEnd,maxStage:81,doorHp:state.masterHp,maxDoorHp:state.maxMasterHp,kills:state.kills,wave:state.wave,wavesTotal:state.wavesTotal,bossSpawned:state.bossSpawned,
      charges:state.charges,maxCharges:state.maxCharges,enemies:state.enemies.filter(e=>e.alive).length,
      master:{x:Math.round(state.masterX),moving:state.movingMaster,still:+state.masterStill.toFixed(1),shield:state.masterShield,skillCooldown:+state.skillCooldown.toFixed(1)},hazards:state.hazards.map(h=>({x:Math.round(h.x),y:Math.round(h.y),damage:h.damage})),
      targets:state.enemies.filter(e=>e.alive).map(e=>({id:e.id,x:Math.round(e.x),y:Math.round(e.y),type:e.type,hp:+e.hp.toFixed(1),maxHp:e.maxHp,shield:e.shield,burn:e.burn,resist:e.resist,lastElement:e.lastElement})),
      difficulty:state.currentStage?{name:state.currentStage.name,act:state.currentStage.act,score:state.currentStage.score,hpScale:state.currentStage.hp,spdScale:state.currentStage.spd,modifier:state.currentStage.modifier||""}:null,
      levels:state.levels,mainSchool:state.mainSchool,schoolPoints:state.schoolPoints,evolutionStage:state.evolutionStage,evolutions:state.evolutions,specialization:state.specialization,
      relics:state.relics,treasures:meta.treasures,fusion:fusionName(),rewardType:state.rewardType,offered:state.offered,
      experience:{level:state.runLevel,xp:state.xp,need:state.xpNeed,pending:state.pendingLevelUps},
      meta:{scrolls:meta.scrolls,highest:meta.highest,selectedPage:meta.selectedPage,mainCharacter:meta.mainCharacter,lineup:meta.lineup,growth:meta.growth},mainCharacter:state.mainCharacter,attackMult:state.attackMult,wuxing:state.wuxing,wuxingMult:state.wuxingMult,wuxingLeakUsed:state.wuxingLeakUsed,runCompanions:state.runCompanions,focusOwner:state.focusOwner,ownerPicks:state.ownerPicks,earnedScrolls:state.earnedScrolls,
      effects:{arcs:state.arcs.length,sweeps:state.sweeps.length,flameTrails:state.flameTrails.length,cloneJumps:state.cloneJumps.length,wind:state.windWaves.length,lightning:state.lightnings.length,vortex:state.vortices.length,elementFx:state.elementFx.length},
      attackElements:[(characters.find(c=>c.id===state.mainCharacter)||characters[0]).element,state.mainSchool?schoolMeta[state.mainSchool].element:null,level("waterRune")?"water":null,level("earthRune")?"earth":null].filter(Boolean),
      stats:state.stats
    });
  }

  if(new URLSearchParams(location.search).has("probe")){
    window.__dsNextUniversal=()=>{try{return pickUniversalSlot(nextStagePreview()?.tally,[])}catch(e){return "ERR:"+e.message}};
  }

  function pointer(e){
    const r=canvas.getBoundingClientRect();
    return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};
  }
  canvas.addEventListener("pointerdown",e=>{
    if(state.mode!=="play")return;
    const p=pointer(e);canvas.setPointerCapture(e.pointerId);
    if(p.y>=620){
      state.movingMaster=true;state.masterStill=0;state.masterX=clamp(p.x,92,298);return;
    }
    state.selecting=true;state.pointer=p;state.path=[p];lockNearby();
  });
  canvas.addEventListener("pointermove",e=>{
    const p=pointer(e);
    if(state.movingMaster){state.masterX=clamp(p.x,92,298);state.masterStill=0;return}
    if(!state.selecting)return;
    state.pointer=p;const last=state.path[state.path.length-1];
    if(!last||Math.hypot(last.x-state.pointer.x,last.y-state.pointer.y)>8){state.path.push(state.pointer);if(state.path.length>44)state.path.shift()}
    lockNearby();
  });
  canvas.addEventListener("pointerup",()=>{
    if(state.movingMaster){state.movingMaster=false;return}
    fireAttack();
  });
  canvas.addEventListener("pointercancel",()=>{
    if(state.movingMaster){state.movingMaster=false;return}
    fireAttack();
  });
  skillButton.addEventListener("click",castSutra);
  pauseButton.addEventListener("click",pauseGame);
  document.querySelector("#resume-game").addEventListener("click",resumeGame);
  document.querySelector("#quit-game").addEventListener("click",showLobby);
  document.querySelector("#start").addEventListener("click",()=>{intro.hidden=true;reset()});
  const nextStageBtn=document.querySelector("#next-stage");
  if(nextStageBtn)nextStageBtn.addEventListener("click",()=>{result.hidden=true;reset()});
  document.querySelector("#restart").addEventListener("click",showLobby);
  document.querySelectorAll("[data-lobby-tab]").forEach(button=>button.addEventListener("click",()=>setLobbyTab(button.dataset.lobbyTab)));
  chapterPrev.addEventListener("click",()=>{if(meta.selectedPage>1){meta.selectedPage--;refreshLobby()}});
  chapterNext.addEventListener("click",()=>{if(meta.selectedPage<unlockedPages()){meta.selectedPage++;refreshLobby()}});
  stageMainRoster.addEventListener("click",event=>{
    const button=event.target.closest("[data-stage-main]");
    if(button&&!button.disabled)setMainCharacter(button.dataset.stageMain);
  });
  growthRoster.addEventListener("click",event=>{
    const button=event.target.closest("[data-growth-character]");
    if(!button||!isUnlocked(button.dataset.growthCharacter))return;
    selectedGrowthId=button.dataset.growthCharacter;refreshLobby();
  });
  growthDetail.addEventListener("click",event=>{
    const button=event.target.closest("[data-grow]");
    if(button)buyScripture(button.dataset.grow);
  });
  partnerList.addEventListener("click",event=>{
    const mainButton=event.target.closest("[data-main]");
    if(mainButton&&!mainButton.disabled&&isUnlocked(mainButton.dataset.main)){
      setMainCharacter(mainButton.dataset.main);
      return;
    }
    const button=event.target.closest("[data-lineup]");
    if(!button||button.disabled||!isUnlocked(button.dataset.lineup))return;
    const id=button.dataset.lineup,index=meta.lineup.indexOf(id);
    if(id===meta.mainCharacter)return;
    if(index>=0)meta.lineup.splice(index,1);else meta.lineup.push(id);
    saveMeta();refreshLobby();
  });
  buildCards.addEventListener("click",e=>{
    const power=e.target.closest("[data-power]"),treasure=e.target.closest("[data-treasure]"),spec=e.target.closest("[data-spec]");
    if(power)choosePower(power.dataset.power);
    if(treasure)chooseTreasure(treasure.dataset.treasure);
    if(spec)chooseSpecialization(spec.dataset.spec);
  });

  let last=performance.now();
  function frame(now){
    const dt=Math.min(.033,(now-last)/1000)*speed;last=now;
    update(dt);draw();requestAnimationFrame(frame);
  }
  refreshLobby();
  requestAnimationFrame(frame);
})();
