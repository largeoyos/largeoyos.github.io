# freeCodeCamp
### 1. h1元素
- HTML 由元素组成。 你将使用的第一个元素是 `h1` 元素：
```html
<h1>Welcome to freeCodeCamp</h1>
```
- 它以一个开始标签（`<h1>`）开始，以一个结束标签（`</h1>`）结束，中间是它将显示的文本。
- 在你的 `Welcome to freeCodeCamp` 文本前面添加一个开始标签，后面添加一个结束标签，将其转化为一个 `h1` 元素。
### 2. h2元素
- `h1` 元素是网页的主标题，每个页面你应该只使用一个。`h2` 元素表现子标题。每个页面可以有多个，它们看起来像这样：
```html
<h2>This is a subheading.</h2>
```
- HTML 中有六个标题元素： `h1` 到 `h6`。 它们用于表明网页各部分的重要性，其中 `h1` 最为重要，而 `h6` 则最为次要。
### 3. p元素
```html
<p>This is a paragraph element.</p>
```

### 4. 空元素
```html
<img>
```
- 注意，这个图像元素没有结束标签，也没有任何内容。 空元素不能有任何内容，只有一个开始标签。
- 有时你会看到使用 `/` 放在 `>` 之前的空元素，如下所示：

```html
<img />
```

- 许多代码格式化工具（如 Prettier）会选择在空元素中包含 `/`，HTML 规范指出，`/` 的存在 "并不标志着开始标记是自闭合的，而且是不必要的，没有任何影响"。
- 在实际开发中，这两种形式你都会见到，因此熟悉它们非常重要。
## 5.图像元素
- 如果你要显示图像，则需要在图像元素中包含几个属性。这是一个带有 `src` 属性的图像元素示例

```html
<img src="https://cdn.freecodecamp.org/curriculum/cat-photo-app/running-cats.jpg" />
```

- `src` 属性用于指定图像的位置。 对于图像元素，包含另一个名为 `alt` 的属性是一种好的实践。 `alt` 属性用于为图像提供简短的描述性文本。

- 这是一个带有 `src` 和 `alt` 属性的图像元素示例。尝试通过将 `src` 值更新为 `"https://.freecodecamp.org/curriculum/cat-photo-app/cats.jpg"` 来破坏图像。你将看到图像消失，只显示 `alt` 文本。

```html
<img src="https://cdn.freecodecamp.org/curriculum/cat-photo-app/cats.jpg" alt="Two tabby kittens sleeping together on a couch." />
```
## 6. 属性
- 属性是放置在 HTML 元素**开始标签内**的一个值。 属性提供元素的附加信息，或指定元素的行为方式。 以下是属性的基本语法：
```html
<element attribute="value"></element>
```
- a元素: 锚点anchor
```html
<a href="https://www.freecodecamp.org/news/" target="_blank">Visit freeCodeCamp</a>
```
- 第一个示例使用了 `href` 和 `target` 属性。`href` 属性指定链接的 URL，`target` 属性指定打开链接的位置。
- 将 `href="https://www.freecodecamp.org/news/"` 更改为 `href="https://www.freecodecamp.org"`。现在，当你点击交互式编辑器中的链接时，你将在新的浏览器标签页中看到 freeCodeCamp 主页。
- 如果没有 `href` 属性，链接将无法工作，因为没有目标 URL。所以你必须包含这个 `href` 属性以使链接生效。`target="_blank"` 启用链接在新的浏览器标签（页）中打开。
- 其他常见的属性有 `src` 和 `alt`，或备选属性——分别用于指定图像的来源和为图像提供备选描述性文本。
```html
<input type="checkbox" checked />
```
- 在上面的示例中，有一个 `type` 属性设置为 `checkbox` 的 `input` 元素。 输入用于从用户处收集数据，`type` 属性指定了输入的类型。 在本例中，该输入是一个复选框。 You will learn more about how inputs work in the upcoming lessons.
- `checked` 属性用于指定默认选中的复选框。 `checked` 属性不需要值。 如果它存在，则默认选中该复选框。 如果它不存在，复选框将被取消选中。 这被称为布尔属性。 在学习 JavaScript 部分时，你将学习更多有关布尔的知识。
- 在 HTML 中会遇到几种常见的布尔属性，例如 `disabled`、`readonly` 和 `required`。 这些属性用于指定元素的状态，如禁用、只读或必填。
- 这是一个默认被禁用的文本 `input` 元素示例。现在从 `input` 元素中移除 `disabled` 属性，你将看到该 `input` 不再默认被禁用。你现在应该能够点击它并在字段内输入内容。
```html
<input type="text" disabled>
```
## 7.link元素
- `link` 元素用于链接样式表和网站图标等外部资源。 以下是为外部 CSS 文件使用 `link` 元素的基本语法：
```html
<link rel="stylesheet" href="./styles.css" />
```
- `rel` 属性用于指定链接资源与 HTML 文档之间的关系。 在这种情况下，我们需要指定该链接资源为 `stylesheet`。
- 将 HTML 和 CSS 分置于不同的文件中被视为最佳实践。 开发人员将使用 `link` 元素来链接外部 CSS 文件，而不是在 HTML 文档中编写所有内容。
- `href` 属性用于指定外部资源 URL 的位置。
- 示例中的 `dot` 后跟一个斜杠，是告诉计算机在当前文件夹或目录中查找 `styles.css` 文件。
- `link` 元素应放在 `head` 元素内，如下例所示：
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Examples of the link element</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
```
- 通常情况下，你会在专业代码库中看到多个 `link` 元素，它们链接到不同的样式表、字体和图标。 下面是一个使用 `link` 元素链接到外部 Google 字体 _Playwright Cuba_ 的示例：
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Playwrite+CU:wght@100..400&display=swap"
  rel="stylesheet"
/>
```
- Google 字体是一套免费的开源自定义字体，你可以在任何项目中使用。 你可以选择要使用的字体，Google 会为你提供必要的 HTML 和 CSS 代码。 在这个示例中，`rel` 属性的 `preconnect` 值告诉浏览器，要与 `href` 属性中指定的值提前建立连接。 这样做是为了加快这些外部资源的加载时间。

- `link` 元素的另一个常见用例是链接到图标。 下面是一个链接到 favicon 的示例：
```html
<link rel="icon" href="favicon.ico" />
```
- favicon 是 favorite icon（收藏夹图标）的缩写，通常是在浏览器标签（页）中显示在网站标题旁边的小图标。许多网站会使用 favicon 来显示他们的品牌图标。
## 8. HTML 模板
-  HTML 模板就像一个现成的网页模板。模板包括每个 HTML 文档所需的基本结构和重要元素。 它可以节省你的时间，并有助于确保你的页面设置正确。 这是一个示例：
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
       name="viewport"
       content="width=device-width, initial-scale=1.0" />
    <title>freeCodeCamp</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
  </body>
</html>
```
- 让我们来分析一下这个模板的关键部分。 首先，是 `DOCTYPE` 声明：
```html
<!DOCTYPE html>
```
- 它会告诉浏览器你使用的 HTML 版本。 接下来，是 `html` 标签：
```html
<!DOCTYPE html>
<html lang="en">
  <!--All other elements go inside here-->
</html>
```
- 这包括你所有的内容，并可指定页面语言。 在 `html` 标记内，你会发现两个主要部分——一个 `head` 和一个 `body`：
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!--Important metadata goes here-->
  </head>
  <body>
    <!--Headings, paragraphs, images, etc. go inside here-->
  </body>
</html>
```
- `head` 部分包含重要的幕后信息：
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Document Title Goes Here</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
```
- 网站的元数据，包含在 `meta` 元素中，其中包含字符编码等详细信息，以及 Twitter 等网站应如何预览你的页面链接。 你网站的标题，可在 `title` 元素中找到，它决定了显示在浏览器标签页或窗口中的文本。 最后，你通常会在 `head` 部分使用 `link` 元素链接页面的外部样式表。
- `body` 部分是放置所有内容的地方：
```html
<body>
  <h1>I am a main title</h1>
  <p>Example paragraph text</p>
</body>
```
## 9.UTF-8 字符编码
- UTF-8，或 UCS 转换格式 8，是一种在网络上广泛使用的标准化字符编码。 字符编码是计算机将字符存储为数据的方法。 从本质上讲，网页上的所有文本都是以一个或多个字节形式存储的字符序列。 在计算中，字节是由 8 位或二进制数字组成的数据单位。 UTF-8 支持 Unicode 字符集中的所有字符，包括所有书写系统、语言和技术符号中的字符和符号。 下面是使用带有将字符编码设置为 `UTF-8` 的 `charset` 属性的 `meta` 元素的示例：
```html
<meta charset="UTF-8" />
```
- 通过将字符编码设置为 UTF-8，可确保页面上正确显示重音 `"e"` 字符（`é`）。 下面是使用 UTF-8 字符编码的扩展代码示例：
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Examples of the UTF-8 encoding</title>
  </head>
  <body>
    <p>Café</p>
  </body>
</html>
```
- 对于创建的每个新项目，你都应包含将 `charset` 属性设置为 `UTF-8` 的 `meta` 元素。
## 10. 注释
```HTML
<!--`, contains any number of lines of text, and ends with `-->
```
## 11. main元素
- HTML5 有一些元素能够标识不同的内容区域。 这些元素能让你的 HTML 易于阅读，并有助于搜索引擎优化（SEO）和无障碍。
- `main` 元素用于表示 HTML 文档正文的主要内容。 `main` 元素里的内容应该是文档中唯一的，不应该在文档的其他部分重复。
```html
<main>
  <h1>Most important content of the document</h1>
  <p>Some more important content...</p>
</main>
```
- 通过在 `h1` 元素前添加 `<main>` 开始标签，并在 `p` 元素后添加 `</main>` 结束标签，来识别此页面的主要部分。
## 12.ul元素
- 要创建一个无序项目列表，你可以使用 `ul` 元素。
- `li` 元素用于在有序或无序列表中创建列表项。
- 这是一个无序列表中列表项的示例：
```html
<ul>
  <li>milk</li>
  <li>cheese</li>
</ul>
```
## 13.figure元素
- `figure` 元素代表自包含的内容，允许你将图像与标题相关联。
- 图题（`figcaption`）元素用于添加标题来描述 `figure` 元素中包含的图像。
- 这是一个标题为 `A cute cat` 的 `figcaption` 的元素示例：
```html
<figure>
  <img src="image.jpg" alt="A description of the image">
  <figcaption>A cute cat</figcaption>
</figure>
```
- 要强调一个特定的单词或短语，你可以使用 `em` 元素。
- 通过将 `figcaption` 元素中的单词包裹在强调 `em` 元素中来强调它。
## 14.ol元素
- 有序列表（`ol`）的代码类似于无序列表，但有序列表中的列表项在显示时是编号的。
## 15.em元素斜体,strong元素加粗

## 16.footer元素
- `footer` 元素用于定义文档或章节的页脚。 页脚通常包含文档作者信息、版权数据、使用条款链接、联系信息等。
## 17.Div 元素
- `div` 元素用作容器以分组其他元素。
- 这是一个 `div` 元素的示例。为你的 `div` 元素添加另一个段落元素，并在预览窗口中查看更改。

```html
<div>
  <p>Example paragraph element.</p>
</div>
```

- 当你想要将一组`将共享一组 CSS 样式的`超文本标记语言元素分组时，你主要会使用 `div` 元素。你将在后续的课程和研讨会中学习更多关于 CSS 的内容。
- 尽管 `div` 元素在实际代码库中常被使用，你应当小心不要过度使用它。有些时候，使用其他元素会更合适。
- 例如，如果你想将内容划分为多个部分，那么使用 `section` 元素比使用 `div` 元素更合适。
- 在第一个 `section` 元素下方添加另一个 `section` 元素。然后在该 `section` 元素内添加 `h2` 和 `p` 元素。你可以使用任何你喜欢的文本，并且你将在预览窗口中看到更改。
```html
<section>
  <h2>Mammals</h2>
  <p>
    Mammals are warm-blooded animals with fur or hair. Most give birth to live
    young.
  </p>
  <ul>
    <li>Lion</li>
    <li>Elephant</li>
    <li>Dolphin</li>
  </ul>
</section>
```
- `section`元素相比`div`元素没有语义而言有语义。语义是语言中单词或短语的含义。 HTML 是一种语言，元素也有自己的语义含义。 因此，这意味着如果你使用了 `section` 元素， 浏览器将获取其语义含义并理解应将其视为一个独立部分——无论是在台式机上、移动设备上，还是其他任何设备上。
## 18.ID 和类
- `id` 属性为 HTML 元素添加唯一标识符。
- 这是一个带有 `id` 为 `title` 的 `h1` 元素示例。
- 在 `h1` 元素下方，添加一个 `h2` 元素，其 `id` 设置为 `"subtitle"`。你可以为 `h2` 编写任意文本，并且你将在预览窗口中看到更改。
```html
<h1 id="title">Movie Review Page</h1>

```
- 你可以在你的 JavaScript 或 CSS 中引用 `title` 的 `id` 名称。以下是一个 CSS 示例，引用 `title` 的 `id` 来将文本 `color` 更改为 `red`。
- **注意**：在此交互示例中已为你提供了一些 CSS。不要担心尝试理解这些 CSS 代码，因为你将在后续课程中学习更多相关内容。但如果你想看到文本颜色变为蓝色，点击 `styles.css` 标签（页），并将 `color: red;` 改为 `color: blue;`。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
       name="viewport"
       content="width=device-width, initial-scale=1.0" />
    <title>Review page Example</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <h1 id="title">Movie Review Page</h1>
  </body>
</html>
```

```css
#title {
  color: red;
}
```
- 在 `title`之前的`#`,告诉计算你你想指向一个拥有对应`id`的值. `id`值不能重复. 关于 `id` 值的另一个需要注意的事情是它们不能有空格。 这是一个是将单词 `main` 和 `heading` 应用于一个 `id` 属性值的示例：
```html
<h1 id="main heading">Main heading</h1>
```
- 浏览器会将此空格视为 `id` 的一部分，这将在样式和脚本处理中导致不必要的问题。`id` 属性值应仅包含字母、数字、下划线和破折号。
- 与 `id` 属性不同，`class` 属性值不需要唯一，可以包含空格。
- 这是一个将名为 `box` 的类应用到 `div` 元素的示例。
```html
<div class="box"></div>
```
- 如果你想为一个元素添加多个类名，可以通过空格分隔这些名称来实现。下面是一个将多个类应用到 `div` 元素的更新示例。
```html
<div class="box red-box"></div>
```
- 这是为多个 `div` 元素应用多个类的另一个示例。
- **注意**：在此交互示例中已为你提供了一些 CSS。不要担心尝试理解 CSS 代码，因为你将在后续课程中学习更多相关内容。点击 `styles.css` 标签（页），并将 `background-color: red;` 改为 `background-color: black;`。
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
       name="viewport"
       content="width=device-width, initial-scale=1.0" />
    <title>Colored boxes example</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div class="box red-box"></div>
    <div class="box blue-box"></div>
    <div class="box red-box"></div>
    <div class="box blue-box"></div>
  </body>
</html>
```

```css
.box {
  width: 100px;
  height: 100px;
}

.red-box {
  background-color: red;
}

.blue-box {
  background-color: blue;
}
```

那么，回顾一下，你什么时候应该使用 `id` 而不是 `class`？ 当你希望将一组样式应用于许多元素时，最好使用类。 如果要针对特定的元素，最好使用 `id`，因为这些值需要是唯一的。

## 19.HTML 实体
- HTML 实体或字符引用是用于表示 HTML 中保留字符的一组字符。
- 假设你想在屏幕上显示文本 `This is an <img/> element`。如果你使用当前编辑器中的代码，它不会显示预期的结果。即使你为示例添加了 `src` 和 `alt` 属性，它也会在段落中间显示一张图像，而不是预期的结果。
```html
<p>This is an <img /> element</p>
```
- 当超文本标记语言解析器看到小于号（`<`）符号后跟一个超文本标记语言标签名称时，它会将其解释为一个超文本标记语言元素。这就是为什么你在屏幕上没有得到期望的 `This is an <img/> element` 结果。
- 为了解决此问题，你可以使用超文本标记语言实体。以下是使用正确的超文本标记语言实体表示小于（`<`）和大于（`>`）符号的更新示例。现在你应该在屏幕上看到 `This is an <img/> element`。
```html
<p>This is an &lt;img /&gt; element</p>
```
- `&lt;`代表`<` 
- `&gt;`代表`>`
- 这些类型的字符引用被称为命名字符引用。 命名字符引用用(`&`)开头,用(`;`)结尾. 通过使用命名字符引用，HTML 解析器不会将其与实际的 HTML 元素混淆。
- 另一种类型的字符引用是十进制数字引用。 这个字符引用以一个与号和哈希符号（`#`）开头，后面跟一个或多个十进制数字，后面跟一个分号。
- 下面是使用小于符号的十进制数字引用的示例。
启用交互式编辑器并更改代码以查看不同的符号。你可以使用 `&#169;` 表示版权符号，©使用 `&#174;` 表示注册商标符号。® &#60; 表示<
- 最后一种类型的字符引用是十六进制数字引用。 这个字符引用以一个与号、哈希符号和字母 `x` 开头。 然后，后面跟一个或多个 ASCII 十六进制数字，并以分号结束。
- 这是使用小于符号的十六进制数字引用的示例。
- 启用交互式编辑器并更改代码以查看不同的符号。你可以使用 `&#x20AC;` 表示欧元符号€，使用 `&#x03A9;` 表示希腊大写字母欧米茄符号Ω。&#x3C; <
- &amp;是&的转义字符
## 20. Script元素
- 下面是一个在超文本标记语言文档中使用 `script` 元素的示例
```html
<body>
  <script>
    // alert("Welcome to freeCodeCamp");
  </script>
</body>
```
- 虽然从技术上讲，你可以在 `script` 标签中编写所有 JavaScript 代码，但最佳实践是链接到外部 JavaScript 文件。 这是一个使用 `script` 元素链接到外部 JavaScript 文件的例子：
```html
<script src="path-to-javascript-file.js"></script>
```
- `src`标签被用于确定外部JavaScript文件的地址. 不鼓励将所有 JavaScript 放在 HTML 文档中的原因是关注点分离。 关注点分离是一种设计原则，将程序分成不同的部分，每个部分处理一个单独的关注点。 在这种情况下，我们希望将 JavaScript 代码与 HTML 代码分开。
## 21.
## 22.
## 23.
## 24.
## 25.
