import re

with open('/mnt/d/NapCatQQ/data/parsed_today.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

msgs = []
for line in lines:
    if '|' not in line: continue
    parts = line.strip().split('|')
    if len(parts) >= 3:
        msgs.append({'time': parts[0], 'user': parts[1], 'text': parts[2].strip()})

print(f'总消息: {len(msgs)}')

# 话题相关片段
topics_data = {
    '传功限制争议': ['传功','次数','1次','无限'],
    '充值竞争与排行榜': ['充','氪金','榜','首充','648','98元','排行','5000','2000'],
    '国战系统初体验': ['国战','BOSS','长春','麻了','阵营','大唐','一国独大'],
    '肝度与自动化争议': ['肝','自动','月卡','扫荡','减负','太肝'],
    '概率/数值信任危机': ['概率','运气','最低','88','失败','20多','1%'],
}

for topic, kws in topics_data.items():
    matched = [m for m in msgs if any(k in m['text'] for k in kws)]
    print(f'\n## {topic} ({len(matched)}条)')
    for m in matched[:5]:
        print(f'[{m["user"]}] {m["text"][:60]}')

# 反馈相关片段
feedback_data = {
    '传功次数太少': ['传功','次数','1次'],
    '游戏太肝缺乏自动化': ['肝','自动','月卡'],
    '论道奖励概率存疑': ['论道','88','概率'],
    '国战平衡堪忧': ['国战','大唐','麻了'],
}

print('\n\n## 玩家反馈片段')
for topic, kws in feedback_data.items():
    matched = [m for m in msgs if any(k in m['text'] for k in kws)]
    print(f'\n### {topic} ({len(matched)}条)')
    for m in matched[:5]:
        print(f'[{m["user"]}] {m["text"][:60]}')

# 关键词相关
keyword_data = {
    '角色/英雄': ['角色','英雄','门客'],
    '功能/系统': ['功能','系统','界面','入口','设置'],
    '玩家吐槽': ['无语','醉了','离谱','恶心','垃圾','坑'],
}
print('\n\n## 关键词相关片段')
for topic, kws in keyword_data.items():
    matched = [m for m in msgs if any(k in m['text'] for k in kws)]
    print(f'\n### {topic} ({len(matched)}条)')
    for m in matched[:5]:
        print(f'[{m["user"]}] {m["text"][:60]}')
