/**
 * 测试用 UI 代码：用于自检 LivePreview / PreviewFrame 是否正常显示。
 * 结构：根 flex 列、顶栏 NavBar、主内容区 flex-1 填满 ListItem、底栏按钮。
 * 仅使用 preview-ui 组件与 cn，无 Lucide Icon，符合提示词约束。
 */
export const TEST_UI_CODE = `
function Page() {
  return (
    <div className={cn("flex flex-col h-full min-h-full bg-white")}>
      <NavBar title="商品详情" left={<span className="text-sm text-gray-600">返回</span>} />
      <main className={cn("flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0")}>
        <ListItem title="Aurora 无线蓝牙耳机" description="¥299 · 销量 1.2万" />
        <ListItem title="规格：颜色" description="深空灰 / 星光白" />
        <ListItem title="配送" description="明日达 · 免运费" />
        <ListItem title="保障" description="7天无理由退换" />
        <ListItem title="店铺" description="Aurora 官方旗舰店" />
        <div className="pt-2">
          <Button className="w-full" size="lg">加入购物车</Button>
        </div>
      </main>
      <div className={cn("shrink-0 border-t border-gray-100 bg-white px-4 py-3 flex gap-3 safe-area-inset-bottom")}>
        <Button variant="outline" className="flex-1">收藏</Button>
        <Button className="flex-1">去结算</Button>
      </div>
    </div>
  );
}
`.trim();
