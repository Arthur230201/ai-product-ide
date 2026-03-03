# 上次 AI 返回的 UI 代码

每次在画布上点击「生成本页 UI」成功后，会覆盖此文件。可复制下方代码块到本地或 [CodeSandbox](https://codesandbox.io) 等环境渲染，与图中预期对比。

## 本次生成上下文

| 项 | 值 |
| --- | --- |
| 生成时间 | 2026-03-03T05:44:53.225Z |
| 节点名称 | 角色与权限 |
| 视口 | desktop |
| flex-1 | true |
| <main> | false |
| ListItem 数量 | 5 |
| Card 数量 | 10 |
| NavBar | false |
| AppBar | true |
| 根 flex-col | true |

### 发给模型的页面描述（pageDescription）


页面：角色与权限。页面描述：角色与权限页：角色列表、权限树/勾选、分配权限、新建角色。展示角色与菜单/权限的对应关系。。作为管理员，配置角色与权限，以便控制功能与数据访问范围。作为管理员，配置角色与权限，以便控制功能与数据访问范围。验收标准：页面布局与描述一致；使用 Button/Card 等组件；内容充实非占位


---

## 代码（复制下方整块到可运行 React+Tailwind 环境对比）

```tsx
export default function Page() {
  const roles = [
    {
      id: "r1",
      name: "系统管理员",
      code: "SYS_ADMIN",
      desc: "拥有平台全部功能与数据权限，负责租户/组织/用户/权限配置。",
      users: 6,
      updatedAt: "2026-03-01 10:24",
      status: "启用",
      level: "高权限",
      scope: "全局",
    },
    {
      id: "r2",
      name: "安全审计员",
      code: "SEC_AUDITOR",
      desc: "只读访问安全相关配置与审计日志，支持导出与风险核查。",
      users: 3,
      updatedAt: "2026-02-27 16:08",
      status: "启用",
      level: "中权限",
      scope: "全局",
    },
    {
      id: "r3",
      name: "运营主管",
      code: "OPS_LEAD",
      desc: "管理内容/工单/活动配置，审批运营变更，查看运营看板。",
      users: 12,
      updatedAt: "2026-02-25 09:42",
      status: "启用",
      level: "中权限",
      scope: "本组织",
    },
    {
      id: "r4",
      name: "客服专员",
      code: "CS_AGENT",
      desc: "处理客户咨询与工单，访问客户基础信息与沟通记录（脱敏）。",
      users: 28,
      updatedAt: "2026-02-23 19:11",
      status: "启用",
      level: "基础",
      scope: "本组织",
    },
    {
      id: "r5",
      name: "财务出纳",
      code: "FIN_CASHIER",
      desc: "处理对账与开票，访问订单/发票数据（不含风控策略配置）。",
      users: 4,
      updatedAt: "2026-02-21 14:56",
      status: "停用",
      level: "基础",
      scope: "本组织",
    },
    {
      id: "r6",
      name: "数据分析师",
      code: "DATA_ANALYST",
      desc: "查看分析报表与指标，支持数据导出（按字段权限控制）。",
      users: 7,
      updatedAt: "2026-02-20 11:03",
      status: "启用",
      level: "基础",
      scope: "本组织",
    },
  ];

  const permissions = [
    {
      id: "p1",
      title: "控制台",
      desc: "平台核心概览与快捷入口",
      children: [
        { id: "p1-1", title: "控制台总览", desc: "查看关键指标、待办与告警" },
        { id: "p1-2", title: "运营看板", desc: "订单/转化/留存趋势与渠道分布" },
        { id: "p1-3", title: "告警中心", desc: "系统/业务告警查看与确认" },
      ],
    },
    {
      id: "p2",
      title: "用户与组织",
      desc: "人员、组织架构与认证配置",
      children: [
        { id: "p2-1", title: "用户管理", desc: "新建/停用用户、重置密码、分配角色" },
        { id: "p2-2", title: "组织架构", desc: "部门与岗位维护、上下级关系" },
        { id: "p2-3", title: "登录与安全", desc: "二次验证、登录策略与设备管理" },
      ],
    },
    {
      id: "p3",
      title: "角色与权限",
      desc: "RBAC 角色、菜单与数据权限",
      children: [
        { id: "p3-1", title: "角色管理", desc: "新建角色、配置权限、绑定用户" },
        { id: "p3-2", title: "权限策略", desc: "菜单权限、按钮权限与字段权限" },
        { id: "p3-3", title: "数据范围", desc: "全局/本组织/本人/自定义范围" },
      ],
    },
    {
      id: "p4",
      title: "工单与客服",
      desc: "服务台能力与工单流程",
      children: [
        { id: "p4-1", title: "工单列表", desc: "受理/流转/关闭工单，支持 SLA" },
        { id: "p4-2", title: "知识库", desc: "FAQ 与标准话术维护" },
        { id: "p4-3", title: "评价与质检", desc: "满意度、抽检与改进建议" },
      ],
    },
    {
      id: "p5",
      title: "订单与财务",
      desc: "交易、对账与发票",
      children: [
        { id: "p5-1", title: "订单管理", desc: "订单查询、退款与异常处理" },
        { id: "p5-2", title: "对账中心", desc: "渠道对账、差异处理、日结" },
        { id: "p5-3", title: "发票管理", desc: "开票申请、审核、发票作废" },
      ],
    },
    {
      id: "p6",
      title: "系统设置",
      desc: "配置与运维相关能力",
      children: [
        { id: "p6-1", title: "参数配置", desc: "业务参数与开关配置" },
        { id: "p6-2", title: "审计日志", desc: "关键操作留痕与导出" },
        { id: "p6-3", title: "API 密钥", desc: "开放平台密钥与调用限制" },
      ],
    },
  ];

  const rolePermissionSummary = [
    {
      role: "系统管理员",
      menuCount: 28,
      btnCount: 76,
      dataScope: "全局",
      lastChange: "2026-03-01 10:24",
      changedBy: "陈雨（平台管理员）",
    },
    {
      role: "安全审计员",
      menuCount: 12,
      btnCount: 18,
      dataScope: "全局（只读）",
      lastChange: "2026-02-27 16:08",
      changedBy: "林嘉（安全负责人）",
    },
    {
      role: "运营主管",
      menuCount: 16,
      btnCount: 34,
      dataScope: "本组织",
      lastChange: "2026-02-25 09:42",
      changedBy: "周楠（运营中心）",
    },
    {
      role: "客服专员",
      menuCount: 9,
      btnCount: 21,
      dataScope: "本组织（脱敏）",
      lastChange: "2026-02-23 19:11",
      changedBy: "赵敏（客服经理）",
    },
    {
      role: "财务出纳",
      menuCount: 7,
      btnCount: 15,
      dataScope: "本组织",
      lastChange: "2026-02-21 14:56",
      changedBy: "何晨（财务主管）",
    },
  ];

  const initialChecked = new Set([
    "p1",
    "p1-1",
    "p1-2",
    "p2",
    "p2-1",
    "p3",
    "p3-1",
    "p3-2",
    "p3-3",
    "p6",
    "p6-2",
  ]);

  const [activeTab, setActiveTab] = React.useState("分配权限");
  const [query, setQuery] = React.useState("");
  const [selectedRoleId, setSelectedRoleId] = React.useState("r1");
  const [checked, setChecked] = React.useState(initialChecked);
  const [expandAll, setExpandAll] = React.useState(true);

  const [newRole, setNewRole] = React.useState({
    name: "",
    code: "",
    desc: "",
    scope: "本组织",
    status: true,
  });

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const filteredRoles = roles.filter((r) => {
    const k = query.trim();
    if (!k) return true;
    return (
      r.name.includes(k) ||
      r.code.toLowerCase().includes(k.toLowerCase()) ||
      r.desc.includes(k)
    );
  });

  const totalNodes = React.useMemo(() => {
    let c = 0;
    permissions.forEach((p) => {
      c += 1;
      c += p.children.length;
    });
    return c;
  }, []);

  const checkedCount = checked.size;

  const svgShield = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
      <path
        d="M12 2.5l7 3.5v6.2c0 5-3 8.7-7 9.8-4-1.1-7-4.8-7-9.8V6l7-3.5z"
        className="stroke-slate-700"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 12.2l1.9 2 3.9-4.4"
        className="stroke-slate-700"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const svgPlus = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
      <path
        d="M12 5v14M5 12h14"
        className="stroke-white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const svgSearch = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
        className="stroke-slate-500"
        strokeWidth="1.8"
      />
      <path
        d="M16.2 16.2 21 21"
        className="stroke-slate-500"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );

  function toggleNode(id, shouldCheck) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (shouldCheck) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleModule(moduleId, shouldCheck) {
    const module = permissions.find((p) => p.id === moduleId);
    if (!module) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (shouldCheck) {
        next.add(module.id);
        module.children.forEach((c) => next.add(c.id));
      } else {
        next.delete(module.id);
        module.children.forEach((c) => next.delete(c.id));
      }
      return next;
    });
  }

  function moduleState(module) {
    const childIds = module.children.map((c) => c.id);
    const childChecked = childIds.filter((id) => checked.has(id)).length;
    const moduleChecked = checked.has(module.id);
    const all = moduleChecked && childChecked === childIds.length;
    const partial = childChecked > 0 && childChecked < childIds.length;
    return { all, partial, childChecked, total: childIds.length };
  }

  function applyPreset(preset) {
    const base = new Set();
    if (preset === "最小可用") {
      ["p1", "p1-1", "p3", "p3-1"].forEach((id) => base.add(id));
    }
    if (preset === "运营主管模板") {
      ["p1", "p1-1", "p1-2", "p4", "p4-1", "p4-2", "p3", "p3-1"].forEach((id) => base.add(id));
    }
    if (preset === "审计只读") {
      ["p6", "p6-2", "p3", "p3-1", "p2", "p2-1"].forEach((id) => base.add(id));
    }
    setChecked(base);
  }

  const scopeBadge = (scope) => {
    if (scope.includes("全局")) return <Badge className="bg-slate-900 text-white">全局</Badge>;
    if (scope.includes("脱敏")) return <Badge className="bg-amber-100 text-amber-900">脱敏</Badge>;
    return <Badge className="bg-slate-100 text-slate-700">本组织</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <AppBar
        title="角色与权限"
        right={
          <div className="flex items-center gap-2">
            <Button className="min-h-[44px] bg-slate-900 text-white hover:bg-slate-800">
              <span className="flex items-center gap-2">
                {svgPlus}
                新建角色
              </span>
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <Sidebar>
              <SidebarItem active>权限管理</SidebarItem>
              <SidebarItem>用户管理</SidebarItem>
              <SidebarItem>组织架构</SidebarItem>
              <SidebarItem>审计日志</SidebarItem>
              <SidebarItem>系统设置</SidebarItem>
            </Sidebar>

            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {svgShield}
                    角色列表
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>搜索角色</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">{svgSearch}</div>
                      <Input
                        className="pl-10"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="按角色名 / 编码 / 描述搜索"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {filteredRoles.length === 0 ? (
                      <EmptyState title="未找到匹配角色" description="请调整关键词，或新建角色后再分配权限。" />
                    ) : (
                      filteredRoles.map((r) => (
                        <ListItem
                          key={r.id}
                          title={
                            <div className="flex items-center gap-2">
                              <span className={cn("font-medium", r.id === selectedRoleId && "text-slate-900")}>
                                {r.name}
                              </span>
                              {r.status === "启用" ? (
                                <Badge className="bg-emerald-100 text-emerald-800">启用</Badge>
                              ) : (
                                <Badge className="bg-slate-200 text-slate-700">停用</Badge>
                              )}
                              <Badge className="bg-slate-100 text-slate-700">{r.level}</Badge>
                            </div>
                          }
                          description={
                            <div className="space-y-1">
                              <div className="text-sm text-slate-600">{r.desc}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                                <span>编码：{r.code}</span>
                                <span>·</span>
                                <span>成员：{r.users} 人</span>
                                <span>·</span>
                                <span>更新：{r.updatedAt}</span>
                              </div>
                            </div>
                          }
                          right={
                            <div className="flex items-center gap-2">
                              {scopeBadge(r.scope)}
                              <Button
                                className={cn(
                                  "min-h-[36px]",
                                  r.id === selectedRoleId
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
                                )}
                                onClick={() => setSelectedRoleId(r.id)}
                              >
                                {r.id === selectedRoleId ? "已选择" : "选择"}
                              </Button>
                            </div>
                          }
                        />
                      ))
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    共 {roles.length} 个角色 · 当前显示 {filteredRoles.length} 个
                  </div>
                  <Button className="min-h-[36px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50">
                    导入角色
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          <div className="col-span-9 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
              <PageHeader
                title="权限配置"
                description="为不同角色分配菜单/按钮权限与数据范围，变更将写入审计日志。"
              />

              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  title="已选择角色"
                  value={selectedRole?.name || "—"}
                  description={`编码 ${selectedRole?.code || "-"} · ${selectedRole?.status || "-"} · 数据范围：${selectedRole?.scope || "-"}`}
                />
                <StatCard
                  title="已勾选权限节点"
                  value={`${checkedCount} / ${totalNodes}`}
                  description="包含模块与子权限节点；建议最小授权原则"
                />
                <StatCard
                  title="最近一次更新"
                  value={selectedRole?.updatedAt || "—"}
                  description="变更人信息可在审计日志中查看"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>操作提示</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Alert>
                    <div className="text-sm text-slate-700">
                      建议先选择角色，再在「分配权限」中勾选菜单/权限节点。对生产环境角色变更前，请先在灰度组织验证。
                    </div>
                  </Alert>

                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      className="min-h-[44px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
                      onClick={() => applyPreset("最小可用")}
                    >
                      应用：最小可用
                    </Button>
                    <Button
                      className="min-h-[44px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
                      onClick={() => applyPreset("运营主管模板")}
                    >
                      应用：运营主管模板
                    </Button>
                    <Button
                      className="min-h-[44px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
                      onClick={() => applyPreset("审计只读")}
                    >
                      应用：审计只读
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>工作区</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TabsList>
                    <TabsTrigger active={activeTab === "分配权限"} onClick={() => setActiveTab("分配权限")}>
                      分配权限
                    </TabsTrigger>
                    <TabsTrigger active={activeTab === "角色-权限对应"} onClick={() => setActiveTab("角色-权限对应")}>
                      角色-权限对应
                    </TabsTrigger>
                    <TabsTrigger active={activeTab === "新建角色"} onClick={() => setActiveTab("新建角色")}>
                      新建角色
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent active={activeTab === "分配权限"}>
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-8 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-slate-900">权限树（菜单 / 权限点）</div>
                            <div className="text-xs text-slate-500">
                              当前角色：{selectedRole.name} · 已勾选 {checkedCount} 项
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-slate-600">展开全部</Label>
                              <Switch checked={expandAll} onCheckedChange={(v) => setExpandAll(!!v)} />
                            </div>
                            <Button
                              className="min-h-[36px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
                              onClick={() => setChecked(new Set())}
                            >
                              清空勾选
                            </Button>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          {permissions.map((m) => {
                            const st = moduleState(m);
                            return (
                              <Card key={m.id}>
                                <CardHeader>
                                  <CardTitle className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <Switch
                                        checked={st.all}
                                        onCheckedChange={(v) => toggleModule(m.id, !!v)}
                                      />
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-base font-semibold text-slate-900">{m.title}</span>
                                          {st.partial ? (
                                            <Badge className="bg-amber-100 text-amber-900">部分授权</Badge>
                                          ) : st.all ? (
                                            <Badge className="bg-emerald-100 text-emerald-800">已授权</Badge>
                                          ) : (
                                            <Badge className="bg-slate-100 text-slate-700">未授权</Badge>
                                          )}
                                          <Badge className="bg-slate-100 text-slate-700">
                                            {st.childChecked}/{st.total}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">{m.desc}</div>
                                      </div>
                                    </div>

                                    <div className="text-xs text-slate-500 shrink-0">
                                      模块ID：{m.id}
                                    </div>
                                  </CardTitle>
                                </CardHeader>

                                {expandAll ? (
                                  <CardContent className="space-y-2">
                                    {m.children.map((c) => (
                                      <ListItem
                                        key={c.id}
                                        title={
                                          <div className="flex items-center gap-3">
                                            <Switch
                                              checked={checked.has(c.id)}
                                              onCheckedChange={(v) => toggleNode(c.id, !!v)}
                                            />
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-slate-900">{c.title}</span>
                                                <Badge className="bg-slate-100 text-slate-700">菜单</Badge>
                                                <Badge className="bg-slate-100 text-slate-700">可见</Badge>
                                              </div>
                                              <div className="text-xs text-slate-500">{c.desc}</div>
                                            </div>
                                          </div>
                                        }
                                        description={
                                          <div className="text-xs text-slate-500">
                                            权限点示例：查看 · 新建 · 编辑 · 删除 · 导出（由权限策略进一步细分）
                                          </div>
                                        }
                                        right={
                                          <div className="flex items-center gap-2">
                                            <Button className="min-h-[36px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50">
                                              配置按钮权限
                                            </Button>
                                          </div>
                                        }
                                      />
                                    ))}
                                  </CardContent>
                                ) : (
                                  <CardContent>
                                    <div className="text-sm text-slate-600">
                                      已收起子节点（{st.childChecked}/{st.total} 已勾选）。
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      </div>

                      <div className="col-span-4 space-y-3">
                        <Card>
                          <CardHeader>
                            <CardTitle>角色信息</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-lg font-bold text-slate-900">{selectedRole.name}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                  编码：{selectedRole.code} · 更新：{selectedRole.updatedAt}
                                </div>
                              </div>
                              {selectedRole.status === "启用" ? (
                                <Badge className="bg-emerald-100 text-emerald-800">启用</Badge>
                              ) : (
                                <Badge className="bg-slate-200 text-slate-700">停用</Badge>
                              )}
                            </div>

                            <div className="text-sm text-slate-700">{selectedRole.desc}</div>

                            <Separator />

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">成员数量</span>
                                <span className="font-medium">{selectedRole.users} 人</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">数据范围</span>
                                <span className="font-medium">{selectedRole.scope}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">授权覆盖</span>
                                <span className="font-medium">{checkedCount}/{totalNodes}</span>
                              </div>
                              <Progress value={Math.min(100, Math.round((checkedCount / Math.max(1, totalNodes)) * 100))} />
                              <div className="text-xs text-slate-500">
                                授权覆盖率用于辅助评估，不代表安全等级；请结合字段权限与数据范围配置。
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex items-center gap-2">
                            <Button className="flex-1 min-h-[44px] bg-slate-900 text-white hover:bg-slate-800">
                              保存权限变更
                            </Button>
                            <Button className="min-h-[44px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50">
                              预览可见菜单
                            </Button>
                          </CardFooter>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>变更记录（最近）</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {[
                              {
                                t: "2026-03-01 10:24",
                                who: "陈雨（平台管理员）",
                                what: "为「系统管理员」新增：API 密钥、告警中心导出权限",
                                risk: "高",
                              },
                              {
                                t: "2026-02-27 16:08",
                                who: "林嘉（安全负责人）",
                                what: "为「安全审计员」启用：审计日志导出（仅脱敏字段）",
                                risk: "中",
                              },
                              {
                                t: "2026-02-25 09:42",
                                who: "周楠（运营中心）",
                                what: "为「运营主管」移除：退款审批按钮权限（迁移至财务）",
                                risk: "中",
                              },
                              {
                                t: "2026-02-23 19:11",
                                who: "赵敏（客服经理）",
                                what: "为「客服专员」新增：知识库编辑（仅本组织）",
                                risk: "低",
                              },
                              {
                                t: "2026-02-21 14:56",
                                who: "何晨（财务主管）",
                                what: "停用「财务出纳」角色并回收其导出权限",
                                risk: "中",
                              },
                            ].map((x, idx) => (
                              <ListItem
                                key={idx}
                                title={
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-slate-900">{x.what}</span>
                                    {x.risk === "高" ? (
                                      <Badge className="bg-rose-100 text-rose-800">风险高</Badge>
                                    ) : x.risk === "中" ? (
                                      <Badge className="bg-amber-100 text-amber-900">风险中</Badge>
                                    ) : (
                                      <Badge className="bg-emerald-100 text-emerald-800">风险低</Badge>
                                    )}
                                  </div>
                                }
                                description={
                                  <div className="text-xs text-slate-500">
                                    {x.t} · {x.who}
                                  </div>
                                }
                                right={
                                  <Button className="min-h-[36px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50">
                                    查看详情
                                  </Button>
                                }
                              />
                            ))}
                          </CardContent>
                          <CardFooter className="flex items-center justify-between">
                            <div className="text-xs text-slate-500">完整记录请前往「审计日志」</div>
                            <Button className="min-h-[36px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50">
                              导出记录
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent active={activeTab === "角色-权限对应"}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-900">角色与权限对应关系</div>
                          <div className="text-xs text-slate-500">
                            展示各角色的菜单/按钮数量与数据范围，便于审计与快速对比。
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button className="min-h-[36px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50">
                            生成权限报告
                          </Button>
                          <Button className="min-h-[36px] bg-slate-900 text-white hover:bg-slate-800">
                            一键对比差异
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-3">
                        {rolePermissionSummary.map((x, idx) => (
                          <Card key={idx}>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between gap-3">
                                <span className="text-base font-semibold">{x.role}</span>
                                <Badge className="bg-slate-100 text-slate-700">{x.dataScope}</Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-3 gap-3">
                                <StatCard title="菜单数" value={String(x.menuCount)} description="可见菜单/页面" />
                                <StatCard title="按钮权限" value={String(x.btnCount)} description="操作能力控制" />
                                <StatCard title="数据范围" value={x.dataScope.includes("全局") ? "全局" : "组织"} description="数据访问边界" />
                              </div>

                              <div className="text-xs text-slate-500">
                                最近变更：{x.lastChange} · 变更人：{x.changedBy}
                              </div>

                              <div className="flex items-center gap-2">
                                <Button className="min-h-[36px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50">
                                  查看权限清单
                                </Button>
                                <Button className="min-h-[36px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50">
                                  复制为新角色
                                </Button>
                                <Button className="min-h-[36px] bg-slate-900 text-white hover:bg-slate-800">
                                  设为基准模板
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent active={activeTab === "新建角色"}>
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-7">
                        <Card>
                          <CardHeader>
                            <CardTitle>新建角色</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>角色名称</Label>
                                <Input
                                  value={newRole.name}
                                  onChange={(e) => setNewRole((s) => ({ ...s, name: e.target.value }))}
                                  placeholder="例如：渠道运营专员"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>角色编码</Label>
                                <Input
                                  value={newRole.code}
                                  onChange={(e) => setNewRole((s) => ({ ...s, code: e.target.value }))}
                                  placeholder="例如：OPS_CHANNEL"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>角色描述</Label>
                              <Textarea
                                value={newRole.desc}
                                onChange={(e) => setNewRole((s) => ({ ...s, desc: e.target.value }))}
                                placeholder="描述该角色可访问的模块、可执行的操作、数据范围限制等。建议遵循最小授权原则。"
                                className="min-h-[96px]"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>数据范围</Label>
                                <Input
                                  value={newRole.scope}
                                  onChange={(e) => setNewRole((s) => ({ ...s, scope: e.target.value }))}
                                  placeholder="全局 / 本组织 / 本人 / 自定义"
                                />
                                <div className="text-xs text-slate-500">
                                  常用：本组织；涉及财务与风控数据建议配置字段权限并启用脱敏策略。
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>启用状态</Label>
                                <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-slate-900">创建后立即启用</div>
                                    <div className="text-xs text-slate-500">停用角色将回收其绑定用户的权限（保留历史审计）</div>
                                  </div>
                                  <Switch
                                    checked={newRole.status}
                                    onCheckedChange={(v) => setNewRole((s) => ({ ...s, status: !!v }))}
                                  />
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div className="flex items-center gap-2">
                              <Button className="min-h-[44px] bg-slate-900 text-white hover:bg-slate-800">
                                创建并进入权限分配
                              </Button>
                              <Button className="min-h-[44px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50">
                                保存为草稿
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="col-span-5 space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>命名与规范建议</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {[
                              { t: "角色名可读", d: "使用业务语言，例如「渠道运营专员」「仓配调度员」，便于跨团队沟通。" },
                              { t: "编码可追溯", d: "建议使用大写下划线：OPS_CHANNEL、FIN_AP、RISK_REVIEW。" },
                              { t: "描述要具体", d: "写清楚“能看什么、能做什么、数据范围是什么、是否脱敏”。" },
                              { t: "最小授权", d: "先满足核心流程，再逐步开放按钮/导出等高风险能力。" },
                              { t: "审计可落地", d: "关键角色变更前后建议生成权限报告并留档。" },
                            ].map((x, i) => (
                              <ListItem
                                key={i}
                                title={<span className="font-medium text-slate-900">{x.t}</span>}
                                description={<span className="text-sm text-slate-600">{x.d}</span>}
                                right={<Badge className="bg-slate-100 text-slate-700">建议</Badge>}
                              />
                            ))}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>常用角色模板（可复制）</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {[
                              {
                                name: "渠道运营专员",
                                code: "OPS_CHANNEL",
                                scope: "本组织",
                                perms: "控制台、运营看板、活动配置（仅查看/编辑）",
                              },
                              {
                                name: "退款复核员",
                                code: "FIN_REFUND_REVIEW",
                                scope: "本组织",
                                perms: "订单管理、退款审批（仅审批/驳回）、导出受限",
                              },
                              {
                                name: "风控观察员",
                                code: "RISK_OBSERVER",
                                scope: "全局（只读）",
                                perms: "风控报表、告警中心（只读）、审计日志（只读）",
                              },
                              {
                                name: "仓配调度员",
                                code: "WMS_DISPATCH",
                                scope: "本组织",
                                perms: "工单列表、配送异常处理、联系记录（脱敏）",
                              },
                              {
                                name: "外包客服",
                                code: "CS_VENDOR",
                                scope: "本组织（脱敏）",
                                perms: "工单列表（仅本人）、知识库（只读）、导出禁用",
                              },
                            ].map((x, i) => (
                              <ListItem
                                key={i}
                                title={
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-slate-900">{x.name}</span>
                                    <Badge className="bg-slate-100 text-slate-700">{x.code}</Badge>
                                    <Badge className="bg-slate-100 text-slate-700">{x.scope}</Badge>
                                  </div>
                                }
                                description={
                                  <div className="text-sm text-slate-600">
                                    权限包含：{x.perms}
                                  </div>
                                }
                                right={
                                  <Button className="min-h-[36px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50">
                                    复制
                                  </Button>
                                }
                              />
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Card>
            </div>

            <div className="mt-4">
              <Separator />
              <div className="py-4 flex items-center justify-between text-xs text-slate-500">
                <div>权限变更将记录：操作人、时间、角色、变更前后差异、来源 IP。</div>
                <div className="flex items-center gap-2">
                  <Button className="min-h-[36px] bg-white text-slate-900 border border-slate-200 hover:bg-slate-50">
                    查看审计日志
                  </Button>
                  <Button className="min-h-[36px] bg-slate-900 text-white hover:bg-slate-800">
                    发布变更
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}
```
