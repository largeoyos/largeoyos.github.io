# 数据结构复习:B 树和 B+ 树

好,我们进入 **B 树和 B+ 树**。这两个结构是**数据库索引的核心**,MySQL InnoDB 引擎的索引就是 B+ 树。它们是**多路平衡树**,是 BST/AVL 在磁盘存储场景下的自然延伸。

**先说清楚学习重点**:考研对 B 树的考查集中在**定义、阶的概念、插入时的分裂、删除时的合并**,代码实现相对次要(更多是手工模拟)。B+ 树重在**理解与 B 树的区别**以及**为什么数据库用 B+ 树而不是 B 树**。

---

### 一、为什么需要 B 树?(从磁盘 IO 说起)

BST 和 AVL 在**内存**中很好用,但用在**磁盘**上有致命问题。

**问题**:磁盘的基本读写单位是"**块**"(通常 4KB 或 16KB),每次从磁盘读取数据,无论你只要 1 字节还是 4KB,代价是一样的——一次磁盘 IO。而磁盘 IO 比内存访问慢 **10 万倍**左右。

**AVL 树的问题**:n 个节点的 AVL 树高度是 O(log₂n)。如果有 100 万条记录,高度约为 20,意味着**最坏需要 20 次磁盘 IO** 才能找到一条记录——太慢了。

**B 树的解决思路**:把树"压矮"。每个节点存**多个关键字**,有**多个孩子**,每次 IO 读一整个节点(一整块磁盘块),一次比较就能排除更多候选。

**类比**:AVL 是每次只问"左还是右"(二叉);B 树是每次问"第几段"(多叉)。树高从 O(log₂n) 降到 O(log_m n)(m 是阶数),**IO 次数大幅减少**。

---

### 二、B 树的定义(严格版,考研必背)

**m 阶 B 树**满足以下条件:

**第一**,每个节点最多有 **m 棵子树**(m 个孩子),即最多有 **m-1 个关键字**。

**第二**,根节点如果不是叶子,则**至少有 2 棵子树**。

**第三**,非根非叶的节点至少有 **⌈m/2⌉ 棵子树**,即至少有 **⌈m/2⌉ - 1 个关键字**。

**第四**,所有叶子节点在**同一层**(B 树是完全平衡的)。

**第五**,每个节点内的关键字**从小到大排列**,且满足:第 i 棵子树中的所有关键字 > 第 i 个关键字 > 第 i-1 棵子树的所有关键字。(即节点内有序,节点间也满足 BST 性质)

**第六**,叶子节点本身**不含任何实际信息**(指向 nullptr),它们只是"查找失败"的标志。

---

### 三、B 树的关键参数(手算必备)

**m 阶 B 树各类节点的关键字数目范围**:

|节点类型|最少关键字数|最多关键字数|
|---|---|---|
|根节点|1|m-1|
|非根非叶|⌈m/2⌉ - 1|m-1|
|叶子|—|—(都是 nullptr)|

**注意**:这里"叶子"是 B 树定义中的**失败节点**,不是通常意义上的"没有孩子的节点"。B 树的叶子在最后一层,不含数据。实际存数据的是**倒数第二层**往上的所有节点。

**一个典型例子:3 阶 B 树(也叫 2-3 树)**:

每个节点最多 2 个关键字、3 个孩子;每个非根节点至少 1 个关键字、2 个孩子。

```
            [35]
          /       \
      [15 25]    [45 55]
     /  |  \    /  |  \
   [.][.][.] [.][.][.][.]
```

叶子节点(最后一层的 [.])都是失败节点。

---

### 四、B 树的高度计算(考研常考)

**问题**:n 个关键字的 m 阶 B 树,高度 h 的范围是多少?

**最大高度**(节点尽量少关键字,树尽量高):

第 1 层:1 个节点,1 个关键字,2 个孩子(根节点最少 2 个孩子)。第 2 层:2 个节点,每个最少 ⌈m/2⌉ - 1 个关键字。第 k 层:2 × ⌈m/2⌉^(k-2) 个节点。

由于叶子(第 h+1 层)共有 n+1 个(失败节点),可推出:

**h ≤ log_{⌈m/2⌉}((n+1)/2) + 1**

**最小高度**(每个节点装满):

每个节点 m-1 个关键字。第 1 层 m-1 个,前 2 层共 m²-1 个……

**h ≥ log_m(n+1)**

**结论**:B 树高度是 O(log_m n) 量级,m 越大树越矮,IO 次数越少。这是 B 树的根本优势。

---

### 五、B 树的插入(重点:分裂)

B 树的插入**永远插在叶子位置**(实际是最底层的数据节点),插入后如果节点关键字数超过 m-1,就要**分裂**。

**分裂规则**:把关键字数为 m 的节点,从中间位置 ⌈m/2⌉ 处分裂,**中间那个关键字上提到父节点**,左右两半各自成为一个新节点。如果父节点也因此溢出,继续向上分裂,直到不溢出或根分裂(根分裂会产生新根,树高增加 1)。

#### 插入示例:3 阶 B 树,依次插入 `{30, 10, 20, 40, 50, 60, 70, 80, 90}`

**插入 30**:树为空,根直接插入。

```
[30]
```

**插入 10**:

```
[10 30]
```

**插入 20**:插入后 `[10 20 30]`,关键字数 = 3 = m,超过 m-1 = 2,**分裂**!

中间位置 ⌈3/2⌉ = 2,即关键字 20 上提。左 [10],右 [30],新根 [20]:

```
      [20]
     /    \
   [10]  [30]
```

**插入 40**:40 > 20,进右子树,插入 [30] 得 [30 40]。未溢出。

```
      [20]
     /    \
   [10]  [30 40]
```

**插入 50**:进右子树,插入 [30 40] 得 [30 40 50],溢出!分裂,40 上提:

左 [30],右 [50],40 插入根 [20] 得 [20 40]:

```
        [20 40]
       /   |   \
    [10] [30] [50]
```

**插入 60**:进第三个子树,插入 [50] 得 [50 60]。

```
        [20 40]
       /   |   \
    [10] [30] [50 60]
```

**插入 70**:进第三子树,得 [50 60 70],溢出!60 上提,根变 [20 40 60]:

```
          [20 40 60]
         /   |   |   \
      [10] [30] [50] [70]
```

**插入 80**:进第四子树,得 [70 80]。

```
          [20 40 60]
         /   |   |   \
      [10] [30] [50] [70 80]
```

**插入 90**:进第四子树,得 [70 80 90],溢出!80 上提,根变 [20 40 60 80]——还是溢出(m=3,最多 2 个)!根也要分裂,中间值 40 再次上提:

新根 [40],左子树根 [20],右子树根 [60 80]:

```
              [40]
            /       \
         [20]       [60 80]
        /    \      /  |  \
      [10]  [30] [50][70][90]
```

**树高从 2 增加到 3**——根分裂是 B 树长高的唯一方式。

---

### 六、B 树的删除(重点:合并与借键)

删除比插入复杂,分三种情况:

#### 情况一:被删关键字在**非最底层**节点

不能直接删,要用其**前驱或后继**(最底层节点的关键字)替换,然后删除那个前驱/后继。转化为情况二或三。

**（这和 BST 删除度为 2 的节点的策略一样!）**

#### 情况二:被删关键字在**最底层**且删后关键字数 ≥ ⌈m/2⌉ - 1

直接删除,满足最少关键字要求,结束。

#### 情况三:被删后该节点关键字数 < ⌈m/2⌉ - 1(下溢出)

分两个子情况:

**子情况 A(兄弟够借)**:如果相邻兄弟节点关键字数 > ⌈m/2⌉ - 1(即 ≥ ⌈m/2⌉),可以向兄弟借一个。**注意不是直接把兄弟的关键字搬过来,要通过父节点中转**("旋转"):

父节点中分隔这两个兄弟的关键字"下移"到当前节点,兄弟的一个边界关键字"上移"到父节点填补空位。

**子情况 B(兄弟不够借)**:兄弟节点也只剩 ⌈m/2⌉ - 1 个关键字,不能再借。此时**合并**:当前节点 + 父节点中分隔两者的那个关键字 + 兄弟节点，合并成一个新节点。父节点少了一个关键字,若父节点也下溢出则继续向上合并,直到根(根合并后树高减 1)。

---

### 七、B 树结构体及代码(3 阶 B 树)

代码部分我们实现 **3 阶 B 树**(2-3 树),因为它是最简单的 B 树,参数固定,边界清晰。

#### 文件组织

```
DataStructure/
└── BTree/
    ├── BTree.h
    ├── BTree.cpp
    └── main.cpp
```

#### BTree.h

cpp

```cpp
#pragma once
#include <iostream>
using namespace std;

#define ORDER 3                         // B 树的阶
#define MAX_KEY (ORDER - 1)             // 节点最多关键字数:2
#define MIN_KEY (ORDER / 2 - 1 + (ORDER % 2 != 0 ? 1 : 0) - 1)
// 非根节点最少关键字数:⌈m/2⌉ - 1 = 1

typedef int KeyType;

typedef struct BTreeNode {
    int keyNum;                         // 当前关键字数量
    KeyType keys[ORDER];                // 关键字数组,下标 1..keyNum(0 不用)
    struct BTreeNode *children[ORDER + 1]; // 孩子指针,下标 0..keyNum
    bool isLeaf;                        // 是否是最底层数据节点
} BTreeNode, *BTree;

// ========== 基本操作 ==========
BTreeNode* CreateNode(bool isLeaf);
BTree InitBTree();

// ========== 查找 ==========
BTreeNode* Search(BTree T, KeyType key, int &pos);

// ========== 插入(含分裂)==========
void SplitChild(BTreeNode *parent, int i, BTreeNode *child);
void InsertNonFull(BTreeNode *node, KeyType key);
void Insert(BTree &T, KeyType key);

// ========== 遍历(中序,输出有序序列)==========
void InOrder(BTree T);

// ========== 打印树结构 ==========
void PrintTree(BTree T, int depth);
```

**关于下标约定**:我们让 `keys` 数组下标从 1 开始(keys[0] 不用),`children` 下标从 0 开始。这样 children[i-1] 是 keys[i] 的左孩子,children[i] 是 keys[i] 的右孩子——与教材保持一致,便于对照手算结果。

#### BTree.cpp

cpp

```cpp
#include "BTree.h"

BTreeNode* CreateNode(bool isLeaf) {
    BTreeNode *p = new BTreeNode;
    p->keyNum = 0;
    p->isLeaf = isLeaf;
    for (int i = 0; i <= ORDER; i++) p->children[i] = nullptr;
    for (int i = 0; i <= ORDER - 1; i++) p->keys[i] = 0;
    return p;
}

BTree InitBTree() {
    return nullptr;
}

// 在以 T 为根的子树中查找 key
// 找到:返回节点指针,pos 为在 keys 中的下标
// 未找到:返回 nullptr,pos 为应在的孩子下标
BTreeNode* Search(BTree T, KeyType key, int &pos) {
    if (T == nullptr) return nullptr;
    int i = 1;
    while (i <= T->keyNum && key > T->keys[i]) i++;
    if (i <= T->keyNum && key == T->keys[i]) {
        pos = i;
        return T;                       // 在当前节点找到
    }
    if (T->isLeaf) return nullptr;      // 到底层未找到
    return Search(T->children[i - 1], key, pos);
}

// 分裂 parent 的第 i 个孩子(child),child 已满(keyNum == ORDER-1 == MAX_KEY)
// 注意:这里 child 是 parent->children[i]
void SplitChild(BTreeNode *parent, int i, BTreeNode *child) {
    int mid = ORDER / 2;                // 中间位置
    BTreeNode *newNode = CreateNode(child->isLeaf);
    newNode->keyNum = mid - 1;          // 新节点获得 mid-1 个关键字
    
    // 把 child 后半部分关键字给 newNode
    for (int j = 1; j <= mid - 1; j++) {
        newNode->keys[j] = child->keys[j + mid];
    }
    // 把 child 后半部分孩子指针给 newNode
    if (!child->isLeaf) {
        for (int j = 0; j <= mid - 1; j++) {
            newNode->children[j] = child->children[j + mid];
        }
    }
    child->keyNum = mid - 1;            // child 保留前半部分
    
    // 在 parent 中腾出位置,把 child->keys[mid] 上提
    for (int j = parent->keyNum; j >= i; j--) {
        parent->children[j + 1] = parent->children[j];
    }
    parent->children[i] = newNode;
    
    for (int j = parent->keyNum; j >= i; j--) {
        parent->keys[j + 1] = parent->keys[j];
    }
    parent->keys[i] = child->keys[mid];  // 中间关键字上提
    parent->keyNum++;
}

// 向以 node 为根的非满子树中插入 key
void InsertNonFull(BTreeNode *node, KeyType key) {
    int i = node->keyNum;
    
    if (node->isLeaf) {
        // 直接插入到叶子节点中,保持有序
        while (i >= 1 && key < node->keys[i]) {
            node->keys[i + 1] = node->keys[i];
            i--;
        }
        node->keys[i + 1] = key;
        node->keyNum++;
    } else {
        // 找到合适的孩子
        while (i >= 1 && key < node->keys[i]) i--;
        i++;                            // 进入 children[i-1]
        if (node->children[i - 1]->keyNum == MAX_KEY) {
            // 孩子已满,先分裂
            SplitChild(node, i, node->children[i - 1]);
            // 分裂后判断 key 进哪一侧
            if (key > node->keys[i]) i++;
        }
        InsertNonFull(node->children[i - 1], key);
    }
}

void Insert(BTree &T, KeyType key) {
    if (T == nullptr) {
        T = CreateNode(true);
        T->keys[1] = key;
        T->keyNum = 1;
        return;
    }
    if (T->keyNum == MAX_KEY) {         // 根满了,预先分裂
        BTreeNode *newRoot = CreateNode(false);
        newRoot->children[0] = T;
        SplitChild(newRoot, 1, T);
        T = newRoot;                    // 新根
    }
    InsertNonFull(T, key);
}

void InOrder(BTree T) {
    if (T == nullptr) return;
    for (int i = 1; i <= T->keyNum; i++) {
        if (!T->isLeaf) InOrder(T->children[i - 1]);
        cout << T->keys[i] << " ";
    }
    if (!T->isLeaf) InOrder(T->children[T->keyNum]);
}

void PrintTree(BTree T, int depth) {
    if (T == nullptr) return;
    for (int d = 0; d < depth; d++) cout << "    ";
    cout << "[";
    for (int i = 1; i <= T->keyNum; i++) {
        cout << T->keys[i];
        if (i < T->keyNum) cout << " ";
    }
    cout << "]" << endl;
    for (int i = 0; i <= T->keyNum; i++) {
        PrintTree(T->children[i], depth + 1);
    }
}
```

**Insert 采用"预分裂"策略**:从根下行时,凡遇到满节点就**提前分裂**,保证递归到底时插入位置一定有空间。这样可以**自上而下一趟完成插入**,不需要回溯,实现更简洁。

---

### 八、测试代码(main.cpp)

cpp

```cpp
#include "BTree.h"
#include <iostream>
using namespace std;

int main() {
    BTree T = InitBTree();
    
    int arr[] = {30, 10, 20, 40, 50, 60, 70, 80, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    for (int i = 0; i < n; i++) {
        Insert(T, arr[i]);
    }
    
    cout << "B 树结构:" << endl;
    PrintTree(T, 0);
    
    cout << "\n中序遍历(应为升序): ";
    InOrder(T); cout << endl;
    
    int pos;
    BTreeNode *p = Search(T, 60, pos);
    cout << "\n查找 60: " << (p ? "找到" : "未找到");
    if (p) cout << ",在节点的第 " << pos << " 个位置";
    cout << endl;
    
    p = Search(T, 35, pos);
    cout << "查找 35: " << (p ? "找到" : "未找到") << endl;
    
    return 0;
}
```

预期输出(对应前面手算的最终树):

```
B 树结构:
[40]
    [20]
        [10]
        [30]
    [60 80]
        [50]
        [70]
        [90]

中序遍历(应为升序): 10 20 30 40 50 60 70 80 90 

查找 60: 找到,在节点的第 1 个位置
查找 35: 未找到
```

---

### 九、B+ 树

#### 9.1 B+ 树和 B 树的核心区别

**B+ 树是 B 树的变种**,专门为磁盘数据库优化。它和 B 树有以下关键区别:

**区别一:所有数据(卫星数据)只存在叶子节点**。B 树的内部节点也可以存数据;B+ 树的内部节点只存关键字(作为路由/索引),实际记录只在叶子。

**区别二:叶子节点通过链表相连**。所有叶子节点按关键字顺序串成一个**有序链表**,支持**范围查询**的高效扫描。

**区别三:内部节点的关键字在叶子中还会出现**。B 树中,一旦关键字出现在内部节点,就不再出现在叶子;B+ 树的内部节点关键字是**叶子关键字的副本**。

**区别四:查找过程**。B 树找到关键字在内部节点就可返回;B+ 树必须**走到叶子**才算找到(因为数据在叶子)。

#### 9.2 一棵 3 阶 B+ 树示例

```
              [20  40]           ← 内部节点(只作路由)
            /    |    \
          [10 20] [30 40] [50 60]  ← 叶子节点(存真实数据)
             ↕       ↕       ↕
          (链表串联所有叶子)
```

注意 20、40 同时出现在内部节点和叶子节点——这是 B+ 树的特征。

#### 9.3 B+ 树的阶定义(注意和 B 树的区别)

对 m 阶 B+ 树:

**内部节点**:最多 m 个孩子、m-1 个关键字;最少 ⌈m/2⌉ 个孩子(根节点最少 2 个)。

**叶子节点**:最多 m 个关键字(注意:B+ 树叶子装的是"实际数据",所以最多关键字数 = m 而不是 m-1);最少 ⌈m/2⌉ 个关键字。

---

### 十、B 树 vs B+ 树:为什么数据库选 B+?

这是面试和考研的**经典问答**,必须能条理清晰地说出来:

**第一,范围查询效率**。B+ 树叶子串成链表,范围查询(如 `WHERE age BETWEEN 20 AND 30`)只需找到起始叶子,沿链表扫描即可;B 树做范围查询要中序遍历整棵树(复杂得多)。**这是 B+ 树最大的优势。**

**第二,IO 效率**。B+ 树内部节点不存数据,只存关键字,因此同等大小的磁盘块能装更多关键字,**树更矮,IO 次数更少**。

**第三,查询稳定性**。B+ 树每次查找都必须走到叶子,查找任何关键字的路径长度相同(等于树高),**性能稳定**;B 树的查找深度不定(内部节点可能提前命中),性能有波动。

**第四,全表扫描**。B+ 树直接扫描叶子链表即可全表扫描,B 树需要中序遍历整棵树。

**B 树相对 B+ 树的唯一优势**:如果查找的关键字恰好在内部节点,B 树可以不用走到叶子就返回,查找某些特定值会快一点——但这种场景在数据库中并不典型。

---

### 十一、B+ 树结构体(仅展示定义,实现思路与 B 树类似)

cpp

```cpp
#pragma once
#define ORDER_PLUS 3
typedef int KeyType;

// B+ 树叶子节点
typedef struct BPlusLeaf {
    int keyNum;
    KeyType keys[ORDER_PLUS];           // 叶子存真实 key(最多 ORDER 个)
    int records[ORDER_PLUS];            // 对应的数据记录(简化为 int)
    struct BPlusLeaf *next;             // 指向下一个叶子(链表!)
} BPlusLeaf;

// B+ 树内部节点
typedef struct BPlusNode {
    int keyNum;
    KeyType keys[ORDER_PLUS];           // 路由关键字
    void *children[ORDER_PLUS + 1];     // 孩子(可能是内部节点或叶子)
    bool isLeaf;                        // 区分类型
} BPlusNode, *BPlusTree;
```

B+ 树的完整代码实现在考研范围内不作要求,**重点是理解其结构和与 B 树的差异**。如果你需要完整实现,我可以单独展开。

---

### 十二、对比总结表

|特性|B 树|B+ 树|
|---|---|---|
|数据存储位置|所有节点|仅叶子节点|
|叶子间连接|无|有序链表|
|内部节点关键字|不重复出现在叶子|在叶子中有副本|
|查找终点|可在任意层|必须到叶子|
|范围查询|中序遍历树|扫描叶子链表|
|查询稳定性|不稳定|稳定(等于树高)|
|数据库应用|较少|MySQL/PostgreSQL 等主流|

### 十三、思考题(请作答)

第一题,在 3 阶 B 树中,依次插入 `{1, 2, 3, 4, 5, 6, 7}`,**每一步画出树的形态**,标出每次分裂的位置和上提的关键字。

第二题,已知 m 阶 B 树共有 N 个关键字,**树的高度 h 最大是多少**?写出推导过程(用 N、m 表示 h)。

第三题,下面哪个说法是**错误**的?

(A) B 树和 B+ 树的叶子节点都在同一层。 (B) B+ 树所有关键字都出现在叶子节点中。 (C) 在 B 树中查找一个关键字,最多比较次数等于树的高度。 (D) B+ 树比 B 树更适合做范围查询。

第四题,一棵 5 阶 B 树有 100 个关键字,**树的最大高度和最小高度**各是多少?

第五题,**为什么说 B+ 树的内部节点不存数据,可以让同等磁盘块容纳更多关键字?** 结合磁盘块大小(比如 16KB)和一条记录大小(比如 1KB)来估算,同等高度下 B+ 树能存多少倍的记录?