# 上次 AI 返回的 UI 代码

每次在画布上点击「生成本页 UI」成功后，会覆盖此文件。可复制下方代码块到本地或 [CodeSandbox](https://codesandbox.io) 等环境渲染，与图中预期对比。

## 本次生成上下文

| 项 | 值 |
| --- | --- |
| 生成时间 | 2026-03-18T14:50:16.658Z |
| 节点名称 | 歌曲列表 |
| 视口 | mobile |
| flex-1 | true |
| <main> | true |
| ListItem 数量 | 2 |
| Card 数量 | 6 |
| NavBar | true |
| AppBar | false |
| 根 flex-col | false |

### 发给模型的页面描述（pageDescription）


页面：歌曲列表。页面描述：显示全部或筛选后的歌曲。。作为听歌用户，浏览歌曲列表，以便找到想听的歌。作为听歌用户，浏览歌曲列表，以便找到想听的歌。验收标准：可浏览全部歌曲


---

## 代码（复制下方整块到可运行 React+Tailwind 环境对比）

```tsx
export default function App() {
  const songs = [
    {
      id: "s-001",
      title: "霓虹心跳",
      artist: "陆也 / 夏语",
      album: "凌晨两点的海",
      duration: "3:42",
      bpm: 128,
      mood: "夜跑",
      language: "中文",
      explicit: false,
      quality: "Hi-Res",
      addedAt: "2026-03-12 21:08",
      plays: 128430,
      likes: 9821,
      status: "可播放",
      tags: ["合成器流行", "热门上升"],
    },
    {
      id: "s-002",
      title: "雨落在旧站台",
      artist: "林北北",
      album: "返程票",
      duration: "4:16",
      bpm: 92,
      mood: "治愈",
      language: "中文",
      explicit: false,
      quality: "HQ",
      addedAt: "2026-03-10 09:34",
      plays: 86320,
      likes: 15422,
      status: "可播放",
      tags: ["民谣", "通勤"],
    },
    {
      id: "s-003",
      title: "Midnight Arcade",
      artist: "KAIRO",
      album: "Pixel Dreams",
      duration: "2:58",
      bpm: 140,
      mood: "派对",
      language: "英文",
      explicit: true,
      quality: "HQ",
      addedAt: "2026-03-08 18:02",
      plays: 210540,
      likes: 23011,
      status: "可播放",
      tags: ["电子", "能量"],
    },
    {
      id: "s-004",
      title: "海风写的信",
      artist: "程一岚",
      album: "南岸",
      duration: "3:25",
      bpm: 105,
      mood: "放松",
      language: "中文",
      explicit: false,
      quality: "Hi-Res",
      addedAt: "2026-03-06 14:20",
      plays: 45210,
      likes: 6120,
      status: "可播放",
      tags: ["独立流行", "海边"],
    },
    {
      id: "s-005",
      title: "低温告白",
      artist: "周沐 / 许漫",
      album: "冬日备忘录",
      duration: "3:11",
      bpm: 118,
      mood: "恋爱",
      language: "中文",
      explicit: false,
      quality: "HQ",
      addedAt: "2026-03-05 20:47",
      plays: 73590,
      likes: 12033,
      status: "可播放",
      tags: ["R&B", "甜"],
    },
    {
      id: "s-006",
      title: "城市漂流",
      artist: "The Skyline",
      album: "Late Night Drive",
      duration: "3:54",
      bpm: 124,
      mood: "驾驶",
      language: "英文",
      explicit: false,
      quality: "HQ",
      addedAt: "2026-03-03 11:06",
      plays: 66800,
      likes: 8010,
      status: "可播放",
      tags: ["流行摇滚", "公路"],
    },
    {
      id: "s-007",
      title: "月光备份",
      artist: "沈知夏",
      album: "把梦存起来",
      duration: "4:02",
      bpm: 88,
      mood: "安静",
      language: "中文",
      explicit: false,
      quality: "Hi-Res",
      addedAt: "2026-02-28 22:15",
      plays: 39220,
      likes: 5201,
      status: "可播放",
      tags: ["钢琴", "睡前"],
    },
  ];

  const playlists = [
    {
      id: "p-01",
      name: "夜跑 30 分钟",
      desc: "高能节拍，稳住呼吸",
      count: 18,
      updatedAt: "今天 20:10",
    },
    {
      id: "p-02",
      name: "通勤不焦虑",
      desc: "温柔节奏，抵消噪音",
      count: 24,
      updatedAt: "昨天 08:40",
    },
    {
      id: "p-03",
      name: "学习专注",
      desc: "低干扰背景，提升专注",
      count: 36,
      updatedAt: "03-14 23:01",
    },
  ];

  const chips = [
    { id: "c-all", label: "全部" },
    { id: "c-hot", label: "热门" },
    { id: "c-new", label: "新上架" },
    { id: "c-ch", label: "中文" },
    { id: "c-en", label: "英文" },
    { id: "c-hires", label: "Hi-Res" },
  ];

  return (
    <div className={cn("w-full overflow-x-hidden flex flex-col h-full min-h-full bg-slate-950")}>
      <NavBar
        title="歌曲列表"
        className="bg-slate-950 text-slate-50 border-b border-slate-800"
      />

      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="w-full max-w-[375px] mx-auto px-4 py-4 space-y-4">
          <Card className="rounded-md shadow-lg bg-white border border-slate-200">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-slate-900 text-lg font-bold">
                    发现你的下一首循环单曲
                  </CardTitle>
                  <p className="mt-1 text-slate-600 text-sm whitespace-normal">
                    今日推荐基于你的最近播放：电子 / 民谣 / 独立流行。支持一键加入播放队列与歌单。
                  </p>
                </div>
                <Badge className="rounded-md bg-violet-600 text-white">
                  为你推荐
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <StatCard
                  className="rounded-md shadow-md border border-slate-200"
                  title="今日播放"
                  value="1,284"
                  desc="较昨日 +12%"
                />
                <StatCard
                  className="rounded-md shadow-md border border-slate-200"
                  title="新上架"
                  value="27"
                  desc="近 7 天"
                />
                <StatCard
                  className="rounded-md shadow-md border border-slate-200"
                  title="已喜欢"
                  value="392"
                  desc="你的收藏"
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-slate-900">搜索</Label>
                <Input
                  className="rounded-md border border-slate-200 focus-visible:ring-2 focus-visible:ring-violet-600 min-h-[44px]"
                  placeholder="搜索歌曲 / 歌手 / 专辑"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900">筛选</Label>
                <div className="flex flex-wrap gap-2">
                  {chips.map((c, idx) => (
                    <Button
                      key={c.id}
                      variant={idx === 0 ? "default" : "secondary"}
                      className={cn(
                        "rounded-md shadow-md min-h-[44px px-3 cursor-pointer transition duration-200",
                        idx === 0
                          ? "bg-violet-600 hover:bg-violet-700 text-white"
                          : "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200"
                      )}
                    >
                      {c.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-slate-200 p-3 bg-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-slate-900 font-semibold">播放队列</p>
                    <p className="text-slate-600 text-sm whitespace-normal">
                      当前队列：6 首 · 顺序播放
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="rounded-md shadow-md min-h-[44px] bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer transition duration-200"
                    >
                      继续播放
                    </Button>
                    <Button
                      variant="secondary"
                      className="rounded-md shadow-md min-h-[44px] bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 cursor-pointer transition duration-200"
                    >
                      管理
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-3">
              <Button className="rounded-md shadow-md min-h-[44px] bg-violet-600 hover:bg-violet-700 text-white cursor-pointer transition duration-200">
                随机播放
              </Button>
              <Button className="rounded-md shadow-md min-h-[44px] bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer transition duration-200">
                新建歌单
              </Button>
            </CardFooter>
          </Card>

          <Card className="rounded-md shadow-lg bg-white border border-slate-200">
            <CardHeader>
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-slate-900 text-base font-bold">
                    推荐歌单
                  </CardTitle>
                  <p className="mt-1 text-slate-600 text-sm whitespace-normal">
                    快速开听：按场景挑一张就走
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="rounded-md shadow-md min-h-[44px] bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 cursor-pointer transition duration-200"
                >
                  查看全部
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {playlists.map((p) => (
                <ListItem
                  key={p.id}
                  className="rounded-md border border-slate-200 hover:bg-slate-50 transition duration-150 cursor-pointer"
                  title={p.name}
                  subtitle={`${p.desc} · ${p.count} 首 · 更新于 ${p.updatedAt}`}
                  right={
                    <Button className="rounded-md shadow-md min-h-[44px] bg-violet-600 hover:bg-violet-700 text-white cursor-pointer transition duration-200">
                      开始
                    </Button>
                  }
                />
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-md shadow-lg bg-white border border-slate-200">
            <CardHeader className="space-y-2">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-slate-900 text-base font-bold">
                    今日热播
                  </CardTitle>
                  <p className="mt-1 text-slate-600 text-sm whitespace-normal">
                    共 {songs.length} 首 · 轻点加入队列或收藏
                  </p>
                </div>
                <Badge className="rounded-md bg-cyan-600 text-white">热度榜</Badge>
              </div>

              <div className="flex items-center gap-2">
                <TabsList className="bg-slate-100 rounded-md p-1">
                  <TabsTrigger
                    value="hot"
                    className="rounded-md px-3 py-2 min-h-[44px] cursor-pointer transition duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md"
                  >
                    热门
                  </TabsTrigger>
                  <TabsTrigger
                    value="new"
                    className="rounded-md px-3 py-2 min-h-[44px] cursor-pointer transition duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md"
                  >
                    新上架
                  </TabsTrigger>
                  <TabsTrigger
                    value="hires"
                    className="rounded-md px-3 py-2 min-h-[44px] cursor-pointer transition duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md"
                  >
                    Hi-Res
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="rounded-md border border-slate-200">
                {songs.map((s, i) => (
                  <div key={s.id} className="bg-white">
                    <ListItem
                      className="rounded-none hover:bg-slate-50 transition duration-150 cursor-pointer"
                      title={
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-slate-900 font-semibold truncate">
                            {s.title}
                          </span>
                          {s.explicit ? (
                            <Badge className="rounded-md bg-slate-900 text-white">E</Badge>
                          ) : null}
                          {s.quality === "Hi-Res" ? (
                            <Badge className="rounded-md bg-violet-600 text-white">
                              Hi-Res
                            </Badge>
                          ) : (
                            <Badge className="rounded-md bg-slate-100 text-slate-900 border border-slate-200">
                              HQ
                            </Badge>
                          )}
                        </div>
                      }
                      subtitle={
                        <div className="space-y-1">
                          <div className="text-slate-600 text-sm whitespace-normal">
                            {s.artist} · {s.album}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <span className="font-medium text-slate-900">{s.duration}</span>
                              <span>·</span>
                              <span>{s.bpm} BPM</span>
                              <span>·</span>
                              <span>{s.language}</span>
                            </span>
                            <span className="text-slate-600">·</span>
                            <span>播放 {s.plays.toLocaleString()}</span>
                            <span className="text-slate-600">·</span>
                            <span>喜欢 {s.likes.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {s.tags.slice(0, 2).map((t) => (
                              <Badge
                                key={t}
                                className="rounded-md bg-white text-slate-900 border border-slate-200"
                              >
                                {t}
                              </Badge>
                            ))}
                            <Badge className="rounded-md bg-slate-100 text-slate-900 border border-slate-200">
                              {s.mood}
                            </Badge>
                          </div>
                        </div>
                      }
                      right={
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            className="rounded-md shadow-md min-h-[44px] bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 cursor-pointer transition duration-200"
                          >
                            喜欢
                          </Button>
                          <Button className="rounded-md shadow-md min-h-[44px] bg-violet-600 hover:bg-violet-700 text-white cursor-pointer transition duration-200">
                            播放
                          </Button>
                        </div>
                      }
                    />
                    {i !== songs.length - 1 ? (
                      <Separator className="bg-slate-200" />
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Card className="rounded-md shadow-lg bg-white border border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-900 text-sm font-bold">下载音质</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-slate-600 text-sm">优先 Hi-Res</p>
                      <Switch />
                    </div>
                    <p className="text-slate-600 text-xs whitespace-normal">
                      Wi-Fi 环境下自动下载高品质，移动网络默认 HQ。
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-md shadow-lg bg-white border border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-900 text-sm font-bold">音量保护</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-slate-600 text-sm">限制峰值</p>
                      <Switch />
                    </div>
                    <p className="text-slate-600 text-xs whitespace-normal">
                      减少突然增益，适合耳机与车载场景。
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Alert className="rounded-md border border-slate-200 bg-white">
                <div className="space-y-1">
                  <p className="text-slate-900 font-semibold">小贴士</p>
                  <p className="text-slate-600 text-sm whitespace-normal">
                    长按歌曲可快速加入歌单；在设置中开启“优先 Hi-Res”以提升听感（更耗流量）。
                  </p>
                </div>
              </Alert>
            </CardContent>
          </Card>

          <Card className="rounded-md shadow-lg bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 text-base font-bold">反馈与建议</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-slate-900">你想听到的风格 / 歌手</Label>
                <Textarea
                  className="rounded-md border border-slate-200 focus-visible:ring-2 focus-visible:ring-violet-600"
                  placeholder="例如：更多 City Pop、Lo-fi、或某位独立歌手的新专辑…"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button className="rounded-md shadow-md min-h-[44px] bg-violet-600 hover:bg-violet-700 text-white cursor-pointer transition duration-200">
                  提交
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-md shadow-md min-h-[44px] bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 cursor-pointer transition duration-200"
                >
                  联系客服
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="h-4" />
        </div>
      </main>

      <BottomNav className="bg-slate-950 border-t border-slate-800">
        <BottomNavItem
          active
          label="发现"
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8Zm3.536-12.95-5.99 2.395a1 1 0 0 0-.58.58l-2.395 5.99a1 1 0 0 0 1.3 1.3l5.99-2.395a1 1 0 0 0 .58-.58l2.395-5.99a1 1 0 0 0-1.3-1.3ZM12 13a1 1 0 1 1 1-1 1 1 0 0 1-1 1Z"
              />
            </svg>
          }
        />
        <BottomNavItem
          label="搜索"
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M10 18a8 8 0 1 1 5.293-14.007A8 8 0 0 1 10 18Zm0-14a6 6 0 1 0 4.243 10.243A6 6 0 0 0 10 4Zm10.707 16.293-4.2-4.2a1 1 0 0 0-1.414 1.414l4.2 4.2a1 1 0 0 0 1.414-1.414Z"
              />
            </svg>
          }
        />
        <BottomNavItem
          label="歌单"
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M4 6a1 1 0 0 1 1-1h10a1 1 0 0 1 0 2H5A1 1 0 0 1 4 6Zm0 5a1 1 0 0 1 1-1h10a1 1 0 0 1 0 2H5a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h6a1 1 0 0 1 0 2H5a1 1 0 0 1-1-1Zm14-6.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V17a3 3 0 1 1-2-2.83V9.5Z"
              />
            </svg>
          }
        />
        <BottomNavItem
          label="我的"
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.411 0-8 2.239-8 5a1 1 0 0 0 2 0c0-1.495 2.467-3 6-3s6 1.505 6 3a1 1 0 0 0 2 0c0-2.761-3.589-5-8-5Z"
              />
            </svg>
          }
        />
      </BottomNav>
    </div>
  );
}
```
