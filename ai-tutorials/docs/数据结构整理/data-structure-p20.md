# 数据结构复习:最小生成树(Prim 与 Kruskal)

好,我们进入**最小生成树**(Minimum Spanning Tree,MST)。这是图论里**最优美的一章**——概念直观、代码简洁、两种算法思想完全不同却都很经典。我还会顺便带你学**并查集**(Kruskal 算法的灵魂伴侣),一种极其简洁又极其强大的数据结构。

---

### 一、问题引入

**经典场景**:n 个城市,想修一个**互联互通**的公路网,使得任意两城之间都能互通(可以经过其他城市)。每条可能的公路都有成本,如何规划使得**总成本最低**?

**抽象**:给一张**带权无向连通图** G,找一棵**生成树 T**(包含所有顶点、n-1 条边、连通、无环),使得 T 的**边权之和最小**。这棵 T 就是**最小生成树**。

---

### 二、核心概念

#### 2.1 生成树的基本性质

回忆一下:**n 个顶点的生成树恰好有 n-1 条边**。为什么?

因为生成树是一棵树,而树的定义是"连通且无环",它必然有 n-1 条边(少了不连通,多了出环)。**所以 MST 的构造本质是:在所有边中挑 n-1 条,既要连通所有点又要总权最小**。

#### 2.2 MST 的两个关键性质

**性质一(MST 的不唯一性)**:一张图可能有**多棵不同**的 MST(如果边权有重复)。但**所有 MST 的总权值必然相等**——这是最小权,本就只有一个值。

**性质二(割性质 / Cut Property)**:如果把图的顶点分成两个非空集合 U 和 V\U,那么**连接 U 和 V\U 的所有边中,权值最小的那条**一定属于某棵 MST。

**这个性质是两个算法正确性的共同基础**。Prim 算法每次都在找"连接已选集合和未选集合的最小边";Kruskal 每次选最小边,本质也是"跨某个割的最小边"。

---

### 三、Prim 算法(普里姆)

#### 3.1 核心思想

**"从一个顶点出发,像滚雪球一样逐步扩大"**。

把顶点分成两组:**已在生成树中**的(初始只有起点)、**尚未加入**的。每一步从"连接两组的所有边"中,挑**权值最小**的那条,把对应的新顶点加入"已在"组。重复 n-1 次,所有顶点都加入。

**直观类比**:从家出发铺路,每次伸出一条**最便宜的路**到最近的新邻居,直到覆盖所有城市。

#### 3.2 实现核心:lowcost 数组

Prim 的经典实现依赖两个辅助数组:

**lowcost[i]**:**顶点 i 到"已在树中的集合"的最小边权**。如果 i 已在树中,lowcost[i] = 0。

**closest[i]**:这条最小边的另一端是哪个顶点(便于输出 MST 的边)。

**算法骨架**:

第一步,把起点 v0 加入树,初始化 lowcost[i] = G.edges[v0][i],closest[i] = v0。

第二步,重复 n-1 次:

在 lowcost 中找**最小值**(排除已在树中的顶点),设其下标为 k,值为 min。这意味着:顶点 k 到树的最近连接是 min,另一端是 closest[k]。

把 k 加入树:lowcost = 0(标记"已加入")。

输出边 (closest[k], k),权 min。

**更新**:对每个未加入的顶点 j,如果 G.edges[k][j] < lowcost[j],则 lowcost[j] = G.edges[k][j],closest[j] = k。(意思是:现在 k 加入了,j 通过 k 连到树的成本可能更低)

#### 3.3 Prim 代码(邻接矩阵版,最经典)

cpp

```cpp
#include "MGraph.h"
#include <iostream>
using namespace std;

void Prim(MGraph G, int v0) {
    int lowcost[MAX_VERTEX];
    int closest[MAX_VERTEX];
    
    // 1. 初始化:所有顶点到 v0 的距离
    for (int i = 0; i < G.vexNum; i++) {
        lowcost[i] = G.edges[v0][i];      // 没边就是 INF
        closest[i] = v0;
    }
    lowcost[v0] = 0;                       // v0 已在树中
    
    int totalCost = 0;
    cout << "MST 的边:" << endl;
    
    // 2. 找剩下 n-1 个顶点加入
    for (int i = 1; i < G.vexNum; i++) {
        // 在未加入的顶点中找 lowcost 最小的
        int min = INF, k = -1;
        for (int j = 0; j < G.vexNum; j++) {
            if (lowcost[j] != 0 && lowcost[j] < min) {
                min = lowcost[j];
                k = j;
            }
        }
        
        if (k == -1) {
            cout << "图不连通,无 MST" << endl;
            return;
        }
        
        // 输出这条边
        cout << "  (" << G.vexs[closest[k]] << ", " << G.vexs[k] 
             << ") 权 " << min << endl;
        totalCost += min;
        lowcost[k] = 0;                   // k 加入树
        
        // 3. 更新 lowcost 和 closest
        for (int j = 0; j < G.vexNum; j++) {
            if (lowcost[j] != 0 && G.edges[k][j] < lowcost[j]) {
                lowcost[j] = G.edges[k][j];
                closest[j] = k;
            }
        }
    }
    
    cout << "总权值: " << totalCost << endl;
}
```

#### 3.4 Prim 手工模拟

一张带权无向图(5 顶点):

```
顶点:A B C D E
边:
(A,B) 1
(A,C) 5
(B,C) 3
(B,D) 6
(C,D) 4
(C,E) 2
(D,E) 8
```

**从 A 出发**,初始化:

|i|A|B|C|D|E|
|---|---|---|---|---|---|
|lowcost|0|1|5|∞|∞|
|closest|A|A|A|A|A|

**第 1 轮**:最小 lowcost = 1(B),加入 B,输出边 (A, B) 权 1。

更新:B 的邻居中,lowcost[C] = min(5, G[B][C]=3) = 3,closest[C] = B;lowcost[D] = min(∞, 6) = 6,closest[D] = B。

|i|A|B|C|D|E|
|---|---|---|---|---|---|
|lowcost|0|0|3|6|∞|
|closest|A|A|B|B|A|

**第 2 轮**:最小 lowcost = 3(C),加入 C,输出边 (B, C) 权 3。

更新:C 的邻居中,lowcost[D] = min(6, 4) = 4,closest[D] = C;lowcost[E] = min(∞, 2) = 2,closest[E] = C。

|i|A|B|C|D|E|
|---|---|---|---|---|---|
|lowcost|0|0|0|4|2|
|closest|A|A|B|C|C|

**第 3 轮**:最小 lowcost = 2(E),加入 E,输出边 (C, E) 权 2。

E 的邻居中,lowcost[D] = min(4, G[E][D]=8) = 4,不更新。

**第 4 轮**:最小 lowcost = 4(D),加入 D,输出边 (C, D) 权 4。

**完成**。MST 边集:(A,B) 1, (B,C) 3, (C,E) 2, (C,D) 4,总权 **10**。

#### 3.5 Prim 的复杂度

**时间**:O(V²)——外层循环 n-1 次,每次找最小值 O(V) + 更新 O(V)。

**空间**:O(V)。

**优化**:用**小根堆/优先队列**维护 lowcost,时间降到 **O((V+E) log V)**。在**稀疏图**中更快;在**稠密图**中 O(V²) 反而更好。考研默写基本都是 O(V²) 版本,简洁直观。

**优先队列版的伪代码**:

```
PQ 初始化,插入 (0, v0)
while PQ 非空:
    取出最小的 (cost, v)
    if v 已在树中,跳过
    否则 v 加入,处理其所有邻居 w:PQ.push((G[v][w], w))
```

这就是"**Prim 是带权版 BFS**"的真正含义——把 BFS 的队列换成优先队列,按边权排序扩展即可。**和 Dijkstra 代码结构几乎一模一样**(Dijkstra 用累计距离,Prim 用单边权)。

---

### 四、并查集(Union-Find):Kruskal 的前置

Kruskal 算法的核心操作是"**判断两个顶点是否已在同一连通分量**",直接用图遍历太慢。**并查集**提供 O(接近常数) 的判断,是专门为这种场景设计的数据结构。

#### 4.1 并查集的两个核心操作

**Find(x)**:查找元素 x 所在集合的代表元。

**Union(x, y)**:把 x 和 y 所在的两个集合合并成一个。

#### 4.2 实现方式:父节点数组

用一个数组 `parent[]`,`parent[i]` 表示 i 的父节点。每个集合用一棵树表示,树根就是代表元。

**最简实现**:

cpp

```cpp
int parent[MAX_N];

void Init(int n) {
    for (int i = 0; i < n; i++) parent[i] = i;   // 初始每个元素自成一组
}

int Find(int x) {
    if (parent[x] == x) return x;
    return Find(parent[x]);                       // 递归找根
}

void Union(int x, int y) {
    int px = Find(x), py = Find(y);
    if (px != py) parent[px] = py;                // 一个根挂到另一个下面
}
```

这是最简版本,最坏时间 O(n)(树退化成链)。

#### 4.3 路径压缩(Path Compression)

**优化 Find**:递归回溯时,**把路径上所有节点直接指向根**。

cpp

```cpp
int Find(int x) {
    if (parent[x] != x) {
        parent[x] = Find(parent[x]);              // 直接指向根
    }
    return parent[x];
}
```

只加这一行,Find 的均摊复杂度就降到 **接近 O(1)**(准确说是 O(α(n)),α 是阿克曼函数的反函数,实际值不超过 4)。

#### 4.4 按秩合并(Union by Rank,可选)

**优化 Union**:合并时**把小树挂到大树下**,避免树退化成链。

cpp

```cpp
int rank_[MAX_N];                                 // 每棵树的"秩"(近似高度)

void Init(int n) {
    for (int i = 0; i < n; i++) { parent[i] = i; rank_[i] = 0; }
}

void Union(int x, int y) {
    int px = Find(x), py = Find(y);
    if (px == py) return;
    if (rank_[px] < rank_[py]) parent[px] = py;
    else if (rank_[px] > rank_[py]) parent[py] = px;
    else { parent[py] = px; rank_[px]++; }
}
```

**路径压缩 + 按秩合并**的并查集,在所有实际应用中可视为 **O(1) 操作**。考研中**路径压缩是必会的,按秩合并了解即可**。

#### 4.5 并查集的其他应用

并查集不只为 Kruskal 服务,还有很多:

**判断图的连通分量数**——对所有边执行 Union,最后有几个不同的根就有几个连通分量。

**网络连接性问题**——动态判断"A 和 B 是否能通过一系列链接到达"。

**离线处理图问题**——比如"逆向删边"问题。

这是一种极其**简单却极其有力**的数据结构,**面试非常爱考**。

---

### 五、Kruskal 算法(克鲁斯卡尔)

#### 5.1 核心思想

**"按边权从小到大,能加就加"**。

把所有边按权值**升序排序**。依次考察每条边 `(u, v)`:如果 u 和 v **还不在同一连通分量**(加这条边不会形成环),就加入 MST;否则跳过。直到加入 n-1 条边为止。

**直观类比**:从最便宜的路开始修,只要修了这条路不会造成环,就修。

**和 Prim 的对比**:Prim 是"长一棵树",Kruskal 是"长一片森林,逐步合并"。Kruskal 更像**森林版**的贪心。

#### 5.2 Kruskal 的核心——判环

"加这条边会不会形成环"怎么判断?**看 u 和 v 是否已在同一连通分量**。这正是并查集的看家本领:**Find(u) == Find(v)** 即同分量。

#### 5.3 Kruskal 代码(边集数组版)

邻接矩阵/邻接表都不直接适合 Kruskal,因为要**对所有边排序**。所以我们用**边集数组**。

cpp

```cpp
#include <iostream>
#include <algorithm>
using namespace std;

#define MAX_EDGE 10000
#define MAX_VERTEX 100

typedef struct {
    int u, v;              // 两端
    int weight;
} Edge;

Edge edges[MAX_EDGE];
int parent[MAX_VERTEX];

int Find(int x) {
    if (parent[x] != x) parent[x] = Find(parent[x]);
    return parent[x];
}

bool cmp(Edge a, Edge b) {
    return a.weight < b.weight;
}

void Kruskal(int n, int e) {       // n 顶点,e 边
    // 1. 边按权排序
    sort(edges, edges + e, cmp);
    
    // 2. 初始化并查集
    for (int i = 0; i < n; i++) parent[i] = i;
    
    int totalCost = 0, count = 0;
    cout << "MST 的边:" << endl;
    
    // 3. 扫描每条边
    for (int i = 0; i < e && count < n - 1; i++) {
        int pu = Find(edges[i].u);
        int pv = Find(edges[i].v);
        if (pu != pv) {             // 不在同分量,不成环
            parent[pu] = pv;         // 合并
            cout << "  (" << edges[i].u << ", " << edges[i].v 
                 << ") 权 " << edges[i].weight << endl;
            totalCost += edges[i].weight;
            count++;
        }
    }
    
    if (count < n - 1) {
        cout << "图不连通,无 MST" << endl;
    } else {
        cout << "总权值: " << totalCost << endl;
    }
}
```

#### 5.4 Kruskal 手工模拟

同样用前面那张图,**边按权升序**:

```
(A,B) 1
(C,E) 2
(B,C) 3
(C,D) 4
(A,C) 5
(B,D) 6
(D,E) 8
```

**初始**:每个点自成分量 {A}, {B}, {C}, {D}, {E}。

**考察 (A,B) 1**:不同分量,加入。合并 {A,B}。MST 边:(A,B)。

**考察 (C,E) 2**:不同分量,加入。合并 {C,E}。MST 边:(A,B), (C,E)。

**考察 (B,C) 3**:A,B 在一组,C,E 在一组,不同分量,加入。合并为 {A,B,C,E}。MST 边:(A,B), (C,E), (B,C)。

**考察 (C,D) 4**:D 独立,加入。合并为 {A,B,C,D,E}。MST 边:4 条,达到 n-1=4,结束。

**总权**:1 + 2 + 3 + 4 = **10**——和 Prim 结果一致 ✓。

---

### 六、Prim vs Kruskal 对比

|维度|Prim|Kruskal|
|---|---|---|
|思想|从一个点扩散,长一棵树|按边排序,森林合并|
|数据结构|lowcost 数组 / 优先队列|边集 + 并查集|
|时间(朴素)|O(V²)|O(E log E)|
|时间(优化)|O((V+E) log V)|O(E log E)(排序占主导)|
|适合|稠密图|稀疏图|
|存储|邻接矩阵|边集数组|
|代码复杂度|稍简单|稍复杂(需并查集)|

**怎么选?**

**E 远大于 V**(稠密图,E ≈ V²):选 **Prim**,因为 O(V²) < O(E log E) = O(V² log V)。

**E 与 V 同阶**(稀疏图):选 **Kruskal**,因为 O(E log E) = O(V log V) < O(V²)。

**考研大题两种都会考**,你都要熟练。

---

### 七、几个易错点

**易错一**:Prim 每次**找最小 lowcost 时要排除已加入的顶点**(lowcost == 0)。代码中的 `lowcost[j] != 0` 就是这个判断。**忘了会死循环或结果错**。

**易错二**:Kruskal 必须**判断加边后是否成环**,不能见边就加。判环靠并查集。

**易错三**:**Prim 的 lowcost 要更新,不是直接覆盖**。新加入的顶点 k 可能让某些 j 通过 k 连到树更便宜,但也可能不如原来,要用 `min` 更新。

**易错四**:**并查集的 Find 要递归(或循环),不能只看 parent[x]**。因为 parent[x] 可能不是根,只是直接父节点。

**易错五**:MST **可能不唯一**(权相同边多时),但总权唯一。选择题常问"以下哪个是 MST 的边"——要看哪个候选边真的最优。

**易错六**:MST 只对**连通图**有定义。非连通图只能求"最小生成森林",每个连通分量一棵树。

---

### 八、完整测试(main.cpp)

cpp

```cpp
#include "MGraph.h"
#include <iostream>
using namespace std;

void Prim(MGraph G, int v0);

int main() {
    /* 输入样例(无向带权图):
       5 7
       A B C D E
       A B 1
       A C 5
       B C 3
       B D 6
       C D 4
       C E 2
       D E 8
    */
    MGraph G;
    InitGraph_M(G);
    CreateGraph_M(G, false, true);    // 无向、带权
    
    cout << "===== Prim 算法 =====" << endl;
    Prim(G, 0);                        // 从 A (下标 0) 开始
    
    return 0;
}
```

预期输出:

```
===== Prim 算法 =====
MST 的边:
  (A, B) 权 1
  (B, C) 权 3
  (C, E) 权 2
  (C, D) 权 4
总权值: 10
```

Kruskal 你可以单独写一个测试程序,用边集数组输入边,调 `Kruskal(n, e)`。

---

### 九、思考题(请作答)

**第一题**,下面这张带权无向图,分别用 Prim(从 A 出发)和 Kruskal 构造 MST,**列出每一步的边和最终总权**。你会发现两种算法选的边可能不完全一样,但总权一定相等:

```
顶点:{A, B, C, D, E, F}
边:
(A,B) 6, (A,C) 1, (A,D) 5,
(B,C) 5, (B,E) 3,
(C,D) 5, (C,E) 6, (C,F) 4,
(D,F) 2, (E,F) 6
```

**第二题**,一张带权无向图有 6 条边,权值分别为 `{1, 2, 3, 4, 5, 6}`,**所有边权两两不同**。问:这张图的 MST **是否唯一**?证明或反驳。

**第三题**,对并查集,下列序列(下标 1..6)执行后 `parent` 数组是什么?假设用**路径压缩**但**不**用按秩合并,并约定 Union(x, y) 把 Find(x) 的父亲设为 Find(y)。

```
Init(6)
Union(1, 2)
Union(3, 4)
Union(5, 6)
Union(1, 3)
Find(2)
```

**第四题**,**为什么 Kruskal 的时间复杂度是 O(E log E) 而不是 O(E log V)**?这两者有区别吗?

**第五题**,思考以下命题:"在一棵 MST 中,权值最小的边一定是原图中权值最小的那条边。" **是对还是错?** 给出理由或反例。

**第六题**,如果一张图里有**负权边**,Prim 和 Kruskal **还能正确找到 MST 吗**?(提示:MST 和最短路径不同,MST 不关心路径累积,只关心边权总和)

**第七题**,**并查集的 Find 用递归 vs 循环写,哪种更好**?写出循环版(迭代版)的 Find 带路径压缩。