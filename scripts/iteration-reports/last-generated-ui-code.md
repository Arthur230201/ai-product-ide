# 上次 AI 返回的 UI 代码

每次在画布上点击「生成本页 UI」成功后，会覆盖此文件。可复制下方代码块到本地或 [CodeSandbox](https://codesandbox.io) 等环境渲染，与图中预期对比。

## 本次生成上下文

| 项 | 值 |
| --- | --- |
| 生成时间 | 2026-03-05T05:26:18.723Z |
| 节点名称 | 个人中心 |
| 视口 | desktop |
| flex-1 | true |
| <main> | true |
| ListItem 数量 | 0 |
| Card 数量 | 9 |
| NavBar | false |
| AppBar | true |
| 根 flex-col | true |

### 发给模型的页面描述（pageDescription）


页面：个人中心。页面描述：展示用户资料、历史记录入口、设置等基础信息。。作为用户，查看个人基础信息，以便确认个人资料与偏好设置。作为用户，查看个人基础信息，以便确认个人资料与偏好设置。验收标准：可见用户名；可见设置入口


---

## 代码（复制下方整块到可运行 React+Tailwind 环境对比）

```tsx
export default function App() {
  const profile = {
    name: "林若曦",
    role: "高级产品运营 · UO",
    dept: "增长与用户运营中心",
    city: "上海",
    email: "ruoxi.lin@company.com",
    phone: "138-****-2196",
    joinedAt: "2023-04-18",
    status: "在职",
    bio: "负责增长策略、用户分层与生命周期运营，关注数据闭环与体验一致性。",
  };

  const uoMetrics = [
    { title: "本周新增激活用户", value: "12,480", delta: "+8.6%", tone: "cyan" },
    { title: "7 日留存率", value: "34.2%", delta: "+1.9%", tone: "emerald" },
    { title: "转化漏斗完成率", value: "6.8%", delta: "+0.4%", tone: "cyan" },
    { title: "NPS（近 30 天）", value: "42", delta: "+3", tone: "emerald" },
  ];

  const uoProjects = [
    {
      name: "新用户引导 2.0（A/B）",
      owner: "林若曦",
      status: "进行中",
      progress: 62,
      lastUpdate: "2026-03-03 17:20",
      desc: "优化首登路径与关键触达点，降低跳失并提升激活率。",
      tags: ["A/B", "新手引导", "激活"],
      priority: "高",
    },
    {
      name: "会员续费唤醒策略",
      owner: "林若曦",
      status: "待上线",
      progress: 86,
      lastUpdate: "2026-03-01 10:05",
      desc: "基于用户分层与权益偏好，制定多通道唤醒与优惠梯度。",
      tags: ["CRM", "分层", "续费"],
      priority: "中",
    },
    {
      name: "增长看板口径统一",
      owner: "张启明",
      status: "已完成",
      progress: 100,
      lastUpdate: "2026-02-25 19:44",
      desc: "统一 DAU/激活/留存等指标口径与数据源，减少跨部门对齐成本。",
      tags: ["数据治理", "指标", "看板"],
      priority: "中",
    },
    {
      name: "Push 触达节奏优化",
      owner: "许雅雯",
      status: "进行中",
      progress: 38,
      lastUpdate: "2026-03-04 09:10",
      desc: "基于频控与兴趣画像，提升打开率并降低退订率。",
      tags: ["Push", "频控", "画像"],
      priority: "高",
    },
    {
      name: "流失预警模型联调",
      owner: "周远航",
      status: "阻塞",
      progress: 21,
      lastUpdate: "2026-03-02 14:32",
      desc: "与数据团队联调特征与阈值策略，当前受限于埋点缺失与延迟。",
      tags: ["模型", "预警", "埋点"],
      priority: "高",
    },
    {
      name: "渠道投放归因复盘",
      owner: "陈思齐",
      status: "待排期",
      progress: 12,
      lastUpdate: "2026-03-04 16:18",
      desc: "补齐多触点归因与成本口径，输出可执行的投放优化建议。",
      tags: ["归因", "投放", "ROI"],
      priority: "低",
    },
  ];

  const uoTasks = [
    {
      title: "完善新手任务链路埋点",
      status: "处理中",
      due: "2026-03-07",
      owner: "数据分析-郑思远",
      note: "补齐 step_start/step_complete，校验事件延迟 < 3min。",
    },
    {
      title: "会员续费唤醒短信模板评审",
      status: "待评审",
      due: "2026-03-06",
      owner: "品牌法务-刘颖",
      note: "重点核对权益文案与优惠期限描述。",
    },
    {
      title: "Push 频控策略灰度参数确认",
      status: "待确认",
      due: "2026-03-05",
      owner: "客户端-梁一鸣",
      note: "按人群设置 1/3/7 天窗口，支持紧急消息白名单。",
    },
    {
      title: "增长看板指标口径对齐会",
      status: "已完成",
      due: "2026-03-01",
      owner: "数据平台-杨澈",
      note: "对齐 DAU、激活、留存口径与数据源，形成 PRD 附录。",
    },
    {
      title: "流失预警模型特征清单补充",
      status: "阻塞",
      due: "2026-03-08",
      owner: "算法-韩亦辰",
      note: "缺少支付失败与客服接触特征，等待数据侧补表。",
    },
  ];

  const statusBadge = (status: string) => {
    const base = "border rounded px-2 py-0.5 text-xs";
    if (status === "进行中")
      return (
        <Badge className={cn(base, "bg-cyan-500/15 text-cyan-300 border-cyan-500/30")}>
          {status}
        </Badge>
      );
    if (status === "待上线" || status === "待排期" || status === "待评审" || status === "待确认")
      return (
        <Badge className={cn(base, "bg-emerald-500/15 text-emerald-300 border-emerald-500/30")}>
          {status}
        </Badge>
      );
    if (status === "已完成")
      return (
        <Badge className={cn(base, "bg-slate-700/40 text-slate-200 border-slate-600")}>
          {status}
        </Badge>
      );
    if (status === "阻塞")
      return (
        <Badge className={cn(base, "bg-slate-950 text-slate-100 border-cyan-500/40")}>
          {status}
        </Badge>
      );
    return (
      <Badge className={cn(base, "bg-slate-700/30 text-slate-200 border-slate-600")}>
        {status}
      </Badge>
    );
  };

  const priorityBadge = (p: string) => {
    const base = "border rounded px-2 py-0.5 text-xs";
    if (p === "高")
      return (
        <Badge className={cn(base, "bg-cyan-500/15 text-cyan-300 border-cyan-500/30")}>P0</Badge>
      );
    if (p === "中")
      return (
        <Badge className={cn(base, "bg-emerald-500/15 text-emerald-300 border-emerald-500/30")}>P1</Badge>
      );
    return (
      <Badge className={cn(base, "bg-slate-700/40 text-slate-200 border-slate-600")}>P2</Badge>
    );
  };

  const MetricCard = ({ item }: any) => (
    <Card className="bg-slate-800/80 border border-cyan-500/20 shadow-lg rounded">
      <CardHeader className="p-2">
        <CardTitle className="text-sm font-medium text-slate-200">{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="flex items-end justify-between gap-2">
          <div className="text-2xl font-bold text-slate-100">{item.value}</div>
          <div
            className={cn(
              "text-sm font-medium",
              item.tone === "emerald" ? "text-emerald-300" : "text-cyan-300"
            )}
          >
            {item.delta}
          </div>
        </div>
        <div className="mt-2">
          <Progress value={item.tone === "emerald" ? 68 : 58} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("flex flex-col h-full min-h-full bg-slate-900")}>
      <AppBar
        title="个人中心"
        className="bg-slate-950 border-b border-slate-700"
        right={
          <div className="flex items-center gap-2">
            <Button className="rounded shadow bg-cyan-500 text-white hover:bg-cyan-600 min-h-[36px] px-3">
              生成 UO 报告
            </Button>
            <Button
              variant="outline"
              className="rounded shadow border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 min-h-[36px] px-3"
            >
              设置
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar className="min-w-[240px] bg-slate-950 border-r border-slate-700">
          <div className="p-2">
            <div className="flex items-center gap-2 p-2 rounded border border-cyan-500/20 bg-slate-900 shadow">
              <Avatar name={profile.name} />
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-100 truncate">{profile.name}</div>
                <div className="text-xs text-slate-400 truncate">{profile.role}</div>
              </div>
            </div>

            <div className="mt-2 grid gap-2">
              <SidebarItem active>概览</SidebarItem>
              <SidebarItem>UO 项目</SidebarItem>
              <SidebarItem>待办事项</SidebarItem>
              <SidebarItem>资料与权限</SidebarItem>
              <SidebarItem>通知与订阅</SidebarItem>
            </div>

            <Separator className="my-2 bg-slate-700" />

            <Card className="bg-slate-900 border border-slate-700 shadow-lg rounded">
              <CardHeader className="p-2">
                <CardTitle className="text-sm text-slate-100">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0 grid gap-2">
                <Button className="rounded shadow bg-emerald-500 text-white hover:bg-emerald-600 min-h-[40px]">
                  新建 UO 活动
                </Button>
                <Button
                  variant="outline"
                  className="rounded shadow border border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 min-h-[40px]"
                >
                  导出指标明细
                </Button>
                <Button
                  variant="outline"
                  className="rounded shadow border border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 min-h-[40px]"
                >
                  申请数据权限
                </Button>
              </CardContent>
            </Card>
          </div>
        </Sidebar>

        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-2 grid gap-2">
              <Card className="bg-slate-800/80 border border-cyan-500/20 shadow-lg rounded">
                <CardHeader className="p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base text-slate-100">UO 概览</CardTitle>
                      <div className="mt-1 text-sm text-slate-400 whitespace-normal">
                        以「用户运营（UO）」视角汇总关键指标、项目推进与待办风险，便于你每天 3 分钟完成自检。
                      </div>
                    </div>
                    <Badge className="rounded border border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                      {profile.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="grid grid-cols-4 gap-2">
                    {uoMetrics.map((m, idx) => (
                      <MetricCard key={idx} item={m} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-2">
                <Card className="col-span-2 bg-slate-800/80 border border-cyan-500/20 shadow-lg rounded">
                  <CardHeader className="p-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base text-slate-100">UO 项目推进</CardTitle>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="搜索项目：如 新用户引导"
                          className="rounded bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-400 min-h-[36px]"
                        />
                        <Button className="rounded shadow bg-cyan-500 text-white hover:bg-cyan-600 min-h-[36px] px-3">
                          查询
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 pt-0 grid gap-2">
                    {uoProjects.map((p, i) => (
                      <Card
                        key={i}
                        className="bg-slate-900 border border-slate-700 shadow-lg rounded"
                      >
                        <CardContent className="p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="text-sm font-bold text-slate-100 truncate">
                                  {p.name}
                                </div>
                                {statusBadge(p.status)}
                                {priorityBadge(p.priority)}
                              </div>
                              <div className="mt-1 text-sm text-slate-400 whitespace-normal">
                                {p.desc}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {p.tags.map((t: string, ti: number) => (
                                  <Badge
                                    key={ti}
                                    className="rounded border border-cyan-500/20 bg-slate-950 text-slate-200"
                                  >
                                    {t}
                                  </Badge>
                                ))}
                                <span className="text-xs text-slate-400">
                                  负责人：{p.owner}
                                </span>
                                <span className="text-xs text-slate-400">
                                  更新：{p.lastUpdate}
                                </span>
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-400">进度</span>
                                  <span className="text-xs text-slate-200">{p.progress}%</span>
                                </div>
                                <div className="mt-1">
                                  <Progress value={p.progress} />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <Button className="rounded shadow bg-emerald-500 text-white hover:bg-emerald-600 min-h-[36px] px-3">
                                进入
                              </Button>
                              <Button
                                variant="outline"
                                className="rounded shadow border border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 min-h-[36px] px-3"
                              >
                                复盘
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                <div className="grid gap-2">
                  <Card className="bg-slate-800/80 border border-cyan-500/20 shadow-lg rounded">
                    <CardHeader className="p-2">
                      <CardTitle className="text-base text-slate-100">个人资料</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 grid gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={profile.name} />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-100 truncate">
                            {profile.name}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {profile.dept} · {profile.city}
                          </div>
                        </div>
                      </div>
                      <Separator className="bg-slate-700" />
                      <div className="grid gap-2">
                        <div>
                          <div className="text-xs text-slate-400">邮箱</div>
                          <div className="text-sm text-slate-100">{profile.email}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">手机</div>
                          <div className="text-sm text-slate-100">{profile.phone}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">入职日期</div>
                          <div className="text-sm text-slate-100">{profile.joinedAt}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">个人简介</div>
                          <div className="text-sm text-slate-100 whitespace-normal">
                            {profile.bio}
                          </div>
                        </div>
                      </div>
                      <Button className="rounded shadow bg-cyan-500 text-white hover:bg-cyan-600 min-h-[40px]">
                        编辑资料
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/80 border border-cyan-500/20 shadow-lg rounded">
                    <CardHeader className="p-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base text-slate-100">UO 待办</CardTitle>
                        <Badge className="rounded border border-slate-700 bg-slate-900 text-slate-200">
                          {uoTasks.length} 条
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 grid gap-2">
                      {uoTasks.map((t, i) => (
                        <Card
                          key={i}
                          className="bg-slate-900 border border-slate-700 shadow-lg rounded"
                        >
                          <CardContent className="p-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="text-sm font-bold text-slate-100 truncate">
                                    {t.title}
                                  </div>
                                  {statusBadge(t.status)}
                                </div>
                                <div className="mt-1 text-xs text-slate-400 whitespace-normal">
                                  {t.note}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge className="rounded border border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                                    截止 {t.due}
                                  </Badge>
                                  <span className="text-xs text-slate-400">经办：{t.owner}</span>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                className="rounded shadow border border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 min-h-[36px] px-3 shrink-0"
                              >
                                标记
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button className="rounded shadow bg-emerald-500 text-white hover:bg-emerald-600 min-h-[40px]">
                        新增待办
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="bg-slate-800/80 border border-cyan-500/20 shadow-lg rounded">
                <CardHeader className="p-2">
                  <CardTitle className="text-base text-slate-100">UO 生成（草稿区）</CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 grid gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <div>
                        <Label className="text-slate-200">周报标题</Label>
                        <Input
                          defaultValue="用户运营（UO）周报 · 2026 W10"
                          className="rounded bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-400 min-h-[40px]"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-200">核心结论</Label>
                        <Textarea
                          defaultValue="本周激活新增 12,480（+8.6%），7 日留存 34.2%（+1.9%）。新用户引导 2.0 A/B 进入第二阶段，Push 频控灰度中，需尽快补齐埋点以降低模型联调风险。"
                          className="rounded bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-400 min-h-[120px]"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div>
                        <Label className="text-slate-200">下周计划</Label>
                        <Textarea
                          defaultValue="1）完成新手任务链路埋点与告警；2）续费唤醒策略上线灰度 10%；3）Push 频控策略扩大灰度至 30%；4）输出渠道归因复盘结论并落地 2 个优化动作。"
                          className="rounded bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-400 min-h-[120px]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between p-2 rounded border border-slate-700 bg-slate-900">
                          <div>
                            <div className="text-sm font-medium text-slate-100">自动同步项目进度</div>
                            <div className="text-xs text-slate-400">将进行中/阻塞项目摘要自动写入报告。</div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-2 rounded border border-slate-700 bg-slate-900">
                          <div>
                            <div className="text-sm font-medium text-slate-100">生成风险提示</div>
                            <div className="text-xs text-slate-400">对阻塞项与埋点缺失自动提示关注点。</div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm text-slate-400 whitespace-normal">
                      点击「生成 UO 报告」可输出可复制的 Markdown 模版，便于同步到飞书/Confluence。
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="rounded shadow border border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 min-h-[40px] px-4"
                      >
                        预览
                      </Button>
                      <Button className="rounded shadow bg-cyan-500 text-white hover:bg-cyan-600 min-h-[40px] px-4">
                        生成 UO
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="border-t border-slate-700 bg-slate-950">
            <div className="max-w-7xl mx-auto p-2 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-400">
                数据更新时间：2026-03-05 09:30 · 指标口径：增长看板 v3.2
              </div>
              <div className="flex items-center gap-2">
                <Badge className="rounded border border-cyan-500/30 bg-cyan-500/15 text-cyan-300">
                  UO
                </Badge>
                <span className="text-xs text-slate-400">个人中心 · 科技风</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
```
