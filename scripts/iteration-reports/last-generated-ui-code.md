# 上次 AI 返回的 UI 代码

每次在画布上点击「生成本页 UI」成功后，会覆盖此文件。可复制下方代码块到本地或 [CodeSandbox](https://codesandbox.io) 等环境渲染，与图中预期对比。

## 本次生成上下文

| 项 | 值 |
| --- | --- |
| 生成时间 | 2026-03-14T15:28:25.308Z |
| 节点名称 | 首页 |
| 视口 | desktop |
| flex-1 | true |
| <main> | true |
| ListItem 数量 | 2 |
| Card 数量 | 4 |
| NavBar | false |
| AppBar | true |
| 根 flex-col | false |

### 发给模型的页面描述（pageDescription）


页面：首页。页面描述：应用入口，展示部分推荐新闻与入口导航。。作为用户，进入应用，以便快速看到推荐新闻。作为用户，进入应用，以便快速看到推荐新闻。验收标准：可看到推荐区；可进入新闻列表


---

## 代码（复制下方整块到可运行 React+Tailwind 环境对比）

```tsx
export default function Page() {
  const news = [
    {
      id: "n-20260314-01",
      title: "AI 时代的个人隐私保护：你需要立刻检查的 7 个设置",
      summary:
        "从系统权限到浏览器指纹，这份清单帮你在 10 分钟内完成核心自查，避免“默认授权”带来的隐患。",
      channel: "科技前沿",
      time: "今天 09:20",
      readTime: "5 分钟",
      heat: 92,
      tag: "必读",
      source: "TechWave",
    },
    {
      id: "n-20260314-02",
      title: "本周市场观察：消费电子回暖，供应链价格出现拐点",
      summary:
        "多家上游厂商释放产能恢复信号，关键原材料价格波动收敛；机构建议关注二季度需求修复。",
      channel: "财经",
      time: "今天 08:10",
      readTime: "6 分钟",
      heat: 86,
      tag: "热度",
      source: "星辰财经",
    },
    {
      id: "n-20260313-03",
      title: "城市通勤报告：地铁拥挤度下降，但换乘效率差异拉大",
      summary:
        "基于一线城市 30 天出行数据，早高峰拥挤度整体下降 8%，但跨线换乘等待时间差距最高达 2.4 倍。",
      channel: "生活方式",
      time: "昨天 18:45",
      readTime: "4 分钟",
      heat: 79,
      tag: "趋势",
      source: "城市研究所",
    },
    {
      id: "n-20260313-04",
      title: "开发者手记：如何用一套规范把前端性能指标落地到日常迭代",
      summary:
        "从 LCP/INP 到资源分层与回归机制，给出可复制的周迭代流程与指标看板结构。",
      channel: "产品与研发",
      time: "昨天 16:05",
      readTime: "8 分钟",
      heat: 74,
      tag: "实战",
      source: "工程笔记",
    },
    {
      id: "n-20260312-05",
      title: "健康科普：睡眠质量与咖啡因代谢的关系，被忽略的时间窗口",
      summary:
        "并不是“别喝太晚”那么简单。不同代谢速度的人群，建议把最后一杯咖啡的时间提前到不同的节点。",
      channel: "健康",
      time: "03-12 21:30",
      readTime: "5 分钟",
      heat: 68,
      tag: "科普",
      source: "新知健康",
    },
    {
      id: "n-20260312-06",
      title: "摄影入门：同一张照片，如何用 3 步把氛围感做出来",
      summary:
        "从构图留白、色彩对比到局部提亮，给出适合手机后期的轻量处理方法。",
      channel: "兴趣",
      time: "03-12 14:10",
      readTime: "3 分钟",
      heat: 63,
      tag: "教程",
      source: "光影实验室",
    },
  ];

  const quickEntrances = [
    {
      id: "e-01",
      title: "新闻列表",
      desc: "进入全部频道与筛选",
      pill: "推荐入口",
      color: "from-violet-400/40 to-indigo-400/30",
    },
    {
      id: "e-02",
      title: "热点追踪",
      desc: "查看今日热度榜",
      pill: "趋势",
      color: "from-fuchsia-400/35 to-violet-400/25",
    },
    {
      id: "e-03",
      title: "订阅管理",
      desc: "配置频道与关键词",
      pill: "个性化",
      color: "from-indigo-400/35 to-sky-400/20",
    },
    {
      id: "e-04",
      title: "离线阅读",
      desc: "缓存通勤必读内容",
      pill: "效率",
      color: "from-violet-400/30 to-purple-400/25",
    },
  ];

  const channels = [
    { id: "c-all", name: "全部", count: 128 },
    { id: "c-tech", name: "科技前沿", count: 34 },
    { id: "c-fin", name: "财经", count: 26 },
    { id: "c-life", name: "生活方式", count: 22 },
    { id: "c-dev", name: "产品与研发", count: 18 },
    { id: "c-health", name: "健康", count: 16 },
    { id: "c-hobby", name: "兴趣", count: 12 },
  ];

  const notifications = [
    {
      id: "m1",
      title: "为你更新：隐私保护清单",
      meta: "已根据你关注的「科技前沿」更新",
      time: "今天 09:25",
      tone: "info",
    },
    {
      id: "m2",
      title: "热点提醒：消费电子回暖",
      meta: "热度进入前 10，建议关注后续跟进",
      time: "今天 08:15",
      tone: "warn",
    },
    {
      id: "m3",
      title: "订阅建议：新增关键词「供应链」",
      meta: "近期与你阅读偏好高度匹配",
      time: "昨天 20:40",
      tone: "success",
    },
  ];

  const trend = [
    { label: "今日推荐", value: 18, hint: "基于阅读偏好与热度综合" },
    { label: "你关注的频道", value: 6, hint: "科技/财经/研发等" },
    { label: "待读清单", value: 9, hint: "已收藏，未阅读" },
    { label: "本周阅读时长", value: "2h 35m", hint: "同比 +12%" },
  ];

  const heatMax = 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700">
      <div className={cn("flex flex-col h-full min-h-full")}>
        <AppBar className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-7xl mx-auto w-full px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-2xl bg-white/20 border border-white/20 backdrop-blur-xl flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M4 19h16" />
                  <path d="M6 16V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9" />
                  <path d="M8 9h8" />
                  <path d="M8 12h6" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold leading-tight truncate">
                  云镜资讯
                </div>
                <div className="text-white/70 text-sm leading-tight truncate">
                  首页 · 推荐新闻与快捷入口
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-2 justify-center">
              <div className="w-full max-w-xl">
                <Label className="sr-only">搜索新闻</Label>
                <div className="relative">
                  <Input
                    defaultValue=""
                    placeholder="搜索：频道 / 关键词 / 来源（例如：隐私、供应链、性能指标）"
                    className="min-h-[44px] bg-white/20 text-white placeholder:text-white/60 border-white/20 backdrop-blur-xl rounded-2xl pl-11 pr-28 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                    aria-label="搜索新闻"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3.5-3.5" />
                    </svg>
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button
                      className="min-h-[40px] rounded-xl bg-white/90 text-gray-900 hover:bg-white transition cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                      aria-label="搜索"
                    >
                      搜索
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-[40px] rounded-xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer border border-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                      aria-label="高级筛选"
                    >
                      筛选
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="ghost"
                className="min-h-[44px] px-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition cursor-pointer focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                aria-label="消息中心"
              >
                <span className="inline-flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                  <span className="hidden lg:inline text-white/90">消息</span>
                </span>
                <Badge className="ml-2 bg-violet-500/90 text-white border border-white/20">
                  3
                </Badge>
              </Button>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-3 py-2">
                <Avatar className="h-9 w-9 border border-white/20" />
                <div className="hidden xl:block">
                  <div className="text-white/90 text-sm leading-tight font-medium">
                    林若溪
                  </div>
                  <div className="text-white/60 text-xs leading-tight">
                    已登录 · 个性化推荐开启
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AppBar>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Sidebar */}
              <aside className="col-span-3 min-w-[240px]">
                <Sidebar className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3">
                  <div className="px-2 py-2">
                    <div className="text-white/90 text-sm font-semibold">
                      导航
                    </div>
                    <div className="text-white/60 text-xs mt-1">
                      快速到达核心功能
                    </div>
                  </div>
                  <div className="mt-2 space-y-2">
                    <SidebarItem
                      className="bg-white/20 border border-white/20 rounded-2xl px-3 py-3 cursor-pointer hover:bg-white/25 transition"
                      aria-label="进入首页"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                          <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path d="M3 11l9-8 9 8" />
                            <path d="M5 10v10h14V10" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate">
                            首页
                          </div>
                          <div className="text-white/60 text-sm truncate">
                            推荐与入口
                          </div>
                        </div>
                      </div>
                    </SidebarItem>

                    <SidebarItem
                      className="bg-white/10 border border-white/20 rounded-2xl px-3 py-3 cursor-pointer hover:bg-white/20 transition"
                      aria-label="进入新闻列表"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                          <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path d="M8 6h13" />
                            <path d="M8 12h13" />
                            <path d="M8 18h13" />
                            <path d="M3 6h.01" />
                            <path d="M3 12h.01" />
                            <path d="M3 18h.01" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate">
                            新闻列表
                          </div>
                          <div className="text-white/60 text-sm truncate">
                            全部频道与筛选
                          </div>
                        </div>
                      </div>
                    </SidebarItem>

                    <SidebarItem
                      className="bg-white/10 border border-white/20 rounded-2xl px-3 py-3 cursor-pointer hover:bg-white/20 transition"
                      aria-label="进入订阅管理"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                          <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path d="M12 2v2" />
                            <path d="M12 20v2" />
                            <path d="M4.93 4.93l1.41 1.41" />
                            <path d="M17.66 17.66l1.41 1.41" />
                            <path d="M2 12h2" />
                            <path d="M20 12h2" />
                            <path d="M4.93 19.07l1.41-1.41" />
                            <path d="M17.66 6.34l1.41-1.41" />
                            <circle cx="12" cy="12" r="4" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate">
                            订阅管理
                          </div>
                          <div className="text-white/60 text-sm truncate">
                            频道/关键词/屏蔽
                          </div>
                        </div>
                      </div>
                    </SidebarItem>
                  </div>

                  <Separator className="my-4 bg-white/15" />

                  <div className="px-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-white/90 text-sm font-semibold">
                          推荐偏好
                        </div>
                        <div className="text-white/60 text-xs mt-1">
                          开启后更贴合你的阅读
                        </div>
                      </div>
                      <Switch aria-label="个性化推荐开关" defaultChecked />
                    </div>

                    <div className="mt-4">
                      <div className="text-white/80 text-sm font-medium">
                        频道覆盖度
                      </div>
                      <div className="text-white/60 text-xs mt-1">
                        当前订阅 {channels.length - 1} 个频道，建议补齐兴趣类
                      </div>
                      <div className="mt-3 space-y-2">
                        {channels.slice(1).map((c) => {
                          const pct = Math.min(
                            100,
                            Math.round((c.count / channels[0].count) * 100)
                          );
                          return (
                            <div
                              key={c.id}
                              className="bg-white/10 border border-white/20 rounded-2xl p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-white/85 text-sm font-medium truncate">
                                  {c.name}
                                </div>
                                <div className="text-white/60 text-xs shrink-0">
                                  {c.count} 篇
                                </div>
                              </div>
                              <div className="mt-2">
                                <Progress
                                  value={pct}
                                  className="h-2 bg-white/10"
                                />
                                <div className="mt-2 text-white/60 text-xs">
                                  覆盖度 {pct}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Sidebar>
              </aside>

              {/* Main */}
              <main className="col-span-9 min-w-0">
                <PageHeader className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white text-xl font-semibold tracking-tight">
                        今日为你推荐
                      </div>
                      <div className="text-white/70 text-sm mt-1 whitespace-normal">
                        聚合热度与偏好，优先呈现你更可能读完的内容；支持一键进入新闻列表继续浏览。
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge className="bg-white/20 text-white border border-white/20">
                          主色：violet-500
                        </Badge>
                        <Badge className="bg-white/10 text-white/90 border border-white/20">
                          更新频率：每 30 分钟
                        </Badge>
                        <Badge className="bg-white/10 text-white/90 border border-white/20">
                          推荐策略：热度 × 兴趣 × 新鲜度
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        className="min-h-[44px] rounded-2xl bg-white/90 text-gray-900 hover:bg-white transition cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                        aria-label="进入新闻列表"
                      >
                        进入新闻列表
                      </Button>
                      <Dialog>
                        <Button
                          variant="ghost"
                          className="min-h-[44px] rounded-2xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer border border-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                          aria-label="打开推荐说明"
                        >
                          推荐说明
                        </Button>
                        <DialogContent className="bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 text-white">
                          <DialogHeader>
                            <div className="text-white text-lg font-semibold">
                              推荐规则（示例）
                            </div>
                            <div className="text-white/70 text-sm mt-1">
                              说明面向展示：热度、阅读时长、频道偏好与新鲜度共同计算。
                            </div>
                          </DialogHeader>

                          <div className="mt-4 space-y-3">
                            <Alert className="bg-white/10 border border-white/20 text-white">
                              <div className="text-white/90 font-medium">
                                热度因子
                              </div>
                              <div className="text-white/70 text-sm mt-1">
                                结合全站阅读量、收藏量、分享量与时效衰减，优先展示“正在发生”的内容。
                              </div>
                            </Alert>
                            <Alert className="bg-white/10 border border-white/20 text-white">
                              <div className="text-white/90 font-medium">
                                兴趣因子
                              </div>
                              <div className="text-white/70 text-sm mt-1">
                                根据你近 7 天阅读完成率、停留时间与频道点击，动态调整推荐权重。
                              </div>
                            </Alert>
                            <Alert className="bg-white/10 border border-white/20 text-white">
                              <div className="text-white/90 font-medium">
                                负反馈
                              </div>
                              <div className="text-white/70 text-sm mt-1">
                                你可以在列表中选择“不感兴趣/屏蔽来源”，降低相似内容曝光。
                              </div>
                            </Alert>
                          </div>

                          <DialogFooter className="mt-5">
                            <Button
                              className="min-h-[44px] rounded-2xl bg-violet-500 text-white hover:bg-violet-400 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                              aria-label="我知道了"
                            >
                              我知道了
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </PageHeader>

                <div className="mt-6 grid grid-cols-4 gap-4">
                  {trend.map((t) => (
                    <StatCard
                      key={t.label}
                      className="bg-white/15 backdrop-blur-xl rounded-2xl border border-white/20"
                      title={t.label}
                      value={t.value}
                      footer={
                        <div className="text-white/60 text-xs whitespace-normal">
                          {t.hint}
                        </div>
                      }
                    />
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-12 gap-6">
                  <section className="col-span-8 min-w-0">
                    <Card className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <CardTitle className="text-white">
                              推荐区
                            </CardTitle>
                            <div className="text-white/60 text-sm mt-1 whitespace-normal">
                              精选 {news.length} 条，优先展示你可能读完的文章
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <TabsList className="bg-white/10 border border-white/20 rounded-2xl p-1">
                              <TabsTrigger
                                value="for-you"
                                className="rounded-xl text-white/90 data-[state=active]:bg-white/20 data-[state=active]:text-white cursor-pointer transition"
                              >
                                为你推荐
                              </TabsTrigger>
                              <TabsTrigger
                                value="hot"
                                className="rounded-xl text-white/90 data-[state=active]:bg-white/20 data-[state=active]:text-white cursor-pointer transition"
                              >
                                今日热榜
                              </TabsTrigger>
                            </TabsList>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {news.slice(0, 5).map((n, idx) => {
                            const heatPct = Math.round(
                              (n.heat / heatMax) * 100
                            );
                            const tone =
                              n.tag === "必读"
                                ? "bg-violet-500/90"
                                : n.tag === "热度"
                                ? "bg-fuchsia-500/80"
                                : "bg-white/20";

                            return (
                              <ListItem
                                key={n.id}
                                className="bg-white/10 hover:bg-white/15 transition cursor-pointer rounded-2xl border border-white/20 p-4"
                              >
                                <div className="flex items-start gap-4">
                                  <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="w-6 h-6 text-white/90"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      aria-hidden="true"
                                    >
                                      <path d="M6 3h12v18H6z" />
                                      <path d="M9 7h6" />
                                      <path d="M9 11h6" />
                                      <path d="M9 15h4" />
                                    </svg>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <div className="text-white font-semibold leading-snug whitespace-normal">
                                        {n.title}
                                      </div>
                                      <Badge
                                        className={cn(
                                          "text-white border border-white/20",
                                          tone
                                        )}
                                      >
                                        {n.tag}
                                      </Badge>
                                      {idx === 0 ? (
                                        <Badge className="bg-white/10 text-white/90 border border-white/20">
                                          置顶推荐
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <div className="text-white/70 text-sm mt-1 whitespace-normal">
                                      {n.summary}
                                    </div>

                                    <div className="mt-3 grid grid-cols-12 gap-3 items-center">
                                      <div className="col-span-7 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge className="bg-white/10 text-white/85 border border-white/20">
                                            {n.channel}
                                          </Badge>
                                          <div className="text-white/60 text-xs">
                                            {n.time}
                                          </div>
                                          <Separator className="hidden lg:block w-px h-3 bg-white/20" />
                                          <div className="text-white/60 text-xs">
                                            预计阅读 {n.readTime}
                                          </div>
                                          <Separator className="hidden lg:block w-px h-3 bg-white/20" />
                                          <div className="text-white/60 text-xs">
                                            来源：{n.source}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-span-3">
                                        <div className="text-white/60 text-xs mb-2">
                                          热度 {n.heat}/100
                                        </div>
                                        <Progress
                                          value={heatPct}
                                          className="h-2 bg-white/10"
                                        />
                                      </div>
                                      <div className="col-span-2 flex items-center justify-end gap-2">
                                        <Button
                                          className="min-h-[44px] rounded-2xl bg-white/90 text-gray-900 hover:bg-white transition cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                                          aria-label={`打开文章：${n.title}`}
                                        >
                                          阅读
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </ListItem>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="text-white/60 text-xs">
                            已展示 5 条 · 进入列表查看更多与筛选
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              className="min-h-[44px] rounded-2xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer border border-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                              aria-label="刷新推荐"
                            >
                              刷新推荐
                            </Button>
                            <Button
                              className="min-h-[44px] rounded-2xl bg-violet-500 text-white hover:bg-violet-400 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                              aria-label="去新闻列表"
                            >
                              去新闻列表
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </section>

                  <aside className="col-span-4 min-w-0">
                    <Card className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white">
                          快捷入口
                        </CardTitle>
                        <div className="text-white/60 text-sm mt-1 whitespace-normal">
                          常用功能一键直达
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 gap-3">
                          {quickEntrances.map((e) => (
                            <div
                              key={e.id}
                              className={cn(
                                "rounded-2xl border border-white/20 backdrop-blur-xl p-4 cursor-pointer transition hover:translate-y-[-1px] hover:bg-white/10",
                                "bg-white/10"
                              )}
                            >
                              <div
                                className={cn(
                                  "rounded-2xl p-4 border border-white/20",
                                  "bg-gradient-to-br",
                                  e.color
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-white font-semibold">
                                      {e.title}
                                    </div>
                                    <div className="text-white/70 text-sm mt-1 whitespace-normal">
                                      {e.desc}
                                    </div>
                                  </div>
                                  <Badge className="bg-white/20 text-white border border-white/20 shrink-0">
                                    {e.pill}
                                  </Badge>
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-2">
                                  <div className="text-white/70 text-xs">
                                    建议操作：立即查看
                                  </div>
                                  <Button
                                    className="min-h-[44px] rounded-2xl bg-white/90 text-gray-900 hover:bg-white transition cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                                    aria-label={`进入：${e.title}`}
                                  >
                                    打开
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Alert className="w-full bg-white/10 border border-white/20 text-white">
                          <div className="text-white/90 font-medium">
                            提示
                          </div>
                          <div className="text-white/70 text-sm mt-1 whitespace-normal">
                            进入「新闻列表」可按频道、热度、阅读时长筛选，并支持收藏与离线。
                          </div>
                        </Alert>
                      </CardFooter>
                    </Card>

                    <Card className="mt-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white">
                          更新与提醒
                        </CardTitle>
                        <div className="text-white/60 text-sm mt-1 whitespace-normal">
                          你的订阅与热点变化
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {notifications.map((m) => {
                            const badgeCls =
                              m.tone === "warn"
                                ? "bg-fuchsia-500/70"
                                : m.tone === "success"
                                ? "bg-violet-500/70"
                                : "bg-white/20";
                            const toneText =
                              m.tone === "warn"
                                ? "提醒"
                                : m.tone === "success"
                                ? "建议"
                                : "更新";

                            return (
                              <ListItem
                                key={m.id}
                                className="bg-white/10 hover:bg-white/15 transition cursor-pointer rounded-2xl border border-white/20 p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="w-5 h-5 text-white/90"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      aria-hidden="true"
                                    >
                                      <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2z" />
                                      <path d="M18 16v-5a6 6 0 1 0-12 0v5" />
                                      <path d="M5 16h14" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="text-white/90 font-semibold whitespace-normal">
                                        {m.title}
                                      </div>
                                      <Badge
                                        className={cn(
                                          "text-white border border-white/20 shrink-0",
                                          badgeCls
                                        )}
                                      >
                                        {toneText}
                                      </Badge>
                                    </div>
                                    <div className="text-white/70 text-sm mt-1 whitespace-normal">
                                      {m.meta}
                                    </div>
                                    <div className="text-white/60 text-xs mt-2">
                                      {m.time}
                                    </div>
                                  </div>
                                </div>
                              </ListItem>
                            );
                          })}
                        </div>

                        <Separator className="my-4 bg-white/15" />

                        <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                          <div className="text-white/90 font-semibold">
                            反馈偏好
                          </div>
                          <div className="text-white/60 text-sm mt-1 whitespace-normal">
                            告诉我们你想看到什么，推荐会更准确。
                          </div>
                          <div className="mt-3 space-y-2">
                            <div>
                              <Label className="text-white/80">
                                关注关键词
                              </Label>
                              <Input
                                defaultValue="隐私保护, 供应链, 性能指标"
                                className="mt-2 min-h-[44px] bg-white/20 text-white border-white/20 backdrop-blur-xl rounded-2xl focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                                aria-label="关注关键词输入"
                              />
                            </div>
                            <div>
                              <Label className="text-white/80">
                                不感兴趣的来源
                              </Label>
                              <Input
                                defaultValue="营销号, 转载聚合站"
                                className="mt-2 min-h-[44px] bg-white/20 text-white border-white/20 backdrop-blur-xl rounded-2xl focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                                aria-label="不感兴趣的来源输入"
                              />
                            </div>
                            <div>
                              <Label className="text-white/80">
                                备注（可选）
                              </Label>
                              <Textarea
                                defaultValue="希望多推荐有数据、有结论的深度内容；少一些标题党。"
                                className="mt-2 min-h-[88px] bg-white/20 text-white border-white/20 backdrop-blur-xl rounded-2xl focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                                aria-label="偏好备注输入"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                className="min-h-[44px] rounded-2xl bg-violet-500 text-white hover:bg-violet-400 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                                aria-label="保存偏好"
                              >
                                保存偏好
                              </Button>
                              <Button
                                variant="ghost"
                                className="min-h-[44px] rounded-2xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer border border-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                                aria-label="重置"
                              >
                                重置
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </aside>
                </div>

                <div className="mt-6">
                  <Card className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white">
                        继续浏览（频道导览）
                      </CardTitle>
                      <div className="text-white/60 text-sm mt-1 whitespace-normal">
                        快速定位你关心的频道，进入列表后可继续细分与排序
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-7 gap-3">
                        {channels.map((c) => (
                          <div
                            key={c.id}
                            className="bg-white/10 hover:bg-white/15 transition cursor-pointer rounded-2xl border border-white/20 p-4"
                            role="button"
                            tabIndex={0}
                            aria-label={`打开频道：${c.name}`}
                          >
                            <div className="text-white/90 font-semibold truncate">
                              {c.name}
                            </div>
                            <div className="text-white/60 text-sm mt-1">
                              {c.count} 篇
                            </div>
                            <div className="mt-3">
                              <Button
                                className="w-full min-h-[44px] rounded-2xl bg-white/90 text-gray-900 hover:bg-white transition cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                                aria-label={`进入列表并筛选频道：${c.name}`}
                              >
                                进入列表
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 pb-10">
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white/90 font-semibold">
                        入口确认
                      </div>
                      <div className="text-white/60 text-sm mt-1 whitespace-normal">
                        你可以从「推荐区」直接阅读，或点击任意「进入列表」查看完整新闻列表。
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        className="min-h-[44px] rounded-2xl bg-white/90 text-gray-900 hover:bg-white transition cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                        aria-label="进入新闻列表"
                      >
                        进入新闻列表
                      </Button>
                      <Button
                        variant="ghost"
                        className="min-h-[44px] rounded-2xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer border border-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0"
                        aria-label="返回顶部"
                      >
                        返回顶部
                      </Button>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 bg-white/10 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
            <div className="text-white/70 text-sm">
              © 2026 云镜资讯 · 玻璃拟态首页
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/10 text-white/80 border border-white/20">
                数据更新时间：今天 09:30
              </Badge>
              <Badge className="bg-white/10 text-white/80 border border-white/20">
                推荐命中率：78%
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```
