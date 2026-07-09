import pandas as pd, json, re
from collections import Counter

path = '/home/lining/.hermes/outputs/聊天查看_20260523-20260529.csv'
df = pd.read_csv(path, encoding='utf-8-sig')
df['时间'] = pd.to_datetime(df['服务器时间-时间格式'].str[:19])
df['小时'] = df['时间'].dt.hour

all_text = ' '.join(df['聊天内容'].fillna('').astype(str))

# ===== 1. 玩家反馈含心理分析 =====
# 按心理动因归类
psych_cats = {
    '损失厌恶（付费焦虑）': {
        'keywords': ['月卡','特权卡','氪金','充钱','骗钱','骗人氪金','付费','退钱','退款','自动弄到月卡','花钱'],
        'desc': '玩家对游戏付费设计产生抵触，核心是"被强迫感"而非消费本身。自动功能捆绑月卡触发损失厌恶——不买月卡就失去便利，玩家感到被要挟。',
        'color': '#ff6b6b'
    },
    '挫败感（难度曲线）': {
        'keywords': ['难打','打不过','死了奖励','坑比','太难','BOSS','元婴','金丹磨','破玩意','真难'],
        'desc': '玩家在BOSS战中反复失败，且死亡后无奖励导致"努力无回报"的挫败感。这是典型的习得性无助——玩家认为投入时间也无法获得预期回报。',
        'color': '#ffa726'
    },
    '认知失调（画风vs玩法）': {
        'keywords': ['画风骗','被骗进来','米二画风','不知道在玩啥'],
        'desc': '玩家被高品质美术吸引下载，但实际玩法与预期不符。这是"高期望落差"——美术拉高了期待值，但玩法体验接不住。买量素材与 gamepay 不一致。',
        'color': '#42a5f5'
    },
    '公平感知（机制质疑）': {
        'keywords': ['离谱','机制','垃圾','恶心','无语','醉了','什么玩意'],
        'desc': '玩家对游戏机制产生不公感，认为设计不合理（如自动绑月卡）。公平理论：玩家在比较"投入/产出比"时感到倾斜。',
        'color': '#ab47bc'
    },
    '社交需求（加好友/求带）': {
        'keywords': ['加好友','一起玩','带带','组队','求带','一起论道','加我'],
        'desc': '玩家主动寻求社交连接，说明游戏内缺乏有效的社交匹配系统。这是未被满足的归属需求——玩家需要被接纳和指导。',
        'color': '#51cf66'
    },
    '信息焦虑（攻略求助）': {
        'keywords': ['攻略','怎么打','怎么过','求攻略','怎么玩','怎么弄','不懂','怎么搞'],
        'desc': '玩家在新手阶段频繁求助，说明游戏引导不足。玩家处于"不知道该怎么玩"的焦虑状态，需要更清晰的PUA（渐进式引导）。',
        'color': '#26c6da'
    },
}

psych_results = []
total_msgs = len(df)
for cat, info in psych_cats.items():
    matching = df[df['聊天内容'].fillna('').astype(str).apply(lambda x: any(k in x for k in info['keywords']))]
    count = len(matching)
    pct = round(count/total_msgs*100, 1)
    samples = matching['聊天内容'].dropna().astype(str).unique()[:3]
    psych_results.append({
        'name': cat,
        'desc': info['desc'],
        'count': count,
        'pct': pct,
        'color': info['color'],
        'samples': [s[:50] for s in samples]
    })

# ===== 2. 玩家行为洞察 =====
# 活跃度分布
player_msg_counts = df['角色名称'].value_counts()
avg_msgs = player_msg_counts.mean()
# 高频玩家（>100条）
heavy_users = (player_msg_counts > 100).sum()
# 低频玩家（仅1-2条）
light_users = (player_msg_counts <= 2).sum()

# 社交行为
friend_reqs = df[df['聊天内容'].fillna('').astype(str).str.contains('加好友|加我|一起|组队')].shape[0]
share_behav = df[df['聊天方式'].isin(['地块分享(4)','兵器分享(6)','灵兽分享(7)'])].shape[0]
help_seeking = len(df[df['聊天内容'].fillna('').astype(str).apply(lambda x: any(k in x for k in ['怎么','求','攻略','带带','帮','教教','不懂']))])
# 活跃时段
peak_hour_msgs = df[df['小时'].isin([15])].shape[0]
night_hour_msgs = df[df['小时'].isin([23,0,1,2,3,4])].shape[0]

behavior = {
    'avgMsgsPerPlayer': round(avg_msgs, 1),
    'heavyUserCount': int(heavy_users),
    'heavyUserPct': round(heavy_users/player_msg_counts.nunique()*100, 1),
    'lightUserCount': int(light_users),
    'lightUserPct': round(light_users/player_msg_counts.nunique()*100, 1),
    'friendRequests': int(friend_reqs),
    'shareBehavior': int(share_behav),
    'helpSeeking': int(help_seeking),
    'peakHourMsgs': int(peak_hour_msgs),
    'peakHourPct': round(peak_hour_msgs/total_msgs*100, 1),
    'nightMsgs': int(night_hour_msgs),
    'nightPct': round(night_hour_msgs/total_msgs*100, 1),
    'totalPlayers': int(player_msg_counts.nunique()),
}

# 聊天方式分析
method_counts = df['聊天方式'].value_counts()
behavior['chatMethods'] = {str(k):int(v) for k,v in method_counts.to_dict().items()}

# ===== 3. 数据洞察 =====
# 渠道集中度
ch_top = df['注册渠道'].value_counts()
ch_concentration = round(ch_top.iloc[0]/ch_top.sum()*100, 1)
# 时间集中度
hour_top3 = df['小时'].value_counts().head(3)
time_concentration = round(hour_top3.sum()/total_msgs*100, 1)

insights = {
    'channelConcentration': ch_concentration,
    'topChannel': str(ch_top.index[0]),
    'timeConcentration': time_concentration,
    'topHours': [int(h) for h in hour_top3.index],
    'msgPerPlayer': round(total_msgs/player_msg_counts.nunique(), 1),
    'socialRatio': round((friend_reqs+share_behav)/total_msgs*100, 1),
    'helpRatio': round(help_seeking/total_msgs*100, 1),
}

output = {
    'psychAnalysis': psych_results,
    'behavior': behavior,
    'insights': insights,
}

print(json.dumps(output, ensure_ascii=False))
