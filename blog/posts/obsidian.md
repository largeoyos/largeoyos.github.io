# markdown语言
- \# 加标题 最多六级 
-  \*\*什么东西 \*\* 有加粗之效
 - \*什么东西\*有斜体之效
- \> blockquote 引用块
- ---加标签
-  ————————————分割线
- 有序列表
1. 远
2. 冷
3. 董
- \- 无序列表
	- 小满
	- 大橘
	- 如意
- \`code\`  
- 
```
#include<stdio.h>
int main(){
	printf(“Hello, world!\n”);
	return 0;
}
```

- \`\`\`
  代码块
  \`\`\`
- 链接\[title]\(https://www.example.com)
- 图片 !\[alt text](image.jpg)
- table: 

|tabelhead1|tablehead2|tablehead3|
|—————-|——————|——————-|

- 脚注Here's a sentence with a footnote
- [^1]

- [^1]:This is the footnote;
- 标题编号
- ### My Great Heading {#2}
- 定义列表
- 删除线
- \~~得到的~~
- \~~~ 这是啥
- 任务列表 
- - [ ] Write
# 教程第二弹
## 标题语法
	Markdown语法          HTML
	# Heading level 1    <h1>Heading level 1</h1>
	最多六级标题
	可以用在文本下方添加任意数量====来标识一级标题
						   ----来标识二级标题
## 段落语法
	Markdown语法                       HTML
	用空白行将一行或多行文本分割        <p>....</p>
	注意不要缩进段落        
			
	xxxxx.
			

## 换行语法
	Markdown语法                            HTML
	一行末尾添加两个或多个空格然后回车     <p>....<br>....</p>
## 强调语法
### 粗体
	Markdown语法                HTML
	**....**              <strong>...</strong>
	__....__
	.....**...**** 
### 斜体
	Markdown语法               HTML
	*...                    <em>...</em>
	_...
	...*...*....
### 又粗又斜
	Markdown语法                HTML
	***....***             <strong><em>....</em></strong>
	___.....___
	__*....*__
	**_...._**
	...***..***...
	
## 引用语法
	>.....
	或是
	>.....
	>
	>.....

> Dorothy followed her through many of the beautiful rooms in her castle.

> Dorothy followed her through many of the beautiful rooms in her castle.
> 
> The Witch bade her clean the pots and kettles and sweep the floor and keep the fire fed with wood. 
### 嵌套块引用
	 >....
	 >
	 >>....

> Dorothy followed her through many of the beautiful rooms in her castle.
> 
>> The Witch bade her clean the pots and kettles and sweep the floor and keep the fire fed with wood.
### 带有其它元素的块引用
```
> #### The quarterly results look great!
>
> - Revenue was off the chart.
> - Profits were higher than ever.
>
>  *Everything* is going according to **plan**.
```

> #### The quarterly results look great!
>
> - Revenue was off the chart.
> - Profits were higher than ever.
>
>  *Everything* is going according to **plan**.

## 列表语法
### 有序列表
	Markdown语法                HTML
	1. first item         <ol>
	2. second item        <li>First item</li>
	3. third item         <li>Second item</li>
						</ol>
### 无序列表
	Markdown语法                HTML
	- first item              <ul>
	- second item             <li>first item</li> 
	- third item              <li>second item</li>
						    </ul>
代码块在列表中要八个空格或两个制表符
段落在代码中要缩进四个空格或一个制表符
引用快也是缩进四个空格或一个制表符
图片缩进四个空格或一个制表符
列表也是多缩进四个空格或一个制表符
## 代码语法
	Markdown语法                HTML
	`...`                     <code>....</code>
	遇到代码中有`的,用``...`...`...``
### 代码块
	四个空格或一个制表符
## 分割线语法
	
	***
	
	---
	
	___
	
	最好在分割线的前后均添加空白行

***
---
___
## 链接语法
	[超链接显示名](超链接地址 "title名字")
	title名字:鼠标悬停在上面会出现的文字

 [Markdown语法](https://markdown.com.cn "最好的markdown教程")。
 
 ### 网址 email地址
	<https://markdown.com.cn>
	<fake@example.com>

<https://markdown.com.cn>
<liuguangyi@mail.ustc.edu.cn>

### 带格式化的链接
	强调链接,在链接语法前后增加星号.
	将链接表示为代码 ,在方括号中添加反引号
	I love supporting the **[EFF](https://eff.org)**.
	This is the *[Markdown Guide](https://www.markdownguide.org)*.
	See the section on [`code`](#code).

I love supporting the **[EFF](https://eff.org)**.
This is the *[Markdown Guide](https://www.markdownguide.org)*.
See the section on [`code`](#code).
### 引用类型链接
#### 第一部分
	[hobbit-hole][1]
	第一组方括号包围应显示为链接的文本
	第二组括号显示了一个标签,指向存储在文档其他位置的链接
[hobbit-hole][1]

#### 第二部分
	[label]: URL "可选标题"
	放在括号中的标签,紧跟冒号和至少一个空格
	URL可以选择括在尖括号中
	链接的可选标题可以括在"" '' ()中
[1]: https://en.wikipedia.org/wiki/Hobbit#Lifestyle

## 图片语法
	![tupianalt](图片链接 “图片title”)
- 图片也可以利用html标签来写
```
<p align="center">
  <img src="./云台实物.png" width="550"/>
</p>
<p align="center">
  <em>图 1: 云台机械图纸</em>
</p>
```

