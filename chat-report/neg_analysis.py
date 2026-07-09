import pandas as pd, json
from collections import Counter

path = '/home/lining/.hermes/outputs/聊天查看_20260523-20260529.csv'
df = pd.read_csv(path, encoding='utf-8-sig')
neg_kw = ['离谱','恶心','垃圾','坑','bug','太难','无语','醉了','骗','气死','退钱','退款']
neg = df[df['聊天内容'].fillna('').astype(str).apply(lambda x: any(k in x for k in neg_kw))]

categories = {
    '月卡/付费捆绑': ['月卡','特权卡','氪金','充钱','骗钱','骗人氪金','付费','自动弄到月卡'],
    'BOSS/战斗体验': ['BOSS','boss','难打','打不过','死了奖励','元婴','金丹磨'],
    '主线/剧情': ['主线','剧情','任务'],
    '机制/平衡': ['机制','平衡','坑比','离谱'],
    '画风不符预期': ['画风骗','被骗进来','米二画风'],
}
results = []
for msg in neg['聊天内容'].fillna('').astype(str):
    cat = '其他'
    for c,kws in categories.items():
        if any(k in msg for k in kws):
            cat = c; break
    results.append({'cat':cat,'msg':msg[:80]})

cat_counts = Counter(r['cat'] for r in results)
output = {'total':len(results), 'categories':[]}
for cat, cnt in cat_counts.most_common():
    samples = [r['msg'] for r in results if r['cat']==cat][:3]
    output['categories'].append({'name':cat,'count':cnt,'pct':round(cnt/len(results)*100),'samples':samples})
print(json.dumps(output, ensure_ascii=False))
