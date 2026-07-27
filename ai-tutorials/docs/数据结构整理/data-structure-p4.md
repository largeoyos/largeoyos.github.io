## 数据结构复习:二叉搜索树 BST

好,我们进入**二叉搜索树**(Binary Search Tree,简称 BST),也叫"二叉排序树"(Binary Sort Tree)。这是数据结构中最重要的动态查找结构之一,**考研大题高频命题点**,几乎每年都会以某种形式出现(插入、删除、查找效率分析)。

这一章最大的难点是**删除操作的三种情况**,特别是"删除度为 2 的节点"时的处理。我会把每种情况都讲透。

---

### 一、BST 的定义与性质

**定义**:一棵二叉搜索树或者为空,或者满足:

左子树所有节点的值 < 根节点的值 < 右子树所有节点的值,且左右子树也是二叉搜索树。

**核心性质**:**对 BST 做中序遍历,得到的序列是一个递增有序序列**。这是 BST 最重要的特性,几乎所有性质都由它推出。

例如下面这棵 BST:

```
        8
       / \
      3   10
     / \    \
    1   6    14
       / \   /
      4   7 13
```

中序遍历:1 3 4 6 7 8 10 13 14——确实是递增的。这就是"二叉**搜索**树"名字的来源:搜索(查找)某个值只需要 O(h) 时间,h 是树的高度。

---

### 二、BST 的查找(最容易的操作)

**思路**:从根出发,与目标值比较:相等则找到;小于当前节点则向左子树找;大于则向右子树找。

cpp

```cpp
// 递归版
BSTNode* Search(BSTNode *T, int key) {
    if (T == nullptr || T->data == key) return T;
    if (key < T->data) return Search(T->lchild, key);
    else return Search(T->rchild, key);
}
```

**这段代码本质上就是二分查找在树上的推广**——每次比较后丢掉一半数据。

**查找效率分析**:最好 O(log n)(树平衡),最坏 O(n)(树退化成链表,比如严格递增插入)。平均为 O(log n)。

---

### 三、BST 的插入

**规则**:插入的新节点**一定作为某个叶子**。

**流程**:从根出发按查找规则向下走,直到走到 nullptr 的位置——这个位置就是新节点的家。

cpp

```cpp
bool Insert(BSTNode *&T, int key) {
    if (T == nullptr) {                         // 找到空位
        T = new BSTNode;
        T->data = key;
        T->lchild = T->rchild = nullptr;
        return true;
    }
    if (key == T->data) return false;           // 不允许重复
    if (key < T->data) return Insert(T->lchild, key);
    else return Insert(T->rchild, key);
}
```

**注意 `T` 必须用引用传递**——因为递归到 nullptr 位置时要修改指针本身。你之前学链表时已经反复训练过这个点。

---

### 四、BST 的构造(批量插入)

一棵 BST 可以通过"依次插入"一组数据来构造。**关键结论**:**插入顺序不同,得到的 BST 形态不同**,但**中序遍历结果相同**(都是递增序列)。

比如按 `{50, 30, 70, 20, 40, 60, 80}` 插入:

```
        50
       /  \
      30   70
     / \   / \
    20 40 60 80
```

按 `{20, 30, 40, 50, 60, 70, 80}` 插入(严格递增),BST 会退化成右斜链表:

```
20 → 30 → 40 → 50 → 60 → 70 → 80
```

这时 BST 查找效率退化到 O(n),完全失去意义。这就是为什么后来发明了 **AVL 树、红黑树**——强制保持平衡。

---

### 五、BST 的删除(本章重中之重)

**BST 删除比插入复杂得多**,因为要保证删除后**仍然是 BST**(中序仍递增)。根据待删除节点 p 的度数,分三种情况:

#### 情况一:p 是叶子(度为 0)

直接删除,修改父节点对应的指针为 nullptr。

#### 情况二:p 只有一个孩子(度为 1)

让 p 的孩子**顶替** p 的位置。相当于在链表中删除一个单链节点。

#### 情况三:p 有两个孩子(度为 2,最难)

不能简单"顶替",因为 p 只有一个"位置",而要安置两个子树。

**标准做法**:找 p 在**中序序列中的前驱**(或后继)来替换 p 的 data,然后删除那个前驱(或后继)节点。

**为什么这样做是对的?** 因为:

中序前驱是"左子树中最大的节点"——它位于 p **左子树的最右下角**,**必然度 ≤ 1**(它没有右孩子,否则就不是最大)。所以删除前驱变成了情况一或情况二,可以递归解决。

中序后继类似,是"右子树中最小的节点",位于 p **右子树的最左下角**,**必然度 ≤ 1**(没有左孩子)。

用哪种都行,形态会不同但都是合法 BST。我们统一用**中序后继**(教材主流做法)。

#### 删除的可视化示例

删除节点 3(度为 2):

```
        8                    8
       / \                  / \
      3   10      →         4   10
     / \    \              / \    \
    1   6    14           1   6    14
       / \   /               \   /
      4   7 13                7 13
```

步骤:找 3 的中序后继 = 4(3 的右子树最左下角);用 4 的值替换 3;删除原来那个 4(它是叶子,直接去掉)。

#### 删除代码(必须反复理解)

cpp

```cpp
// 找以 p 为根的子树中的最小节点(最左下角)
BSTNode* FindMin(BSTNode *p) {
    while (p->lchild != nullptr) p = p->lchild;
    return p;
}

// 删除 key
bool Delete(BSTNode *&T, int key) {
    if (T == nullptr) return false;

    if (key < T->data) {
        return Delete(T->lchild, key);
    } else if (key > T->data) {
        return Delete(T->rchild, key);
    } else {
        // 找到要删的节点 T
        if (T->lchild == nullptr) {         // 情况一 + 情况二(只有右孩子)
            BSTNode *q = T;
            T = T->rchild;                  // 右孩子顶替
            delete q;
        } else if (T->rchild == nullptr) {  // 情况二(只有左孩子)
            BSTNode *q = T;
            T = T->lchild;
            delete q;
        } else {                             // 情况三(度为 2)
            BSTNode *succ = FindMin(T->rchild);
            T->data = succ->data;           // 用后继的值替换当前节点
            Delete(T->rchild, succ->data);  // 递归删除后继(必落入情况一/二)
        }
        return true;
    }
}
```

**关键细节**:

第一,情况一和情况二可以**合并处理**:只要某个孩子为空,用另一个孩子顶替即可。如果左孩子为空,用右孩子顶替(包括右孩子也为空的情况,等价于删叶子);如果右孩子为空,用左孩子顶替。

第二,`T = T->rchild` 这种写法之所以能正确修改父节点的指针,靠的是 `BSTNode *&T` 的引用传递。再次强调这一点的重要性——**如果你忘了 `&`,整个删除就崩了**。

第三,情况三中我们只**复制了 data**,然后递归删除后继节点。这样既完成了"逻辑上的替换",又把问题转化为已知的简单情况。**这是算法设计中"化繁为简"的典范**。

---

### 六、项目文件组织

```
DataStructure/
└── BST/
    ├── BST.h
    ├── BST.cpp
    └── main.cpp
```

---

### 七、BST.h

cpp

```cpp
#pragma once

typedef int ElemType;

typedef struct BSTNode {
    ElemType data;
    struct BSTNode *lchild, *rchild;
} BSTNode, *BSTree;

// ========== 基本操作 ==========
bool InitBST(BSTree &T);
BSTNode* Search(BSTree T, ElemType key);         // 递归查找
BSTNode* Search_NonRec(BSTree T, ElemType key);  // 非递归查找
bool Insert(BSTree &T, ElemType key);
bool Delete(BSTree &T, ElemType key);
void CreateBST(BSTree &T, ElemType arr[], int n); // 由数组构造 BST

// ========== 辅助 ==========
BSTNode* FindMin(BSTree T);                       // 最小节点(最左下)
BSTNode* FindMax(BSTree T);                       // 最大节点(最右下)
void InOrder(BSTree T);                           // 中序遍历(升序输出)
void DestroyBST(BSTree &T);
```

---

### 八、BST.cpp 完整实现

#### 8.1 初始化与查找

cpp

```cpp
#include "BST.h"
#include <iostream>
using namespace std;

bool InitBST(BSTree &T) {
    T = nullptr;
    return true;
}

BSTNode* Search(BSTree T, ElemType key) {
    if (T == nullptr || T->data == key) return T;
    if (key < T->data) return Search(T->lchild, key);
    return Search(T->rchild, key);
}

// 非递归版本(效率略高,空间 O(1))
BSTNode* Search_NonRec(BSTree T, ElemType key) {
    while (T != nullptr && T->data != key) {
        if (key < T->data) T = T->lchild;
        else T = T->rchild;
    }
    return T;
}
```

#### 8.2 插入与构造

cpp

```cpp
bool Insert(BSTree &T, ElemType key) {
    if (T == nullptr) {
        T = new BSTNode;
        T->data = key;
        T->lchild = T->rchild = nullptr;
        return true;
    }
    if (key == T->data) return false;       // 不允许重复
    if (key < T->data) return Insert(T->lchild, key);
    return Insert(T->rchild, key);
}

void CreateBST(BSTree &T, ElemType arr[], int n) {
    T = nullptr;
    for (int i = 0; i < n; i++) {
        Insert(T, arr[i]);
    }
}
```

#### 8.3 辅助函数

cpp

```cpp
BSTNode* FindMin(BSTree T) {
    if (T == nullptr) return nullptr;
    while (T->lchild != nullptr) T = T->lchild;
    return T;
}

BSTNode* FindMax(BSTree T) {
    if (T == nullptr) return nullptr;
    while (T->rchild != nullptr) T = T->rchild;
    return T;
}

void InOrder(BSTree T) {
    if (T == nullptr) return;
    InOrder(T->lchild);
    cout << T->data << " ";
    InOrder(T->rchild);
}
```

#### 8.4 删除(完整版,上面已经讲过)

cpp

```cpp
bool Delete(BSTree &T, ElemType key) {
    if (T == nullptr) return false;

    if (key < T->data) {
        return Delete(T->lchild, key);
    } else if (key > T->data) {
        return Delete(T->rchild, key);
    } else {
        if (T->lchild == nullptr) {
            BSTNode *q = T;
            T = T->rchild;
            delete q;
        } else if (T->rchild == nullptr) {
            BSTNode *q = T;
            T = T->lchild;
            delete q;
        } else {
            BSTNode *succ = FindMin(T->rchild);
            T->data = succ->data;
            Delete(T->rchild, succ->data);
        }
        return true;
    }
}
```

#### 8.5 销毁

cpp

```cpp
void DestroyBST(BSTree &T) {
    if (T == nullptr) return;
    DestroyBST(T->lchild);
    DestroyBST(T->rchild);
    delete T;
    T = nullptr;
}
```

---

### 九、测试代码(main.cpp)

cpp

```cpp
#include "BST.h"
#include <iostream>
using namespace std;

int main() {
    BSTree T;
    int arr[] = {50, 30, 70, 20, 40, 60, 80, 35, 45};
    int n = sizeof(arr) / sizeof(arr[0]);

    CreateBST(T, arr, n);
    cout << "构造后中序遍历(应为升序): ";
    InOrder(T); cout << endl;
    // 期望: 20 30 35 40 45 50 60 70 80

    int key = 45;
    BSTNode *p = Search(T, key);
    cout << "查找 " << key << ": " << (p ? "找到" : "未找到") << endl;

    // 删除度为 0 的节点(叶子)
    Delete(T, 35);
    cout << "删除 35 后: ";
    InOrder(T); cout << endl;

    // 删除度为 1 的节点
    Delete(T, 40);       // 40 现在只有右孩子 45
    cout << "删除 40 后: ";
    InOrder(T); cout << endl;

    // 删除度为 2 的节点
    Delete(T, 30);       // 30 有左右两个孩子
    cout << "删除 30 后: ";
    InOrder(T); cout << endl;

    // 删除根节点
    Delete(T, 50);
    cout << "删除根 50 后: ";
    InOrder(T); cout << endl;

    DestroyBST(T);
    return 0;
}
```

预期输出:

```
构造后中序遍历(应为升序): 20 30 35 40 45 50 60 70 80
查找 45: 找到
删除 35 后: 20 30 40 45 50 60 70 80
删除 40 后: 20 30 45 50 60 70 80
删除 30 后: 20 45 50 60 70 80
删除根 50 后: 20 45 60 70 80
```

**每一步删除后,中序遍历仍然是递增的**——这是检验删除正确性的最可靠标准。

---

### 十、BST 的查找效率分析(考点)

**核心指标**:**ASL(Average Search Length,平均查找长度)**——所有节点被查找到时比较次数的平均值。

**对于含 n 个节点的 BST**:

**最好情况**:树是**完美平衡**的(近似满二叉树),ASL = O(log n)。

**最坏情况**:树**退化成链**(严格有序插入),ASL = (n+1)/2 = O(n)。

**平均情况**(随机插入顺序):ASL = O(log n)。

#### ASL 计算示例

对前面那棵 BST:

```
        50          ← 层 1,1 次比较
       /  \
      30   70       ← 层 2,2 次比较
     / \   / \
    20 40 60 80     ← 层 3,3 次比较
```

**成功查找的 ASL**:

ASL_成功 = (1×1 + 2×2 + 3×4) / 7 = (1 + 4 + 12) / 7 = 17/7 ≈ 2.43

层 1 有 1 个节点(50),层 2 有 2 个节点,层 3 有 4 个节点,各自查找比较次数 = 层数。

**不成功查找的 ASL** 需要考虑"失败位置"——在逻辑上每个叶子位置都可以继续下挂两个"虚拟节点"作为失败节点,共 n+1 个失败节点。这部分计算考研偶有考查,但相对次要。

---

### 十一、BST 与其他查找结构的对比

哈希表查找 O(1) 比 BST 快,但哈希表**不支持范围查询和有序遍历**;BST 只要做中序遍历就能按序访问所有元素,这是 BST 的杀手锏。

BST 查找最坏 O(n),AVL 树/红黑树通过强制平衡把最坏也降到 O(log n),但代价是插入和删除时要做旋转维护平衡。**红黑树**是 C++ `std::map`、`std::set` 的底层实现,Java `TreeMap` 同理。

---

### 十二、思考题(请作答)

第一题,按顺序插入 `{62, 88, 58, 47, 35, 73, 51, 99, 37}`,画出最终的 BST,并给出中序、先序、后序遍历序列。

第二题,在上题构造的 BST 中:

先**删除节点 47**(度为 2),画出删除后的树;再**删除节点 62**(根节点,度为 2),画出最终树。每步都标出使用的是"中序前驱"还是"中序后继"替换方案。

第三题,一棵 BST 的先序遍历是 `50, 30, 20, 40, 70, 60, 80`,**这棵树唯一确定吗?** 如果确定,画出它;如果不确定,说明为什么。(提示:BST 的先序序列有个神奇性质)

第四题,下列哪些序列**不可能**是某棵 BST 的先序遍历?为每个错误序列指出第一个违反 BST 规则的地方:

(a) 95, 22, 11, 3, 17, 44, 66, 123
(b) 95, 22, 11, 3, 44, 66, 17, 123
(c) 95, 22, 44, 66, 11, 3, 17, 123

第五题,在一棵有 n 个节点的 BST 中查找某个节点,**最多**比较多少次?**最少**比较多少次?这两个极值分别对应什么样的树形态?

## 数据结构复习:平衡二叉树 AVL

好,我们进入**平衡二叉树**(AVL Tree,以发明者 Adelson-Velsky 和 Landis 命名)。这是 BST 的升级版,也是数据结构课的**最高峰之一**——四种旋转是历年考研大题的常客,几乎每年必考。

**事先提醒**:AVL 的**代码不算太难,但四种旋转的判断条件和旋转后的形态极其容易混淆**。我会把每种情况都配图讲清,你一定要拿纸笔跟着画,光看是记不住的。

---

### 一、为什么需要 AVL?

回忆 BST 的致命弱点:**如果插入顺序不好,BST 会退化成链表**,查找从 O(log n) 变成 O(n)。

例如按 `{1, 2, 3, 4, 5}` 插入:

```
1
 \
  2
   \
    3
     \
      4
       \
        5
```

AVL 的解决方案:**在每次插入/删除后,如果发现不平衡,立即通过"旋转"把树调回平衡状态**。这样保证任何时刻树高度都是 O(log n),查找永远是 O(log n)。

---

### 二、平衡因子(BF)的定义

对 AVL 树中的每个节点,定义**平衡因子**:

**BF(node) = 左子树高度 - 右子树高度**

**AVL 的定义**:**每个节点的 BF 的绝对值 ≤ 1**,即 BF ∈ {-1, 0, 1}。

一旦某节点 BF = ±2,就"失衡"了,需要通过旋转恢复。

**注意高度的约定**:空树高度通常规定为 0(有些教材规定为 -1,注意看你的教材),单节点树高度为 1。我们采用**空树高度 = 0** 的约定。

---

### 三、旋转操作(核心难点,四种情况)

当插入一个新节点导致某个祖先失衡时,设该失衡的**最低祖先**为 A(也叫"最小失衡子树"的根)。根据"导致失衡的插入路径"从 A 往下的走向,失衡分为四种:

**L 型**:新节点插在 A 的**左**孩子的**左**子树中 → 用**右单旋**修复。

**R 型**:新节点插在 A 的**右**孩子的**右**子树中 → 用**左单旋**修复。

**LR 型**:新节点插在 A 的**左**孩子的**右**子树中 → 先左旋再右旋(双旋)。

**RL 型**:新节点插在 A 的**右**孩子的**左**子树中 → 先右旋再左旋(双旋)。

**记忆法**:**型号名称描述的是"失衡路径方向"**,旋转方向**与路径方向相反**。L 失衡用"右"旋,R 失衡用"左"旋。

---

#### 3.1 L 型 → 右单旋

**失衡形态**(插入 x 后 A 失衡):

```
      A (BF=+2)              B
     / \                   /   \
    B   Z         →       X     A
   / \                   / \   / \
  X   Y                 ..  ..Y   Z
  ↑
  新插
```

**旋转规则**:

B 取代 A 成为子树新根。A 成为 B 的**右孩子**。B 原来的**右孩子 Y** 变成 A 的**左孩子**(因为 A 现在的左位置空了,而 Y 的值范围恰好是"大于 B 小于 A",符合 A 的左孩子)。

cpp

```cpp
// 右单旋:返回新的子树根
AVLNode* RotateRight(AVLNode *A) {
    AVLNode *B = A->lchild;
    A->lchild = B->rchild;     // B 原来的右孩子 Y 接到 A 的左
    B->rchild = A;             // A 成为 B 的右孩子
    // 更新高度(必须先更新 A,再更新 B,因为 B 是新根依赖 A)
    A->height = max(Height(A->lchild), Height(A->rchild)) + 1;
    B->height = max(Height(B->lchild), Height(B->rchild)) + 1;
    return B;                  // B 成为新子树的根
}
```

---

#### 3.2 R 型 → 左单旋

完全对称,插入点在 A 右孩子 B 的右子树:

```
    A (BF=-2)                  B
   / \                       /   \
  X   B           →         A     Z
     / \                   / \   / \
    Y   Z                 X   Y    ..
                                   ↑
                                   新插
```

B 取代 A,A 成为 B 的左孩子,B 原来的**左孩子 Y** 变成 A 的右孩子。

cpp

```cpp
AVLNode* RotateLeft(AVLNode *A) {
    AVLNode *B = A->rchild;
    A->rchild = B->lchild;
    B->lchild = A;
    A->height = max(Height(A->lchild), Height(A->rchild)) + 1;
    B->height = max(Height(B->lchild), Height(B->rchild)) + 1;
    return B;
}
```

---

#### 3.3 LR 型 → 左旋+右旋

**失衡形态**:新节点插在 A 的**左**孩子 B 的**右**子树中。

```
       A (BF=+2)
      / \
     B   Z
    / \
   X   C (插入使 C 增高)
      / \
     M   N
```

**关键点**:不能直接对 A 做右旋——因为 C 在 B 的右边,单次右旋会把问题搬到另一侧。要**先对 B 做左旋**(把 C 旋到 B 的上面):

```
       A
      / \
     C   Z
    / \
   B   N
  / \
 X   M
```

**然后对 A 做右旋**,变成:

```
       C
     /   \
    B     A
   / \   / \
  X   M N   Z
```

**代码实现**:就是两个单旋的组合。

cpp

```cpp
AVLNode* RotateLR(AVLNode *A) {
    A->lchild = RotateLeft(A->lchild);  // 先对 B(A 的左孩子)左旋
    return RotateRight(A);               // 再对 A 右旋
}
```

---

#### 3.4 RL 型 → 右旋+左旋

完全对称,新节点插在 A 的**右**孩子 B 的**左**子树中:

```
       A (BF=-2)                         C
      / \                              /   \
     X   B             →              A     B
        / \                          / \   / \
       C   Z                        X   M N   Z
      / \
     M   N
```

先对 B 右旋,再对 A 左旋:

cpp

```cpp
AVLNode* RotateRL(AVLNode *A) {
    A->rchild = RotateRight(A->rchild);
    return RotateLeft(A);
}
```

---

### 四、判断应使用哪种旋转

**算法流程**:插入后沿路径回溯更新 height,发现某节点 A 的 BF 绝对值 = 2 时,根据 **A 和插入路径上的方向关系**判断类型:

|A 的 BF|A 的子节点方向|类型|旋转|
|---|---|---|---|
|+2|插入在**左孩子**的**左**子树|L|右单旋|
|+2|插入在**左孩子**的**右**子树|LR|左右双旋|
|-2|插入在**右孩子**的**右**子树|R|左单旋|
|-2|插入在**右孩子**的**左**子树|RL|右左双旋|

**在代码中怎么判断"路径方向"?** 看 A 的那个"过高"子节点 B 的 BF:

如果 A.BF = +2,看 B = A->lchild:若 B.BF ≥ 0(多半是 +1),属 L;若 B.BF < 0(多半是 -1),属 LR。

如果 A.BF = -2,看 B = A->rchild:若 B.BF ≤ 0(多半是 -1),属 R;若 B.BF > 0(多半是 +1),属 RL。

记住这个判断逻辑,代码里就能一行解决。

---

### 五、项目文件组织

```
DataStructure/
└── AVL/
    ├── AVL.h
    ├── AVL.cpp
    └── main.cpp
```

---

### 六、AVL.h

cpp

```cpp
#pragma once

typedef int ElemType;

typedef struct AVLNode {
    ElemType data;
    int height;                       // 以该节点为根的子树高度
    struct AVLNode *lchild, *rchild;
} AVLNode, *AVLTree;

// ========== 辅助 ==========
int Height(AVLNode *p);                      // 空指针返回 0
int BalanceFactor(AVLNode *p);               // 返回 BF
int max(int a, int b);
void UpdateHeight(AVLNode *p);

// ========== 四种旋转 ==========
AVLNode* RotateRight(AVLNode *A);            // LL 型用
AVLNode* RotateLeft(AVLNode *A);             // RR 型用
AVLNode* RotateLR(AVLNode *A);               // LR 型:左旋+右旋
AVLNode* RotateRL(AVLNode *A);               // RL 型:右旋+左旋

// ========== 插入(核心)==========
AVLNode* Insert(AVLTree T, ElemType key);

// ========== 查找与遍历 ==========
AVLNode* Search(AVLTree T, ElemType key);
void InOrder(AVLTree T);
void PreOrder(AVLTree T);
void DestroyAVL(AVLTree &T);
```

**关于节点设计**:我们给每个节点加了 `height` 字段,这是 AVL 常见做法之一。另一种常见做法是存 **BF** 字段(-1, 0, +1),存 BF 更省空间但每次更新时要区分"左高/右高/平衡"三种状态;存 height 更直观,插入时只需重新计算。**两种都是主流,我们选 height 版本**。

**另一个说明**:插入函数的返回值是 `AVLNode*` 而不是 `void` + 引用。原因是 AVL 插入可能让**子树的根发生改变**(旋转后原根不再是根),用返回值重新赋给父节点的指针是最清晰的写法。

---

### 七、AVL.cpp 完整实现

#### 7.1 辅助函数

cpp

```cpp
#include "AVL.h"
#include <iostream>
using namespace std;

int max(int a, int b) { return a > b ? a : b; }

int Height(AVLNode *p) {
    return p == nullptr ? 0 : p->height;
}

int BalanceFactor(AVLNode *p) {
    if (p == nullptr) return 0;
    return Height(p->lchild) - Height(p->rchild);
}

void UpdateHeight(AVLNode *p) {
    p->height = max(Height(p->lchild), Height(p->rchild)) + 1;
}
```

#### 7.2 四种旋转

cpp

```cpp
AVLNode* RotateRight(AVLNode *A) {
    AVLNode *B = A->lchild;
    A->lchild = B->rchild;
    B->rchild = A;
    UpdateHeight(A);                 // 先更新 A(因为它现在在下面)
    UpdateHeight(B);                 // 再更新 B(新根)
    return B;
}

AVLNode* RotateLeft(AVLNode *A) {
    AVLNode *B = A->rchild;
    A->rchild = B->lchild;
    B->lchild = A;
    UpdateHeight(A);
    UpdateHeight(B);
    return B;
}

AVLNode* RotateLR(AVLNode *A) {
    A->lchild = RotateLeft(A->lchild);
    return RotateRight(A);
}

AVLNode* RotateRL(AVLNode *A) {
    A->rchild = RotateRight(A->rchild);
    return RotateLeft(A);
}
```

**高度更新顺序至关重要**:旋转后 A 已经是"下面的节点",先更新 A;B 是新根,更新 B 要依赖 A 的新高度,所以后更新 B。

#### 7.3 插入(核心算法)

cpp

```cpp
AVLNode* Insert(AVLTree T, ElemType key) {
    // 1. 标准 BST 插入
    if (T == nullptr) {
        T = new AVLNode;
        T->data = key;
        T->height = 1;
        T->lchild = T->rchild = nullptr;
        return T;
    }
    if (key < T->data) {
        T->lchild = Insert(T->lchild, key);
    } else if (key > T->data) {
        T->rchild = Insert(T->rchild, key);
    } else {
        return T;                    // 重复键不插入
    }

    // 2. 更新当前节点高度
    UpdateHeight(T);

    // 3. 计算 BF,判断是否失衡
    int bf = BalanceFactor(T);

    // 4. 四种失衡情况
    // LL:左孩子的左侧过高
    if (bf > 1 && key < T->lchild->data) {
        return RotateRight(T);
    }
    // RR:右孩子的右侧过高
    if (bf < -1 && key > T->rchild->data) {
        return RotateLeft(T);
    }
    // LR:左孩子的右侧过高
    if (bf > 1 && key > T->lchild->data) {
        return RotateLR(T);
    }
    // RL:右孩子的左侧过高
    if (bf < -1 && key < T->rchild->data) {
        return RotateRL(T);
    }

    return T;                        // 未失衡,或处理完毕
}
```

**理解要点**:

第一,递归回溯时**从下往上**检查每层节点的 BF,发现第一个失衡点就旋转修复。

第二,判断 L/LR 时靠 `key < T->lchild->data` vs `key > T->lchild->data`——因为 key 走的方向决定了插入位置在左孩子的左边还是右边。这是**代码上最简洁的判断方式**,比计算子节点的 BF 更直接。

第三,一次插入最多导致**一次**旋转(单旋或双旋算一次),**旋转完了整棵树就平衡了**,不会继续传播。这一点和红黑树、B 树的插入类似。

#### 7.4 查找、遍历、销毁

cpp

```cpp
AVLNode* Search(AVLTree T, ElemType key) {
    while (T != nullptr && T->data != key) {
        T = (key < T->data) ? T->lchild : T->rchild;
    }
    return T;
}

void InOrder(AVLTree T) {
    if (T == nullptr) return;
    InOrder(T->lchild);
    cout << T->data << "(h=" << T->height << ") ";
    InOrder(T->rchild);
}

void PreOrder(AVLTree T) {
    if (T == nullptr) return;
    cout << T->data << " ";
    PreOrder(T->lchild);
    PreOrder(T->rchild);
}

void DestroyAVL(AVLTree &T) {
    if (T == nullptr) return;
    DestroyAVL(T->lchild);
    DestroyAVL(T->rchild);
    delete T;
    T = nullptr;
}
```

---

### 八、手工构造 AVL:一个完整示例

依次插入 `{3, 2, 1, 4, 5, 6, 7, 16, 15, 14}`,我们一步步画出来。

**插入 3**:单节点树,无需旋转。

```
3
```

**插入 2**:

```
  3
 /
2
```

BF = 1,平衡。

**插入 1**:

```
    3 (BF=2,失衡!)
   /
  2 (BF=1)
 /
1
```

**L 型**(2 是 3 的左孩子,1 是 2 的左孩子),对 3 右单旋:

```
  2
 / \
1   3
```

**插入 4**:

```
  2
 / \
1   3
     \
      4
```

BF 都在范围内,平衡。

**插入 5**:

```
  2 (BF=-2)
 / \
1   3 (BF=-1)
     \
      4 (BF=-1)
       \
        5
```

根 2 失衡,**R 型**(3 是 2 的右,4 是 3 的右),对 2 左单旋——但等一下,这里**最小失衡子树**是谁?从新插入节点 5 往上找,第一个失衡的是**根 2**。对 2 左单旋:

```
    3
   / \
  2   4
 /     \
1       5
```

**插入 6**:

```
    3
   / \
  2   4 (BF=-2,失衡)
 /     \
1       5
         \
          6
```

最小失衡在节点 4,**R 型**,对 4 左单旋:

```
    3
   / \
  2   5
 /   / \
1   4   6
```

**插入 7**:

```
      3 (BF=-2,失衡!)
     / \
    2   5
   /   / \
  1   4   6
           \
            7
```

最小失衡在根 3。类型?从根看:右孩子 5 的右孩子 6 的右孩子 7 方向——**R 型**,对 3 左单旋:

```
      5
     / \
    3   6
   / \   \
  2   4   7
 /
1
```

**插入 16**:

```
      5
     / \
    3   6
   / \   \
  2   4   7
 /         \
1           16
```

平衡。

**插入 15**:

```
      5
     / \
    3   6 (BF=-2,失衡)
   / \   \
  2   4   7 (BF=-1)
 /         \
1           16 (BF=1)
           /
          15
```

最小失衡在 6。类型?6 的右孩子 7 的右孩子 16 的**左**孩子 15 ——**RL 型**,对 6 做右左双旋。

第一步,对 7(6 的右孩子)右旋:

```
      5
     / \
    3   6
   / \   \
  2   4   16
 /         /
1         7
           \
            15
```

第二步,对 6 左旋:

```
      5
     / \
    3   16
   / \   / \
  2   4 6   7 (等等,这里不对)
 /       \
1         15
```

让我重新仔细画一下。对 6 为根做 RL 旋转:6 的右孩子是 7,7 的左孩子是?原本 7 没有左孩子,插入 15 后 15 成为 16 的左孩子,16 是 7 的右孩子。**让我重新审视——其实失衡路径是:6 → 右孩子 7 → 右孩子 16 → 左孩子 15,这是 R-L 路径,而不是标准 RL。**

嗯等等,让我停下来仔细想。失衡发生时,**关键看"失衡节点到新插入节点的前两步方向"**。从 6 出发:第一步往右到 7,第二步……15 是 16 的左孩子,16 是 7 的右孩子,所以从 7 开始是 7→右→左。**第二步是"右"**。所以 **6 → 右 → 右**,是 **R 型**,对 6 做左单旋。

(这说明我上面判断 RL 错了——**判断类型时看"失衡节点往下的头两步"**,不是整条路径。)

对 6 左单旋:

```
      5
     / \
    3   7
   / \   / \
  2   4 6   16
 /             /
1            15
```

检查 5:左高 3,右高 3,平衡。

**插入 14**:

```
      5
     / \
    3   7
   / \   / \
  2   4 6   16 (BF=2)
 /          /
1          15 (BF=1)
           /
          14
```

最小失衡在 16。16 → 左 15 → 左 14,**L 型**,对 16 右单旋:

```
      5
     / \
    3   7
   / \   / \
  2   4 6   15
 /          / \
1          14  16
```

**最终 AVL 树**:

```
          5
         / \
        3   7
       / \  / \
      2   4 6  15
     /        / \
    1        14  16
```

中序遍历:1 2 3 4 5 6 7 14 15 16,升序——验证正确。高度 4,对于 10 个节点来说很紧凑。

---

### 九、测试代码(main.cpp)

cpp

```cpp
#include "AVL.h"
#include <iostream>
using namespace std;

int main() {
    AVLTree T = nullptr;
    int arr[] = {3, 2, 1, 4, 5, 6, 7, 16, 15, 14};
    int n = sizeof(arr) / sizeof(arr[0]);

    for (int i = 0; i < n; i++) {
        T = Insert(T, arr[i]);
    }

    cout << "中序遍历(应为升序): ";
    InOrder(T); cout << endl;

    cout << "先序遍历: ";
    PreOrder(T); cout << endl;

    cout << "根节点高度: " << Height(T) << endl;

    // 查找
    int key = 14;
    AVLNode *p = Search(T, key);
    cout << "查找 " << key << ": " << (p ? "找到" : "未找到") << endl;

    DestroyAVL(T);
    return 0;
}
```

---

### 十、AVL 的高度分析(考点)

**定理**:含 n 个节点的 AVL 树,高度 h ≤ 1.44 × log₂(n+2)。

也就是说 AVL 树高度最坏约是 **1.44 × log n**,和理想完美二叉树 log n 相差常数倍,**查找始终是 O(log n)**。

**极端 AVL 树**:具有 n 个节点的 AVL 树,在某些形态下可能比完美二叉树高,但不会差太多。考研中常考的是**给定高度,问最少节点数**:

**N(h)** 表示高度为 h 的 AVL 树的**最少节点数**,递推式:

N(0) = 0,N(1) = 1,N(2) = 2,N(h) = N(h-1) + N(h-2) + 1

这是**斐波那契式**的增长。推导:高度为 h 的最小 AVL,它的左右子树一个高 h-1、一个高 h-2(差 1 是允许的最大差),都取最小,加上根节点 1。

所以 AVL 树高度和节点数的关系类似斐波那契数列,**高度以对数速度增长**。

---

### 十一、删除操作(简介,代码略)

AVL 的删除比插入复杂:

第一,先按 BST 规则删除(可能替换为后继)。第二,从删除位置回溯到根,沿途每个节点检查 BF,失衡就旋转。**删除与插入的关键区别**:插入后一次旋转即平衡;**删除后可能需要多次旋转**,因为一次旋转可能让更上层的节点也失衡。

判断旋转类型的方法与插入类似,但要注意:删除导致的失衡,失衡节点的"另一侧"是"高的一侧"。例如从左子树删节点导致 BF=-2,就看右孩子的 BF:若右孩子 BF ≤ 0(-1 或 0)→ R 型;若右孩子 BF = +1 → RL 型。

**考研一般以插入为主,删除偶尔考**,我们暂不展开代码,先把插入吃透。

---

### 十二、易错点总结

**第一个易错点**:L 型用**右旋**,R 型用**左旋**。很多同学一开始会搞反——**记住方向相反**即可:失衡歪向哪边,就往反方向扳回来。

**第二个易错点**:LR 型是"**先对左孩子左旋,再对失衡点右旋**",RL 型是"先对右孩子右旋,再对失衡点左旋"。**口诀**:"外面名字对应第二次旋转,第一次旋转是为了把问题搬到外侧"。

**第三个易错点**:判断失衡类型时看**失衡节点往下的头两步方向**,不是整条路径。

**第四个易错点**:旋转后**记得更新 height**。顺序是:先更新原来的根(A),再更新新根(B)。

**第五个易错点**:插入 AVL 后,**第一次遇到的失衡节点是最小失衡子树的根**,对它旋转一次,整棵树就平衡了,**不用继续往上检查**。这是插入的重要性质。

---

### 十三、思考题(请作答)

第一题,依次插入 `{13, 24, 37, 90, 53}` 到空 AVL 树,**每次插入都画图**,标注失衡时用的是哪种旋转,以及旋转后的树形态。

第二题,高度为 5 的 AVL 树**最少有多少个节点**?请用前述递推式 N(h) = N(h-1) + N(h-2) + 1 计算 N(0) 到 N(5)。

第三题,以下先序遍历能否对应某棵 AVL 树?画出那棵树并判断:

(a) 50, 30, 20, 40, 70, 60, 80
(b) 50, 40, 30, 20, 10, 60

第四题,在 AVL 中插入一个新节点后,**最多需要调整多少层**?**最多做多少次单旋**?(提示:一次双旋算两次单旋)

第五题,假设某节点 A 的 BF 变成 -2,它的右孩子 B 的 BF 是 0,这种情况可能出现在**插入**操作中吗?为什么?(提示:考虑插入会导致哪些 BF 状态组合;这个问题引导你思考"插入和删除导致的失衡模式差异")

## 数据结构复习:B 树和 B+ 树

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

## 数据结构复习:堆和堆排序

好,在我们一头扎进代码之前,我想先确认一下你的起点——这样我能更好地把堆讲清楚,而不是把此前已经会的东西重复一遍。

### 几个引导问题(请选答你能答的)

**问题一**:你之前学过"完全二叉树"对吧?能用自己的话回忆一下:**完全二叉树和满二叉树的区别**是什么?为什么完全二叉树特别适合**用数组存储**(不用指针)?

**问题二**:假设有一棵完全二叉树用数组 `a[1..n]` 存储,下标 i 的节点:

- 它的左孩子在哪个下标?
- 它的右孩子在哪个下标?
- 它的父节点在哪个下标?
- 第一个**非叶子**节点在哪个下标?(这个问题对堆排序至关重要,你想想看)

**问题三**:你对"堆"这个词,目前有多少印象?以下哪些你能说出大概?

- 大根堆 / 小根堆是什么意思?
- 堆和 BST 有什么区别?(都是二叉树,但性质不同)
- 优先队列和堆有什么关系?

**问题四**:你之前学过排序算法吗?如果学过,知道哪几种?(冒泡、选择、插入、快排、归并……)

---

### 为什么我先问这些?

因为**堆排序的代码非常短(核心就两个函数),但每一行都建立在前面的概念之上**:

- 数组下标的父子关系 → 决定了堆的实现
- "第一个非叶子节点" → 决定了**建堆**从哪里开始
- 大根堆性质 → 决定了堆排序为什么能得到升序
- 堆调整的"下沉"操作 → 是整个算法的核心

如果其中任何一环你不熟,我帮你先打牢;如果你都熟,我可以直接进入代码部分,讲快一些。

---

### 你可以这样回答我

最理想的情况是:**你试着回答上面的问题,哪怕只能写出"我大概知道但说不准"也行**——这样我就能看出你的真实起点。

零基础读者可先从完全二叉树的数组表示开始学习。

如果你说"问题一二我都会,问题三四不太懂",那我就跳过前两个,直接从堆的定义开始。

从基础开始讲,按照我们之前一贯的风格——**概念铺垫 → 存储结构 → 核心操作 → 应用 → 思考题**。这一章代码不长,但**每一步的原理必须透彻**,否则面对变形题就会懵。

---

### 一、前置知识:完全二叉树的数组表示

**这是堆的存储基础,必须先讲清楚。**

回忆一下完全二叉树:除最后一层外,每一层都填满,且最后一层的节点**从左到右连续**排列。正因为它这么规整,**可以不用指针,直接用数组按层序存储**。

#### 数组下标的父子关系(必背)

设数组下标**从 1 开始**使用(a[0] 不用),对于下标 i 的节点:

**父节点**下标:`i / 2`(整数除法,自动向下取整)。

**左孩子**下标:`2 * i`。

**右孩子**下标:`2 * i + 1`。

#### 一个例子

完全二叉树:

```
        50           ← 下标 1
       /  \
      30   70        ← 下标 2, 3
     / \   / \
    20 40 60 80      ← 下标 4, 5, 6, 7
```

数组表示:

|下标|1|2|3|4|5|6|7|
|---|---|---|---|---|---|---|---|
|值|50|30|70|20|40|60|80|

验证:下标 2 的左孩子下标 2×2=4 是 20,右孩子下标 5 是 40,父节点下标 2/2=1 是 50——完全对应。

#### 为什么下标从 1 开始?

如果下标从 0 开始,父子关系变成:左孩子 `2i+1`,右孩子 `2i+2`,父节点 `(i-1)/2`。**能用,但计算更繁琐**。从 1 开始的下标关系最优雅,所以教材(严蔚敏、王道)和考研大题都用 **1 起**的约定。我们也用这个。

#### 第一个非叶子节点在哪里?(重要!)

**结论**:对于 n 个节点的完全二叉树,最后一个节点的下标是 n,它的父节点下标是 `n/2`。这个父节点就是**最后一个非叶子节点**。

**为什么?** 最后一个节点之后的所有节点(下标 n+1, n+2, ...)都不存在,所以它们的父节点(下标 n/2 之前的某些节点)才可能是叶子。但下标 `n/2` 的节点至少有最后一个节点作为孩子,所以它**一定是非叶子**。再往前的节点也都是非叶子(它们的孩子下标更小,肯定存在)。

**所以下标范围 1 到 n/2 都是非叶子,n/2+1 到 n 都是叶子。**

这个结论是**堆排序建堆的起点**——建堆从下标 n/2 开始向前遍历。

---

### 二、堆的定义

**堆(Heap)**:一棵**完全二叉树**,且满足以下性质之一:

**大根堆(大顶堆)**:每个节点的值 ≥ 它的左右孩子的值。等价说法:根是整棵树的最大值。

**小根堆(小顶堆)**:每个节点的值 ≤ 它的左右孩子的值。等价说法:根是整棵树的最小值。

**注意**:堆**只要求父子间满足大小关系**,**不要求兄弟间、也不要求整个树像 BST 那样全局有序**。这是堆和 BST 最大的区别。

#### 大根堆示例

```
        80
       /  \
      70   60
     / \   / \
    40 50 20 30
```

每个节点都 ≥ 它的孩子。但左子树里有 40 < 50(兄弟),右子树里 20 < 30——**兄弟间无序也无妨**,堆只看父子关系。

#### 堆 vs BST 对比

|性质|堆|BST|
|---|---|---|
|树形|必须完全二叉树|任意二叉树|
|存储|数组|链表/指针|
|顺序|父子关系|左<根<右|
|根节点|最大(或最小)|无特殊含义|
|找最大/最小|O(1)|O(h)|
|查找任意值|O(n)|O(h)|
|中序遍历|无意义(不会有序)|递增有序|

**一句话概括**:**BST 为查找任意值优化,堆为"反复取最大/最小值"优化**。这决定了它们各自的应用场景。

---

### 三、堆的核心操作:向下调整(Sift Down)

堆有两个基本操作——"向下调整"和"向上调整"。我们先讲**向下调整**,这是堆排序和建堆的基石。

#### 问题情境

假设下标 i 的节点**违反了堆性质**(它的值比孩子小,在大根堆中就是违反者),但 i 的左右子树**本身都已经是合法的大根堆**。如何让以 i 为根的整棵子树重新变成大根堆?

#### 向下调整的思路

从 i 出发:

**第一步**,找 i 的左右孩子中**较大**的一个,记作 max。

**第二步**,如果 i 本身已经 ≥ max,性质满足,结束。

**第三步**,否则,**交换 i 和 max 的值**,然后把问题**下沉**——i 的值现在在原 max 的位置,可能又违反那一层的堆性质,所以对那个位置继续做同样的调整。

这个过程像"违反者一路沉到底",所以叫"下沉"或"向下调整"。

#### 图解

对下面这棵子树调整(下标 1 的根 30 违反大根堆):

```
        30 ← 根违反
       /  \
      70   60        ← 左右子树都已是合法大根堆
     / \   / \
    40 50 20 10
```

**第一步**,比较左右孩子 70 vs 60,左大;30 < 70,交换 30 和 70:

```
        70
       /  \
      30   60        ← 30 下沉到左子树根
     / \   / \
    40 50 20 10
```

**第二步**,30 现在在下标 2 的位置,它的孩子是 40、50。40 vs 50,50 大;30 < 50,交换:

```
        70
       /  \
      50   60
     / \   / \
    40 30 20 10   ← 30 继续下沉
```

**第三步**,30 现在在下标 5 的位置,下标 10、11 的孩子不存在(n=7),30 已到叶子,结束。

**最终**,以原先 30 为根的子树,经过下沉调整,变成合法大根堆。

#### 代码实现(向下调整)

cpp

```cpp
// 对数组 a[1..n] 中下标 i 的节点做向下调整(大根堆)
void SiftDown(int a[], int i, int n) {
    while (2 * i <= n) {                // 只要有左孩子
        int child = 2 * i;              // 左孩子下标
        // 选出左右孩子中较大的那个
        if (child + 1 <= n && a[child + 1] > a[child]) {
            child++;                    // 右孩子更大
        }
        // 如果父节点已经 >= 较大孩子,堆性质满足,结束
        if (a[i] >= a[child]) break;
        // 否则交换,继续下沉
        int temp = a[i];
        a[i] = a[child];
        a[child] = temp;
        i = child;                      // 更新 i,继续向下
    }
}
```

**这段代码必须背下来**。它看起来只有 10 行,但是堆算法的全部精髓。逐行理解:

`while (2*i <= n)`:循环条件是"i 还有左孩子"。如果左孩子都没有(i 是叶子),下沉结束。

`int child = 2*i`:先假设要和左孩子比。

`if (child+1 <= n && a[child+1] > a[child])`:如果右孩子存在且更大,改成和右孩子比。这里**短路判断**很关键——如果右孩子不存在(`child+1 > n`),`a[child+1]` 就越界了,所以必须先判 `child+1 <= n`。

`if (a[i] >= a[child]) break`:性质已满足,不用再下沉。

`swap + i = child`:交换后问题转移到孩子位置,继续。

**时间复杂度**:向下调整最多走完树的高度,即 O(log n)。

---

### 四、建堆:从无序数组到大根堆

给你一个无序数组 a[1..n],如何把它变成大根堆?

#### 朴素思路(不好)

从下标 1 开始,对每个位置做向下调整。但**这是错的**——因为 SiftDown 要求"i 的左右子树已经是合法堆",从上往下做,子树根本还没调整过。

#### 正确思路:从最后一个非叶子节点开始,向前遍历

**最后一个非叶子节点**下标是 `n/2`(前面推导过)。从这里开始**向前**到下标 1,依次对每个节点做 SiftDown。

**为什么这样对?** 因为下标 n/2+1 到 n 都是叶子——**叶子本身已经是合法堆**(单节点就是堆)。从 n/2 开始,每个节点的左右子树都已经被处理过(因为子树在数组中下标更大,更早处理),所以 SiftDown 的前提条件满足。

**这就是著名的"Floyd 建堆法"**,也叫"自底向上建堆"。

#### 代码

cpp

```cpp
void BuildMaxHeap(int a[], int n) {
    for (int i = n / 2; i >= 1; i--) {  // 从最后一个非叶子到根
        SiftDown(a, i, n);
    }
}
```

#### 建堆示例:数组 `[_, 4, 1, 3, 2, 16, 9, 10, 14, 8, 7]`(下标 0 不用,n=10)

对应完全二叉树:

```
              4
           /     \
          1       3
         / \     / \
        2   16  9  10
       / \  /
      14  8 7
```

**最后一个非叶子下标 = 10/2 = 5**(值 16)。从下标 5 开始向前。

**i=5(16)**:左孩子下标 10(7)。16 > 7,已满足,不动。

**i=4(2)**:左孩子 14,右孩子 8,最大 14;2 < 14,交换。

```
              4
           /     \
          1       3
         / \     / \
       14   16  9  10
       / \  /
      2   8 7
```

**i=3(3)**:左孩子 9,右孩子 10,最大 10;3 < 10,交换。

```
              4
           /     \
          1      10
         / \     / \
       14  16  9   3
       / \  /
      2   8 7
```

**i=2(1)**:左孩子 14,右孩子 16,最大 16;1 < 16,交换。然后 1 下沉到原 16 位置(下标 5),左孩子 7,1 < 7,再交换。

```
              4
           /     \
         16      10
         / \     / \
       14   7  9   3
       / \  /
      2   8 1
```

**i=1(4)**:左 16,右 10,最大 16;4 < 16,交换。4 下沉到下标 2,左 14,右 7,最大 14;4 < 14,交换。4 下沉到下标 4,左 2,右 8,最大 8;4 < 8,交换。4 下沉到下标 9,无孩子,停止。

```
              16
           /      \
         14       10
         / \      / \
        8   7   9    3
       / \  /
      2   4 1
```

**建堆完成**。根 16 是最大值。

#### 建堆的时间复杂度(易错点)

很多人第一反应是 O(n log n),因为每次 SiftDown 是 O(log n),共 n/2 次。**但实际上是 O(n)**。

**为什么?** 因为**越靠近根的节点越少,但下沉路径越长;越靠近叶子的节点越多,但下沉路径越短**。数学上可以证明总和是线性的。**"建堆 O(n)"是考研选择题重点考点**。

---

### 五、堆排序(Heap Sort)

有了大根堆之后,排序思路非常优雅:

**步骤一**,建大根堆,此时根 a[1] 是全局最大值。

**步骤二**,**把 a[1] 和 a[n] 交换**。最大值就位(排到了数组末尾)。此时数组前 n-1 个元素可能不再是堆。

**步骤三**,对 a[1..n-1] **重新调整为堆**(只需对 a[1] 做一次 SiftDown 即可,因为只有根被换过)。

**步骤四**,重复:把 a[1] 和 a[n-1] 交换,对 a[1..n-2] 调整,……

**共交换 n-1 次,每次调整 O(log n),总时间 O(n log n)**。

#### 核心代码

cpp

```cpp
void HeapSort(int a[], int n) {
    // 1. 建堆
    BuildMaxHeap(a, n);

    // 2. 反复"取最大 + 调整"
    for (int i = n; i >= 2; i--) {
        // 交换 a[1] 和 a[i]
        int temp = a[1];
        a[1] = a[i];
        a[i] = temp;
        // 对 a[1..i-1] 重新调整
        SiftDown(a, 1, i - 1);
    }
}
```

**注意**:第二个参数 `i - 1` 非常关键——此时数组有效范围缩小到 `[1..i-1]`,`a[i..n]` 已经是排好序的部分了。SiftDown 必须知道"堆的大小",才能正确处理边界。

#### 为什么大根堆排出升序?

每次把最大值放到末尾,下次把"剩余中的最大值"放到倒数第二位……所以最终数组从前往后是从小到大。

**如果要排降序,就用小根堆**,每次把最小值放末尾,结果从前到后就是从大到小。

---

### 六、堆排序的完整示例

继续用前面建好的堆:

```
a[] = [_, 16, 14, 10, 8, 7, 9, 3, 2, 4, 1]
```

**第一轮**:交换 a[1]=16 和 a[10]=1,数组变为 `[_, 1, 14, 10, 8, 7, 9, 3, 2, 4, 16]`。对 a[1..9] 做 SiftDown(1):

1 的左右孩子 14、10,最大 14;1 < 14,交换。1 下沉到下标 2,左 8、右 7,最大 8;1 < 8,交换。1 下沉到下标 4,左 2、右 4,最大 4;1 < 4,交换。1 下沉到下标 9,无孩子,停。

数组:`[_, 14, 8, 10, 4, 7, 9, 3, 2, 1, 16]`

**第二轮**:交换 a[1]=14 和 a[9]=1,数组 `[_, 1, 8, 10, 4, 7, 9, 3, 2, 14, 16]`。调整 a[1..8]:

类似地 1 下沉……最终数组 `[_, 10, 8, 9, 4, 7, 1, 3, 2, 14, 16]`。

**……**(继续 n-1 轮)

**最终排序结果**:`[_, 1, 2, 3, 4, 7, 8, 9, 10, 14, 16]`——升序。

---

### 七、项目文件组织

```
DataStructure/
└── Heap/
    ├── Heap.h
    ├── Heap.cpp
    └── main.cpp
```

#### Heap.h

cpp

```cpp
#pragma once

typedef int ElemType;

// ========== 堆的核心操作 ==========
void SiftDown(ElemType a[], int i, int n);       // 向下调整
void SiftUp(ElemType a[], int i);                 // 向上调整(优先队列插入用)
void BuildMaxHeap(ElemType a[], int n);           // 建大根堆

// ========== 堆排序 ==========
void HeapSort(ElemType a[], int n);

// ========== 优先队列的基本操作 ==========
void Insert(ElemType a[], int &n, ElemType e, int capacity);  // 插入
ElemType ExtractMax(ElemType a[], int &n);                   // 取走最大值
ElemType GetMax(ElemType a[], int n);                         // 读最大值

// ========== 辅助 ==========
void PrintArray(ElemType a[], int n);
```

#### Heap.cpp

cpp

```cpp
#include "Heap.h"
#include <iostream>
using namespace std;

void SiftDown(ElemType a[], int i, int n) {
    while (2 * i <= n) {
        int child = 2 * i;
        if (child + 1 <= n && a[child + 1] > a[child]) {
            child++;
        }
        if (a[i] >= a[child]) break;
        ElemType temp = a[i];
        a[i] = a[child];
        a[child] = temp;
        i = child;
    }
}

void SiftUp(ElemType a[], int i) {
    while (i > 1 && a[i] > a[i / 2]) {       // 比父大就上浮
        ElemType temp = a[i];
        a[i] = a[i / 2];
        a[i / 2] = temp;
        i = i / 2;
    }
}

void BuildMaxHeap(ElemType a[], int n) {
    for (int i = n / 2; i >= 1; i--) {
        SiftDown(a, i, n);
    }
}

void HeapSort(ElemType a[], int n) {
    BuildMaxHeap(a, n);
    for (int i = n; i >= 2; i--) {
        ElemType temp = a[1];
        a[1] = a[i];
        a[i] = temp;
        SiftDown(a, 1, i - 1);
    }
}

// 优先队列:插入 e 到堆中
void Insert(ElemType a[], int &n, ElemType e, int capacity) {
    if (n >= capacity - 1) return;           // 满了(n 是当前元素数,下标 1..n)
    n++;
    a[n] = e;                                 // 放到末尾
    SiftUp(a, n);                             // 向上调整
}

// 优先队列:取走最大值
ElemType ExtractMax(ElemType a[], int &n) {
    ElemType maxVal = a[1];
    a[1] = a[n];                              // 末尾元素覆盖根
    n--;
    SiftDown(a, 1, n);
    return maxVal;
}

ElemType GetMax(ElemType a[], int n) {
    return a[1];                              // O(1) 读最大值
}

void PrintArray(ElemType a[], int n) {
    for (int i = 1; i <= n; i++) cout << a[i] << " ";
    cout << endl;
}
```

**这里顺便讲了"向上调整 SiftUp"**——它是 SiftDown 的对称操作,用于**优先队列的插入**:把新元素放在数组末尾,然后向上浮动到正确位置。逻辑类似,不再赘述。

---

### 八、main.cpp 测试

cpp

```cpp
#include "Heap.h"
#include <iostream>
using namespace std;

int main() {
    // ========== 堆排序测试 ==========
    ElemType a[] = {0, 4, 1, 3, 2, 16, 9, 10, 14, 8, 7};  // a[0] 不用
    int n = 10;

    cout << "原数组:   "; PrintArray(a, n);

    BuildMaxHeap(a, n);
    cout << "建堆后:   "; PrintArray(a, n);

    HeapSort(a, n);
    cout << "排序后:   "; PrintArray(a, n);

    // ========== 优先队列测试 ==========
    cout << "\n===== 优先队列 =====" << endl;
    ElemType pq[20];
    int pqSize = 0;

    int data[] = {5, 3, 8, 1, 9, 2, 7};
    for (int i = 0; i < 7; i++) {
        Insert(pq, pqSize, data[i], 20);
        cout << "插入 " << data[i] << " 后: ";
        PrintArray(pq, pqSize);
    }

    cout << "\n依次取出最大值: ";
    while (pqSize > 0) {
        cout << ExtractMax(pq, pqSize) << " ";
    }
    cout << endl;

    return 0;
}
```

预期输出:

```
原数组:   4 1 3 2 16 9 10 14 8 7
建堆后:   16 14 10 8 7 9 3 2 4 1
排序后:   1 2 3 4 7 8 9 10 14 16

===== 优先队列 =====
插入 5 后: 5
插入 3 后: 5 3
插入 8 后: 8 3 5
插入 1 后: 8 3 5 1
插入 9 后: 9 8 5 1 3
插入 2 后: 9 8 5 1 3 2
插入 7 后: 9 8 7 1 3 2 5

依次取出最大值: 9 8 7 5 3 2 1
```

**取出的顺序正是从大到小**——这就是优先队列的核心用途。

---

### 九、堆的应用总结

#### 应用一:堆排序

O(n log n) 时间,O(1) 空间(原地排序)。**不稳定排序**(相同元素的相对位置可能改变)。

相比快排:堆排最坏也是 O(n log n)(快排最坏 O(n²)),但**常数因子更大**,实际中通常比快排慢 2-3 倍。所以堆排主要用于"需要严格保证 O(n log n)"的场景。

#### 应用二:优先队列

需要反复取最大/最小,且支持动态插入的场景。典型应用:任务调度(优先级高的先执行)、Dijkstra 最短路径(每次取距离最小的节点)、Huffman 建树(每次取权值最小的两棵)。

**C++ 的 `std::priority_queue` 底层就是堆**,默认大根堆。

#### 应用三:Top K 问题

**从 n 个元素中找最大的 K 个**。

**朴素做法**:排序后取前 K 个,O(n log n)。

**堆做法**:维护一个**大小为 K 的小根堆**。遍历 n 个元素,每个元素若大于堆顶,就替换堆顶并 SiftDown。最终堆里就是最大的 K 个。**O(n log K)**,当 K 远小于 n 时比排序快很多。

**这是面试高频题**,你要熟。

#### 应用四:建哈夫曼树

还记得我们前面讲哈夫曼树的"Select 函数"吗?用线性查找是 O(n),每次选最小的两个;**如果用小根堆替代,每次取最小是 O(log n)**,建哈夫曼树总时间从 O(n²) 降到 O(n log n)。这是一个**把堆应用到我们已学内容**的经典场景。

---

### 十、常见易错点总结

**易错一**:建堆的起点是 `n/2`,不是 1,也不是 n。从 `n/2` 向前遍历到 1。

**易错二**:向下调整时,判断右孩子存在必须用 `child+1 <= n` 短路,否则越界。

**易错三**:堆排序时 `SiftDown(a, 1, i-1)` 中的 `i-1` 不能写成 n,因为堆的有效范围每轮在缩小。

**易错四**:**建堆是 O(n)**,不是 O(n log n)。但**堆排序整体是 O(n log n)**(因为还要做 n-1 次 SiftDown)。

**易错五**:堆**不是排序的**,只是父子关系固定。不要误以为堆的中序遍历会有序。

**易错六**:大根堆排升序(最大值沉底),小根堆排降序。很多人记反。

**易错七**:堆排序是**不稳定**的(SiftDown 可能改变相同值的相对顺序),归并排序是稳定的。

---

### 十一、思考题(请作答)

第一题,对数组 `[53, 17, 78, 9, 45, 65, 87, 32]`(下标从 1 开始,n=8),**画出建大根堆的每一步**,标明从下标几开始、每次 SiftDown 的路径。

第二题,**建堆的时间复杂度为什么是 O(n) 而不是 O(n log n)?** 请给出直观解释(不需要严格证明,但要说清楚"为什么上层节点少但下沉深、下层节点多但下沉浅能抵消")。

第三题,**Top K 问题**:从一个有 100 万个元素的数组中找最大的 10 个,用**大小为 10 的小根堆**的算法过程是怎样的?为什么用小根堆而不是大根堆?(提示:想想"堆顶"在 Top K 里代表什么)

第四题,给定一个大根堆,**堆中的最小值可能在哪些位置**?是不是一定在叶子?(提示:想想堆的定义只约束父子)

第五题,向一个含 n 个元素的大根堆中**插入一个新元素**,最坏情况要做多少次比较和交换?**删除最大值**呢?分别写出时间复杂度。

第六题,**堆排序是稳定的吗?** 如果不是,举一个反例(即给一个输入,其中相同值元素的相对顺序在堆排后发生了改变)。

## 数据结构复习:红黑树

好,我们进入**红黑树**(Red-Black Tree)。先给你打个预防针——**这是数据结构里最难的一章,没有之一**。它比 AVL 复杂得多,比 B 树概念更抽象,但又是**工业界最重要的平衡树**(`std::map`、`std::set`、Java TreeMap、Linux 内核的许多内部结构都用红黑树)。

**关于考研**:红黑树从 2019 年起被列入考研大纲,但考查以**性质判断、插入手画**为主,**代码默写要求较低**。所以我的讲解重点是"**让你能看懂红黑树在做什么、能手画几步插入、能和 AVL 对比**",代码会给出但不要求你默写每一行。

---

### 一、为什么还要红黑树?AVL 不够好吗?

回忆一下 AVL:**严格平衡**,左右子树高度差不超过 1。这使 AVL 的**查找性能极好**(高度接近 log n)。

**AVL 的痛点在于"维护成本太高"**:

第一,每次插入/删除都可能触发**多次旋转**(删除操作甚至可能一路旋到根)。

第二,要维护高度(或平衡因子)字段,每次更新。

第三,频繁写操作下,旋转开销让 AVL 的吞吐率下降明显。

**红黑树的哲学**:**放弃严格平衡,接受"近似平衡"**。只要保证"最长路径不超过最短路径的 2 倍",就不算失衡。这样平均旋转次数大幅下降,**在增删频繁的场景下优于 AVL**。

**类比**:AVL 是"强迫症房东"(每根头发都要梳直),红黑树是"务实房东"(大致整齐就行,但保证不乱)。

---

### 二、红黑树的定义(必须一字不差地记)

一棵红黑树是满足以下**五条性质**的二叉搜索树:

**性质一**:每个节点不是**红色**就是**黑色**。

**性质二**:**根节点是黑色**。

**性质三**:每个**叶子节点(NIL)是黑色**。注意:这里的"叶子"指概念上每个没有孩子的位置挂一个**哨兵 NIL 节点**,不是通常"没有孩子的普通节点"。

**性质四**:如果一个节点是**红色**,则它的**两个孩子必须都是黑色**(即"**红色节点不能连续**",但黑色可以连续)。

**性质五**:对每个节点,从该节点出发到它**任何一个后代叶子(NIL)的路径**上,所含**黑色节点数相同**。这个数叫该节点的"**黑高度**"。

**性质五是最重要的约束**——它保证了树的"近似平衡"。

---

### 三、从五条性质能推出什么?(最核心的定理)

**定理**:一棵包含 n 个**内部节点**的红黑树,高度 h ≤ **2 × log₂(n+1)**。

**证明思路(大白话版)**:

性质五保证每条根到叶子的路径有相同的黑高度 bh。性质四保证路径上红黑交替,所以**最长路径最多是最短路径的 2 倍**(黑黑黑…… vs 红黑红黑……)。再结合 n 个内部节点的约束,可推出 h ≤ 2 log(n+1)。

**这个定理就是红黑树存在的意义**:高度是 O(log n),查找永远 O(log n)。虽然常数比 AVL 稍差(2 log n vs 1.44 log n),但维护代价低得多。

---

### 四、一棵合法红黑树的例子

```
             13(黑)
           /       \
        8(红)      17(红)
       /    \      /    \
     1(黑)  11(黑) 15(黑) 25(黑)
       \              \
       6(红)          22(红)
```

你验证一下:

根 13 黑(✓性质二);没有红红父子(11 黑,8 红没问题;1 黑,6 红没问题);从每个节点到叶子的黑色数一致。比如从 13 出发:13→8→1→NIL 黑数是 2,13→8→1→6→NIL 黑数 2,13→17→15→NIL 黑数 2,13→17→25→22→NIL 黑数 2——全部为 2,满足性质五。

---

### 五、红黑树的插入(核心算法)

#### 5.1 基本框架

**第一步**:按 BST 规则找到插入位置,新节点默认**染红**。

**为什么染红?** 因为如果染黑,立刻破坏性质五(所在路径黑高度 +1,影响全局);染红最多破坏性质四(红红父子),局部可修复。

**第二步**:如果插入后破坏了性质(性质二或性质四),执行"**插入修复**"(insert fixup)。

#### 5.2 插入修复的三种情况

**核心判断**:新节点 z 是红色,z 的父节点 p 是什么颜色决定了是否需要修复。

**情况 0**:**p 是黑色**。性质四未被破坏(红黑父子合法),**直接结束,什么都不用做**。

**情况 1、2、3 都发生在"父节点 p 是红色"时**。此时必有祖父 g(因为根是黑色,红色节点不可能是根),也必然有**叔叔节点 u**(可能是 NIL,那就是黑色)。

**我们分 p 是 g 的左孩子还是右孩子,有两组对称情况**。这里只讲"p 是 g 的左孩子"的三种情况,另一侧完全对称。

**情况 1:叔叔 u 是红色**

```
        g(黑)                 g(红)
       /    \                /    \
     p(红)  u(红)   →       p(黑) u(黑)
     /                      /
   z(红)                   z(红)
```

**操作**:p 和 u 都染黑,g 染红。然后把 g 当作新的 z,**向上递归**检查(因为 g 变红了,g 的父节点如果也是红,要继续修复)。

**为什么这样做?** p、u 染黑消除红红冲突;g 染红保持黑高度不变(原 g 为黑,路径上黑数 +1,现在 g 红、p/u 黑,黑数仍是原来那样);但 g 变红后可能导致上层红红冲突,所以要向上继续。

**情况 2:叔叔 u 是黑色,且 z 是 p 的右孩子(LR 型,"折线")**

```
        g(黑)                    g(黑)
       /    \                   /    \
     p(红)  u(黑)    →        z(红)  u(黑)
       \                      /
       z(红)                 p(红)
```

**操作**:对 p 做**左旋**。把情况 2 转化为情况 3。

**情况 3:叔叔 u 是黑色,且 z 是 p 的左孩子(L 型,"直线")**

```
        g(黑)                   p(黑)
       /    \                  /    \
     p(红)  u(黑)   →         z(红)  g(红)
     /                                  \
   z(红)                                u(黑)
```

**操作**:g 和 p **交换颜色**,对 g 做**右旋**。修复完成,算法结束。

#### 5.3 记忆法(很重要)

**一条记忆主线**:

**父黑**:不用动。**父红,叔红**:颜色翻转(爸叔黑,爷红),向上递归。**父红,叔黑,折线**:转一次变直线(情况 2 → 情况 3)。**父红,叔黑,直线**:旋转 + 变色,结束。

**对比 AVL**:AVL 是"四种旋转(LL、RR、LR、RL)",红黑树是"三种情况(叔红 / 叔黑折 / 叔黑直)"。红黑树判断更快(只看叔叔颜色),但情况 1 可能向上递归多次。

---

### 六、手工插入完整示例

对空树依次插入 `{10, 20, 30, 15, 5}`。

**插入 10**:

根插入 10。染红,但性质二要求根是黑,所以**染黑**:

```
10(黑)
```

**插入 20**:

按 BST,20 > 10,作为 10 的右孩子。染红:

```
  10(黑)
     \
     20(红)
```

父是黑,情况 0,**不修复**。

**插入 30**:

30 > 10,30 > 20,作为 20 的右孩子。染红:

```
  10(黑)
     \
     20(红)
        \
        30(红)
```

父 20 是红,**情况发生**。叔叔是 10 的左孩子……**但 10 没有左孩子,即叔叔是 NIL,黑色**。

所以是"叔黑"的情况。z=30 是 p=20 的右孩子,g=10。p 是 g 的右孩子,z 是 p 的右孩子——**是对称情况 3(直线 R 型)**:g 和 p 交换颜色,对 g 做左旋。

```
    20(黑)
   /     \
 10(红)  30(红)
```

验证:根黑(✓),没有红红连(✓),从 20 到所有 NIL 黑数都是 2(✓)。

**插入 15**:

15 > 10,15 < 20,作为左子树;再比较 15 和 20,15 < 20,作为 20 的左孩子。染红:

```
    20(黑)
   /     \
 10(红)  30(红)
    \
    15(红)    ← 新
```

等等,15 应该放哪?让我重来。15 和根 20 比,15 < 20,走左;15 和 10 比,15 > 10,走右。所以 15 是 10 的右孩子:

```
    20(黑)
   /     \
 10(红)  30(红)
    \
    15(红)
```

父 10 是红,**情况发生**。叔叔 30 是红——**情况 1**:p=10 和 u=30 都染黑,g=20 染红。

```
    20(红)
   /     \
 10(黑)  30(黑)
    \
    15(红)
```

然后把 g=20 当作新 z,向上检查。20 是根,根必须是黑——**强制染黑**:

```
    20(黑)
   /     \
 10(黑)  30(黑)
    \
    15(红)
```

**插入 5**:

5 < 20,走左;5 < 10,作为 10 的左孩子。染红:

```
       20(黑)
      /     \
    10(黑)  30(黑)
    /  \
   5(红) 15(红)
```

父 10 是黑,**情况 0**,不修复。

最终合法红黑树。

---

### 七、红黑树的删除(只讲思路,代码极复杂)

**删除比插入复杂得多**,因为:

插入修复最多 3 种情况;**删除修复有 4 种情况,且可能向上递归多次**。

**总流程**:

第一步,按 BST 规则删除:如果度为 2,用后继替换;最终总是删除一个**最多有一个孩子**的节点。

第二步,如果删的是**红节点**,直接删,不破坏任何性质,结束。

第三步,如果删的是**黑节点**,所在路径黑高度 -1,破坏性质五,需要"删除修复"。

**删除修复的核心概念**:被删除位置引入一个"**双重黑(double black)**"的哨兵,通过各种操作把这个"额外的黑"消化掉(要么转移给兄弟的孩子,要么通过变色吸收,要么推到父节点继续处理)。

**删除修复的四种情况**(以被删节点 x 是父节点的左孩子为例,兄弟 w):

**情况 1**:w 是红色——先旋转变色,把问题转成 w 是黑色的情况。

**情况 2**:w 是黑色,且 w 的两个孩子都是黑色——w 染红,双重黑上移到父。

**情况 3**:w 是黑色,w 的左孩子红、右孩子黑——旋转 + 染色,转成情况 4。

**情况 4**:w 是黑色,w 的右孩子红——旋转 + 染色,修复完成,结束。

**这四种情况每种都要记住旋转方向和染色规则,确实繁琐。考研对红黑树删除的考查非常少,你只需知道"有四种情况、比插入复杂"即可。**

---

### 八、代码实现(教学参考)

**我给出完整的插入代码,仅作参考**。考研不要求默写,但你应该能**看懂**。

#### 文件组织

```
DataStructure/
└── RedBlackTree/
    ├── RBTree.h
    ├── RBTree.cpp
    └── main.cpp
```

#### RBTree.h

cpp

```cpp
#pragma once

typedef int KeyType;
enum Color { RED, BLACK };

typedef struct RBNode {
    KeyType key;
    Color color;
    struct RBNode *left, *right, *parent;
} RBNode;

typedef struct {
    RBNode *root;
    RBNode *nil;                    // 哨兵节点:所有 NIL 都指向这一个
} RBTree;

// ========== 基本操作 ==========
RBTree* InitRBTree();
void Insert(RBTree *T, KeyType key);
RBNode* Search(RBTree *T, KeyType key);
void InOrder(RBTree *T, RBNode *x);

// ========== 内部辅助 ==========
void LeftRotate(RBTree *T, RBNode *x);
void RightRotate(RBTree *T, RBNode *x);
void InsertFixup(RBTree *T, RBNode *z);
```

**说明"哨兵 NIL"的设计**:教材通常**共用一个 NIL 节点**作为所有叶子,NIL 染黑。这样代码处理边界(检查 NULL)更简单——所有叶子都是 NIL 对象,可以正常访问它的 color 字段。`std::map` 源码就是这么做的。

#### RBTree.cpp(插入部分)

cpp

```cpp
#include "RBTree.h"
#include <iostream>
using namespace std;

RBTree* InitRBTree() {
    RBTree *T = new RBTree;
    T->nil = new RBNode;
    T->nil->color = BLACK;          // NIL 永远黑
    T->nil->left = T->nil->right = T->nil->parent = T->nil;
    T->root = T->nil;
    return T;
}

// 以 x 为轴左旋
void LeftRotate(RBTree *T, RBNode *x) {
    RBNode *y = x->right;
    x->right = y->left;
    if (y->left != T->nil) y->left->parent = x;
    y->parent = x->parent;
    if (x->parent == T->nil) T->root = y;
    else if (x == x->parent->left) x->parent->left = y;
    else x->parent->right = y;
    y->left = x;
    x->parent = y;
}

// 右旋(对称)
void RightRotate(RBTree *T, RBNode *x) {
    RBNode *y = x->left;
    x->left = y->right;
    if (y->right != T->nil) y->right->parent = x;
    y->parent = x->parent;
    if (x->parent == T->nil) T->root = y;
    else if (x == x->parent->right) x->parent->right = y;
    else x->parent->left = y;
    y->right = x;
    x->parent = y;
}

void Insert(RBTree *T, KeyType key) {
    // 1. 标准 BST 插入
    RBNode *z = new RBNode;
    z->key = key;
    z->color = RED;                     // 新节点染红
    z->left = z->right = z->parent = T->nil;

    RBNode *y = T->nil;
    RBNode *x = T->root;
    while (x != T->nil) {
        y = x;
        if (z->key < x->key) x = x->left;
        else x = x->right;
    }
    z->parent = y;
    if (y == T->nil) T->root = z;
    else if (z->key < y->key) y->left = z;
    else y->right = z;

    // 2. 修复红黑性质
    InsertFixup(T, z);
}

void InsertFixup(RBTree *T, RBNode *z) {
    while (z->parent->color == RED) {          // 父红才需要修复
        if (z->parent == z->parent->parent->left) {
            RBNode *uncle = z->parent->parent->right;
            if (uncle->color == RED) {
                // 情况 1:叔红
                z->parent->color = BLACK;
                uncle->color = BLACK;
                z->parent->parent->color = RED;
                z = z->parent->parent;          // 向上递归
            } else {
                if (z == z->parent->right) {
                    // 情况 2:叔黑,折线 → 先左旋,转情况 3
                    z = z->parent;
                    LeftRotate(T, z);
                }
                // 情况 3:叔黑,直线 → 换色 + 右旋,结束
                z->parent->color = BLACK;
                z->parent->parent->color = RED;
                RightRotate(T, z->parent->parent);
            }
        } else {
            // 对称情况(父是祖父的右孩子)
            RBNode *uncle = z->parent->parent->left;
            if (uncle->color == RED) {
                z->parent->color = BLACK;
                uncle->color = BLACK;
                z->parent->parent->color = RED;
                z = z->parent->parent;
            } else {
                if (z == z->parent->left) {
                    z = z->parent;
                    RightRotate(T, z);
                }
                z->parent->color = BLACK;
                z->parent->parent->color = RED;
                LeftRotate(T, z->parent->parent);
            }
        }
    }
    T->root->color = BLACK;                    // 最后强制根为黑
}

void InOrder(RBTree *T, RBNode *x) {
    if (x == T->nil) return;
    InOrder(T, x->left);
    cout << x->key << "(" << (x->color == RED ? "R" : "B") << ") ";
    InOrder(T, x->right);
}
```

这段代码**对比 AVL 的 4 种旋转,红黑树的 6 种修复情况**(3 种主情况 + 3 种对称)写起来其实**没有想象中那么可怕**,关键是理解每种情况的逻辑。但如果你在考研,这段代码默写要求真的不高,**看懂 + 能画出修复过程即可**。

#### main.cpp

cpp

```cpp
#include "RBTree.h"
#include <iostream>
using namespace std;

int main() {
    RBTree *T = InitRBTree();
    int arr[] = {10, 20, 30, 15, 5, 25, 40, 50};
    int n = sizeof(arr) / sizeof(arr[0]);

    for (int i = 0; i < n; i++) {
        Insert(T, arr[i]);
        cout << "插入 " << arr[i] << " 后中序: ";
        InOrder(T, T->root);
        cout << endl;
    }
    return 0;
}
```

---

### 九、红黑树 vs AVL:一张对比表

|维度|AVL|红黑树|
|---|---|---|
|平衡条件|左右子树高度差 ≤ 1|最长路径 ≤ 2 × 最短路径|
|高度|≤ 1.44 log n|≤ 2 log n|
|查找|更快(更矮)|略慢(更高些)|
|插入旋转次数|最多 2(一次双旋)|最多 2|
|删除旋转次数|最多 O(log n)|最多 3|
|插入后是否可能向上递归|否|是(情况 1 可递归)|
|适用场景|查找多、修改少|插入删除频繁|
|工业应用|少见|C++ std::map/set、Java TreeMap|

**核心取舍**:AVL 查得快,红黑树改得快。工业界普遍选红黑树,因为实际应用中查和改的频率都高,平均表现红黑树胜出。

---

### 十、常见疑问

**疑问一:红黑树为什么叫"红黑"?**

历史原因,发明者 Rudolf Bayer 1972 年最初叫 "symmetric binary B-tree"(对称二叉 B 树),后来 Leonidas Guibas 和 Robert Sedgewick 在 1978 年用"红黑"两色重新表述,因为红色和黑色打印机容易呈现。名字就流传下来了。

**疑问二:红黑树的本质是 2-3-4 树?**

**是的**。红黑树可以看作 2-3-4 树(4 阶 B 树)的二叉表示:一个"红节点 + 它的黑父节点"等价于 2-3-4 树的一个节点。这个视角非常深刻,帮助理解为什么红黑树的规则是这样的——**它实际上是 B 树的二叉编码**。

**疑问三:红黑树和跳表(Skip List)哪个更好?**

跳表是概率性结构,期望 O(log n),代码实现比红黑树**简单得多**。Redis 使用跳表而不是红黑树,因为实现简单、对缓存更友好。但红黑树**最坏也是 O(log n)**(跳表是期望),在对最坏情况敏感的场景(操作系统、数据库)更可靠。

---

### 十一、思考题(请作答)

第一题,下面这棵"树"是否是合法的红黑树?如果不是,指出违反了哪条性质:

```
         10(黑)
        /      \
      5(红)   20(黑)
      /          \
    3(红)       30(红)
```

第二题,一棵红黑树有 7 个内部节点,**高度最多是多少、最少是多少**?请手画出这两种极端情况的树。

第三题,依次向空红黑树插入 `{1, 2, 3, 4, 5}`,**每一步画出树的形态**,标注每次触发的是哪种修复情况(情况 1 / 情况 2 / 情况 3)。

第四题,证明:红黑树中,**从根到任意叶子的路径上,红色节点数不超过路径总长度的一半**。(提示:性质四说的是红红不连续,那么一条路径上红色节点怎么分布?)

第五题,为什么新插入的节点**必须染红而不是染黑**?用性质五来解释。

第六题,**红黑树和 AVL,哪个的插入旋转次数更少?哪个的删除旋转次数更少?** 请用数据回答(给出具体的最多次数)。
