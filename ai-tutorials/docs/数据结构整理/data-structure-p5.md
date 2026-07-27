## 数据结构复习:图论入门(基础篇)

好,我们开始**图论**。这是考研分值最高、代码量最大、概念最密集的章节——但也是**最有用**的,几乎所有复杂的真实问题(地图导航、网络路由、社交关系、任务调度)最终都归结为图问题。

按你的要求,**这一次我们先打基础**:概念、术语、存储结构。DFS、BFS、最小生成树、最短路径这些算法留到后面的对话逐步展开。**打地基不能省**——图的基础不牢,后面所有算法都会飘。

---

### 一、什么是图?

**图(Graph)** 由两部分组成:

**顶点集 V**(Vertex):图中所有"点"的集合。

**边集 E**(Edge):连接顶点的"线"的集合。

用数学符号写:**G = (V, E)**。

**一个直观例子**:把 5 个城市抽象成顶点,城市之间的公路抽象成边,就得到一张"城市公路图"。

---

### 二、图的基本分类(必须分清)

#### 2.1 按"边是否有方向"分

**无向图(Undirected Graph)**:边没有方向,`(A, B)` 表示 A 和 B 之间有一条边,**等价于** `(B, A)`。例如"A 和 B 是朋友"是无向关系。

**有向图(Directed Graph)**:边有方向,`<A, B>` 表示从 A 到 B 的边,**不等于** `<B, A>`。例如"A 关注了 B"是有向关系,不代表 B 也关注 A。

**符号约定**:无向边用小括号 `(A, B)`,有向边用尖括号 `<A, B>`。**考研大题里严格区分,你要记住**。

#### 2.2 按"边是否带权值"分

**非带权图**:边只表示"连通",不带额外信息。

**带权图(网)**:每条边附带一个数值(权值),表示距离、费用、容量等。带权的无向图叫**无向网**,带权的有向图叫**有向网**。

**四种组合**:无向图、有向图、无向网、有向网——考研题目会明确给出类型,**不同类型适用不同算法**。

---

### 三、术语大总结(考研高频概念)

我按"理解难度"排序,由浅入深。

#### 3.1 基本术语

**完全图**:任意两个顶点之间都有边。n 个顶点的**无向完全图**有 C(n,2) = n(n-1)/2 条边;**有向完全图**有 n(n-1) 条边(每对顶点有两条方向相反的边)。

**稀疏图 vs 稠密图**:边数远少于完全图是稀疏图,接近完全图是稠密图。**没有严格界限**,一般 |E| < |V| log |V| 视为稀疏。稀疏稠密决定了"用邻接矩阵还是邻接表"存储更优。

**子图**:从图中"摘"一部分顶点和边出来构成的图(要求摘出来的边的两个端点都在所摘的顶点里)。

#### 3.2 顶点相关

**邻接(Adjacent)**:两顶点 u、v 间有边,称它们"邻接"。无向图中 u、v 互为邻接点;有向图中,若有 `<u, v>`,称 v 是 u 的**出邻接点**,u 是 v 的**入邻接点**。

**度(Degree)**:

无向图中,顶点 v 的**度** = 与 v 相连的边数,记 `TD(v)`。

有向图中,**出度** `OD(v)` = 从 v 出发的边数,**入度** `ID(v)` = 进入 v 的边数。**总度 = 出度 + 入度**。

**度的核心定理**:**所有顶点的度之和 = 边数的 2 倍**(每条边贡献 2 个度端点)。有向图则是**出度之和 = 入度之和 = 边数**。这个公式年年考,必记。

#### 3.3 路径相关

**路径(Path)**:从 u 到 v 的顶点序列,每对相邻顶点之间有边。

**路径长度**:路径上的边数(非带权)或边权之和(带权)。

**简单路径**:路径上**顶点不重复**。

**回路(环)**:起点终点相同的路径。长度 ≥ 1 的回路就是"环"。

**简单回路**:除起点终点外,顶点不重复的回路。

#### 3.4 连通性(重点!)

**无向图**

**连通**:u 到 v 有路径,称 u 和 v 连通。

**连通图**:图中**任意两个顶点**都连通。

**连通分量**:**极大**连通子图(不可再扩充)。一个连通图只有 1 个连通分量(就是它自己);非连通图有多个连通分量。

**有向图**:

**强连通**:u 到 v、v 到 u **都有路径**(双向都能到)。

**强连通图**:任意两个顶点强连通。

**强连通分量**:极大强连通子图。

**注意区别"连通"和"强连通"**——无向图用"连通",有向图用"强连通"。考研选择题最爱混淆这一点。

#### 3.5 特殊图

**树**:**连通且无环**的无向图。一棵有 n 个顶点的树恰好有 n-1 条边。

**生成树**:对无向连通图 G,它的**极小连通子图**(保留所有顶点,减到 n-1 条边还能连通)。一个图可能有多棵生成树。

**生成森林**:非连通图的每个连通分量各取一棵生成树,合起来就是生成森林。

---

### 四、图的五种存储结构

这是基础篇的**核心内容**。存储结构决定了后续所有算法的写法和效率。

#### 4.1 邻接矩阵(Adjacency Matrix)

**核心思想**:用 **n×n 的二维数组** `A[n][n]` 存储,`A[i][j]` 表示顶点 i 到 j 是否有边(或边权)。

**非带权**:`A[i][j] = 1` 表示有边,0 表示无边。

**带权**:`A[i][j] = 权值` 表示有边,特殊值(如 0 或 ∞)表示无边。**通常 ∞ 用来表示"不可达"**。

**例子**:以下无向图的邻接矩阵:

```
顶点:{A, B, C, D}
边:  (A,B), (A,C), (B,C), (C,D)
```

```
      A  B  C  D
   A [ 0  1  1  0 ]
   B [ 1  0  1  0 ]
   C [ 1  1  0  1 ]
   D [ 0  0  1  0 ]
```

**观察**:无向图的邻接矩阵**沿对角线对称**。

**有向图的邻接矩阵不对称**——`A[i][j]` 和 `A[j][i]` 可以不同。

**特点总结**:

优点:**判断两顶点是否相邻 O(1)**(直接查表);矩阵运算可以解决某些图问题(如传递闭包)。

缺点:空间 **O(V²)**,稀疏图极浪费;**遍历某顶点的所有邻居** O(V),而不是 O(邻居数)。

**何时用**:稠密图(边数接近 V²)、或需要 O(1) 判断邻接性的场景。

#### 4.2 邻接表(Adjacency List)

**核心思想**:**每个顶点挂一个单链表**,链表存该顶点的所有邻居。

**结构**:顶点用数组,每个数组元素指向一个链表;链表节点存"邻居顶点的下标"(和可能的边权)。

**例子**:前面那个图的邻接表:

```
A -> B -> C
B -> A -> C
C -> A -> B -> D
D -> C
```

**特点总结**:

优点:空间 **O(V+E)**,稀疏图非常省空间;**遍历某顶点的所有邻居**时间 O(邻居数),不浪费。

缺点:判断"u、v 是否相邻"要 O(邻居数);**有向图**的邻接表只记录出边,想找入边要遍历全图(或额外建"逆邻接表")。

**何时用**:稀疏图、需要频繁遍历邻居的算法(DFS、BFS、Dijkstra 等)。

**这是绝大多数图算法的首选存储结构**。

#### 4.3 十字链表(有向图专用)

邻接表对有向图的缺陷是"难找入边"。**十字链表**同时存储每个顶点的入边和出边,一举解决。

每条边节点有四个指针:尾顶点、头顶点、同尾下一边、同头下一边。

**这个结构比较复杂,考研只要求了解其思想,一般不要求写代码**。你知道"十字链表适合有向图、能同时 O(1) 找入边和出边"就够了。

#### 4.4 邻接多重表(无向图的优化)

邻接表在无向图中有个小缺陷:每条边 (u,v) 会被存**两次**(u 的链表里一次,v 的链表里一次),删除边时要改两处。

**邻接多重表**让每条边只存一次,每条边节点包含两个顶点下标和两个"同顶点下一边"指针。

**同样,考研了解概念即可,很少要求写代码**。

#### 4.5 边集数组(Edge List)

最简单的一种:**用一个数组存所有边**,每个元素是 `(u, v, weight)`。

**特点**:空间 O(E),但**查询任意两顶点是否相邻要 O(E)**。

**典型应用**:Kruskal 最小生成树算法——这个算法的核心操作是"把所有边按权值排序",用边集数组最自然。

---

### 五、图的结构体设计(代码实战)

我们给出**邻接矩阵**和**邻接表**两种主流实现。这两种占据了考研 90% 以上的代码题。

#### 文件组织

```
DataStructure/
└── Graph/
    ├── MGraph.h        // 邻接矩阵
    ├── MGraph.cpp
    ├── ALGraph.h       // 邻接表
    ├── ALGraph.cpp
    └── main.cpp
```

类似之前栈/队列的命名策略,两种结构用不同前缀:**M**Graph(Matrix)和 **AL**Graph(Adjacency List),共存不冲突。

#### 5.1 邻接矩阵(MGraph.h)

cpp

```cpp
#pragma once

#define MAX_VERTEX 100
#define INF 0x3f3f3f3f          // "无穷大",表示无边。用 0x3f3f3f3f 避免加法溢出

typedef char VertexType;         // 顶点数据(用 char 方便观察)
typedef int EdgeType;            // 边权(带权图时用)

typedef struct {
    VertexType vexs[MAX_VERTEX];        // 顶点数组
    EdgeType edges[MAX_VERTEX][MAX_VERTEX]; // 邻接矩阵
    int vexNum, edgeNum;                // 当前顶点数、边数
} MGraph;

// ========== 基本操作 ==========
void InitGraph_M(MGraph &G);
void CreateGraph_M(MGraph &G, bool directed, bool weighted);
int  LocateVex_M(MGraph G, VertexType v);       // 找顶点下标,失败返回 -1
void PrintGraph_M(MGraph G);
```

**关于 `INF = 0x3f3f3f3f`** 这个小技巧:用它表示无穷大,既足够大(约 10 亿,比常见边权大),**又不会在 `INF + INF` 时溢出**(0x7f7f7f7f 不到 int 上限)。这是竞赛和工程里的黑魔法。如果你用 INT_MAX,一旦做 `distance + edgeWeight` 就会溢出变负数,Dijkstra 等算法会崩。

#### 5.2 MGraph.cpp

cpp

```cpp
#include "MGraph.h"
#include <iostream>
#include <cstring>
using namespace std;

void InitGraph_M(MGraph &G) {
    G.vexNum = 0;
    G.edgeNum = 0;
    for (int i = 0; i < MAX_VERTEX; i++)
        for (int j = 0; j < MAX_VERTEX; j++)
            G.edges[i][j] = INF;            // 初始化:所有边不存在
}

int LocateVex_M(MGraph G, VertexType v) {
    for (int i = 0; i < G.vexNum; i++) {
        if (G.vexs[i] == v) return i;
    }
    return -1;
}

void CreateGraph_M(MGraph &G, bool directed, bool weighted) {
    cout << "输入顶点数和边数:";
    cin >> G.vexNum >> G.edgeNum;

    cout << "输入 " << G.vexNum << " 个顶点(单字符):";
    for (int i = 0; i < G.vexNum; i++) {
        cin >> G.vexs[i];
    }

    // 初始化所有边为 INF(无边)
    for (int i = 0; i < G.vexNum; i++)
        for (int j = 0; j < G.vexNum; j++)
            G.edges[i][j] = (i == j) ? 0 : INF;    // 自己到自己权为 0

    cout << "输入 " << G.edgeNum << " 条边(格式:u v"
         << (weighted ? " weight" : "") << "):" << endl;
    for (int k = 0; k < G.edgeNum; k++) {
        VertexType u, v;
        EdgeType w = 1;                     // 非带权默认为 1
        cin >> u >> v;
        if (weighted) cin >> w;

        int i = LocateVex_M(G, u);
        int j = LocateVex_M(G, v);
        if (i == -1 || j == -1) {
            cout << "顶点不存在,跳过" << endl;
            continue;
        }

        G.edges[i][j] = w;
        if (!directed) G.edges[j][i] = w;   // 无向图对称
    }
}

void PrintGraph_M(MGraph G) {
    cout << "邻接矩阵:" << endl;
    cout << "    ";
    for (int i = 0; i < G.vexNum; i++) cout << G.vexs[i] << "\t";
    cout << endl;
    for (int i = 0; i < G.vexNum; i++) {
        cout << G.vexs[i] << " : ";
        for (int j = 0; j < G.vexNum; j++) {
            if (G.edges[i][j] == INF) cout << "∞\t";
            else cout << G.edges[i][j] << "\t";
        }
        cout << endl;
    }
}
```

**几个关键设计点**:

第一,`CreateGraph_M` 用 `bool directed, bool weighted` 两个参数,**一个函数支持四种图**(有向/无向、带权/非带权)。这比四个单独函数更简洁。

第二,对角线 `edges[i][i] = 0`——约定"顶点自己到自己没有边,但距离是 0"。这在 Floyd 最短路径中很重要。

第三,非带权图我们把边权视为 **1**——这样 Dijkstra/Floyd 等算法可以无差别处理"步数"和"距离"。

#### 5.3 邻接表(ALGraph.h)

cpp

```cpp
#pragma once

#define MAX_VERTEX 100

typedef char VertexType;
typedef int EdgeType;

// ========== 边节点(链表中的节点)==========
typedef struct EdgeNode {
    int adjVex;                     // 邻接顶点的下标
    EdgeType weight;                // 边权(非带权图忽略)
    struct EdgeNode *next;          // 指向下一条边
} EdgeNode;

// ========== 顶点节点(数组中的元素)==========
typedef struct {
    VertexType data;                // 顶点数据
    EdgeNode *firstEdge;            // 指向第一条边的指针
} VertexNode;

// ========== 图 ==========
typedef struct {
    VertexNode adjList[MAX_VERTEX];
    int vexNum, edgeNum;
} ALGraph;

// ========== 基本操作 ==========
void InitGraph_AL(ALGraph &G);
void CreateGraph_AL(ALGraph &G, bool directed, bool weighted);
int  LocateVex_AL(ALGraph G, VertexType v);
void PrintGraph_AL(ALGraph G);
void DestroyGraph_AL(ALGraph &G);
```

**结构嵌套关系**(这段要看懂):

`ALGraph` 含一个 `adjList` 数组,数组每个元素是一个 `VertexNode`(顶点)。每个顶点内部有 `data`(顶点值) 和 `firstEdge`(指向边链表的第一个节点)。边链表的每个节点 `EdgeNode` 存"这条边指向谁(adjVex)、权值多少、下一条边"。

**对比内存布局**:邻接矩阵是"铁板一块的二维数组";邻接表是"数组 + 多条链表"的混合结构,更灵活但需要动态分配内存。

#### 5.4 ALGraph.cpp

cpp

```cpp
#include "ALGraph.h"
#include <iostream>
using namespace std;

void InitGraph_AL(ALGraph &G) {
    G.vexNum = 0;
    G.edgeNum = 0;
    for (int i = 0; i < MAX_VERTEX; i++) {
        G.adjList[i].firstEdge = nullptr;
    }
}

int LocateVex_AL(ALGraph G, VertexType v) {
    for (int i = 0; i < G.vexNum; i++) {
        if (G.adjList[i].data == v) return i;
    }
    return -1;
}

void CreateGraph_AL(ALGraph &G, bool directed, bool weighted) {
    cout << "输入顶点数和边数:";
    cin >> G.vexNum >> G.edgeNum;

    cout << "输入 " << G.vexNum << " 个顶点:";
    for (int i = 0; i < G.vexNum; i++) {
        cin >> G.adjList[i].data;
        G.adjList[i].firstEdge = nullptr;
    }

    cout << "输入 " << G.edgeNum << " 条边:" << endl;
    for (int k = 0; k < G.edgeNum; k++) {
        VertexType u, v;
        EdgeType w = 1;
        cin >> u >> v;
        if (weighted) cin >> w;

        int i = LocateVex_AL(G, u);
        int j = LocateVex_AL(G, v);
        if (i == -1 || j == -1) continue;

        // 头插法:把 j 加入 i 的邻居链表
        EdgeNode *e1 = new EdgeNode;
        e1->adjVex = j;
        e1->weight = w;
        e1->next = G.adjList[i].firstEdge;
        G.adjList[i].firstEdge = e1;

        // 无向图:对称处理,把 i 加入 j 的邻居链表
        if (!directed) {
            EdgeNode *e2 = new EdgeNode;
            e2->adjVex = i;
            e2->weight = w;
            e2->next = G.adjList[j].firstEdge;
            G.adjList[j].firstEdge = e2;
        }
    }
}

void PrintGraph_AL(ALGraph G) {
    cout << "邻接表:" << endl;
    for (int i = 0; i < G.vexNum; i++) {
        cout << G.adjList[i].data << " -> ";
        EdgeNode *p = G.adjList[i].firstEdge;
        while (p != nullptr) {
            cout << G.adjList[p->adjVex].data;
            cout << "(" << p->weight << ") -> ";
            p = p->next;
        }
        cout << "NULL" << endl;
    }
}

void DestroyGraph_AL(ALGraph &G) {
    for (int i = 0; i < G.vexNum; i++) {
        EdgeNode *p = G.adjList[i].firstEdge;
        while (p != nullptr) {
            EdgeNode *q = p;
            p = p->next;
            delete q;
        }
        G.adjList[i].firstEdge = nullptr;
    }
    G.vexNum = G.edgeNum = 0;
}
```

**关键设计点**:

第一,插入边用**头插法**——O(1) 时间。**缺点是邻居顺序和输入顺序相反**,但这对大多数算法无影响。

第二,无向图要**插两次**(i 的链表里加 j,j 的链表里加 i),对应前面说的"邻接表对无向图每条边存两次"。

第三,**必须有 DestroyGraph**——堆内存要手动释放。这和之前链式数据结构一样。

---

### 六、测试代码(main.cpp)

cpp

```cpp
#include "MGraph.h"
#include "ALGraph.h"
#include <iostream>
using namespace std;

int main() {
    cout << "===== 邻接矩阵 =====" << endl;
    cout << "建立无向图,输入样例:\n4 4\nA B C D\nA B\nA C\nB C\nC D" << endl;
    MGraph MG;
    InitGraph_M(MG);
    CreateGraph_M(MG, false, false);    // 无向、非带权
    PrintGraph_M(MG);

    cout << "\n===== 邻接表 =====" << endl;
    cout << "建立带权有向图,输入样例:\n4 4\nA B C D\nA B 5\nA C 3\nB C 2\nC D 7" << endl;
    ALGraph AG;
    InitGraph_AL(AG);
    CreateGraph_AL(AG, true, true);     // 有向、带权
    PrintGraph_AL(AG);

    DestroyGraph_AL(AG);
    return 0;
}
```

**预期输出(邻接矩阵部分)**:

```
邻接矩阵:
    A   B   C   D
A : 0   1   1   ∞
B : 1   0   1   ∞
C : 1   1   0   1
D : ∞   ∞   1   0
```

**预期输出(邻接表部分)**:

```
邻接表:
A -> C(3) -> B(5) -> NULL
B -> C(2) -> NULL
C -> D(7) -> NULL
D -> NULL
```

---

### 七、邻接矩阵 vs 邻接表:何时选哪个?

这是考研高频选择题,一张对比表你要刻在脑子里:

|操作 / 性质|邻接矩阵|邻接表|
|---|---|---|
|空间复杂度|O(V²)|O(V+E)|
|判断 (u,v) 是否相邻|O(1)|O(deg(u))|
|找顶点 u 的所有邻居|O(V)|O(deg(u))|
|计算顶点度(无向)|O(V) 扫一行|O(deg(u)) 数链表长度|
|计算出度(有向)|O(V)|O(out-deg)|
|计算入度(有向)|O(V)|O(V+E) 扫所有链表|
|添加一条边|O(1)头插|
|删除一条边|O(1)|O(deg) 要找|
|适合稀疏图|❌|✅|
|适合稠密图|✅|❌|

**一句话判断**:

**"边数接近 V²"** → 邻接矩阵;**"边数远小于 V²"** → 邻接表。

**"需要反复判断任意两点相邻性"** → 邻接矩阵(Floyd 用);**"需要反复访问某点邻居"** → 邻接表(DFS、BFS、Dijkstra 用)。

---

### 八、常见易错点总结

**易错一**:有向图和无向图的邻接矩阵对称性。**无向图对称,有向图不对称**。

**易错二**:无向图中一条边在邻接表里**存两次**(对应两个端点的链表),在邻接矩阵里对应**两个对称的 1**;有向图中一条边只存一次/一个 1。

**易错三**:度的公式。**无向图**:`Σdeg(v) = 2|E|`;**有向图**:`Σout(v) = Σin(v) = |E|`。

**易错四**:"连通图 ≠ 强连通图"。无向图说连通,有向图说强连通。一个有向图若对应的无向图连通,叫"弱连通"。

**易错五**:有向完全图 n(n-1) 条,无向完全图 n(n-1)/2 条。**不要把 2 除漏了或除错了方向**。

**易错六**:INF 的选择。用 `INT_MAX` 会在 `INF + edge` 时溢出;用 `0x3f3f3f3f` 既大又不溢出。

---

### 九、思考题(打牢基础,请作答)

第一题,一个**无向图**有 16 条边,顶点 V1、V2、V3 的度分别是 4、3、3,其余顶点的度都是 2。这个图有多少个顶点?(提示:用"度数之和 = 2E"的公式)

第二题,一个**有向图**的邻接矩阵如下(1 表示有边,0 无边):

```
      V1 V2 V3 V4
  V1 [ 0  1  1  0 ]
  V2 [ 0  0  0  1 ]
  V3 [ 0  0  0  1 ]
  V4 [ 1  0  0  0 ]
```

练习：(a) 求每个顶点的出度和入度；(b) 判断该图是否为强连通图并说明理由；(c) 画出邻接表。

第三题,一个无向图有 n 个顶点,若它是**连通的**,最少有多少条边?若它**不连通**,最少有多少条边才能保证它"在加一条边后一定连通"?(后半问有点难,考研经典题)

第四题,**邻接矩阵存储的无向图**,如何**快速判断顶点 v 是否是孤立顶点**(无任何边)?给出 O(V) 算法的思路。对应**邻接表**,怎么 O(1) 判断?

第五题,以下**哪种存储结构**最适合以下操作:

(a) 频繁查询"顶点 u 的所有邻居"(比如 BFS/DFS)。 (b) 频繁查询"u 和 v 之间是否有边"(比如 Floyd 最短路径)。 (c) 稀疏图的存储。 (d) 按边权排序所有边(比如 Kruskal 算法)。

## 数据结构复习:图的遍历(DFS 和 BFS)

好,我们进入**图的遍历**——整个图论的"第一把钥匙"。后面所有复杂算法(最小生成树、最短路径、拓扑排序、关键路径)都建立在 DFS 和 BFS 之上。

这节我会讲:**为什么图遍历需要 visited 数组 → DFS 的递归/非递归实现 → BFS 实现 → 连通分量的应用**。邻接矩阵和邻接表两种存储结构**都给代码**,因为考研大题两种都可能考。

---

### 一、图遍历 vs 树遍历:一个关键区别

先回想一下,二叉树遍历是怎么做的?**递归地访问根、左、右**。不用记录"哪些节点已经访问过",因为**树没有环**——每个节点只有一条路径通达。

**图不一样。图有环,有回路**。如果你从顶点 A 出发,走到 B,再走到 C,C 可能有一条边指回 A——如果不记录"A 已访问",你会在 A-B-C-A-B-C 里**无限循环**。

**解决方法**:用一个 `visited[]` 数组标记每个顶点是否已访问。

cpp

```cpp
bool visited[MAX_VERTEX];    // 全局/传入参数
```

访问前检查 visited,访问后立即置 true。**这是图遍历的灵魂**,贯穿所有算法。

---

### 二、DFS(深度优先搜索)

#### 2.1 核心思想

**一条路走到黑,走不通再回头**。用大白话描述:

从起点 v 出发,访问 v;选 v 的一个**未访问的邻居** w,从 w 继续深入;一直走到某个顶点没有未访问的邻居,就**回溯**到上一个节点,尝试它的另一个未访问邻居;全都走完,DFS 结束。

**类比**:走迷宫——优先往深处钻,遇到死路才退回岔口。

#### 2.2 DFS 的递归实现(最经典)

用栈的思想天然对应递归,代码极简:

cpp

```cpp
bool visited[MAX_VERTEX];        // 全局 visited 数组

void DFS(图 G, int v) {
    访问(v);
    visited[v] = true;
    for (v 的每个邻居 w) {
        if (!visited[w]) {
            DFS(G, w);           // 递归深入
        }
    }
}
```

**这是伪代码骨架,下面分别给出邻接矩阵和邻接表的具体实现**。

#### 2.3 邻接矩阵版 DFS

cpp

```cpp
// 邻接矩阵 DFS
#include "MGraph.h"

bool visited_M[MAX_VERTEX];      // 全局 visited

void DFS_M(MGraph G, int v) {
    cout << G.vexs[v] << " ";    // 访问 v
    visited_M[v] = true;
    for (int w = 0; w < G.vexNum; w++) {
        // 检查 v 到 w 是否有边,且 w 未访问
        if (G.edges[v][w] != INF && G.edges[v][w] != 0 && !visited_M[w]) {
            DFS_M(G, w);
        }
    }
}

// 对外接口:处理可能的非连通图
void DFSTraverse_M(MGraph G) {
    for (int i = 0; i < G.vexNum; i++) visited_M[i] = false;
    for (int i = 0; i < G.vexNum; i++) {
        if (!visited_M[i]) {
            DFS_M(G, i);          // 每个未访问顶点都作为新的 DFS 起点
        }
    }
}
```

**几个重要细节**:

第一,`G.edges[v][w] != INF` 是"有边"的判断。我们之前约定 INF 表示无边;`!= 0` 排除自己到自己的"伪边"(对角线我们设为 0)。

第二,外层 `DFSTraverse_M` 的 `for` 循环为什么必要?因为图可能**不连通**——某些顶点从起点出发根本到不了。必须对每个未访问的顶点重启一次 DFS,才能遍历到所有顶点。

第三,`visited_M[i] = false` 的初始化必须在外层做,**不能放在 `DFS_M` 里面**,否则每次递归都会清零。

#### 2.4 邻接表版 DFS

cpp

```cpp
// 邻接表 DFS
#include "ALGraph.h"

bool visited_AL[MAX_VERTEX];

void DFS_AL(ALGraph G, int v) {
    cout << G.adjList[v].data << " ";
    visited_AL[v] = true;
    EdgeNode *p = G.adjList[v].firstEdge;
    while (p != nullptr) {
        int w = p->adjVex;
        if (!visited_AL[w]) {
            DFS_AL(G, w);
        }
        p = p->next;
    }
}

void DFSTraverse_AL(ALGraph G) {
    for (int i = 0; i < G.vexNum; i++) visited_AL[i] = false;
    for (int i = 0; i < G.vexNum; i++) {
        if (!visited_AL[i]) {
            DFS_AL(G, i);
        }
    }
}
```

**关键对比**:

邻接矩阵找邻居要扫**整行**(O(V)),邻接表沿链表走(O(邻居数))。所以**对稀疏图,邻接表的 DFS 总时间 O(V+E);对稠密图,邻接矩阵总时间 O(V²)**。

#### 2.5 DFS 非递归实现(用栈)

用我们之前写的 `BiStack`(改成存顶点下标的 `IntStack`)可以实现非递归 DFS。思路类似非递归先序遍历:

cpp

```cpp
void DFS_NonRec_AL(ALGraph G, int v) {
    bool visited[MAX_VERTEX] = {false};
    IntStack S;
    InitStack(S);

    Push(S, v);
    visited[v] = true;
    cout << G.adjList[v].data << " ";

    while (!StackEmpty(S)) {
        int top; GetTop(S, top);            // 看栈顶
        // 找 top 的一个未访问邻居
        EdgeNode *p = G.adjList[top].firstEdge;
        while (p != nullptr && visited[p->adjVex]) p = p->next;

        if (p != nullptr) {
            int w = p->adjVex;
            cout << G.adjList[w].data << " ";
            visited[w] = true;
            Push(S, w);
        } else {
            Pop(S, top);                     // 没有未访问邻居,回溯
        }
    }
}
```

**原理**:栈顶是"当前深入到的节点",找它的一个未访问邻居就深入;找不到就弹出回溯。**考研一般要求会写递归版就够,非递归了解即可**。

#### 2.6 DFS 遍历示例

对下面这个无向图(邻接表表示,邻居按字母顺序):

```
顶点:A B C D E F G H
边:(A,B) (A,C) (B,D) (B,E) (C,F) (C,G) (D,H) (E,H)

       A
      / \
     B   C
    /|   |\
   D E   F G
   |_|
    H
```

从 A 开始 DFS,邻居按字母序访问:

**A**(访问)→ **B**(A 的第一个邻居)→ **D**(B 的第一个未访问邻居)→ **H**(D 的邻居)→ 回到 H,邻居 E 已访问?不,E 还没访问,但 H 的邻居应该是 D 和 E。H 有 E 这个邻居,访问 **E**。

嗯让我重来更清楚一些。从 A 出发,邻居 B、C(按字母序先 B)→ B,邻居 A(已)、D、E → D,邻居 B(已)、H → H,邻居 D(已)、E → E,邻居 B(已)、H(已);回溯到 H,没新邻居;回溯到 D,没;回溯到 B,没新邻居(E 已访);回溯到 A,访问 C → C 的邻居 A(已)、F、G → F,邻居 C(已);回溯 → G,邻居 C(已);回溯完毕。

**DFS 序**:A B D H E C F G

---

### 三、BFS(广度优先搜索)

#### 3.1 核心思想

**一层一层地向外扩展**。用大白话:

访问起点 v;把 v 的**所有邻居**都访问一遍;再把**邻居的邻居**都访问一遍;依次推进,像水波一样向外扩散。

**类比**:从起点往外找最短路径(非带权图中,BFS 找到的就是最短路径)。

**实现工具**:用**队列**(和 DFS 用栈对应)。新访问的顶点入队尾,从队首取出"下一个要处理的顶点"。

#### 3.2 BFS 的伪代码

```cpp
BFS(G, v):
    访问(v); visited[v] = true
    v 入队
    while 队列非空:
        从队首取出 u
        for u 的每个未访问邻居 w:
            访问(w); visited[w] = true
            w 入队
```

**关键点**:**标记 visited 要在入队时**,不是出队时!否则同一个顶点可能被多次入队,效率大降。这是 BFS 最常见的错误。

#### 3.3 邻接矩阵版 BFS

我们用 C++ STL 队列简化代码;如果要用你自己写的队列,只需把 `queue` 换成 `SqQueue` 或 `LkQueue`(见之前的章节)。

cpp

```cpp
#include "MGraph.h"
#include <queue>
using namespace std;

bool bfsVisited_M[MAX_VERTEX];

void BFS_M(MGraph G, int v) {
    queue<int> Q;
    cout << G.vexs[v] << " ";
    bfsVisited_M[v] = true;
    Q.push(v);

    while (!Q.empty()) {
        int u = Q.front(); Q.pop();
        for (int w = 0; w < G.vexNum; w++) {
            if (G.edges[u][w] != INF && G.edges[u][w] != 0
                && !bfsVisited_M[w]) {
                cout << G.vexs[w] << " ";
                bfsVisited_M[w] = true;
                Q.push(w);
            }
        }
    }
}

void BFSTraverse_M(MGraph G) {
    for (int i = 0; i < G.vexNum; i++) bfsVisited_M[i] = false;
    for (int i = 0; i < G.vexNum; i++) {
        if (!bfsVisited_M[i]) {
            BFS_M(G, i);
        }
    }
}
```

#### 3.4 邻接表版 BFS

cpp

```cpp
#include "ALGraph.h"
#include <queue>
using namespace std;

bool bfsVisited_AL[MAX_VERTEX];

void BFS_AL(ALGraph G, int v) {
    queue<int> Q;
    cout << G.adjList[v].data << " ";
    bfsVisited_AL[v] = true;
    Q.push(v);

    while (!Q.empty()) {
        int u = Q.front(); Q.pop();
        EdgeNode *p = G.adjList[u].firstEdge;
        while (p != nullptr) {
            int w = p->adjVex;
            if (!bfsVisited_AL[w]) {
                cout << G.adjList[w].data << " ";
                bfsVisited_AL[w] = true;
                Q.push(w);
            }
            p = p->next;
        }
    }
}

void BFSTraverse_AL(ALGraph G) {
    for (int i = 0; i < G.vexNum; i++) bfsVisited_AL[i] = false;
    for (int i = 0; i < G.vexNum; i++) {
        if (!bfsVisited_AL[i]) {
            BFS_AL(G, i);
        }
    }
}
```

#### 3.5 BFS 示例

对同一个图,从 A 开始 BFS:

**层 0**:访问 A,入队。队列:`[A]`。

**层 1**:出队 A,访问 A 的所有未访问邻居 B、C,入队。输出:A B C。队列:`[B, C]`。

**层 2**:出队 B,访问 B 的未访问邻居 D、E。输出:A B C D E。队列:`[C, D, E]`。

出队 C,访问 C 的未访问邻居 F、G。输出:A B C D E F G。队列:`[D, E, F, G]`。

**层 3**:出队 D,访问 D 的未访问邻居 H。输出:A B C D E F G H。

出队 E,E 的邻居 B(已)、H(已),无新邻居。

剩下 F、G、H 出队时也没有新邻居。

**BFS 序**:A B C D E F G H

**对比 DFS 序**:A B D H E C F G

两者走的路径完全不同——DFS 钻深,BFS 铺广。

---

### 四、DFS 与 BFS 的性能分析

**时间复杂度**:

邻接矩阵:**O(V²)**——每个顶点都要扫整行看邻居。 邻接表:**O(V+E)**——每个顶点访问一次,每条边访问常数次。

**空间复杂度**:

DFS:递归栈 O(V)(最坏全部在栈上)。 BFS:队列 O(V)。

两者时间复杂度相同(邻接表下都是 O(V+E)),**但适用场景不同**——BFS 天然找最短路径,DFS 天然用于递归式搜索(如回溯、拓扑排序)。

---

### 五、非连通图的处理(考研重点)

前面 `DFSTraverse` 和 `BFSTraverse` 的**外层 for 循环**就是为了处理非连通图。

**关键观察**:**每调用一次内层 DFS/BFS(DFS_M 或 BFS_M),就遍历了一个连通分量**。所以:

**连通分量个数 = 外层 for 循环中真正进入内层的次数**。

这直接给出了一个经典应用:**统计连通分量数**。

#### 应用:求无向图的连通分量数

cpp

```cpp
int CountComponents_AL(ALGraph G) {
    for (int i = 0; i < G.vexNum; i++) visited_AL[i] = false;
    int count = 0;
    for (int i = 0; i < G.vexNum; i++) {
        if (!visited_AL[i]) {
            count++;
            DFS_AL(G, i);        // 遍历第 count 个连通分量
        }
    }
    return count;
}
```

这个函数能告诉你一张图被"分成几块"。例如社交网络里能告诉你"一共有多少个互不相关的朋友圈"。

---

### 六、完整测试代码(main.cpp)

cpp

```cpp
#include "MGraph.h"
#include "ALGraph.h"
#include <iostream>
using namespace std;

extern bool visited_M[MAX_VERTEX];
extern bool visited_AL[MAX_VERTEX];
extern bool bfsVisited_M[MAX_VERTEX];
extern bool bfsVisited_AL[MAX_VERTEX];

void DFSTraverse_M(MGraph G);
void BFSTraverse_M(MGraph G);
void DFSTraverse_AL(ALGraph G);
void BFSTraverse_AL(ALGraph G);
int  CountComponents_AL(ALGraph G);

int main() {
    /* 输入样例(无向图):
       8 8
       A B C D E F G H
       A B
       A C
       B D
       B E
       C F
       C G
       D H
       E H
    */
    ALGraph G;
    InitGraph_AL(G);
    CreateGraph_AL(G, false, false);    // 无向、非带权

    cout << "\nDFS 遍历: ";
    DFSTraverse_AL(G);
    cout << endl;

    cout << "BFS 遍历: ";
    BFSTraverse_AL(G);
    cout << endl;

    cout << "连通分量数: " << CountComponents_AL(G) << endl;

    DestroyGraph_AL(G);
    return 0;
}
```

预期输出(假设邻接表按"头插法"存储,输出顺序可能和字母序相反):

```
DFS 遍历: A C G F B E H D
BFS 遍历: A C B G F E D H
连通分量数: 1
```

**注意**:具体遍历序**强烈依赖邻接表中邻居的存储顺序**。我们用头插法存边,所以邻居链是输入顺序的反向。如果题目要求"按字母顺序"遍历,需要用**尾插法**建邻接表。考研大题一般会明确给出邻接表,按题目给的顺序遍历即可。

---

### 七、DFS 和 BFS 的应用全景

这两个算法是图论的基石,**后续几乎所有算法都是它们的变种**。先给你一个"路线图",接下来的章节你就知道每个算法为什么存在:

**DFS 的衍生**:

**拓扑排序**(AOV 网)——DFS 回溯时记录节点,逆序输出即拓扑序。**关键路径**(AOE 网)——基于拓扑排序。**强连通分量**(Kosaraju / Tarjan 算法)——两遍 DFS。**判断环**——DFS 过程中遇到"回边"即有环。**求连通分量数**——就是上面的应用。

**BFS 的衍生**:

**非带权图的单源最短路径**——BFS 过程自然产生最短距离(按层扩展)。**二分图判定**——BFS 交替染色,若同层出现邻接则非二分图。

**BFS 和 DFS 共用**:

**Prim 最小生成树**——本质是贪心版 BFS。**Dijkstra 最短路径**——贪心 + BFS 变种。

**所以这节内容,是后面所有内容的起点**。把 DFS/BFS 吃透,后面会轻松很多。

---

### 八、常见易错点总结

**易错一**:忘记 visited 数组的初始化。初始化必须在每次外层遍历前做**一次**,不能放在递归函数里。

**易错二**:BFS 中在"出队时"标记 visited。**应该在"入队时"就标记**,否则同一顶点可能被多次入队。

**易错三**:DFS 遍历非连通图只从一个顶点出发。**必须用外层 for 循环**对每个未访问顶点重启 DFS。

**易错四**:有向图的"邻居"。邻接矩阵 `edges[u][w]` 表示的是**出邻居**(u 到 w 有边);DFS/BFS 遍历时默认走出边。有向图做 DFS/BFS 可能**无法到达所有顶点**,即使图是弱连通的。

**易错五**:遍历序依赖存储结构。**同一张图,用不同方式建邻接表(头插/尾插),DFS/BFS 序会不同**。大题要严格按题目给的邻接表顺序遍历。

**易错六**:有向图的 DFS 遍历,**从某个顶点出发,不一定能到达所有顶点**;即便是强连通图,外层 for 循环仍然要写,因为代码逻辑不依赖是否强连通。

---

### 九、思考题(请作答)

第一题,给定一个无向图的邻接表:

```
A -> B -> D -> NULL
B -> A -> C -> E -> NULL
C -> B -> F -> NULL
D -> A -> E -> NULL
E -> B -> D -> F -> NULL
F -> C -> E -> NULL
```

请分别给出从 A 出发的 **DFS 序**和 **BFS 序**。

第二题,一张**有向图**,顶点 `{1, 2, 3, 4, 5}`,边 `{<1,2>, <1,3>, <2,4>, <3,4>, <4,5>}`。从顶点 **5** 出发进行 DFS,**能访问到哪些顶点**?解释原因。

第三题,对一个有 n 个顶点、e 条边的图,**邻接矩阵**和**邻接表**两种存储下,DFS 的时间复杂度分别是多少?为什么?

第四题,设计一个算法判断**无向图 G 是否是一棵树**。(提示:树的两个条件:(a) 连通,(b) 边数 = n-1。用 DFS/BFS 一次遍历判断(a),简单数一下边数判断(b))

第五题,**证明或反驳**:"在一个无向图中,如果从顶点 v 出发做 DFS 能访问到所有顶点,那么从任何其他顶点 u 出发做 DFS 也一定能访问到所有顶点。" (提示:这个结论对无向图成立,对有向图不成立,思考为什么)

第六题,BFS 用的是**队列**;如果把队列换成**栈**,会变成什么?(答案有点意外,值得你思考)

## 数据结构复习:拓扑排序与关键路径

好,我们进入**拓扑排序**和**关键路径**。这两个知识点贴近 DFS/BFS,代码不长但概念很"实用"——拓扑排序是编译器、构建系统(make、Maven、npm)的核心;关键路径是项目管理的灵魂(PERT 图、甘特图的理论基础)。

按我们的节奏,先讲**拓扑排序**,再讲**关键路径**(关键路径基于拓扑排序,顺序不能反)。

---

### 一、AOV 网与拓扑排序

#### 1.1 什么是 AOV 网

**AOV 网(Activity On Vertex)**:一个**有向无环图(DAG)**,**顶点表示活动**,**有向边 `<u, v>` 表示"活动 u 必须在活动 v 之前完成"**(u 是 v 的先决条件)。

**经典例子**:大学课程的先修关系。

```
顶点:C1(高数),C2(C 语言),C3(数据结构),C4(编译原理),
      C5(操作系统),C6(算法)

先修关系:
C1 → C3   (高数是数据结构的先修)
C2 → C3   (C 语言是数据结构的先修)
C3 → C4   (数据结构是编译原理的先修)
C3 → C5   (数据结构是操作系统的先修)
C3 → C6   (数据结构是算法的先修)
C4 → C6   (编译原理是算法的先修)
C5 → C6
```

#### 1.2 拓扑排序的定义

**拓扑排序**:把 AOV 网中的顶点排成一个线性序列,使得**对每条有向边 `<u, v>`,u 都出现在 v 之前**。换句话说,**所有先决条件都排在后继之前**的一个顺序。

**上面那个课程图的一个合法拓扑排序**:

```
C1, C2, C3, C4, C5, C6
```

或者:

```
C2, C1, C3, C5, C4, C6
```

都合法。**拓扑排序结果通常不唯一**——只要满足约束就行。

#### 1.3 关键定理

**定理**:一个有向图**存在拓扑排序**,当且仅当它是**有向无环图(DAG)**。

**反过来说**:**有环的图没有拓扑排序**。直观理解:A → B → C → A,那 A 必须在 B 前、B 在 C 前、C 在 A 前,**互相矛盾**,不存在合法序列。

**这个定理的一个重要副作用**:拓扑排序算法可以**用来检测有向图是否有环**——如果算法结束后还有顶点没被排进序列,就说明有环。

---

### 二、拓扑排序的两种实现

#### 2.1 方法一:Kahn 算法(入度法,基于 BFS)

**核心思想**:**反复找入度为 0 的顶点,输出它,并从图中"删掉"它**。删掉后它的出边所指向的顶点入度会减少,可能产生新的入度为 0 的顶点,继续找。

**算法步骤**:

第一步,**计算每个顶点的入度**。

第二步,把所有**入度为 0** 的顶点入队。

第三步,**出队一个顶点 v**,输出它,并把它的所有出邻居的入度 -1。

第四步,如果某个出邻居的入度变为 0,入队。

第五步,重复第三、四步直到队列空。

**如果最后输出的顶点数 < 总顶点数**,说明图中**有环**(环中的顶点入度永远不为 0)。

#### 2.2 Kahn 算法的代码(邻接表版)

cpp

```cpp
#include "ALGraph.h"
#include <queue>
using namespace std;

// 返回 true 表示成功,false 表示图中有环
bool TopoSort_Kahn(ALGraph G, int topo[]) {
    int inDegree[MAX_VERTEX] = {0};

    // 1. 计算每个顶点的入度(扫描所有邻接表)
    for (int i = 0; i < G.vexNum; i++) {
        EdgeNode *p = G.adjList[i].firstEdge;
        while (p != nullptr) {
            inDegree[p->adjVex]++;       // i 到 p->adjVex 有边,p->adjVex 入度 +1
            p = p->next;
        }
    }

    // 2. 所有入度为 0 的顶点入队
    queue<int> Q;
    for (int i = 0; i < G.vexNum; i++) {
        if (inDegree[i] == 0) Q.push(i);
    }

    // 3. 反复出队并"删除"
    int count = 0;                        // 已排序的顶点数
    while (!Q.empty()) {
        int v = Q.front(); Q.pop();
        topo[count++] = v;
        // 遍历 v 的所有出邻居,入度 -1
        EdgeNode *p = G.adjList[v].firstEdge;
        while (p != nullptr) {
            int w = p->adjVex;
            if (--inDegree[w] == 0) Q.push(w);
            p = p->next;
        }
    }

    // 4. 判断是否成功
    return count == G.vexNum;
}
```

**时间复杂度分析**:

计算入度扫描所有边 O(V+E);每个顶点入队/出队一次 O(V);每条边被处理一次(出邻居遍历)O(E)。总计 **O(V+E)**。

**空间复杂度**:O(V)(队列和 inDegree 数组)。

#### 2.3 方法二:基于 DFS 的拓扑排序

**核心思想**:对图做 DFS,**每个顶点在 DFS 完成时(递归返回时)记录**——最终得到的序列**逆序**就是拓扑序。

**为什么逆序?** 因为 DFS 从顶点 v 出发递归完成,意味着 v 的**所有后继都已经被探索完毕**。所以 v 应该排在它的后继**之后**。反过来看,最后完成的顶点应该排在拓扑序**最前面**。

cpp

```cpp
bool hasCycle;                // 检测环
bool onStack[MAX_VERTEX];     // 当前 DFS 路径上的顶点
int topoResult[MAX_VERTEX];
int topoIdx;                  // 从后往前填

void DFS_Topo(ALGraph G, int v, bool visited[]) {
    visited[v] = true;
    onStack[v] = true;

    EdgeNode *p = G.adjList[v].firstEdge;
    while (p != nullptr) {
        int w = p->adjVex;
        if (!visited[w]) {
            DFS_Topo(G, w, visited);
        } else if (onStack[w]) {
            hasCycle = true;           // 回边,发现环
        }
        p = p->next;
    }

    onStack[v] = false;
    topoResult[topoIdx--] = v;         // 后完成的先填
}

bool TopoSort_DFS(ALGraph G, int topo[]) {
    bool visited[MAX_VERTEX] = {false};
    for (int i = 0; i < MAX_VERTEX; i++) onStack[i] = false;
    hasCycle = false;
    topoIdx = G.vexNum - 1;

    for (int i = 0; i < G.vexNum; i++) {
        if (!visited[i]) DFS_Topo(G, i, visited);
    }

    if (hasCycle) return false;
    for (int i = 0; i < G.vexNum; i++) topo[i] = topoResult[i];
    return true;
}
```

**两种方法对比**:

|维度|Kahn(入度法)|DFS 法|
|---|---|---|
|基础|BFS|DFS|
|环检测|容易(count 对比)|需额外的 onStack 数组|
|代码长度|稍长但直观|稍短但要理解"逆序"|
|常见度|工程和考研主流|算法竞赛常用|

**考研 99% 以上用 Kahn 算法**——逻辑直白,环检测简单,写起来最顺手。

#### 2.4 手工模拟 Kahn 算法

用前面那个课程图:

```
C1 → C3, C2 → C3, C3 → C4, C3 → C5, C3 → C6, C4 → C6, C5 → C6
```

**初始入度**:

C1=0, C2=0, C3=2, C4=1, C5=1, C6=3

**入队入度为 0**:队列 [C1, C2]。

**出队 C1**,输出 C1,更新 C3 入度 2-1=1。队列 [C2]。

**出队 C2**,输出 C2,更新 C3 入度 1-1=0,C3 入队。队列 [C3]。

**出队 C3**,输出 C3,更新 C4 入度 1-1=0(入队),C5 入度 1-1=0(入队),C6 入度 3-1=2。队列 [C4, C5]。

**出队 C4**,输出 C4,更新 C6 入度 2-1=1。队列 [C5]。

**出队 C5**,输出 C5,更新 C6 入度 1-1=0,C6 入队。队列 [C6]。

**出队 C6**,输出 C6。队列空。

**拓扑序**:C1, C2, C3, C4, C5, C6。count=6=vexNum,无环。

---

### 三、AOE 网与关键路径

#### 3.1 什么是 AOE 网

**AOE 网(Activity On Edge)**:一个**带权有向无环图**,**顶点表示"事件"**,**有向边表示"活动"**,**边的权值表示活动所需的时间**。

**AOV 和 AOE 的区别**(易混淆!):

|维度|AOV 网|AOE 网|
|---|---|---|
|顶点表示|活动|事件(时间节点)|
|边表示|先后关系(无权)|活动(带权=持续时间)|
|权值|无|边权(活动时长)|
|主要问题|拓扑排序(顺序)|关键路径(总时长)|

**实际例子**:一个软件项目的 AOE 网。

```
顶点:v1(开始),v2(设计完成),v3(前端完成),v4(后端完成),
      v5(集成完成),v6(测试完成)

活动(边):
v1 → v2,权 5(设计阶段,5 天)
v2 → v3,权 3(前端开发)
v2 → v4,权 6(后端开发)
v3 → v5,权 2(前端集成)
v4 → v5,权 1(后端集成)
v5 → v6,权 4(测试)
```

#### 3.2 关键概念(必须一字不差地记)

关键路径涉及**四个时间参数**,两两成对。你一定要先把这四个概念的**含义**和**关系**搞清楚,然后才能理解算法。

**顶点参数**(对事件而言):

**ve(v)**:事件 v 的**最早发生时间**(earliest)。物理意义:从源点到 v 的**最长路径**长度——因为 v 要等所有先决条件都完成,慢的那一条决定了 v 能开始的最早时间。

**vl(v)**:事件 v 的**最晚发生时间**(latest)。物理意义:在不延误总工期的前提下,v 最晚可以什么时候发生。

**边参数**(对活动 `<u, v>` 而言,权值为 w):

**e(活动)**:活动 `<u, v>` 的**最早开始时间**。等于 `ve(u)`——活动从 u 发出,u 最早发生时活动就能最早开始。

**l(活动)**:活动 `<u, v>` 的**最晚开始时间**。等于 `vl(v) - w`——活动完成时不能迟于 v 的最晚发生时间,所以活动最晚也要在 `vl(v) - w` 时开始。

**关键活动**:满足 **`e(活动) == l(活动)`** 的活动,即"没有时间余量,耽误不起"的活动。

**关键路径**:由关键活动组成的从源点到汇点的路径。**关键路径的长度 = 工程总工期**。

#### 3.3 为什么要找关键路径?

**工程意义**:工程总工期取决于关键路径。**加快非关键活动不会缩短总工期;只有加快关键活动才有效**。这是项目管理的铁律。

**举例**:设计阶段(5天)是关键路径的一部分,加快设计能缩短工期;但如果前端开发和后端开发并行,而前端只需 3 天、后端需 6 天,**前端就是非关键活动**——即使前端加速到 2 天,总工期也不变(后端仍然需要 6 天)。

#### 3.4 关键路径算法(六步法,必须熟练)

**第一步**,对 AOE 网做**拓扑排序**,得到拓扑序。

**第二步**,**按拓扑序**从前往后计算 ve(v):

```
ve(源点) = 0
ve(v) = max{ ve(u) + w(u,v) } 对所有 u 能到达 v
```

"最早发生"取**最大值**——要等最慢的前置。

**第三步**,**按逆拓扑序**从后往前计算 vl(v):

```
vl(汇点) = ve(汇点)              ← 汇点的最晚 = 最早
vl(u) = min{ vl(v) - w(u,v) } 对所有 u 能到达 v
```

"最晚发生"取**最小值**——不能耽误最急的后继。

**第四步**,对每条活动 `<u, v>`(权 w):

```
e(活动) = ve(u)
l(活动) = vl(v) - w
```

**第五步**,找出所有 `e == l` 的活动,即**关键活动**。

**第六步**,关键活动连起来就是**关键路径**。关键路径可能不唯一(多条并列的最长路径)。

#### 3.5 手算关键路径示例

用前面的软件项目 AOE 网。

**边和权**:v1→v2(5), v2→v3(3), v2→v4(6), v3→v5(2), v4→v5(1), v5→v6(4)。

**第一步:拓扑排序**。显然:v1, v2, v3, v4, v5, v6(或 v1, v2, v4, v3, v5, v6 都合法)。

**第二步:按拓扑序算 ve**。

ve(v1) = 0。

ve(v2) = ve(v1) + 5 = 5。

ve(v3) = ve(v2) + 3 = 8。

ve(v4) = ve(v2) + 6 = 11。

ve(v5) = max{ve(v3) + 2, ve(v4) + 1} = max{10, 12} = 12。

ve(v6) = ve(v5) + 4 = 16。

**总工期 = ve(v6) = 16 天**。

**第三步:按逆拓扑序算 vl**。

vl(v6) = ve(v6) = 16。

vl(v5) = vl(v6) - 4 = 12。

vl(v4) = vl(v5) - 1 = 11。

vl(v3) = vl(v5) - 2 = 10。

vl(v2) = min{vl(v3) - 3, vl(v4) - 6} = min{7, 5} = 5。

vl(v1) = vl(v2) - 5 = 0。

**第四、五步:算每条边的 e、l,找关键活动**。

|活动|e|l|l-e|关键?|
|---|---|---|---|---|
|v1→v2 (5)|0|0|0|✅|
|v2→v3 (3)|5|7|2|❌|
|v2→v4 (6)|5|5|0|✅|
|v3→v5 (2)|8|10|2|❌|
|v4→v5 (1)|11|11|0|✅|
|v5→v6 (4)|12|12|0|✅|

**关键路径**:v1 → v2 → v4 → v5 → v6,总长 5+6+1+4 = 16(= 总工期 ✓)。

**工程启示**:如果你想把项目从 16 天缩短到 15 天,**必须加快关键路径上的某个活动**(比如把后端开发从 6 天压到 5 天)。加快前端开发(v2→v3)毫无用处。

#### 3.6 关键路径代码(邻接表版)

cpp

```cpp
#include "ALGraph.h"
#include <iostream>
#include <queue>
#include <cstring>
using namespace std;

int ve[MAX_VERTEX], vl[MAX_VERTEX];

bool CriticalPath(ALGraph G) {
    // 1. 拓扑排序(Kahn)
    int inDegree[MAX_VERTEX] = {0};
    for (int i = 0; i < G.vexNum; i++) {
        EdgeNode *p = G.adjList[i].firstEdge;
        while (p) { inDegree[p->adjVex]++; p = p->next; }
    }

    queue<int> Q;
    for (int i = 0; i < G.vexNum; i++) {
        if (inDegree[i] == 0) Q.push(i);
        ve[i] = 0;                       // ve 初始化为 0
    }

    int topo[MAX_VERTEX], count = 0;
    while (!Q.empty()) {
        int u = Q.front(); Q.pop();
        topo[count++] = u;
        EdgeNode *p = G.adjList[u].firstEdge;
        while (p) {
            int v = p->adjVex;
            // 2. 顺便算 ve:ve(v) = max{ve(u) + w}
            if (ve[u] + p->weight > ve[v]) {
                ve[v] = ve[u] + p->weight;
            }
            if (--inDegree[v] == 0) Q.push(v);
            p = p->next;
        }
    }

    if (count < G.vexNum) {
        cout << "图中有环,无法算关键路径" << endl;
        return false;
    }

    // 3. 按逆拓扑序算 vl
    for (int i = 0; i < G.vexNum; i++) vl[i] = ve[topo[count - 1]];  // 初始化为终点的 ve

    for (int i = count - 1; i >= 0; i--) {
        int u = topo[i];
        EdgeNode *p = G.adjList[u].firstEdge;
        while (p) {
            int v = p->adjVex;
            if (vl[v] - p->weight < vl[u]) {
                vl[u] = vl[v] - p->weight;
            }
            p = p->next;
        }
    }

    // 4. 输出关键活动
    cout << "关键活动:" << endl;
    for (int u = 0; u < G.vexNum; u++) {
        EdgeNode *p = G.adjList[u].firstEdge;
        while (p) {
            int v = p->adjVex;
            int e = ve[u];
            int l = vl[v] - p->weight;
            if (e == l) {
                cout << "  " << G.adjList[u].data << " -> "
                     << G.adjList[v].data << " (权 " << p->weight << ")" << endl;
            }
            p = p->next;
        }
    }

    cout << "总工期: " << ve[topo[count - 1]] << endl;
    return true;
}
```

**代码设计要点**:

第一,**拓扑排序时顺便算 ve**——因为 ve 的计算恰好需要按拓扑序。这是一石二鸟的经典技巧。

第二,**vl 初始化为终点的 ve**——所有顶点的 vl 初值都设为终点的 ve(即总工期),然后从后往前松弛(取 min)。

第三,**逆拓扑序**从 `topo[count-1]` 遍历到 `topo[0]`。

---

### 四、文件组织与测试

沿用之前的 Graph 目录,在 `ALGraph.cpp` 里扩展拓扑排序和关键路径。简单起见,这里我直接把代码写在 main.cpp 里演示:

cpp

```cpp
#include "ALGraph.h"
#include <iostream>
using namespace std;

bool TopoSort_Kahn(ALGraph G, int topo[]);
bool CriticalPath(ALGraph G);

int main() {
    /* 输入样例(带权有向图):
       6 6
       1 2 3 4 5 6
       1 2 5
       2 3 3
       2 4 6
       3 5 2
       4 5 1
       5 6 4
    */
    ALGraph G;
    InitGraph_AL(G);
    CreateGraph_AL(G, true, true);    // 有向、带权

    int topo[MAX_VERTEX];
    if (TopoSort_Kahn(G, topo)) {
        cout << "拓扑序: ";
        for (int i = 0; i < G.vexNum; i++) {
            cout << G.adjList[topo[i]].data << " ";
        }
        cout << endl;
    }

    CriticalPath(G);

    DestroyGraph_AL(G);
    return 0;
}
```

预期输出:

```
拓扑序: 1 2 3 4 5 6
关键活动:
  1 -> 2 (权 5)
  2 -> 4 (权 6)
  4 -> 5 (权 1)
  5 -> 6 (权 4)
总工期: 16
```

---

### 五、易错点总结

**易错一:AOV 和 AOE 搞混**。AOV 顶点是活动,AOE **边**是活动。这是考研选择题最爱混淆的。

**易错二:拓扑序不唯一**。只要满足先后约束,输出顺序可以多种。大题要问"是否有某种拓扑序",你要判断所有可能;要你"给出一种",任何合法的都算对。

**易错三:Kahn 算法用栈还是队列?** 都行!用栈时结果仍是合法拓扑序,只是顺序不同。考研默认用队列(教材统一)。

**易错四:ve 和 vl 的"最大、最小"搞反**。ve 取**max**(等最慢的前置),vl 取**min**(不能误最急的后继)。可以用"瓶颈"来类比:前置瓶颈影响最早发生,后继瓶颈影响最晚发生。

**易错五:关键路径不唯一**。如果有多条长度相同的最长路径,都是关键路径。加快其中一条的某个活动**不一定能缩短总工期**——除非同时加快所有关键路径上的活动。这是一个考研坑。

**易错六:关键活动的边与关键路径上的点**。关键**活动**是边;关键**路径**是一条由关键活动组成的路径。说"顶点是关键路径上的"不等于说"某条边是关键活动",反之亦然。

**易错七:vl 的初始化**。`vl[终点] = ve[终点]`,其他顶点的 vl 可以初始化为终点的 ve,然后从后往前取 min。直接初始化为 ∞ 也行,但计算时要小心边界。

---

### 六、思考题(请作答)

**第一题**:下面的有向图,写出所有合法的**拓扑排序**序列。(提示:用 Kahn 算法模拟,注意每次入度为 0 的顶点可能不止一个)

```
顶点:{1, 2, 3, 4, 5}
边:  <1,2>, <1,3>, <2,4>, <3,4>, <4,5>
```

**第二题**:一个有向图的拓扑排序**不唯一**,说明了什么?有什么条件下拓扑排序**唯一**?

**第三题**:下面的 AOE 网,求:

```
顶点:v1(源), v2, v3, v4, v5, v6(汇)
边:v1→v2(6), v1→v3(4), v1→v4(5), v2→v5(1),
    v3→v5(1), v4→v6(2), v5→v6(7)
```

(a) 所有顶点的 ve 和 vl; (b) 所有活动的 e 和 l; (c) 关键路径及总工期。

**第四题**:对第三题的 AOE 网,如果你是项目经理,**能否通过加快活动 `v3→v5` 来缩短工期**?为什么?**能否加快 `v5→v6`**?解释原因。

**第五题**:如何用 **DFS** 检测一个有向图是否有环?写出伪代码思路(提示:用我代码中 `onStack` 数组的思想)。

**第六题**:拓扑排序算法能用于**无向图**吗?为什么?(提示:想想入度的定义在无向图里是否还有意义)

**第七题**:编译器编译代码时,需要处理头文件依赖。假设头文件 A 依赖 B、C,B 依赖 D,C 依赖 D。**用拓扑排序给出一个合法的"处理顺序"**,使得每个头文件在被依赖它的文件处理之前就已经处理完毕。

## 数据结构复习:最小生成树(Prim 与 Kruskal)

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

**性质二（割性质 / Cut Property）**：如果把图的顶点分成两个非空集合 $U$ 和 $V\setminus U$，那么**连接 $U$ 和 $V\setminus U$ 的所有边中，权值最小的边**一定属于某棵 MST。

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

## 数据结构复习:最短路径(Dijkstra 与 Floyd)

好,我们进入图论的**压轴章节**——最短路径。这是考研大题命中率最高的图论内容,也是 GPS 导航、网络路由的核心算法。

这一节讲两种经典算法:**Dijkstra**(单源最短路径)和 **Floyd**(多源最短路径)。它们思路完全不同,代码风格也迥异,但都是**动态规划思想**的经典体现。你会发现 Dijkstra 的代码和 Prim 惊人相似——我会在对比中让你看到**贪心算法的共性**。

---

### 一、问题分类(先搞清楚要解决什么)

**单源最短路径**:给定起点 s,求 s 到**其他所有顶点**的最短路径。典型算法:**Dijkstra**(非负权)、**Bellman-Ford**(允许负权)。

**多源最短路径**:求**任意两点之间**的最短路径。典型算法:**Floyd**。

**单对最短路径**:只求 s 到某个特定 t 的最短路径。实际中用 Dijkstra 走到 t 即可,没有专门算法。

**考研要求掌握**:Dijkstra 和 Floyd。Bellman-Ford 偶尔以简答题形式出现。

---

### 二、Dijkstra 算法(迪杰斯特拉)

#### 2.1 核心思想

**"贪心地扩展最近点"**。和 Prim 极其相似,但关注的是"**累计路径长度**",不是"单条边权"。

把顶点分成两组:**已确定最短路径**的(S 集),**未确定**的(V-S 集)。每次从 V-S 中选出**距离 s 最小**的顶点 u,加入 S。然后**用 u 松弛**其他顶点——即看看"s→u→其他顶点"的路径是否比目前已知的更短。

**关键词:松弛(Relax)**。这是最短路径算法的灵魂操作。

#### 2.2 "松弛"是什么?

给定顶点 v,当前已知 s 到 v 的最短距离是 `dist[v]`(可能是估值,不一定最优)。如果我们发现 s 通过 u 再到 v 更短,即:

```
dist[u] + w(u, v) < dist[v]
```

就**更新** `dist[v] = dist[u] + w(u, v)`。这就是"松弛"——像把橡皮筋从"过长的估值"拉紧到"更短的实际值"。

#### 2.3 Dijkstra 的三个核心数组

**dist[i]**:s 到顶点 i 当前已知的最短距离。初始 dist[s] = 0,其他都是 INF(或 s 的直接邻居是边权)。

**path[i]**:i 的**前驱顶点**(最短路径上,i 的上一个顶点是谁)。用于回溯路径。

**final[i]**(或叫 visited[i]):i 是否已加入 S 集(已确定最短)。

#### 2.4 算法骨架

第一步,初始化 dist、path、final 三个数组。

第二步,循环 n 次(每次把一个顶点加入 S):

(a) 在 V-S 中找 dist 最小的顶点 u。

(b) 把 u 加入 S:final = true。

(c) 以 u 为中继,**松弛**所有 u 的邻居:对每个未加入的邻居 v,若 dist[u] + w(u, v) < dist[v],则更新 dist[v] 和 path[v]。

第三步,算法结束后,dist 数组就是 s 到所有顶点的最短距离,path 数组可以回溯出路径。

#### 2.5 Dijkstra 代码(邻接矩阵版)

cpp

```cpp
#include "MGraph.h"
#include <iostream>
using namespace std;

void Dijkstra(MGraph G, int s, int dist[], int path[]) {
    bool final[MAX_VERTEX];

    // 1. 初始化
    for (int i = 0; i < G.vexNum; i++) {
        dist[i] = G.edges[s][i];          // 起点到 i 的直接距离
        final[i] = false;
        path[i] = (dist[i] != INF) ? s : -1;   // s 的直接邻居前驱是 s,其他 -1
    }
    dist[s] = 0;
    final[s] = true;                       // s 自己加入 S
    path[s] = -1;

    // 2. 循环 n-1 次,每次确定一个顶点的最短距离
    for (int i = 1; i < G.vexNum; i++) {
        // (a) 找 V-S 中 dist 最小的顶点 u
        int min = INF, u = -1;
        for (int j = 0; j < G.vexNum; j++) {
            if (!final[j] && dist[j] < min) {
                min = dist[j];
                u = j;
            }
        }

        if (u == -1) break;                // 剩下的顶点都不可达

        // (b) u 加入 S
        final[u] = true;

        // (c) 用 u 松弛其他顶点
        for (int v = 0; v < G.vexNum; v++) {
            if (!final[v] && G.edges[u][v] != INF
                && dist[u] + G.edges[u][v] < dist[v]) {
                dist[v] = dist[u] + G.edges[u][v];
                path[v] = u;                // 记录 v 的前驱是 u
            }
        }
    }
}
```

**几个关键代码细节**:

第一,初始化 `dist[i] = G.edges[s][i]`——这是"到 i 的直接距离"。如果 s-i 有边,就是边权;没边,就是 INF。

第二,**松弛条件写全**:`!final[v]`(只松弛未确定的),`G.edges[u][v] != INF`(u-v 要有边),`dist[u] + G.edges[u][v] < dist[v]`(新路径更短)。三者缺一不可。

第三,**边权加法可能溢出**——如果用 INT_MAX 表示 INF,`dist[u] + INF` 会溢出。所以我们一直推荐用 **`0x3f3f3f3f`** 作为 INF,加法后仍然是大数,不会变负。

#### 2.6 手工模拟 Dijkstra

一个带权有向图:

```
顶点:{0, 1, 2, 3, 4}
边:
0→1 (10)
0→4 (5)
1→2 (1)
1→4 (2)
2→3 (4)
3→0 (7)
3→2 (6)
4→1 (3)
4→2 (9)
4→3 (2)
```

**从 0 出发,求到所有点的最短路径**。

**初始化**:

|顶点|0|1|2|3|4|
|---|---|---|---|---|---|
|dist|0|10|∞|∞|5|
|path|-|0|-1|-1|0|
|final|T|F|F|F|F|

**第 1 轮**:V-S 中最小 dist 是 4(值 5)。加入 4。

松弛 4 的邻居:

4→1:dist + 3 = 8 < 10,更新 dist[1]=8, path[1]=4。

4→2:dist + 9 = 14 < ∞,更新 dist[2]=14, path[2]=4。

4→3:dist + 2 = 7 < ∞,更新 dist[3]=7, path[3]=4。

|顶点|0|1|2|3|4|
|---|---|---|---|---|---|
|dist|0|8|14|7|5|
|path|-|4|4|4|0|
|final|T|F|F|F|T|

**第 2 轮**:V-S 中最小 dist 是 3(值 7)。加入 3。

松弛 3 的邻居:

3→0:dist + 7 = 14,但 0 已 final,跳过。

3→2:dist + 6 = 13 < 14,更新 dist[2]=13, path[2]=3。

|顶点|0|1|2|3|4|
|---|---|---|---|---|---|
|dist|0|8|13|7|5|
|path|-|4|3|4|0|
|final|T|F|F|T|T|

**第 3 轮**:V-S 中最小 dist 是 1(值 8)。加入 1。

松弛 1 的邻居:

1→2:dist + 1 = 9 < 13,更新 dist[2]=9, path[2]=1。

1→4:4 已 final,跳过。

|顶点|0|1|2|3|4|
|---|---|---|---|---|---|
|dist|0|8|9|7|5|
|path|-|4|1|4|0|
|final|T|T|F|T|T|

**第 4 轮**:V-S 中最小 dist 是 2(值 9)。加入 2。

松弛 2 的邻居:2→3,3 已 final;无其他边。

结束。

**最终结果**:

|终点|最短距离|路径|
|---|---|---|
|0|0|0|
|1|8|0 → 4 → 1|
|2|9|0 → 4 → 1 → 2|
|3|7|0 → 4 → 3|
|4|5|0 → 4|

**路径怎么回溯?** 比如终点 2,path[2] = 1,path[1] = 4,path[4] = 0,path[0] = -1(起点)。逆序得 0 → 4 → 1 → 2。

#### 2.7 输出路径的代码

cpp

```cpp
void PrintPath(int path[], int target, MGraph G) {
    if (path[target] == -1) {
        cout << G.vexs[target];
        return;
    }
    PrintPath(path, path[target], G);
    cout << " -> " << G.vexs[target];
}
```

递归回溯——**先打印前驱的路径,再加上自己**。

#### 2.8 Dijkstra 的复杂度

**时间**:O(V²)——外层 n 次,每次找最小 dist 是 O(V),松弛也是 O(V)。

**优化**:用**小根堆/优先队列**维护 dist,时间降到 **O((V+E) log V)**。稀疏图大幅加速。

**核心观察**:Dijkstra 的代码结构和 Prim **几乎一模一样**,唯一区别是:

Prim:`lowcost[v] = G[u][v]`(比较单边权)。

Dijkstra:`dist[v] = dist[u] + G[u][v]`(比较累计距离)。

**贪心思想是相通的**——每次扩展"最近"的点,差别只在"近"的定义是单边还是累计。

#### 2.9 致命警告:Dijkstra 不能处理负权边

这是最经典的考点。**为什么 Dijkstra 不能有负权?**

Dijkstra 的贪心正确性依赖于一个假设:**"一旦把 u 加入 S,dist[u] 就不可能再变小"**。

如果有负权,这个假设就失效——后面某个顶点 x 通过负权边连到 u,可能让 s→x→u 比当前 dist[u] 更短。但 u 已经被"锁定",算法不会再更新它,结果就错了。

**有负权怎么办?** 用 **Bellman-Ford**(O(VE))或 **SPFA**(Bellman-Ford 的队列优化版)。考研以了解为主。

---

### 三、Floyd 算法(弗洛伊德)

#### 3.1 问题目标

求**任意两顶点之间**的最短路径。若用 Dijkstra 对每个顶点作为起点跑一遍,时间 O(V³);Floyd 同样 O(V³),但**代码极短**(核心就三重循环),且**思想更优美**。

#### 3.2 核心思想:动态规划

定义状态 **D(k)[i][j]**:"**只允许使用前 k 个顶点作为中间顶点**"时,i 到 j 的最短距离。

**递推关系**:

对新加入的中间顶点 k,从 i 到 j 有两种选择:

不经过 k:沿用 D(k-1)[i][j]。

经过 k:D(k-1)[i][k] + D(k-1)[k][j]。

**取两者较小值**:

```
D(k)[i][j] = min( D(k-1)[i][j],  D(k-1)[i][k] + D(k-1)[k][j] )
```

**初始 D(-1)[i][j]** = 邻接矩阵(只看直接边)。

**最终答案**:D(n-1)[i][j] = i 到 j 的最短路径(允许所有顶点作中间点)。

#### 3.3 神奇的空间优化:一个矩阵搞定

朴素 DP 要三维数组 D(k)[i][j],但可以证明:**用一个二维数组 D[i][j] 就能原地更新**,k 从 0 到 n-1 迭代,每轮 D 自动更新成 D(k)。

**为什么不会出错?** 当处理 D[i][j] 在第 k 轮更新时:

D[i][k]:这一轮它要么没变(如果 i\==k 或中间不经过 k 更短),要么已在前面某一轮算出了过 k 的更短路径——但本轮处理 D[i][k] 时,k 是中间点,D[i][k] 要么保持前一轮值,要么……其实仔细看:D[k] 在第 k 轮更新时,比较 D[i][k] 和 D[i][k] + D[k][k] = D[i][k] + 0 = D[i][k],相等。所以 D[i][k] 在第 k 轮不会变。D[k][j] 同理。

结论:**D[i][k] 和 D[k][j] 在第 k 轮内保持不变**,所以用原地更新是安全的。

#### 3.4 Floyd 代码(邻接矩阵,极简)

cpp

```cpp
#include "MGraph.h"
#include <iostream>
using namespace std;

int dist[MAX_VERTEX][MAX_VERTEX];
int path[MAX_VERTEX][MAX_VERTEX];

void Floyd(MGraph G) {
    // 1. 初始化
    for (int i = 0; i < G.vexNum; i++) {
        for (int j = 0; j < G.vexNum; j++) {
            dist[i][j] = G.edges[i][j];
            path[i][j] = (i != j && dist[i][j] != INF) ? i : -1;
            // path[i][j] = k 表示 i→j 最短路径上,j 的前驱是 k
        }
    }

    // 2. 三重循环:k 是中间点(最外层!)
    for (int k = 0; k < G.vexNum; k++) {
        for (int i = 0; i < G.vexNum; i++) {
            for (int j = 0; j < G.vexNum; j++) {
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                    path[i][j] = path[k][j];   // i→j 的前驱改为"k→j 的前驱"
                }
            }
        }
    }
}
```

**请特别注意循环顺序**:**k 必须在最外层**!

如果 k 在内层,相当于先固定 i、j,然后用不同 k 更新——这样每个(i, j) 只试了少量中间点,不等价于 DP 的"考虑前 k 个顶点"。**把 k 放错层是考研选择题的经典错误选项**。

#### 3.5 Floyd 的路径回溯

`path[i][j] = k` 的含义:**i 到 j 的最短路径上,j 的前驱顶点是 k**。

回溯过程:

cpp

```cpp
void PrintFloydPath(int i, int j, MGraph G) {
    if (i == j) { cout << G.vexs[i]; return; }
    if (path[i][j] == -1) { cout << "(不可达)"; return; }
    PrintFloydPath(i, path[i][j], G);
    cout << " -> " << G.vexs[j];
}
```

#### 3.6 Floyd 的复杂度

**时间**:O(V³)。

**空间**:O(V²)(dist 和 path 两个矩阵)。

**优势**:

代码极短(三重循环)。

**支持负权边**(只要无负权环)!这是相对 Dijkstra 的一大优势。

**劣势**:

V 大时很慢(V=1000 时 10⁹ 次运算)。

不支持负权环(环权值和为负,最短路径无定义,沿环走无限次可以到负无穷)。

#### 3.7 手工模拟 Floyd 的一轮

一个小图:

```
顶点:{0, 1, 2}
  0→1 (4), 0→2 (11),
  1→2 (2),
  2→0 (3)
```

初始 dist:

```
     0   1   2
  0 [ 0   4   11]
  1 [ ∞   0   2 ]
  2 [ 3   ∞   0 ]
```

**k=0 轮**(允许经过 0):

对每个 (i, j),检查 dist[i][j] vs dist[i][0] + dist[0][j]:

(1, 2):∞ vs dist[1][0]+dist[0][2] = ∞+11 = ∞。不更新。

(2, 1):∞ vs dist[2][0]+dist[0][1] = 3+4 = 7。**更新 dist[2][1]=7**。

其他不变。

**k=1 轮**(允许经过 0 和 1):

(0, 2):11 vs dist[0][1]+dist[1][2] = 4+2 = 6。**更新 dist[0][2]=6**。

(2, 2):0 vs dist[2][1]+dist[1][2] = 7+2 = 9。不更新(0 更小)。

**k=2 轮**(允许经过 0、1、2):

(0, 0):0 vs dist[0][2]+dist[2][0] = 6+3 = 9。不变。

(0, 1):4 vs dist[0][2]+dist[2][1] = 6+7 = 13。不变。

(1, 0):∞ vs dist[1][2]+dist[2][0] = 2+3 = 5。**更新 dist[1][0]=5**。

(1, 1):0 vs dist[1][2]+dist[2][1] = 2+7 = 9。不变。

**最终 dist**:

```
     0   1   2
  0 [ 0   4   6 ]
  1 [ 5   0   2 ]
  2 [ 3   7   0 ]
```

---

### 四、Dijkstra vs Floyd 对比

|维度|Dijkstra|Floyd|
|---|---|---|
|解决问题|单源最短路径|多源最短路径|
|时间|O(V²) 或 O((V+E)logV)|O(V³)|
|空间|O(V)|O(V²)|
|允许负权|❌ 不允许|✅ 允许(但不能有负环)|
|代码长度|较长|极短(三重循环)|
|思想|贪心|动态规划|
|适用|单点到其他点|所有点对|

**选择策略**:

问"某点到所有点":**Dijkstra**。

问"所有点对":**Floyd**(或多次 Dijkstra,取决于图大小)。

有负权:**Floyd**(或 Bellman-Ford)。

稀疏图单源:**Dijkstra + 堆**(比 O(V²) 快)。

---

### 五、完整测试代码

cpp

```cpp
#include "MGraph.h"
#include <iostream>
using namespace std;

void Dijkstra(MGraph G, int s, int dist[], int path[]);
void PrintPath(int path[], int target, MGraph G);
void Floyd(MGraph G);
void PrintFloydPath(int i, int j, MGraph G);
extern int dist[MAX_VERTEX][MAX_VERTEX];
extern int path[MAX_VERTEX][MAX_VERTEX];

int main() {
    /* 有向带权图输入:
       5 10
       0 1 2 3 4
       0 1 10
       0 4 5
       1 2 1
       1 4 2
       2 3 4
       3 0 7
       3 2 6
       4 1 3
       4 2 9
       4 3 2
    */
    MGraph G;
    InitGraph_M(G);
    CreateGraph_M(G, true, true);

    // ========== Dijkstra ==========
    cout << "===== Dijkstra(从 0 出发) =====" << endl;
    int d[MAX_VERTEX], p[MAX_VERTEX];
    Dijkstra(G, 0, d, p);
    for (int i = 0; i < G.vexNum; i++) {
        cout << "0 到 " << G.vexs[i] << " 的最短距离: " << d[i]
             << ",路径: ";
        PrintPath(p, i, G);
        cout << endl;
    }

    // ========== Floyd ==========
    cout << "\n===== Floyd =====" << endl;
    Floyd(G);
    for (int i = 0; i < G.vexNum; i++) {
        for (int j = 0; j < G.vexNum; j++) {
            if (i != j) {
                cout << G.vexs[i] << " 到 " << G.vexs[j] << ": "
                     << (dist[i][j] == INF ? -1 : dist[i][j]);
                if (dist[i][j] != INF) {
                    cout << " 路径: ";
                    PrintFloydPath(i, j, G);
                }
                cout << endl;
            }
        }
    }
    return 0;
}
```

预期输出(部分):

```
===== Dijkstra(从 0 出发) =====
0 到 0 的最短距离: 0,路径: 0
0 到 1 的最短距离: 8,路径: 0 -> 4 -> 1
0 到 2 的最短距离: 9,路径: 0 -> 4 -> 1 -> 2
0 到 3 的最短距离: 7,路径: 0 -> 4 -> 3
0 到 4 的最短距离: 5,路径: 0 -> 4

===== Floyd =====
... (类似结果)
```

---

### 六、易错点总结

**易错一:Dijkstra 不处理负权**。这是选择题杀手,必背。有负权选 Bellman-Ford 或 Floyd。

**易错二:Floyd 的 k 必须在最外层**。k 在中间或最内层就变成错误的更新顺序。

**易错三:Dijkstra 初始化 dist**。应该是 `G.edges[s][i]`(直接边权),而不是 0 或 INF 一刀切。

**易错四:path 数组的含义**。Dijkstra 的 `path[i]` 是 i 的**前驱**;Floyd 的 `path[i][j]` 是 i→j 最短路径上 j 的前驱。看似类似,但对象不同。

**易错五:INF 的选择**。用 INT_MAX 会导致 `dist[u] + edge` 溢出变负,路径计算错乱。一定用 `0x3f3f3f3f`。

**易错六:Dijkstra 的 final 数组初始化**。`final[s] = true` 要在循环前设好,否则 s 自己会被当作"未确定"处理。

**易错七:两个算法的时间复杂度不要搞混**。Dijkstra 朴素 O(V²),Floyd 一定是 O(V³)。

---

### 七、高频考点:如何判断哪个顶点的最短路径**先**被确定?

这是选择题常考的。**Dijkstra 确定顶点的顺序**是"按 dist 升序"——dist 最小的先被加入 S。

比如前面那个例子,从 0 出发,顶点被确定的**顺序**:

0(dist=0)→ 4(dist=5)→ 3(dist=7)→ 1(dist=8)→ 2(dist=9)

这是 dist 升序。**考研大题常问"第 k 个被确定的是谁"、"某顶点确定时 dist 是多少"**——按照手算过程记录即可。

---

### 八、思考题(请作答)

**第一题**,给定下面的有向带权图,用 Dijkstra 从 V1 出发,**列出每一轮的 dist 数组状态**,并写出 V1 到每个顶点的最短路径及距离:

```
V1 → V2 (10), V1 → V5 (100), V1 → V4 (30)
V2 → V3 (50)
V3 → V5 (10)
V4 → V3 (20), V4 → V5 (60)
```

**第二题**,在第一题的图上跑 Floyd 算法,给出**最终的 dist 矩阵**(所有顶点对的最短距离)。

**第三题**,**为什么 Dijkstra 不能处理负权边**?给出一个具体的小反例图(3-4 个顶点),说明 Dijkstra 在这个图上会给出错误答案,指出错在哪。

**第四题**,**Floyd 算法的三重循环,k 必须在最外层**。如果把 k 放在最内层,会发生什么?给一个反例说明结果错。

**第五题**,**一个图有 5 个顶点,用 Dijkstra 从 s 出发**。第 1 个被确定最短路径的一定是 s。请问第 2 个被确定的是谁?(提示:根据 Dijkstra 的贪心选择)

**第六题**,**Dijkstra 和 Prim 的代码结构极其相似**。请写出两者的**主要差异**(在 lowcost 和 dist 的更新逻辑上)。你能用一句话概括它们的共性和区别吗?

**第七题**,**如果只想求 s 到某个特定终点 t 的最短路径**,可以让 Dijkstra 跑到 t 就停下来,不用跑完所有顶点。这样做**正确吗**?为什么?(提示:想想 Dijkstra 的贪心保证是什么)

**第八题**,**Floyd 算法输出的 dist 矩阵对角线**(即 dist[i][i])**应该都是 0**。如果算法结束后某个 dist[i][i] < 0,意味着什么?

---

### 九、图论部分完结总结

走到最短路径这里,你的图论已经**系统完整**了。回头看这条路线:

**基础**:图的定义、术语(邻接、度、连通、强连通)、五种存储结构(邻接矩阵、邻接表、十字链表、邻接多重表、边集数组)。

**遍历**:DFS 和 BFS,递归/非递归/邻接矩阵/邻接表四种组合。

**应用**:连通分量、拓扑排序(AOV 网)、关键路径(AOE 网)、最小生成树(Prim、Kruskal + 并查集)、最短路径(Dijkstra、Floyd)。

**数据结构涉及**:栈(DFS)、队列(BFS)、堆(Dijkstra 优化)、并查集(Kruskal)——**你前面学过的所有数据结构,在图算法里几乎都被用上**。

---

### 十、最终学习版图回顾

你目前掌握的数据结构全家福:

**线性结构**:链表(单/双/循环)、顺序表(静/动)、栈、队列、KMP。

**树形结构**:二叉树、线索二叉树、BST、AVL、红黑树、B 树、B+ 树、哈夫曼树、一般树、森林、堆。

**图结构**:邻接矩阵、邻接表、并查集。

**算法**:DFS、BFS、拓扑排序、关键路径、MST、最短路径。

**到这里,此前已经掌握了考研 408 数据结构 80% 以上的内容**——只剩**查找**(散列表)和**排序**(快排、归并等)这两个章节。
