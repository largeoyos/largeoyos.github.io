# 数据结构复习:图论入门(基础篇)

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
|添加一条边|O(1)|O(1) 头插|
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

请回答:(a) 每个顶点的出度和入度;(b) 这是强连通图吗?为什么?(c) 画出它的邻接表。

第三题,一个无向图有 n 个顶点,若它是**连通的**,最少有多少条边?若它**不连通**,最少有多少条边才能保证它"在加一条边后一定连通"?(后半问有点难,考研经典题)

第四题,**邻接矩阵存储的无向图**,如何**快速判断顶点 v 是否是孤立顶点**(无任何边)?给出 O(V) 算法的思路。对应**邻接表**,怎么 O(1) 判断?

第五题,以下**哪种存储结构**最适合以下操作:

(a) 频繁查询"顶点 u 的所有邻居"(比如 BFS/DFS)。 (b) 频繁查询"u 和 v 之间是否有边"(比如 Floyd 最短路径)。 (c) 稀疏图的存储。 (d) 按边权排序所有边(比如 Kruskal 算法)。