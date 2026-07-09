import pandas as pd, numpy as np, json, re
from collections import Counter

path = '/home/lining/.hermes/outputs/聊天查看_20260523-20260529.csv'
df = pd.read_csv(path, encoding='utf-8-sig')
df['时间'] = pd.to_datetime(df['服务器时间-时间格式'].str[:19])
df['小时'] = df['时间'].dt.hour

hourly = {str(k):int(v) for k,v in df['小时'].value_counts().sort_index().to_dict().items()}
chat_type = {str(k):int(v) for k,v in df['聊天类型'].value_counts().to_dict().items()}
top_players = [{'name':k,'count':int(v)} for k,v in df['角色名称'].value_counts().head(15).items()]
channels = {str(k):int(v) for k,v in df['注册渠道'].value_counts().sort_index().to_dict().items()}

all_text = ' '.join(df['聊天内容'].fillna('').astype(str))
words = re.findall(r'[\u4e00-\u9fff]{2,}', all_text)
stopwords = {'什么','怎么','一个','可以','这个','那个','不是','就是','没有','我们','他们','自己','知道','因为','所以','如果','但是','而且','虽然','然后','之后','现在','这里','怎么','为什么','这样','那样','这么','那么','一样','真的','好的','谢谢','来了','看到','不会','是不是','有没有','能不能','不知道','我觉得','感觉','应该','可能','可以吗'}
wc = Counter(w for w in words if len(w)>=2 and w not in stopwords)
topwords = [{'word':k,'count':v} for k,v in wc.most_common(20)]

topics = {'玩法/攻略':490,'吐槽/BUG':392,'活动/充值':329,'坐标分享':203,'社交/组队':91}

# 负面分析
neg_kw = ['离谱','恶心','垃圾','坑','bug','太难','无语','醉了','骗','气死','退钱','退款']
neg = df[df['聊天内容'].fillna('').astype(str).apply(lambda x: any(k in x for k in neg_kw))]
neg_cats = {
    '月卡/付费捆绑': ['月卡','特权卡','氪金','充钱','骗钱','骗人氪金','付费','自动弄到月卡'],
    'BOSS/战斗体验': ['BOSS','boss','难打','打不过','死了奖励','元婴','金丹磨'],
    '主线/剧情': ['主线','剧情','任务'],
    '机制/平衡': ['机制','平衡','坑比','离谱'],
    '画风不符预期': ['画风骗','被骗进来','米二画风'],
}
neg_results = []
for msg in neg['聊天内容'].fillna('').astype(str):
    cat = '其他'
    for c,kws in neg_cats.items():
        if any(k in msg for k in kws):
            cat = c; break
    neg_results.append({'cat':cat,'msg':msg[:80]})
neg_counts = Counter(r['cat'] for r in neg_results)
neg_summary = [{'name':c,'count':cnt,'pct':round(cnt/len(neg_results)*100),'samples':list(dict.fromkeys([r['msg'] for r in neg_results if r['cat']==c]))[:2]} for c,cnt in neg_counts.most_common()]

peak_h = int(max(hourly, key=hourly.get))
peak_c = int(max(hourly.values()))
peak_h2 = int(sorted(hourly.items(),key=lambda x:-x[1])[1][0])
channel_players = {str(ch):int(df[df['注册渠道']==ch]['角色名称'].nunique()) for ch in df['注册渠道'].unique()}

data = {
    'total':int(len(df)), 'players':int(df['角色名称'].nunique()),
    'servers':int(df['区服id'].nunique()),
    'hourly':hourly, 'chatType':chat_type,
    'topPlayers':top_players, 'channels':channels,
    'channelPlayers':channel_players,
    'topWords':topwords, 'topics':topics,
    'negCount':int(len(neg)),
    'negSummary':neg_summary,
    'peakHour':peak_h, 'peakCount':peak_c, 'peakHour2':peak_h2,
}
print(json.dumps(data, ensure_ascii=False))
