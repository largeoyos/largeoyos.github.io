# 数据结构复习:KMP 算法

这是整个数据结构课里**最难理解**的算法之一,也是串匹配的巅峰之作。但只要你跟着我一步步推导,会发现它其实有清晰的逻辑。这节我会花较多篇幅在**原理讲解**上,因为 KMP 的代码很短,但不懂原理就是"天书"。

---

### 一、为什么需要 KMP?先看朴素匹配的痛点

假设主串 `S = "ababcababa"`,模式串 `T = "ababa"`,我们要找 T 在 S 中第一次出现的位置。

**朴素匹配(BF 算法)**的思路:从 S[0] 开始逐字符比对 T,不匹配就让 S 回退到开始位置的下一位,T 回到 0,重新比。

```
S: a b a b c a b a b a
T: a b a b a           ← 前 4 位匹配,第 5 位 c≠a 失败
   ↓ 让 i 回退到 1,j 回到 0,重来
S: a b a b c a b a b a
T:   a b a b a         ← 又失败
...
```

问题出在哪?**每次失败都把 i 回退**,这些回退其实重复比对了已经知道的信息。时间复杂度 O(nm)。

**KMP 的核心思想**:i **永远不回退**,只让 j(模式串指针)回退到一个"合适的位置"继续比较。这个"合适的位置"由模式串 T 自身的结构决定,与主串 S 无关——所以可以**预处理**出来,这就是著名的 `next` 数组。

---

### 二、next 数组的本质(这是 KMP 的灵魂)

**next[j] 的含义**:当模式串第 j 位失配时,j 应该回退到哪个位置。

它等价于:**T[0..j-1] 这个前缀中,最长的"相等前后缀"的长度**。

什么叫"相等前后缀"?看例子,串 `"ababa"` 的前缀有:`a`, `ab`, `aba`, `abab`;后缀有:`a`, `ba`, `aba`, `baba`。相等的前后缀是 `a` 和 `aba`,最长长度是 3。

为什么"最长相等前后缀"就是 j 失配时的回退位置?**因为既然这段前缀和这段后缀相等,那么当后缀已经和主串匹配上时,我们可以直接让前缀"滑过来"继续比较,跳过中间的比对**。

这个点是 KMP 最难的地方,你可能需要反复读几遍。我用一个图来说明:

```
         (已匹配部分)
S: ... a b a b a X ...        ← X 是失配字符
T:     a b a b a b            ← 假设 T="ababab",在第 5 位失配
       └前缀┘└后缀┘
       
相等的前后缀:"aba"(长度 3)
既然后缀 "aba" 已经和 S 中对应位置匹配,
我们直接把 T 前缀 "aba" 滑到这个位置:

S: ... a b a b a X ...
T:         a b a b a b        ← j 从 3 开始继续比
             ↑ 
             j = 3
```

所以对模式串 T = "ababab",next[5] = 3。

---

### 三、两种 next 数组的约定(必须分清)

教材对 next 数组有两种常见定义,一定要看清楚你的教材用的是哪种,否则代码会错位:

**约定一**(严蔚敏教材,数组下标从 1 开始,**考研主流**):

- `next[1] = 0`(特殊值,表示需要 i 也后移)
- `next[2] = 1`
- 从 `next[3]` 开始才是真正的"最长相等前后缀长度 + 1"

**约定二**(算法导论,数组下标从 0 开始):

- `next[0] = -1` 或 `next[0] = 0`
- `next[j]` 就是真实的最长相等前后缀长度

两种约定的 next 值相差 1,对应的匹配代码也不同。**我们采用约定一(严蔚敏版)**,因为这是中文考研和教材的标准写法。

---

### 四、手算 next 数组(以 T = "ababaa" 为例)

**必须会手算**,否则考试选择题做不出来。我用约定一:下标从 1 开始,next[1] = 0,next[2] = 1。

|j|1|2|3|4|5|6|
|---|---|---|---|---|---|---|
|T[j]|a|b|a|b|a|a|
|next[j]|0|1|1|2|3|4|

逐项推导:

**next[1] = 0**(规定)。**next[2] = 1**(规定)。

**next[3]**:看 T[1..2] = "ab",最长相等前后缀长度 = 0(前缀"a",后缀"b",不等),+1 = 1。

**next[4]**:看 T[1..3] = "aba",最长相等前后缀 "a"(长度 1),+1 = 2。

**next[5]**:看 T[1..4] = "abab",最长相等前后缀 "ab"(长度 2),+1 = 3。

**next[6]**:看 T[1..5] = "ababa",最长相等前后缀 "aba"(长度 3),+1 = 4。

**记忆套路**:j 位置的 next 值,看 j 之前(不含 j)那段串的最长相等前后缀长度再加 1。考场上这样手算是最稳的。

---

### 五、项目文件组织

```
DataStructure/
└── KMP/
    ├── KMP.h
    ├── KMP.cpp
    └── main.cpp
```

---

### 六、KMP.h

cpp

```cpp
#pragma once

#define MAXLEN 255

// 串的定长顺序存储(严蔚敏教材风格,下标从 1 开始)
typedef struct {
    char ch[MAXLEN + 1];    // ch[0] 不用,字符存在 ch[1..length]
    int length;             // 串的当前长度
} SString;

// ========== 基本操作 ==========
bool StrAssign(SString &S, const char *chars);   // 从 C 字符串赋值
int  StrLength(SString S);

// ========== KMP 核心函数 ==========
void GetNext(SString T, int next[]);              // 求 next 数组
void GetNextval(SString T, int nextval[]);        // 求优化版 nextval 数组
int  Index_KMP(SString S, SString T, int next[]); // KMP 匹配,返回 T 在 S 中的位置
int  Index_BF(SString S, SString T);              // 朴素匹配(对比用)
```

**关于下标**:严蔚敏教材约定串的下标从 1 开始(ch[0] 不用),这样 next[1] = 0 才有意义。我们严格遵循这个约定。

---

### 七、KMP.cpp 完整实现

#### 7.1 基础操作

cpp

```cpp
#include "KMP.h"
#include <cstring>

bool StrAssign(SString &S, const char *chars) {
    int len = strlen(chars);
    if (len > MAXLEN) return false;
    for (int i = 0; i < len; i++) {
        S.ch[i + 1] = chars[i];      // 从下标 1 开始存
    }
    S.length = len;
    return true;
}

int StrLength(SString S) {
    return S.length;
}
```

#### 7.2 朴素匹配(对比基准)

cpp

```cpp
int Index_BF(SString S, SString T) {
    int i = 1, j = 1;
    while (i <= S.length && j <= T.length) {
        if (S.ch[i] == T.ch[j]) {
            i++; j++;
        } else {
            i = i - j + 2;           // i 回退到下一个起点
            j = 1;                   // j 回到开头
        }
    }
    if (j > T.length) return i - T.length;   // 匹配成功
    return 0;                                 // 匹配失败返回 0
}
```

这里 `i = i - j + 2` 是什么意思?i 当前位置 - 已匹配长度 + 下一个起点,即 `i - (j-1) + 1 = i - j + 2`。

#### 7.3 求 next 数组(KMP 的精髓)

这段代码是考研默写级别的,必须背下来:

cpp

```cpp
void GetNext(SString T, int next[]) {
    int i = 1, j = 0;
    next[1] = 0;
    while (i < T.length) {
        if (j == 0 || T.ch[i] == T.ch[j]) {
            i++; j++;
            next[i] = j;             // 关键赋值
        } else {
            j = next[j];             // j 回退,继续比
        }
    }
}
```

**这段代码本质是"模式串自己和自己做 KMP 匹配"**,用递推方式算出每个位置的 next 值。我来帮你模拟一遍 T = "ababaa"(长度 6):

初始 `i=1, j=0, next[1]=0`。

第一轮:`j==0`,进入 if,`i=2, j=1, next[2]=1`。

第二轮:`T[2]='b', T[1]='a'`,不等,进入 else,`j = next[1] = 0`。

第三轮:`j==0`,进入 if,`i=3, j=1, next[3]=1`。

第四轮:`T[3]='a', T[1]='a'`,相等,`i=4, j=2, next[4]=2`。

第五轮:`T[4]='b', T[2]='b'`,相等,`i=5, j=3, next[5]=3`。

第六轮:`T[5]='a', T[3]='a'`,相等,`i=6, j=4, next[6]=4`。

循环结束(i=6 不满足 i<6)。结果 `next[] = [_, 0, 1, 1, 2, 3, 4]`,与我们前面手算完全一致。

#### 7.4 KMP 匹配

cpp

```cpp
int Index_KMP(SString S, SString T, int next[]) {
    int i = 1, j = 1;
    while (i <= S.length && j <= T.length) {
        if (j == 0 || S.ch[i] == T.ch[j]) {
            i++; j++;                // 匹配或 j==0(越界边界)时同时后移
        } else {
            j = next[j];             // i 不动,只有 j 回退
        }
    }
    if (j > T.length) return i - T.length;   // 匹配成功
    return 0;
}
```

**请注意这段代码和求 next 的代码极其相似**,不是巧合——它们本质是同一种逻辑。这也是 KMP 为什么精妙的原因:求 next 就是模式串自己的"自我匹配"。

**`j == 0` 的特殊处理**:当 j 已经回退到 0(next[1]=0 触发的),表示连第一个字符都不匹配了,这时必须 i++ j++ 同时后移,让 i 跳到下一位、j 从 1 开始重新比。这就是为什么约定 next[1] = 0,它是一个"哨兵",指示"i 也要往前走"。

---

### 八、nextval 数组(KMP 的进一步优化)

先看一个 next 数组的**低效场景**:T = "aaaab",next 数组是 `[_, 0, 1, 2, 3, 4]`。

假设主串是 `"aaabaaaab"`,在 j=4 处失配(T[4]='a', S 对应位置='b')。按 next[4]=3 回退,j 变成 3,再比 T[3]='a' vs S 中的 'b',还是失配!接着 j=next[3]=2,T[2]='a' vs 'b',继续失配……**连续四次失败的比对,全是在比同一个字符 'a'**。

**问题本质**:如果 `T[j] == T[next[j]]`,那么 j 回退后比较的还是同一个字符,必然再次失败。nextval 的优化就是把这种无效回退**一次性做到位**。

#### nextval 的改进规则

对于每个位置 j:

如果 `T[j] != T[next[j]]`,那么 `nextval[j] = next[j]`(和原来一样)。如果 `T[j] == T[next[j]]`,那么 `nextval[j] = nextval[next[j]]`(直接"接管"前面那个位置的 nextval)。

#### 代码实现

cpp

```cpp
void GetNextval(SString T, int nextval[]) {
    int i = 1, j = 0;
    nextval[1] = 0;
    while (i < T.length) {
        if (j == 0 || T.ch[i] == T.ch[j]) {
            i++; j++;
            if (T.ch[i] != T.ch[j]) {
                nextval[i] = j;
            } else {
                nextval[i] = nextval[j];   // 接管
            }
        } else {
            j = nextval[j];                // 这里也用 nextval
        }
    }
}
```

#### 手算 nextval(T = "ababaa")

|j|1|2|3|4|5|6|
|---|---|---|---|---|---|---|
|T[j]|a|b|a|b|a|a|
|next[j]|0|1|1|2|3|4|
|nextval[j]|0|1|0|1|0|4|

推导逻辑:j=3 时 T[3]='a' == T[next[3]]=T[1]='a',所以 nextval[3] = nextval[1] = 0。j=5 时 T[5]='a' == T[next[5]]=T[3]='a',所以 nextval[5] = nextval[3] = 0。j=6 时 T[6]='a' != T[next[6]]=T[4]='b',所以 nextval[6] = next[6] = 4(保持)。

**考研真题高频考点**:给你一个模式串,让你手算 next 和 nextval,并指出两者的区别。一定要练。

---

### 九、测试代码(main.cpp)

cpp

```cpp
#include "KMP.h"
#include <iostream>
using namespace std;

int main() {
    SString S, T;
    StrAssign(S, "ababcababaaababaa");
    StrAssign(T, "ababaa");

    int next[MAXLEN + 1], nextval[MAXLEN + 1];
    GetNext(T, next);
    GetNextval(T, nextval);

    cout << "模式串 T = ";
    for (int i = 1; i <= T.length; i++) cout << T.ch[i];
    cout << endl;

    cout << "next[]    : ";
    for (int i = 1; i <= T.length; i++) cout << next[i] << " ";
    cout << endl;

    cout << "nextval[] : ";
    for (int i = 1; i <= T.length; i++) cout << nextval[i] << " ";
    cout << endl;

    int pos1 = Index_BF(S, T);
    int pos2 = Index_KMP(S, T, next);
    cout << "BF  匹配位置: " << pos1 << endl;
    cout << "KMP 匹配位置: " << pos2 << endl;

    return 0;
}
```

预期输出:

```
next[]    : 0 1 1 2 3 4 
nextval[] : 0 1 0 1 0 4 
BF  匹配位置: 12
KMP 匹配位置: 12
```

---

### 十、复杂度分析(必须会说)

**时间复杂度**:求 next 是 O(m),主匹配过程是 O(n),总计 **O(n+m)**。为什么是线性的?因为 i 从不回退,j 虽然可能回退但总移动次数有上限。

**空间复杂度**:next 数组是 O(m)。

**对比朴素匹配 O(nm)**,KMP 在长串匹配下优势巨大。比如 S 长 10000,T 长 100:BF 最坏 100万次比对,KMP 只需 10100 次。

---

### 十一、考研高频思考题(请作答)

第一题,模式串 T = "abaabc",手算它的 next 数组和 nextval 数组。

第二题,对于模式串 "aaaaab",它的 next 数组和 nextval 数组分别是什么?这个例子能最直观地看出 nextval 的优化效果——请指出优化体现在哪里。

第三题,在 KMP 匹配过程中,假设在 j=5 处失配,next[5]=3。请问下一步 j 变成多少?**i 会变化吗**?为什么?

第四题,若采用教材约定(下标从 1 开始),next[1] 为什么规定为 0 而不是其他值?(提示:想想 j=0 在 KMP 主匹配代码中的作用)