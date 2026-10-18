import sys

print("Python:", sys.executable)
print("Encoding:", sys.stdout.encoding)

study_minutes=[30,45,20,60,25]
print("每天的学习时间")
total=sum(study_minutes)
days=len(study_minutes)
print("总学习时间:",total,"分钟")
print("平均每天学习时间:",total/days,"分钟")
print("总学习天数",days)
longest=max(study_minutes)
print("最长学习时间:",longest,"分钟")
print("高于平均值的学习时间:")
for minutes in study_minutes:
    if minutes>total/days:
        print(minutes,"分钟")
        