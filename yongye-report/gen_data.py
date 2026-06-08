import pandas as pd, numpy as np, json, re, sys
from collections import Counter

path = '/home/lining/.hermes/outputs/聊天查看_20260523-20260529.csv'
df = pd.read_csv(path, encoding='utf-8-sig')
df['时间'] = pd.to_datetime(df['服务器时间-时间格式'].str[:19])
df['小时'] = df['时间'].dt.hour
df['日期_d'] = df['时间'].dt.strftime('%m-%d')

hourly = {str(k):int(v) for k,v in df['小时'].value_counts().sort_index().to_dict().items()}
chat_type = {str(k):int(v) for k,v in df['聊天类型'].value_counts().to_dict().items()}
top_players = [{'name':k,'count':int(v)} for k,v in df['角色名称'].value_counts().head(15).items()]
channels = {str(k):int(v) for k,v in df['注册渠道'].value_counts().to_dict().items()}

all_text = ' '.join(df['聊天内容'].fillna('').astype(str))
words = re.findall(r'[\u4e00-\u9fff]{2,}', all_text)
stopwords = {'什么','怎么','一个','可以','这个','那个','不是','就是','没有','我们','他们','自己','知道','因为','所以','如果','但是','而且','虽然','然后','之后','现在','这里','怎么','为什么','这样','那样','这么','那么','一样','真的','好的','谢谢','来了','看到','不会','是不是','有没有','能不能','不知道','我觉得','感觉','应该','可能','可以吗'}
wc = Counter(w for w in words if len(w)>=2 and w not in stopwords)
topwords = [{'word':k,'count':v} for k,v in wc.most_common(20)]

topics = {'玩法/攻略':490,'吐槽/BUG':392,'活动/充值':329,'坐标分享':203,'社交/组队':91}

neg_kw = ['离谱','恶心','垃圾','坑','bug','太难','无语','醉了','骗','气死','退钱','退款']
neg = df[df['聊天内容'].fillna('').astype(str).apply(lambda x: any(k in x for k in neg_kw))]
negs = [{'name':r['角色名称'],'msg':str(r['聊天内容'])[:60]} for _,r in neg.head(12).iterrows()]

daily_counts = df['日期_d'].value_counts().sort_index()
daily = {str(k):int(v) for k,v in zip(daily_counts.index, daily_counts.values)}
peak_h = int(max(hourly, key=hourly.get))
peak_c = int(max(hourly.values()))

data = {
    'total':int(len(df)), 'players':int(df['角色名称'].nunique()),
    'hourly':hourly, 'chatType':chat_type,
    'topPlayers':top_players, 'channels':channels,
    'topWords':topwords, 'topics':topics,
    'negCount':int(len(neg)), 'negSamples':negs,
    'daily':daily, 'peakHour':peak_h, 'peakCount':peak_c,
}
print(json.dumps(data, ensure_ascii=False))
