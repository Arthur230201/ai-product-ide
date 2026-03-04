/**
 * PRD 导出用：将 preview-ui 注册到 window.__PRD_*__，供内联 HTML 中的组件使用。
 * 由 scripts/build-preview-ui-prd-bundle.mjs 打包，结果内联到导出 HTML。
 */
import * as ui from '../src/components/preview-ui';

export default function init(React: typeof import('react')) {
  if (typeof window === 'undefined' || !React) return;
  const w = window as unknown as Record<string, unknown>;
  w.__PRD_CN__ = ui.cn;
  w.__PRD_Button__ = ui.Button;
  w.__PRD_Card__ = ui.Card;
  w.__PRD_CardHeader__ = ui.CardHeader;
  w.__PRD_CardTitle__ = ui.CardTitle;
  w.__PRD_CardContent__ = ui.CardContent;
  w.__PRD_CardFooter__ = ui.CardFooter;
  w.__PRD_AppBar__ = ui.AppBar;
  w.__PRD_ListItem__ = ui.ListItem;
  w.__PRD_Badge__ = ui.Badge;
  w.__PRD_Input__ = ui.Input;
  w.__PRD_Label__ = ui.Label;
  w.__PRD_TabsList__ = ui.TabsList;
  w.__PRD_TabsTrigger__ = ui.TabsTrigger;
  w.__PRD_TabsContent__ = ui.TabsContent;
  w.__PRD_Switch__ = ui.Switch;
  w.__PRD_Progress__ = ui.Progress;
  w.__PRD_Dialog__ = ui.Dialog;
  w.__PRD_DialogHeader__ = ui.DialogHeader;
  w.__PRD_DialogContent__ = ui.DialogContent;
  w.__PRD_DialogFooter__ = ui.DialogFooter;
  w.__PRD_Textarea__ = ui.Textarea;
  w.__PRD_Separator__ = ui.Separator;
  w.__PRD_Avatar__ = ui.Avatar;
  w.__PRD_Alert__ = ui.Alert;
  w.__PRD_StatCard__ = ui.StatCard;
  w.__PRD_NavBar__ = ui.NavBar;
  w.__PRD_BottomNav__ = ui.BottomNav;
  w.__PRD_BottomNavItem__ = ui.BottomNavItem;
  w.__PRD_Sidebar__ = ui.Sidebar;
  w.__PRD_SidebarItem__ = ui.SidebarItem;
  w.__PRD_EmptyState__ = ui.EmptyState;
  w.__PRD_PageHeader__ = ui.PageHeader;
  w.__PRD_Skeleton__ = ui.Skeleton;
}
