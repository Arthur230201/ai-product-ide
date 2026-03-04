# 上次 AI 返回的 UI 代码

每次在画布上点击「生成本页 UI」成功后，会覆盖此文件。可复制下方代码块到本地或 [CodeSandbox](https://codesandbox.io) 等环境渲染，与图中预期对比。

## 本次生成上下文

| 项 | 值 |
| --- | --- |
| 生成时间 | 2026-03-04T14:45:47.397Z |
| 节点名称 | 商品列表 |
| 视口 | desktop |
| flex-1 | true |
| <main> | true |
| ListItem 数量 | 2 |
| Card 数量 | 5 |
| NavBar | false |
| AppBar | true |
| 根 flex-col | true |

### 发给模型的页面描述（pageDescription）


页面：商品列表。页面描述：发现/列表页，包含搜索框、筛选（类目/价格区间/是否有货）、排序（综合/销量/价格）、分页加载；状态包含无结果/加载中/错误；点击进入详情。。作为用户，筛选与排序商品，以便更快找到合适的商品。作为用户，筛选与排序商品，以便更快找到合适的商品。验收标准：选择筛选条件后列表刷新并展示结果数；切换排序后列表按所选规则重新排列；无结果时展示空态并支持清除筛选。作为用户，从列表进入商品详情，以便了解商品信息并做购买决策。验收标准：点击任一条目进入对应详情页；返回时保留筛选、排序与滚动位置


---

## 代码（复制下方整块到可运行 React+Tailwind 环境对比）

```tsx
export default function App() {
  const products = [
    {
      id: "SKU-240318-001",
      name: "星野极简真皮通勤托特包 13.3 英寸",
      category: "箱包 / 通勤",
      price: 899,
      marketPrice: 1099,
      stock: 42,
      sold30d: 128,
      rating: 4.7,
      reviews: 326,
      status: "在售",
      updatedAt: "2026-03-02 14:18",
      tags: ["爆款", "次日达", "可开发票"],
    },
    {
      id: "SKU-240521-014",
      name: "澄川·四季恒温保温杯 480ml（磨砂黑）",
      category: "居家 / 水具",
      price: 129,
      marketPrice: 169,
      stock: 306,
      sold30d: 986,
      rating: 4.8,
      reviews: 2148,
      status: "在售",
      updatedAt: "2026-03-01 09:40",
      tags: ["高复购", "食品级304", "包邮"],
    },
    {
      id: "SKU-241102-008",
      name: "南风轻薄羽绒服 90% 白鸭绒（女款）",
      category: "服饰 / 冬季",
      price: 599,
      marketPrice: 799,
      stock: 0,
      sold30d: 412,
      rating: 4.6,
      reviews: 892,
      status: "缺货",
      updatedAt: "2026-02-28 19:05",
      tags: ["保暖", "轻量", "支持退换"],
    },
    {
      id: "SKU-250105-021",
      name: "澜屿海盐洗发水 500ml（控油蓬松）",
      category: "个护 / 洗护",
      price: 79,
      marketPrice: 99,
      stock: 118,
      sold30d: 1534,
      rating: 4.5,
      reviews: 5312,
      status: "在售",
      updatedAt: "2026-03-03 11:22",
      tags: ["新品", "无硅油", "敏感头皮适用"],
    },
    {
      id: "SKU-240909-003",
      name: "曜石机械键盘 98 键 热插拔（白光）",
      category: "数码 / 外设",
      price: 329,
      marketPrice: 399,
      stock: 67,
      sold30d: 245,
      rating: 4.4,
      reviews: 764,
      status: "在售",
      updatedAt: "2026-03-01 16:10",
      tags: ["热插拔", "静音轴", "两年质保"],
    },
    {
      id: "SKU-240707-019",
      name: "云栖记忆枕（高低可调）",
      category: "家纺 / 寝具",
      price: 159,
      marketPrice: 219,
      stock: 24,
      sold30d: 368,
      rating: 4.7,
      reviews: 1421,
      status: "在售",
      updatedAt: "2026-02-27 10:08",
      tags: ["舒压", "护颈", "满减"],
    },
    {
      id: "SKU-241225-006",
      name: "岚光氛围台灯（无极调光 / Type-C）",
      category: "家居 / 灯具",
      price: 119,
      marketPrice: 149,
      stock: 9,
      sold30d: 176,
      rating: 4.6,
      reviews: 506,
      status: "低库存",
      updatedAt: "2026-03-03 08:12",
      tags: ["护眼", "无频闪", "礼品装"],
    },
  ];

  const statusBadge = (status: string) => {
    if (status === "在售") return <Badge className="bg-emerald-600 text-white">在售</Badge>;
    if (status === "缺货") return <Badge className="bg-rose-600 text-white">缺货</Badge>;
    if (status === "低库存") return <Badge className="bg-amber-500 text-white">低库存</Badge>;
    return <Badge className="bg-slate-600 text-white">{status}</Badge>;
  };

  const Stars = ({ value }: { value: number }) => {
    const full = Math.floor(value);
    const half = value - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: full }).map((_, i) => (
          <span key={`f-${i}`} className="text-amber-500">
            ★
          </span>
        ))}
        {half ? <span className="text-amber-500">☆</span> : null}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`e-${i}`} className="text-slate-300">
            ★
          </span>
        ))}
        <span className="ml-1 text-xs text-slate-500">{value.toFixed(1)}</span>
      </div>
    );
  };

  const TopIcon = ({ type }: { type: "search" | "plus" | "export" | "filter" }) => {
    const base = "w-4 h-4";
    if (type === "search")
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    if (type === "plus")
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    if (type === "export")
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 3v10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 7l4-4 4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    return (
      <svg viewBox="0 0 24 24" fill="none" className={base} xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 6h16M7 12h10M10 18h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div className={cn("flex flex-col h-full min-h-full bg-gray-50")}>
      <AppBar
        title="商品列表"
        className="border-b bg-white"
        right={
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="gap-2">
              <TopIcon type="export" />
              导出
            </Button>
            <Button className="gap-2">
              <TopIcon type="plus" />
              新增商品
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar className="min-w-[240px] border-r bg-white">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Avatar
                src="https://images.unsplash.com/photo-1520975682031-a4c3ad5c3ea2?auto=format&fit=crop&w=128&q=80"
                alt="店铺头像"
              />
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 truncate">栖木生活馆（北京）</div>
                <div className="text-xs text-slate-500 truncate">近 7 日 GMV ¥128,460</div>
              </div>
            </div>
          </div>
          <Separator />
          <div className="p-2">
            <SidebarItem active>商品管理</SidebarItem>
            <SidebarItem>订单管理</SidebarItem>
            <SidebarItem>库存预警</SidebarItem>
            <SidebarItem>营销活动</SidebarItem>
            <SidebarItem>店铺设置</SidebarItem>
          </div>
          <Separator />
          <div className="p-4">
            <Alert className="bg-slate-50 border-slate-200 text-slate-700">
              <div className="font-medium">经营提示</div>
              <div className="text-sm mt-1 whitespace-normal">
                低库存商品共 <span className="font-semibold">2</span> 款，建议补货以避免影响转化；缺货商品可一键下架。
              </div>
            </Alert>
          </div>
        </Sidebar>

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <StatCard title="在售商品" value="5" desc="可正常售卖" />
              <StatCard title="缺货商品" value="1" desc="建议补货或下架" />
              <StatCard title="30 天销量" value="3,849" desc="全店合计" />
              <StatCard title="平均评分" value="4.66" desc="近 90 天" />
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>筛选与搜索</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5">
                      <Label className="text-sm text-slate-700">关键词</Label>
                      <div className="mt-2 flex gap-2">
                        <div className="flex-1">
                          <Input placeholder="输入商品名 / SKU / 类目" />
                        </div>
                        <Button variant="secondary" className="gap-2">
                          <TopIcon type="search" />
                          搜索
                        </Button>
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <Label className="text-sm text-slate-700">状态</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button variant="secondary">全部</Button>
                        <Button variant="secondary">在售</Button>
                        <Button variant="secondary">低库存</Button>
                        <Button variant="secondary">缺货</Button>
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-sm text-slate-700">快捷操作</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button variant="secondary" className="gap-2">
                          <TopIcon type="filter" />
                          高级筛选
                        </Button>
                        <Button variant="secondary">批量上下架</Button>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm text-slate-600 whitespace-normal">
                      当前共 <span className="font-semibold text-slate-900">{products.length}</span> 件商品，已按「近 30 天销量」排序。
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-900 text-white">默认排序</Badge>
                      <Badge className="bg-white text-slate-700 border border-slate-200">销量</Badge>
                      <Badge className="bg-white text-slate-700 border border-slate-200">价格</Badge>
                      <Badge className="bg-white text-slate-700 border border-slate-200">库存</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>上新与风控</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Badge className="bg-emerald-600 text-white">通过</Badge>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900">资质校验</div>
                        <div className="text-sm text-slate-600 whitespace-normal">
                          店铺资质与类目授权有效期至 2027-01-15。
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Badge className="bg-amber-500 text-white">提醒</Badge>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900">图片规范</div>
                        <div className="text-sm text-slate-600 whitespace-normal">
                          建议主图保持纯色背景并突出主体，点击「新增商品」可自动检测合规性。
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Badge className="bg-slate-700 text-white">建议</Badge>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900">定价策略</div>
                        <div className="text-sm text-slate-600 whitespace-normal">
                          近 7 日同类均价 ¥162，建议对热卖款进行 5% 促销测试。
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">数据更新时间：2026-03-03 12:00</div>
                  <Button variant="secondary">查看建议</Button>
                </CardFooter>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle>商品明细</CardTitle>
                    <div className="text-sm text-slate-500 mt-1 whitespace-normal">
                      支持快速编辑价格/库存与上下架管理；低库存与缺货会自动标记。
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary">批量改价</Button>
                    <Button variant="secondary">批量补货</Button>
                    <Button variant="secondary">下载模板</Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {products
                      .slice()
                      .sort((a, b) => b.sold30d - a.sold30d)
                      .map((p) => (
                        <ListItem
                          key={p.id}
                          title={
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-semibold text-slate-900 truncate">{p.name}</span>
                              {statusBadge(p.status)}
                            </div>
                          }
                          subtitle={
                            <div className="mt-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                                <span className="text-slate-500">SKU：</span>
                                <span className="font-medium text-slate-800">{p.id}</span>
                                <span className="text-slate-500">类目：</span>
                                <span className="font-medium text-slate-800">{p.category}</span>
                                <span className="text-slate-500">更新：</span>
                                <span className="font-medium text-slate-800">{p.updatedAt}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="flex items-end gap-2">
                                  <span className="text-lg font-bold text-slate-900">¥{p.price}</span>
                                  <span className="text-sm text-slate-400 line-through">¥{p.marketPrice}</span>
                                </div>
                                <Separator className="hidden sm:block w-px h-4" />
                                <div className="text-sm text-slate-600">
                                  库存 <span className="font-semibold text-slate-900">{p.stock}</span>
                                </div>
                                <Separator className="hidden sm:block w-px h-4" />
                                <div className="text-sm text-slate-600">
                                  30天销量 <span className="font-semibold text-slate-900">{p.sold30d}</span>
                                </div>
                                <Separator className="hidden sm:block w-px h-4" />
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Stars value={p.rating} />
                                  <span className="text-slate-500">({p.reviews} 评价)</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {p.tags.map((t) => (
                                  <Badge key={t} className="bg-white text-slate-700 border border-slate-200">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          }
                          action={
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <Button variant="secondary">编辑</Button>
                              <Button variant="secondary">上下架</Button>
                              <Button>查看</Button>
                            </div>
                          }
                        />
                      ))}
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    本页展示 <span className="font-semibold text-slate-900">{products.length}</span> 条，更多筛选可使用「高级筛选」。
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary">上一页</Button>
                    <Button variant="secondary">下一页</Button>
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>类目销量占比（近 30 天）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "个护 / 洗护", value: 1534, pct: 40 },
                      { name: "居家 / 水具", value: 986, pct: 26 },
                      { name: "服饰 / 冬季", value: 412, pct: 11 },
                      { name: "家纺 / 寝具", value: 368, pct: 10 },
                      { name: "数码 / 外设", value: 245, pct: 6 },
                      { name: "箱包 / 通勤", value: 128, pct: 3 },
                      { name: "家居 / 灯具", value: 176, pct: 4 },
                    ].map((row) => (
                      <div key={row.name} className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <div className="font-medium text-slate-900">{row.name}</div>
                          <div className="text-sm text-slate-600">
                            {row.value} 件 <span className="text-slate-400">·</span> {row.pct}%
                          </div>
                        </div>
                        <Progress value={row.pct} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>今日待处理</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        title: "处理缺货商品下架",
                        desc: "南风轻薄羽绒服已连续缺货 3 天，建议先下架以避免差评。",
                        tag: "紧急",
                      },
                      {
                        title: "补货：岚光氛围台灯",
                        desc: "当前库存 9，近 7 日日均销量 8，建议补货 80。",
                        tag: "库存",
                      },
                      {
                        title: "优化主图：记忆枕",
                        desc: "主图点击率低于类目均值 12%，建议更换对比图提升转化。",
                        tag: "运营",
                      },
                      {
                        title: "活动报名：春季焕新专场",
                        desc: "爆款保温杯可报名满减，预计提升 18% 转化。",
                        tag: "营销",
                      },
                      {
                        title: "核对运费模板",
                        desc: "西北地区运费略高，建议调整以减少下单流失。",
                        tag: "设置",
                      },
                    ].map((t) => (
                      <ListItem
                        key={t.title}
                        title={
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{t.title}</span>
                            <Badge className="bg-white text-slate-700 border border-slate-200">{t.tag}</Badge>
                          </div>
                        }
                        subtitle={<div className="text-sm text-slate-600 whitespace-normal mt-1">{t.desc}</div>}
                        action={
                          <div className="flex items-center gap-2">
                            <Button variant="secondary">稍后</Button>
                            <Button>去处理</Button>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">建议按「紧急」优先处理，减少售后风险。</div>
                  <Button variant="secondary">查看全部任务</Button>
                </CardFooter>
              </Card>
            </div>

            <div className="mt-8">
              <Separator />
              <div className="py-6 flex items-center justify-between">
                <div className="text-sm text-slate-500 whitespace-normal">
                  © 2026 栖木生活馆 · 商品管理台（示例数据）
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary">帮助中心</Button>
                  <Button variant="secondary">联系运营</Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
```
