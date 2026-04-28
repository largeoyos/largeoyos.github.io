# 数据结构复习:平衡二叉树 AVL

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

**LL 型**:新节点插在 A 的**左**孩子的**左**子树中 → 用**右单旋**修复。

**RR 型**:新节点插在 A 的**右**孩子的**右**子树中 → 用**左单旋**修复。

**LR 型**:新节点插在 A 的**左**孩子的**右**子树中 → 先左旋再右旋(双旋)。

**RL 型**:新节点插在 A 的**右**孩子的**左**子树中 → 先右旋再左旋(双旋)。

**记忆法**:**型号名称描述的是"失衡路径方向"**,旋转方向**与路径方向相反**。LL 失衡用"右"旋,RR 失衡用"左"旋。

---

#### 3.1 LL 型 → 右单旋

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

#### 3.2 RR 型 → 左单旋

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
|+2|插入在**左孩子**的**左**子树|LL|右单旋|
|+2|插入在**左孩子**的**右**子树|LR|左右双旋|
|-2|插入在**右孩子**的**右**子树|RR|左单旋|
|-2|插入在**右孩子**的**左**子树|RL|右左双旋|

**在代码中怎么判断"路径方向"?** 看 A 的那个"过高"子节点 B 的 BF:

如果 A.BF = +2,看 B = A->lchild:若 B.BF ≥ 0(多半是 +1),属 LL;若 B.BF < 0(多半是 -1),属 LR。

如果 A.BF = -2,看 B = A->rchild:若 B.BF ≤ 0(多半是 -1),属 RR;若 B.BF > 0(多半是 +1),属 RL。

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

第二,判断 LL/LR 时靠 `key < T->lchild->data` vs `key > T->lchild->data`——因为 key 走的方向决定了插入位置在左孩子的左边还是右边。这是**代码上最简洁的判断方式**,比计算子节点的 BF 更直接。

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

**LL 型**(2 是 3 的左孩子,1 是 2 的左孩子),对 3 右单旋:

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

根 2 失衡,**RR 型**(3 是 2 的右,4 是 3 的右),对 2 左单旋——但等一下,这里**最小失衡子树**是谁?从新插入节点 5 往上找,第一个失衡的是**根 2**。对 2 左单旋:

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

最小失衡在节点 4,**RR 型**,对 4 左单旋:

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

最小失衡在根 3。类型?从根看:右孩子 5 的右孩子 6 的右孩子 7 方向——**RR 型**,对 3 左单旋:

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

让我重新仔细画一下。对 6 为根做 RL 旋转:6 的右孩子是 7,7 的左孩子是?原本 7 没有左孩子,插入 15 后 15 成为 16 的左孩子,16 是 7 的右孩子。**让我重新审视——其实失衡路径是:6 → 右孩子 7 → 右孩子 16 → 左孩子 15,这是 RR-L 路径,而不是标准 RL。**

嗯等等,让我停下来仔细想。失衡发生时,**关键看"失衡节点到新插入节点的前两步方向"**。从 6 出发:第一步往右到 7,第二步……15 是 16 的左孩子,16 是 7 的右孩子,所以从 7 开始是 7→右→左。**第二步是"右"**。所以 **6 → 右 → 右**,是 **RR 型**,对 6 做左单旋。

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

最小失衡在 16。16 → 左 15 → 左 14,**LL 型**,对 16 右单旋:

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

判断旋转类型的方法与插入类似,但要注意:删除导致的失衡,失衡节点的"另一侧"是"高的一侧"。例如从左子树删节点导致 BF=-2,就看右孩子的 BF:若右孩子 BF ≤ 0(-1 或 0)→ RR 型;若右孩子 BF = +1 → RL 型。

**考研一般以插入为主,删除偶尔考**,我们暂不展开代码,先把插入吃透。

---

### 十二、易错点总结

**第一个易错点**:LL 型用**右旋**,RR 型用**左旋**。很多同学一开始会搞反——**记住方向相反**即可:失衡歪向哪边,就往反方向扳回来。

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