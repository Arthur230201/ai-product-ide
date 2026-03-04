# 上次 AI 返回的 UI 代码

每次在画布上点击「生成本页 UI」成功后，会覆盖此文件。可复制下方代码块到本地或 [CodeSandbox](https://codesandbox.io) 等环境渲染，与图中预期对比。

## 本次生成上下文

| 项 | 值 |
| --- | --- |
| 生成时间 | 2026-03-03T08:51:40.828Z |
| 节点名称 | 数据报表 |
| 视口 | desktop |
| flex-1 | true |
| <main> | true |
| ListItem 数量 | 2 |
| Card 数量 | 6 |
| NavBar | false |
| AppBar | true |
| 根 flex-col | true |

### 发给模型的页面描述（pageDescription）


页面：数据报表。页面描述：数据报表页：统计图表（折线/柱状/饼图）、时间筛选、导出按钮、核心指标卡片。用于运营或业务概览。。作为管理员，查看数据报表与趋势，以便支撑决策与复盘。作为管理员，查看数据报表与趋势，以便支撑决策与复盘。验收标准：页面布局与描述一致；使用 Button/Card 等组件；内容充实非占位


---

## 代码（复制下方整块到可运行 React+Tailwind 环境对比）

```tsx
export default function Page() {
  const kpi = [
    {
      title: "本月总营收（元）",
      value: "¥ 12,684,200",
      helper: "较上月 +8.6%",
      trend: "up",
      foot: "统计口径：已支付订单（含补差价）",
    },
    {
      title: "订单量",
      value: "186,420",
      helper: "较上月 +4.1%",
      trend: "up",
      foot: "统计口径：支付成功订单数",
    },
    {
      title: "支付转化率",
      value: "3.72%",
      helper: "较上月 -0.18pp",
      trend: "down",
      foot: "统计口径：支付订单/访问会话",
    },
    {
      title: "退款率",
      value: "1.26%",
      helper: "较上月 +0.09pp",
      trend: "up",
      foot: "统计口径：退款订单/支付订单",
    },
  ];

  const topChannels = [
    { name: "自然搜索", amount: 4126000, orders: 48620, cvr: 4.12, roi: 5.8, share: 32.5, delta: "+6.1%" },
    { name: "信息流投放", amount: 3268000, orders: 39810, cvr: 3.36, roi: 3.9, share: 25.8, delta: "+2.4%" },
    { name: "会员复购", amount: 2489000, orders: 31240, cvr: 6.21, roi: 9.4, share: 19.6, delta: "+1.2%" },
    { name: "内容种草", amount: 1593000, orders: 20860, cvr: 2.74, roi: 4.6, share: 12.6, delta: "+3.7%" },
    { name: "线下导流", amount: 865200, orders: 12640, cvr: 3.01, roi: 2.7, share: 6.8, delta: "-0.8%" },
    { name: "联盟分销", amount: 468000, orders: 7250, cvr: 2.08, roi: 3.1, share: 3.7, delta: "+0.3%" },
  ];

  const keyEvents = [
    {
      title: "3.8 女神节专题页上线",
      sub: "活动页曝光提升、客单价小幅上行；建议复盘素材与落地页转化链路",
      time: "2026-03-01 10:00",
      status: "已复盘",
      severity: "低",
      owner: "运营：宋雨婷",
    },
    {
      title: "支付渠道 A 间歇性超时",
      sub: "影响 7 分钟，支付失败率峰值 2.9%；已切换备用通道并补发券",
      time: "2026-02-26 21:14",
      status: "已恢复",
      severity: "高",
      owner: "值班：邓工",
    },
    {
      title: "投放素材批次更新（信息流）",
      sub: "CTR 提升 0.4pp，但转化率下降 0.12pp；建议优化人群包与落地页一致性",
      time: "2026-02-22 09:30",
      status: "观察中",
      severity: "中",
      owner: "投放：谢景然",
    },
    {
      title: "会员积分规则调整",
      sub: "复购占比提升；高价值会员客单价上升 3.2%",
      time: "2026-02-18 16:40",
      status: "已归档",
      severity: "低",
      owner: "产品：温之航",
    },
    {
      title: "华北仓发货时效波动",
      sub: "延迟订单占比 1.6%，已增加临时人手并调整波次策略",
      time: "2026-02-13 12:05",
      status: "已恢复",
      severity: "中",
      owner: "供应链：林嘉宁",
    },
    {
      title: "App 版本 4.9.0 灰度发布",
      sub: "新增下单页地址智能补全；崩溃率下降 0.06pp",
      time: "2026-02-09 19:20",
      status: "已归档",
      severity: "低",
      owner: "研发：周启明",
    },
  ];

  const days = [
    { d: "02-18", rev: 380, ord: 5150 },
    { d: "02-19", rev: 402, ord: 5320 },
    { d: "02-20", rev: 396, ord: 5210 },
    { d: "02-21", rev: 438, ord: 5630 },
    { d: "02-22", rev: 472, ord: 5970 },
    { d: "02-23", rev: 458, ord: 5810 },
    { d: "02-24", rev: 486, ord: 6120 },
    { d: "02-25", rev: 508, ord: 6340 },
    { d: "02-26", rev: 465, ord: 6020 },
    { d: "02-27", rev: 522, ord: 6510 },
    { d: "02-28", rev: 548, ord: 6820 },
    { d: "03-01", rev: 596, ord: 7240 },
    { d: "03-02", rev: 572, ord: 7080 },
    { d: "03-03", rev: 612, ord: 7420 },
  ];

  const maxRev = Math.max(...days.map((x) => x.rev));
  const maxOrd = Math.max(...days.map((x) => x.ord));

  const pie = [
    { label: "新客", value: 44, color: "bg-sky-500" },
    { label: "老客复购", value: 38, color: "bg-emerald-500" },
    { label: "会员专享", value: 12, color: "bg-indigo-500" },
    { label: "企业团购", value: 6, color: "bg-amber-500" },
  ];

  const severityBadge = (s) => {
    if (s === "高") return <Badge className="bg-rose-600 hover:bg-rose-600">高</Badge>;
    if (s === "中") return <Badge className="bg-amber-500 hover:bg-amber-500">中</Badge>;
    return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">低</Badge>;
  };

  const statusBadge = (s) => {
    if (s === "已恢复") return <Badge className="bg-emerald-600 hover:bg-emerald-600">已恢复</Badge>;
    if (s === "观察中") return <Badge className="bg-sky-600 hover:bg-sky-600">观察中</Badge>;
    if (s === "已复盘") return <Badge className="bg-indigo-600 hover:bg-indigo-600">已复盘</Badge>;
    return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">已归档</Badge>;
  };

  const Spark = ({ up = true }) => (
    <svg viewBox="0 0 24 24" className={cn("w-4 h-4", up ? "text-emerald-600" : "text-rose-600")} fill="none">
      <path
        d={up ? "M4 16l6-6 4 4 6-8" : "M4 8l6 6 4-4 6 8"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={up ? "M18 6h4v4" : "M18 18h4v-4"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className={cn("flex flex-col h-full min-h-full bg-gray-50 text-slate-900")}>
      <AppBar
        title="数据报表"
        right={
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="min-h-[44px]">
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path
                    d="M12 3v10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 9l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 17v3h16v-3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                导出
              </span>
            </Button>
            <Button className="min-h-[44px]">
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path
                    d="M3 11h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 11V7a5 5 0 0110 0v4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 11v6a2 2 0 002 2h6a2 2 0 002-2v-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                生成周报
              </span>
            </Button>
          </div>
        }
      />

      <main className={cn("flex-1 min-h-0 overflow-y-auto")}>
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          <PageHeader
            title="运营数据概览"
            description="支持按时间范围查看趋势、渠道贡献与关键事件。数据延迟约 5–10 分钟。"
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">筛选条件</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3 space-y-2">
                  <Label>时间范围</Label>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="min-h-[44px] flex-1">
                      近 7 天
                    </Button>
                    <Button variant="secondary" className="min-h-[44px] flex-1">
                      近 30 天
                    </Button>
                    <Button variant="secondary" className="min-h-[44px] flex-1">
                      本月
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-2">
                  <Label>开始日期</Label>
                  <Input defaultValue="2026-02-18" className="min-h-[44px]" />
                </div>

                <div className="md:col-span-3 space-y-2">
                  <Label>结束日期</Label>
                  <Input defaultValue="2026-03-03" className="min-h-[44px]" />
                </div>

                <div className="md:col-span-3 space-y-2">
                  <Label>业务线/站点</Label>
                  <Input defaultValue="电商主站（App + H5）" className="min-h-[44px]" />
                </div>

                <div className="md:col-span-4 space-y-2">
                  <Label>渠道（可模糊搜索）</Label>
                  <Input defaultValue="全部渠道" className="min-h-[44px]" />
                </div>

                <div className="md:col-span-4 space-y-2">
                  <Label>指标口径</Label>
                  <Input defaultValue="支付口径（推荐）" className="min-h-[44px]" />
                </div>

                <div className="md:col-span-4 flex items-end gap-2">
                  <Button className="min-h-[44px] flex-1">应用筛选</Button>
                  <Button variant="secondary" className="min-h-[44px] flex-1">
                    重置
                  </Button>
                </div>
              </div>

              <Alert>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-700" fill="none">
                      <path
                        d="M12 9v4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 17h.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10.3 4.3l-7.3 13A2 2 0 004.7 20h14.6a2 2 0 001.7-2.7l-7.3-13a2 2 0 00-3.4 0z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-slate-900">数据提示</div>
                    <div className="text-sm text-slate-600">
                      当前选择范围内包含 1 次支付通道异常与 1 次仓配波动，可能对峰值与转化产生短期影响。导出会包含原始明细与口径说明。
                    </div>
                  </div>
                </div>
              </Alert>

              <div className="flex items-center justify-between rounded-lg border bg-white p-4">
                <div className="space-y-1">
                  <div className="font-medium">自动刷新</div>
                  <div className="text-sm text-slate-600">每 10 分钟拉取最新统计（仅影响图表，不影响已导出文件）。</div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpi.map((x) => (
              <StatCard
                key={x.title}
                title={x.title}
                value={x.value}
                helper={
                  <span className="inline-flex items-center gap-1">
                    <Spark up={x.trend === "up"} />
                    <span className={cn("font-medium", x.trend === "up" ? "text-emerald-700" : "text-rose-700")}>
                      {x.helper}
                    </span>
                  </span>
                }
                footer={<span className="text-xs text-slate-500">{x.foot}</span>}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-8">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base md:text-lg">趋势分析：营收与订单量</CardTitle>
                    <div className="text-sm text-slate-600">近 14 天（单位：营收=万元，订单=单）</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-900 hover:bg-slate-900">营收</Badge>
                    <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">订单</Badge>
                  </div>
                </div>
                <Separator />
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-600">区间营收</div>
                        <div className="mt-1 text-lg font-bold">¥ 7,457,000</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600">峰值日</div>
                        <div className="mt-1 font-medium">03-03（¥612 万）</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">说明：峰值日为选择范围内单日营收最高值。</div>
                  </div>

                  <div className="rounded-lg border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-600">区间订单</div>
                        <div className="mt-1 text-lg font-bold">88,430</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600">峰值日</div>
                        <div className="mt-1 font-medium">03-03（7,420 单）</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">说明：订单量按支付成功计数，不含取消/超时未支付。</div>
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">折线（营收）</div>
                    <div className="text-sm text-slate-600">最大值：{maxRev} 万</div>
                  </div>
                  <div className="mt-3 flex items-end gap-2 h-40">
                    {days.map((x) => {
                      const h = Math.max(6, Math.round((x.rev / maxRev) * 100));
                      return (
                        <div key={x.d} className="flex-1 min-w-0">
                          <div className="flex flex-col items-stretch justify-end h-36">
                            <div className="rounded-md bg-slate-900/90" style={undefined} className={cn("rounded-md bg-slate-900/90", `h-[${h}%]`)} />
                          </div>
                          <div className="mt-2 text-[11px] text-slate-500 text-center truncate">{x.d}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="text-slate-600">日均营收</div>
                      <div className="mt-1 font-medium">¥ 532 万</div>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="text-slate-600">日均订单</div>
                      <div className="mt-1 font-medium">6,316 单</div>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="text-slate-600">客单价</div>
                      <div className="mt-1 font-medium">¥ 84.1</div>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="text-slate-600">支付成功率</div>
                      <div className="mt-1 font-medium">92.7%</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">柱状（订单量）</div>
                    <div className="text-sm text-slate-600">最大值：{maxOrd} 单</div>
                  </div>
                  <div className="mt-3 flex items-end gap-2 h-36">
                    {days.map((x) => {
                      const h = Math.max(6, Math.round((x.ord / maxOrd) * 100));
                      return (
                        <div key={x.d} className="flex-1 min-w-0">
                          <div className="flex flex-col items-stretch justify-end h-28">
                            <div className={cn("rounded-md bg-slate-300", `h-[${h}%]`)} />
                          </div>
                          <div className="mt-2 text-[11px] text-slate-500 text-center truncate">{x.d}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    观察：02-26 支付通道异常导致订单短暂下滑，03-01 活动上线后逐步恢复并创新高。
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-slate-600">更新时间：2026-03-03 10:20（北京）</div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" className="min-h-[44px]">
                    查看明细
                  </Button>
                  <Button className="min-h-[44px]">创建订阅</Button>
                </div>
              </CardFooter>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base md:text-lg">用户结构（饼图）</CardTitle>
                    <div className="text-sm text-slate-600">按支付用户去重</div>
                  </div>
                  <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">近 14 天</Badge>
                </div>
                <Separator />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">占比概览</div>
                    <div className="text-sm text-slate-600">总用户：1,248,600</div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {pie.map((x) => (
                      <div key={x.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2.5 h-2.5 rounded-full", x.color)} />
                            <span className="font-medium text-slate-800">{x.label}</span>
                          </div>
                          <span className="text-slate-600">{x.value}%</span>
                        </div>
                        <Progress value={x.value} />
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="text-slate-600">新客占比</div>
                      <div className="mt-1 font-medium">44%</div>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="text-slate-600">复购率</div>
                      <div className="mt-1 font-medium">28.9%</div>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="text-slate-600">会员渗透</div>
                      <div className="mt-1 font-medium">17.4%</div>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="text-slate-600">人均下单</div>
                      <div className="mt-1 font-medium">1.36 单</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    建议：新客占比高时关注首单转化与首购体验；复购下滑时优先排查物流、售后与价格体系波动。
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-4 space-y-3">
                  <div className="font-medium">目标完成度（本月）</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">营收目标：¥ 1,500 万</span>
                      <span className="font-medium text-slate-900">84.6%</span>
                    </div>
                    <Progress value={84.6} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">订单目标：22 万单</span>
                      <span className="font-medium text-slate-900">77.1%</span>
                    </div>
                    <Progress value={77.1} />
                  </div>
                  <div className="text-xs text-slate-500">口径：自然月累计；目标由经营看板同步。</div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-end gap-2">
                <Button variant="secondary" className="min-h-[44px]">
                  配置口径
                </Button>
                <Button className="min-h-[44px]">下载图表</Button>
              </CardFooter>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base md:text-lg">渠道贡献（TOP 6）</CardTitle>
                    <div className="text-sm text-slate-600">按营收贡献排序，含 ROI、转化率与环比</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" className="min-h-[44px]">查看全部</Button>
                    <Button className="min-h-[44px]">导出渠道表</Button>
                  </div>
                </div>
                <Separator />
              </CardHeader>
              <CardContent className="space-y-2">
                {topChannels.map((c) => (
                  <ListItem
                    key={c.name}
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">占比 {c.share}%</Badge>
                        <Badge className={cn(c.delta.startsWith("+") ? "bg-emerald-600 hover:bg-emerald-600" : "bg-rose-600 hover:bg-rose-600")}>
                          环比 {c.delta}
                        </Badge>
                      </div>
                    }
                    description={
                      <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-600">
                        <span>营收：¥ {(c.amount / 10000).toFixed(1)} 万</span>
                        <span>订单：{c.orders.toLocaleString()} 单</span>
                        <span>CVR：{c.cvr.toFixed(2)}%</span>
                        <span>ROI：{c.roi.toFixed(1)}</span>
                      </div>
                    }
                    right={
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" className="min-h-[44px]">对比</Button>
                        <Button className="min-h-[44px]">查看</Button>
                      </div>
                    }
                  />
                ))}
              </CardContent>
              <CardFooter className="text-sm text-slate-600 flex items-center justify-between">
                <span>提示：ROI 计算为（归因营收/投放花费），归因窗口 7 天。</span>
                <span>数据源：CDP + 订单中心</span>
              </CardFooter>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base md:text-lg">关键事件与异常</CardTitle>
                    <div className="text-sm text-slate-600">用于复盘：活动、系统异常、供应链波动</div>
                  </div>
                  <Button variant="secondary" className="min-h-[44px]">新增事件</Button>
                </div>
                <Separator />
              </CardHeader>
              <CardContent className="space-y-2">
                {keyEvents.map((e) => (
                  <ListItem
                    key={e.title + e.time}
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{e.title}</span>
                        {severityBadge(e.severity)}
                        {statusBadge(e.status)}
                      </div>
                    }
                    description={
                      <div className="space-y-1">
                        <div className="text-sm text-slate-600">{e.sub}</div>
                        <div className="text-xs text-slate-500">
                          时间：{e.time} · 负责人：{e.owner}
                        </div>
                      </div>
                    }
                    right={
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" className="min-h-[44px]">复盘</Button>
                        <Button className="min-h-[44px]">详情</Button>
                      </div>
                    }
                  />
                ))}
              </CardContent>
              <CardFooter className="flex items-center justify-between text-sm text-slate-600">
                <span>本周期事件：{keyEvents.length} 条</span>
                <span>建议：将异常日加入对照组，避免误判投放/活动效果。</span>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-base md:text-lg">报表备注（供复盘与交接）</CardTitle>
                  <div className="text-sm text-slate-600">记录本周期关键判断、策略调整与待跟进事项</div>
                </div>
                <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">仅管理员可见</Badge>
              </div>
              <Separator />
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8 space-y-2">
                <Label>备注</Label>
                <Textarea
                  className="min-h-[140px]"
                  defaultValue={
                    "1）信息流投放 CTR 提升但 CVR 下降：优先排查落地页首屏信息与素材一致性，建议将“到手价/发货时效”前置。\n2）02-26 支付通道异常对转化有短时影响，复盘时需剔除该时间段。\n3）会员复购渠道 ROI 表现最佳，建议加大会员权益曝光与召回触达频次（控制频控）。"
                  }
                />
                <div className="text-xs text-slate-500">提示：备注会随导出一起写入“口径说明”页。</div>
              </div>
              <div className="lg:col-span-4 space-y-3">
                <div className="rounded-lg border bg-white p-4 space-y-2">
                  <div className="font-medium">本周期结论</div>
                  <div className="text-sm text-slate-600">营收稳步上行，活动上线后峰值明显；需重点优化投放链路转化与支付稳定性。</div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">优先级 P0</span>
                      <span className="font-medium">支付链路稳定性</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">优先级 P1</span>
                      <span className="font-medium">投放落地页一致性</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">优先级 P2</span>
                      <span className="font-medium">会员召回策略</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-4 space-y-2">
                  <div className="font-medium">协作人</div>
                  <div className="flex items-center gap-3">
                    <Avatar fallback="宋" />
                    <div className="min-w-0">
                      <div className="font-medium">宋雨婷</div>
                      <div className="text-sm text-slate-600 truncate">运营负责人 · 活动/转化</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar fallback="邓" />
                    <div className="min-w-0">
                      <div className="font-medium">邓子安</div>
                      <div className="text-sm text-slate-600 truncate">平台值班 · 支付/稳定性</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar fallback="林" />
                    <div className="min-w-0">
                      <div className="font-medium">林嘉宁</div>
                      <div className="text-sm text-slate-600 truncate">供应链 · 仓配时效</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-end gap-2">
              <Button variant="secondary" className="min-h-[44px]">保存草稿</Button>
              <Button className="min-h-[44px]">发布到经营群</Button>
            </CardFooter>
          </Card>

          <div className="pb-2 text-xs text-slate-500">
            © 2026 运营数据平台 · 报表口径如有变更，请在「配置口径」中同步更新并重新导出。
          </div>
        </div>
      </main>
    </div>
  );
}
```
