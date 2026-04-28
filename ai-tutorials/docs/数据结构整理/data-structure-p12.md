# 数据结构复习:二叉搜索树 BST

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