# 数据结构复习:图的遍历(DFS 和 BFS)

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

```
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

**层 0**:访问 A,入队。队列:[A]。

**层 1**:出队 A,访问 A 的所有未访问邻居 B、C,入队。输出:A B C。队列:[B, C]。

**层 2**:出队 B,访问 B 的未访问邻居 D、E。输出:A B C D E。队列:[C, D, E]。

出队 C,访问 C 的未访问邻居 F、G。输出:A B C D E F G。队列:[D, E, F, G]。

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

---

### 十、下一步方向

DFS 和 BFS 打通之后,接下来可以选:

**(A)** **最小生成树**(Prim 和 Kruskal)——实际意义非常强(网络布线成本最小化),代码不长但概念经典,**考研大题必考点之一**。

**(B)** **最短路径**(Dijkstra 和 Floyd)——GPS 导航的核心算法,考研大题高频。Dijkstra 可以看作"带权 BFS"。

**(C)** **拓扑排序 + 关键路径**(AOV 和 AOE 网)——项目管理、任务调度的核心。基于 DFS 或 BFS 入度法。

**(D)** 先答思考题再继续。

**我个人建议的顺序是 (C) → (A) → (B)**,因为拓扑排序最贴近 DFS/BFS(几乎就是 DFS/BFS 的直接应用),Prim/Dijkstra 则需要引入"带权"和"贪心"的新概念,循序渐进更容易。但你可以按自己的节奏选。

告诉我你的选择,或者先答思考题!