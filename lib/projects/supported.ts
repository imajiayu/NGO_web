// 拥有专属详情页 + 直链路由（/donate/{id}）的项目 ID。
// 新增项目时只在这里加一次，sitemap.ts 和 app/[locale]/donate/[id]/page.tsx 自动同步。
export const SUPPORTED_PROJECT_IDS: readonly number[] = [0, 3, 4, 5, 6]
