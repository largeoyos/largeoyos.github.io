# 常用命令
- 可以通过:man 指令名 来⾃⾏了解指令语法
#### 1.nano
	nano  hello.c
		完成程序
		Ctrl+O保存
		Enter确认文件名
		Ctrl+X退出nano
	gcc hello.c -o hello 编译
	./hello运行
#### 2.文件目录篇
- 以根⽬录算起的绝对路径以 /开头，以家⽬录算起的绝对路径以 ~开头，相对路径不需要 /或 ～开头。
- 举例：⼀个名为ustc的⽤⼾在他的家⽬录下创建了⼀个名为os的⽬录，在os⽬录下⾯⼜创建了⼀个名为lab1的⽬录，则该lab1⽬录可以表⽰为：
	/home/ustc/os/lab1
	~/os/lab1
- 如果⼯作⽬录在家⽬录：os/lab1
- 如果⼯作⽬录在os⽬录：lab1
- **ls** \[参数] \[name]
	- ls / 列出所有根目录
	- ls \*.txt 列出所有txt文件
	- 参数
		- -a 显示所有文件及目录
		- -d 只列出目录
		- -l 长格式,详细解释后面有
		- -r 逆序排序
		- -t
		- -A
		- -F
		- -R 递归处理，显示所有目录及子文件
		- -la等价于 ll

	ls- lh: (h让total下的数据变成k,m等易于读的大小)
	```
	total 4.0K
	-rw-rw-r-- 1 largeoyos largeoyos 9 Mar  4 16:59 readme.txt
	-rw-rw-r-- 1 largeoyos largeoyos 0 Mar  4 16:55 study.txt
	
	```
	- 文件类型:
		- 普通文件:文本文件：ASCII码形式存储，以-开头，如：
		 -rw-r--r--1 root root 39599 Mar 8 12:15 x.sh
		- 目录文件：以d开头，如：
		 drwxr-xr-x 2 root root 4096 Aug 2 2006 bin
		 - 设备文件 : 块设备文件：以b开头( 硬盘（HDD）固态硬盘（SSD）U盘 SD 卡)
			brw-rw----1 root disk 3, 1 Jan 30 2003 /dev/hda1
				字符设备文件：以c开头 (键盘 鼠标 串口（UART）控制台（TTY）打印机。)
			crw-------1 root root 4, 1 Jul 31 13:49 /dev/tty1
		- 链接文件: 存放文件系统通向文件的路径，以l开头
- 文件权限
	- **`-rw-rw-r--` (权限控制)**：
		- 第一个字符 `-` 表示这是一个**普通文件**（如果是 `d` 则表示目录）。
		- 后面的字符三个一组：`rw-` (你)、`rw-` (你所在的组)、`r--` (其他人)。
		- `r`=读取，`w`=写入，`-`=没权限。
	- **`1` (链接数)**：
		- 表示有多少个文件名指向这个数据块。
	- **`largeoyos` (所有者)**：
		- 表示这个文件属于你（你的用户名）。
	- **`largeoyos` (所属组)**：
		- 表示这个文件属于哪个用户组。


| **权限 (-rw-rw-r--)** | **链接数** | **所有者**       | **组**         | **大小** | **修改时间**        | **文件名**        |
| ------------------- | ------- | ------------- | ------------- | ------ | --------------- | -------------- |
| **文件类型与权限**         | **1**   | **largeoyos** | **largeoyos** | **0**  | **Mar 4 16:54** | **readme.txt** |

- **pwd** \[--help] \[--version]
	- pwd 查看当前所在目录
- **cd** 切换工作目录
	- cd .. 返回上一级目录
	- cd - 返回上一次所在目录
	- cd ../../../ 回退三级
- **mkdir** 创建新目录
	- mkdir 
		-p folder/test (folder目录下建立test文件夹,加了-p参数后,若folder不存在则直接新建)
		-m 设置目录权限 :mkdir -m 700 3
			常见的权限组合表
			read:4; write:2;execute:1;

| **数字**  | **权限位**     | **含义**                         |
| ------- | ----------- | ------------------------------ |
| **777** | `rwxrwxrwx` | 所有人都能干任何事（很不安全！）               |
| **755** | `rwxr-xr-x` | 我全能干，别人只能看和进（程序的默认权限）          |
| **644** | `rw-r--r--` | 我能读写，别人只能看（普通文件的默认权限）          |
| **600** | `rw-------` | 只有我能读写（**你的 .pem 密钥文件就该设成这样**） |
- **rmdir** 删除空目录 -p 当子目录被删除后使他成为空目录的话则一并删除
- rm 删除一个文件或目录 rm \[-rf] name
	 -i 删除前逐一询问确认。
	 -f 即使原档案属性设为唯读，亦直接删除，无需逐一确认。
	 -r 将目录及以下之档案亦逐一删除。
	 删除当前目录下的所有文件及目录，命令行为：
		rm  -r  *
- cp复制文件或目录  cp \[-r] source dest
	 `-r` 或 `-R`：递归复制目录及其内容（用于复制目录）。    
	 `-i`：交互模式，覆盖前提示用户确认。
	 `-f`：强制复制，覆盖目标文件而不提示。    
	 `-v`：显示详细的复制过程（verbose）。
	 `-p`：保留文件的原始属性（如权限、时间戳等）。 
	 `-a`：归档模式，等同于 `-dpR`，保留所有文件属性和递归复制目录。
	 `-u`：仅当源文件比目标文件新时才复制（更新模式）。    
	 `-l`：创建硬链接而不是复制文件。
	 `-s`：创建符号链接（软链接）而不是复制文件。

- **mv** 移动或重命名文件或目录  mv source dest
	-i：覆盖现存文件时提示，建议打开此选项，避免误操作覆盖掉目标文件
	-f：不提示直接覆盖存在的目标文件
	**-n**: 不要覆盖任何已存在的文件或目录。
	**-u**：当源文件比目标文件新或者目标文件不存在时，才执行移动操作。
	**-b**: 当目标文件或目录存在时，在执行覆盖前，会为其创建一个备份。
- **chmod** 改变文件或目录的权限
	MODE模式：
		u：文件所属帐户
		g：文件所属组
		o：不同组的帐户
		a：所有帐户
		+：添加权限
		-：去除权限
		=：使得指定文件只具有这些权限

		使文件file各用户都拥有完全权限： chmod 777 file
		允许所有人读file，但只有拥有者能改变它： chmod 644 file
		给所有人增加写权： chmod a+w file
		对组级和其他用户除去写权和读权： chmod o-wr,g-wr file
		建立其他用户的只读权： chmod o=r file
		注意控制权限，尽量不要给其他用户修改删除文件等权限
- ln :为某一个文件在另外一个位置建立一个同步的链接
	ln -s /目标文件夹的完整路径 /快捷方式存放的路径 
	-s 代表软连接
- lsblk 查看磁盘样貌
```
NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
loop0    7:0    0  73.9M  1 loop /snap/core22/2045
loop1    7:1    0     4K  1 loop /snap/bare/5
loop2    7:2    0 245.1M  1 loop /snap/firefox/6565
loop3    7:3    0 251.6M  1 loop /snap/firefox/7836
loop4    7:4    0  16.4M  1 loop /snap/firmware-updater/216
loop5    7:5    0   516M  1 loop /snap/gnome-42-2204/202
loop6    7:6    0  18.5M  1 loop /snap/firmware-updater/210
loop7    7:7    0  91.7M  1 loop /snap/gtk-common-themes/1535
loop8    7:8    0  10.8M  1 loop /snap/snap-store/1270
loop9    7:9    0  49.3M  1 loop /snap/snapd/24792
loop10   7:10   0  48.1M  1 loop /snap/snapd/25935
loop11   7:11   0   576K  1 loop /snap/snapd-desktop-integration/315
loop12   7:12   0   576K  1 loop /snap/snapd-desktop-integration/343
sda      8:0    0    60G  0 disk 
├─sda1   8:1    0     1M  0 part 
└─sda2   8:2    0    60G  0 part /
sr0     11:0    1   5.9G  0 rom  /media/largeoyos/Ubuntu 24.04.3 LTS amd64
```
- sda:物理磁盘
- sda1:用于引导系统
- 后面的依次叫sdb...
- RO:只读
- RM:可插拔
##### 根目录文件详解
```
bin                home               mnt   sbin.usr-is-merged  usr
bin.usr-is-merged  lib                opt   snap                var
boot               lib64              proc  srv
cdrom              lib.usr-is-merged  root  swap.img
dev                lost+found         run   sys
etc                media              sbin  tmp

```

###### 1. 核心居住区（你最常打交道的）

- **`/home`**：**这是你的私人领地。** 你的桌面、下载、文档全都存在这里。
- **`/root`**：**超级管理员的家。** 它是系统老大（root 用户）的私人房间。
- **`/tmp`**：**临时存放处。** 软件运行时产生的临时垃圾会扔在这里，通常系统重启后这里会被清空。
###### 2. 系统核心区（相当于大楼的配电室和承重墙）
- **`/bin` & `/sbin`**：**命令存放地。** `ls`, `cd`, `cp` 等基本命令就住在这里。带有 `s` 的（sbin）通常是给管理员用的高级命令。
- **`/etc`**：**配置中心。** 所有的系统设置文件（比如网络配置、软件选项）都放在这。**想改系统设置，通常就是改这里的某个文件。**
- **`/boot`**：**启动区。** 存放 Linux 内核和启动引导程序（GRUB）。没事别动它，动了系统可能就起不来了。
- **`/usr`**：**软件安装区。** 你以后安装的大部分用户级软件（像浏览器、播放器）的代码和数据都在这。
###### 3. 设备与硬件区（Linux 的“黑科技”）
- **`/dev`**：**设备文件夹。** 在 Linux 看来，“一切皆文件”。你的硬盘、鼠标、键盘在这里都被映射成一个文件。
- **`/media` & `/mnt`**：**外部设备挂载点。** 你插个 U 盘或者挂载第二个硬盘，它们的内容就会显示在这里。
- **`/proc` & `/sys`**：**虚拟文件夹。** 它们不占用硬盘空间，而是内存里运行状态的实时反馈。比如你想看 CPU 信息，其实就是在读这里的文件。
###### 4. 特殊文件
- **`swap.img`**：**虚拟内存文件。** 当你的物理内存不够用时，系统会把一部分硬盘当内存使。那个红叉是因为这个文件正在被系统锁定使用，普通人不能随便读写。

#### 3.文件控制
- **echo** 将文本输出到标准输出
	- echo "Hello World" 显示字符串
	- echo 内容>>test.txt 追加内容进test.txt
- **cat** 将文件内容输出到屏幕
- touch xxx.txt :新建txt文件
- vim xxx.txt :创建后同时用vim打开
#### 4.进程控制
- kill 
	 `-l`：列出所有可用的信号。
	 `-s`：发送特定的信号给目标进程，如 `-9` 表示发送 KILL 信号，即强制终止进程。
		常用的几个信号:
			`SIGKILL`（信号9）：立即结束进程，不能被捕获或忽略。
			`SIGTERM`（信号15）：正常结束进程，可以被捕获或忽略。
			`SIGSTOP`（信号19）：暂停进程，不能被捕获、忽略或结束。
			`SIGCONT`（信号18）：继续执行被暂停的进程。
			`SIGINT`（信号2）：通常是Ctrl+C产生的信号，可以被进程捕获或忽略。
		如kill -9 686
- ps :任务管理器
	`ps`: 显示**当前用户**在当前终端控制下的进程。考虑到用户通常想看不止当前用户和当前终端下的进程，所以不加参数的用法并不常用。
	`ps aux`: 展示所有用户所有进程的详细信息。注意，a前面带一个横线是严格意义上不正确的使用方法。
	`ps -ef`: 也是展示所有用户所有进程的详细信息。就输出结果而言和`ps aux`无甚差别。
- shutdown -h now: Close the service
- hostname: Check the name of the host
#### 5. 通配符和输出过滤
- ? 通配符 :代表一个字符
- \*通配符 :代表任意个字符
- \[n1-n2]通配符 : 指定查询范围，n1 n2代表任意数字或字母
	ls \[a-z]*

#### 6. 安装命令
##### apt
- **sudo apt update** 刷新电脑上的软件清单,看看有没有新版本的软件可以用
- sudo apt install xxx :安装xxx应用
- sudo apt remove xxx :卸载xxx应用
- sudo apt-get install xxx -y :不带进度条的安装,常用于脚本,以保证输出格式

- sudo software-properties-gtk 打开"软件与更新"程序
- **sudo apt install** open-vm-tools-desktop 安装VMware Tools 工具
- disk 或gparted是磁盘工具

##### wegt
- wget是一个在命令行下下载文件的工具。常见的使用方法是：`wget [-O FILE] URL`

- 例如，我们要下载 [https://git-scm.com/images/logo@2x.png](https://git-scm.com/images/logo@2x.png) 到本地。

	1. 直接下载：`wget https://git-scm.com/images/logo@2x.png`，文件名是[logo@2x.png](mailto:logo@2x.png)。
	2. 直接下载并重命名：`wget -O git.png https://git-scm.com/images/logo@2x.png`，文件名是git.png。注：-O中的O表示字母O而不是数字0。
- 注意，如果发现有同名文件，1所示方法会在文件名后面加上.1的后缀进行区分，而2所示方法会直接覆盖。
		wget -O ./personal_file/git.png https://git-scm.com/images/logo@2x.png 改变目录这样写

#### 7. 网络命令
- ping -c 4 192.168.119.1  
	-c 限制次数 4是次数
- ip add: Check the ip address
- curl ifconfig.me :查询公网ip
- curl -4 ifconfig.me :强制查询ipv4地址
```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host noprefixroute 
       valid_lft forever preferred_lft forever
2: eth0@if2919: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether bc:24:11:70:94:ab brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.31.55.232/16 brd 172.31.255.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 2001:da8:d800:4bfc:be24:11ff:fe70:94ab/64 scope global dynamic mngtmpaddr noprefixroute 
       valid_lft 86398sec preferred_lft 14398sec
    inet6 fe80::be24:11ff:fe70:94ab/64 scope link 
       valid_lft forever preferred_lft forever
```
###### 1. `lo` (Loopback / 回环网卡)
- 这是虚拟的“本地网卡”，专门用于机器**自己跟自己通信**。
	- **关键地址：** `127.0.0.1` (IPv4) 和 `::1` (IPv6)。
	- **用途：** 无论你是否插网线，这个网卡永远存在。当你运行 Nginx 并在服务器本机输入 `curl 127.0.0.1` 时，流量走的就是这个网卡。
	- **状态：** `UNKNOWN` 在这里是正常的。
###### 2. `eth0` (Ethernet / 以太网卡)
- 这是你的**主网卡**，负责服务器与外界（互联网或其他服务器）的通信。
	- **内网 IP 地址：** `172.31.55.232`
	    - 这是一个私有 IP。如果你的服务器在阿里云、腾讯云或校园网内，这是它在局域网里的身份。
	- **IPv6 地址：** `2001:da8:...`
	    - 这是一个公网 IPv6 地址。如果你的网络环境支持 IPv6，别人可以通过这个长地址直接访问你的 Nginx。
	- **MAC 地址：** `bc:24:11:70:94:ab`
	    - 这是网卡的物理硬件唯一标识。
	- **状态：** `UP` 表示网卡正在工作且已连接。
###### 3. 重点总结：哪个地址最有用？
- **如果你在服务器本机测试 Nginx**：请访问 `127.0.0.1`。
- **如果你在同一局域网的其他机器访问这台服务器**：请访问 `172.31.55.232`。
- **如果你想从外网（家里）访问这台服务器**：
    - 通常需要一个**公网 IP**（在云服务的管理后台可以看到，通常不直接显示在这个列表里，因为它是通过 NAT 映射的）。
    - 或者尝试使用那个以 `2001` 开头的 **IPv6 地址**（前提是你家里的网络也支持 IPv6）。
#### 8. 配置python环境
再次进入
source myenv/bin/activate
再次退出
deactivate
快速找回
find ~ -name "activate" -type f

#### 9.Nginx
- sudo apt install nginx 安装并且自动启动
- 本机用localhost进入,windows用 http://192.168.119.129

**练习服务管理：** 你可以学习如何开启、关闭、重启服务：
- 按下键盘上的 **`q`** 键即可回到命令行输入状态。

| **操作**            | **命令**                         |
| ----------------- | ------------------------------ |
| **启动**            | `sudo systemctl start nginx`   |
| **停止**            | `sudo systemctl stop nginx`    |
| **重启** (应用重大更改)   | `sudo systemctl restart nginx` |
| **重载** (无缝应用配置更改) | `sudo systemctl reload nginx`  |
| **开机自启**          | `sudo systemctl enable nginx`  |
| **检查状态**          | `sudo systemctl status nginx`  |
##### **查看端口占用：**
```
ss -tunlp | grep 80
```
这会告诉你 80 端口（HTTP 默认端口）是否被 Nginx 占用了。

tcp   LISTEN 0      511          0.0.0.0:80         0.0.0.0:*          
tcp   LISTEN 0      511             [::]:80            [::]:*   

###### 1. 命令在查什么？
- **`ss`**：查看系统的网络套接字（Sockets）统计信息。
- **`-tunlp`**：这是一个组合参数：
    - **`t`**: 显示 TCP 连接（网页浏览通常用 TCP）。
    - **`u`**: 显示 UDP 连接。
    - **`n`**: 直接显示端口号（如 80），而不是服务名（如 http）。
    - **`l`**: 只显示正在 **LISTEN（监听）** 的端口。
    - **`p`**: 显示是哪个程序在占用这个端口。
- **`| grep 80`**：在所有结果中过滤出包含 “80” 的行。
###### 2. 结果解读

| **结果内容**       | **含义**                                                             |
| -------------- | ------------------------------------------------------------------ |
| **0.0.0.0:80** | Nginx 正在监听 **IPv4** 的 80 端口。`0.0.0.0` 表示它接受来自**任何 IP**（本地和局域网）的访问。 |
| **[::]:80**    | Nginx 正在监听 **IPv6** 的 80 端口。                                       |
| **LISTEN**     | 状态正常。表示端口是开放的，随时可以处理请求。                                            |

##### 绕路方案：把 Nginx 换到 8080 端口
- 为了验证是不是 80 端口被封了，我们换个“高位端口”试试（高位端口通常不会被封）：
###### 第一步：修改 Nginx 配置文件
```
sudo vim /etc/nginx/sites-available/default
```
###### 第二步：将 80 改为 8080
Nginx
```
listen 80 default_server;
listen [::]:80 default_server;
```
改成：
```
listen 8080 default_server;
listen [::]:8080 default_server;
```
###### 第三步：重启 Nginx
```
sudo nginx -t                # 检查有没有写错
sudo systemctl restart nginx
```
###### 第四步：浏览器访问
在浏览器地址栏输入： `http://202.38.75.252:8080`

##### ssh连接
- ssh -i .\vlab-vm12825.pem -L 8888:localhost:8080 ubuntu@vlab.ustc.edu.cn
	建立远程连接
网站权限:把项目移到标准位置
- sudo cp -r /home/ubuntu/personal_file/LinuxLab/WebProg/var/www/my_site
- 为了自己还能修改网页,将自己加入该所有组
- 把你的个人账号（假设是 `ubuntu`）拉进 Nginx 的“工人群组”里
- sudo usermod -aG www-data ubuntu
- sudo chown -R ubuntu:www-data /var/www/my_site  (chown是更改所有组)
- 将 Nginx 的 `root` 改为 `/var/www/my_site`
- 最后，我们需要确保组员（Nginx）拥有“读”和“进入”的权限，而你拥有“写”的权限。
```
# 目录权限：775 (你：读写执；组：读写执；他人：读执)
find /var/www/my_site -type d -exec chmod 775 {} +

# 文件权限：664 (你：读写；组：读写；他人：读)
find /var/www/my_site -type f -exec chmod 664 {} +
```



#### 10 改变终端左侧的提示符
PS1="\u@\h:\w\$ :

PS1** 是 Linux 系统中一个非常重要的**环境变量**，它的全称是 **Prompt String 1**。它决定了你在终端输入命令时，左侧显示的那个**提示符（Prompt）**长什么样。

##### 1. 拆解这些“暗号”

- **`\u`** (User)：代表当前**登录的用户名**
- **`@`**：就是一个普通的字符“@”，用来连接用户名和主机名。
- **`\h`** (Hostname)：代表当前**计算机的名字**（主机名）。
- **`:`**：普通的冒号分隔符。
- **`\w`** (Working directory)：代表当前**所在的全路径目录**（如果是家目录，会显示成 `~`）。
- **`\$`**：这是一个智能符号。如果你是**普通用户**，它显示为 **`$`**；如果你切换成了 **root（超级管理员）**，它会自动变成 **`#`**。
- **空格**：最后的那个空格非常重要，它能让你的命令不紧贴着路径，看起来更清爽。

#### 11 终端快捷键
Tab 自动补全
Tab +Tab 给出所有候选项

Ctrl+Insert 复制
Shift+Insert 粘贴

#### 12 Tree(展示文件结构)
tree :以树状图显示文件结构
	tree -L 2 :限制层数
	tree -d :不显示具体文件,只看文件夹结构
	tree -a :显示隐藏文件
	tree -ph :显示权限 大小
	tree -P "\*.c|\*.h" :只显示.c/.h文件
	tree -I "node_modules" :排除掉特定的文件夹
	tree > project_structure.txt :重定向输出

#### 13 **`du`** (Disk Usage)
du:把每一个子目录的大小都列出来
	du -sh . :查看整个文件夹占据空间大小
	du -sh * :查看每个子文件夹大小
	du -sh * | sort -hr :查看并按大小排序
	du -h --max-depth=1 :查看所有一级子目录
#### 14 df
df -h :想看整个**硬盘分区**（比如系统盘、挂载盘）还剩多少空间

#### 15 feh
##### 1. 基本打开操作
```
feh image.jpg          # 打开单张图片
feh dir/               # 打开文件夹下所有图片（通过箭头键切换）
feh -F image.jpg       # 全屏打开
```
##### 2. 常用“骚操作”模式
- **缩略图模式 (`-t`)**：
    像文件管理器一样，弹出一个窗口展示目录下所有图片的预览图。
    ```
    feh -t ./personal_file/
    ```
- **蒙太奇拼图模式 (`-m`)**：
    将目录下所有图片自动拼接成一张大图。
    ```
    feh -m ./images/ -O montage.jpg  # 拼接并保存为新图
    ```
- **幻灯片模式 (`-D`)**：
    每隔 2 秒自动切换下一张。
    ```
    feh -D 2 ./slideshow/
    ```
##### 3. 必须掌握的键盘快捷键

| **按键**         | **功能**      |
| -------------- | ----------- |
| **方向键 / 空格**   | 上一张 / 下一张图片 |
| **方向键 + Ctrl** | 缩放图片        |
| **Up / Down**  | 放大 / 缩小     |
| **R**          | 旋转 (90度)    |
| **< / >**      | 翻转图片        |
| **W**          | 窗口适应图片大小    |
| **Q / Esc**    | 退出程序        |

##### 4. 进阶：用 feh 设置壁纸
```
feh --bg-fill /path/to/wallpaper.jpg
```


#### 16 tar
- 把某名为source的文件或目录压缩成名为out.tar.gz的gzip格式压缩文件：`tar zcvf out.tar.gz source`
- 解压缩某名为abc.tar.gz的gzip格式压缩文件：`tar zxvf abc.tar.gz`
#### 17 tmux
- **安装**：`sudo apt install tmux` (Ubuntu 默认大部分已带)。
- **新建窗口**：`tmux`。
- **离开窗口 (Detach)**：按 `Ctrl + B` 后，再按 `D`。此时你的代码在后台运行！
- **重新进入 (Attach)**：`tmux attach`。

|**功能**|**命令**|
|---|---|
|**新建会话**|`tmux` (或 `tmux new -s myname` 给会话起名)|
|**退出并挂起**|先按 `Ctrl + b`，然后按 `d` (Detach)|
|**查看所有会话**|`tmux ls`|
|**重连会话**|`tmux a` (或 `tmux a -t myname`)|
|**彻底关掉会话**|在 tmux 里输入 `exit` 或 `tmux kill-session -t myname`|
##### 操作逻辑：前缀键 (Prefix)
`tmux` 的所有快捷键都需要先按一个“启动键”，默认是 **`Ctrl + b`**。
**操作步骤：** 按住 `Ctrl` 不放再按 `b` $\rightarrow$ 全部松开 $\rightarrow$ 快速按功能键。

##### 常用功能快捷键：
- **分屏（左右）**：`Ctrl + b` $\rightarrow$ `%`
- **分屏（上下）**：`Ctrl + b` $\rightarrow$ `"`
- **切换窗格**：`Ctrl + b` $\rightarrow$ `方向键`
- **关闭当前窗格**：`Ctrl + b` $\rightarrow$ `x`


1. 输入 `tmux new -s test` 进入新世界。
2. 输入 `top` 看着系统资源跳动。
3. 按 `Ctrl + b` 然后按 `d`。你会发现回到了原来的终端。
4. 输入 `tmux ls` 确认 `test` 还在后台。
5. 输入 `tmux a -t test`，你会发现 `top` 还在原地跳动！
#### 18. alias(别名)
##### 核心逻辑
- 通过修改你家目录下的 `.bashrc`（或 `.zshrc`）文件，给长路径起个“外号”。
##### 操作步骤
1. **打开配置文件**（以最常用的 bash 为例）：
```
    nano ~/.bashrc
```
2. **在文件末尾添加一行**： 假设你经常要去 `/var/www/html/my_project/assets` 这个超长目录，你可以写：
    ```
    alias go='cd /var/www/html/my_project/assets'
    ```
    _注：`go` 是你自己起的命令名，你可以换成任何喜欢的词。_
3. **让配置立即生效**： 保存退出后（Nano 编辑器是 `Ctrl+O` 回车，`Ctrl+X` 退出），运行：
    ```
    source ~/.bashrc
    ```

#### 19. ufw
#### 20. 

ai答案:
错误日志里的 **`(13: Permission denied)`** 是最直观的证据：Nginx 已经找到你的文件夹了，但是**被系统拦在了门外**。

在 Linux 中，Nginx 以 `www-data` 用户身份运行，而你的文件夹属于 `ubuntu` 用户。如果中间任何一层目录（如 `/home/ubuntu`）没有开放“执行”权限，Nginx 就无法进入该目录寻找文件。

###### 终极修复方案：层层打通权限

请在虚拟机终端**依次执行**以下三行命令，一行都不要跳过：

Bash

```
# 1. 允许其他用户（包括 Nginx）“进入”你的家目录
sudo chmod 755 /home/ubuntu

# 2. 允许其他用户进入你的 personal_file 及其子目录
sudo chmod -R 755 /home/ubuntu/personal_file

# 3. 确保你的网页文件本身也是可读的
sudo chmod 644 /home/ubuntu/personal_file/LinuxLab/WebProg/index.html
```

---

###### 为什么需要执行这几步？

Linux 的权限检查是“路径式”的。即使你把 `index.html` 设成了 `777`（全开），但如果上一级的 `/home/ubuntu` 是私有的（通常默认是 `700`），Nginx 就像手里拿着钥匙却进不了院子大门的访客，依然会被报 `Permission denied`。

这个太危险了,尤其是openclaw带来安全风险

还有acl可以参考

# 同步文件
实现“工业级”自动化同步，最核心的思想是：**将“源码仓库”与“运行目录”分离**。

你的代码在 `/home/ubuntu` 目录下进行 Git 操作，而 Nginx 运行的是 `/var/www/my_site` 下的副本。这样既保证了安全（Nginx 进不去你的家目录），又保证了方便（你依然可以在家目录用 Git）。

以下是两种实现方式：

---

### 方法一：rsync 手动/脚本同步（最简单、可控）

如果你习惯在本地 `git pull` 后手动触发更新，`rsync` 是神器。它只会同步**增量修改**的文件，非常快。

1. **先创建目标目录并给好权限：**
    
    Bash
    
    ```
    sudo mkdir -p /var/www/my_site
    sudo chown -R www-data:www-data /var/www/my_site
    ```
    
2. **执行同步命令：**
    
    Bash
    
    ```
    sudo rsync -av --delete --exclude='.git' /home/ubuntu/personal_file/LinuxLab/my_site/ /var/www/my_site/
    ```
    
    - `-av`: 归档模式，保留权限和时间戳。
        
    - `--delete`: 如果你在 Git 里删除了文件，`/var/www` 里对应的文件也会被删除。
        
    - `--exclude='.git'`: 不要把 `.git` 文件夹拷过去，Nginx 不需要它，这也能防止源码泄露。
        
3. **进阶：写成别名（Alias）：** 在 `~/.bashrc` 末尾加一行：`alias deploy='sudo rsync -av --delete --exclude=".git" /home/ubuntu/personal_file/LinuxLab/my_site/ /var/www/my_site/'`。以后只需输入 `deploy` 即可一键同步。
    

---

### 方法二：Git Hook 自动同步（真正的自动化）

这种方式通常用于“服务器作为远程仓库”的场景。如果你是在服务器本地 `git pull`，可以利用 `post-merge` 钩子（在合并/拉取代码后自动触发）。

1. **进入你家目录下的 Git 仓库钩子目录：**
    
    Bash
    
    ```
    cd /home/ubuntu/personal_file/LinuxLab/my_site/.git/hooks
    ```
    
2. **创建 `post-merge` 脚本：**
    
    Bash
    
    ```
    nano post-merge
    ```
    
3. **写入以下内容：**
    
    Bash
    
    ```
    #!/bin/bash
    # 定义目标路径
    TARGET="/var/www/my_site"
    SOURCE="/home/ubuntu/personal_file/LinuxLab/my_site"
    
    echo "Detected git pull/merge, deploying to $TARGET..."
    
    # 使用 rsync 同步到 nginx 目录
    sudo rsync -av --delete --exclude='.git' "$SOURCE/" "$TARGET/"
    
    # 确保权限正确
    sudo chown -R www-data:www-data "$TARGET"
    
    echo "Deployment complete."
    ```
    
4. **赋予执行权限：**
    
    Bash
    
    ```
    chmod +x post-merge
    ```
    
5. **配置 sudo 免密（关键点）：** 由于钩子是以 `ubuntu` 用户运行的，但同步到 `/var/www` 需要 `sudo`。为了不卡住，你需要给 `rsync` 加上免密： 执行 `sudo visudo`，在文件末尾添加：
    
    Plaintext
    
    ```
    ubuntu ALL=(ALL) NOPASSWD: /usr/bin/rsync
    ```
    

**实现效果：** 以后你只要在 `/home/ubuntu/.../my_site` 目录下执行 `git pull`，代码会自动“飞”到 `/var/www/my_site`，Nginx 会立刻感知到更新，且没有任何权限报错。

# 全局系统命令
### 方案一：直接创建全局系统命令（最推荐）

这种方法不依赖于任何用户的配置，直接把 `deploy` 变成像 `ls`、`cd` 一样的系统命令。

1. **创建脚本文件：**
    
    Bash
    
    ```
    sudo nano /usr/local/bin/deploy
    ```
    
2. **把下面的内容完整复制进去：**
    
    Bash
    
    ```
    #!/bin/bash
    # 自动执行同步命令
    sudo rsync -av --delete --exclude=".git" /home/ubuntu/personal_file/LinuxLab/my_site/ /var/www/my_site/
    echo "-----------------------------------"
    echo "部署成功: /home/.../my_site -> /var/www/my_site"
    ```
    
3. **赋予可执行权限：**
    
    Bash
    
    ```
    sudo chmod +x /usr/local/bin/deploy
    ```
    
4. **直接运行：** 现在你在**任何目录下**直接输入 `deploy` 即可，不需要 `source`，也不需要加 `sudo`。