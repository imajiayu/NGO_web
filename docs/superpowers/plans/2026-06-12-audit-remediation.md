# 全项目审查修复执行计划（Audit Remediation）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落实 2026-06-12 全项目代码审查中已核实的修复项（安全加固、性能优化、小型重构），并为大型重构建立待办清单。

**Architecture:** 本计划只包含**已人工核实、改动边界清晰**的任务（Task 1-7），按"数据库 → webhook → 性能 → 渲染"分阶段执行，每个任务独立提交、互不依赖。大型重构（统一 webhook 管道、组件拆分等）列在文末 Backlog，执行前需各自单独写计划。

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Supabase (PostgreSQL), next-intl, Resend

---

## 进度总览

| 任务 | 内容 | 状态 |
| --- | --- | --- |
| Task 1 | `decrement_stock` 补 `SET search_path`（安全） | ✅ 已完成（已 db push） |
| Task 2 | 四个支付 webhook 邮件发送改 `after()` 非阻塞 | ✅ 已完成 |
| Task 3 | `donation-result.ts` 两次 storage list 并行化 | ✅ 已完成 |
| Task 4 | `useActiveSection` 移除 `JSON.stringify` 依赖 | ✅ 已完成 |
| Task 6 | `/api/track` 限流（Vercel Firewall，控制台操作） | ⏳ 待用户在控制台配置 |
| Task 7 | 文档补充（索引清单 + page_views 说明） | ✅ 已完成 |
| Backlog | 大型重构 B1–B11（需单独出计划） | — |

> 完成一个任务后：勾选该任务所有步骤复选框，并把上表状态改为 ✅ 已完成。

---

## 审查结论备忘（防止重复排查）

**已核实成立的发现**（即本计划的任务来源）：见各 Task 描述。

**已核实为误报的发现**（不要再当问题处理）：

1. ~~"WayForPay webhook 缺 merchantAccount 验证是安全漏洞"~~ — 签名串第一个字段就是 `merchantAccount`（`lib/payment/wayforpay/server.ts:133-135`），无密钥无法伪造。与 market 版对齐加显式校验只是可选的纵深防御。
2. ~~"webhook 幂等性有 TOCTOU 竞态，会重复发邮件"~~ — 三个捐赠 webhook 的 UPDATE 都带 `.in('donation_status', transitionableStatuses)` 条件（CAS），并发重复回调时第二个 UPDATE 匹配 0 行，邮件有 `updatedDonations.length > 0` 守卫。前置 SELECT 只是提前退出优化。QmmPay 重放同理无害（状态已是 `paid` 时 UPDATE 不命中）。
3. ~~"types/database.ts 过期，market_orders_public 缺 currency 字段"~~ — 实际已存在（`types/database.ts:444`）。
4. "donation-result.ts 用 Service Role 违反规范" — **存疑而非成立**：donations 表的 anon SELECT 策略已被迁移 `20260331000000` 删除，匿名客户端可能根本查不到数据，Service Role 在此可能是必要的。列入 Backlog B10 复核，**不要直接改成 getPublicClient**。
5. ~~"`[locale]` 页面缺 `setRequestLocale` 会退回动态渲染"~~ — 2026-06-12 build 实测：`privacy-policy`、`public-agreement` 及除 `market/[itemId]` 外所有 `[locale]` 路由均已是 `●`（SSG）。原 Task 5 的前提不成立，已删除。next-intl 在本项目当前配置下未触发动态回退，无需 `setRequestLocale`。

---

## Task 1: `decrement_stock` 补 `SET search_path`

**背景：** `supabase/migrations/20260328000000_market_module.sql:88-109` 定义的 `decrement_stock` 是 SECURITY DEFINER 函数但未设 `search_path`。后续迁移 `20260331400000` 修复了 `restore_stock`（顺带改成返回 BOOLEAN），唯独漏了 `decrement_stock`。Supabase linter 会标记此项。

**Files:**
- Create: `supabase/migrations/20260612000000_fix_decrement_stock_search_path.sql`

- [ ] **Step 1: 确认 `decrement_stock` 没有更晚的重定义**

```bash
grep -rn "FUNCTION decrement_stock" /Users/majiayu/waytofutureua/supabase/migrations/
```

预期：只有 `20260328000000_market_module.sql` 一处 `CREATE OR REPLACE`（`20260330000000_fix_market_bugs.sql` 只涉及 GRANT，不重定义函数体）。若出现更晚的重定义，以最晚版本的函数体为准改写 Step 2。

- [ ] **Step 2: 创建迁移文件**

写入 `supabase/migrations/20260612000000_fix_decrement_stock_search_path.sql`（函数体与 `20260328000000` 原版完全一致，仅补 `SET search_path`，并保持返回 BOOLEAN 语义不变）：

```sql
-- ============================================
-- decrement_stock 补 SET search_path
-- ============================================
-- 背景：decrement_stock 是 SECURITY DEFINER 函数，但 20260328000000 定义时
-- 未设置 search_path。20260331400000 修复了 restore_stock 与触发器函数，
-- 唯独遗漏此函数。本迁移仅补 search_path，函数逻辑不变。

CREATE OR REPLACE FUNCTION decrement_stock(
  p_item_id BIGINT,
  p_quantity INT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  rows_affected INT;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'decrement_stock: quantity must be positive, got %', p_quantity;
  END IF;

  UPDATE market_items
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_item_id
    AND stock_quantity >= p_quantity
    AND status = 'on_sale';

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- 权限保持不变（仅 service_role）
REVOKE EXECUTE ON FUNCTION decrement_stock FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_stock TO service_role;
```

- [ ] **Step 3: 推送迁移到 Supabase（需已 `supabase link`）**

```bash
cd /Users/majiayu/waytofutureua && supabase db push
```

预期：输出包含 `20260612000000_fix_decrement_stock_search_path.sql` 应用成功。若未 link，先让用户执行 `supabase login && supabase link --project-ref <ref>`。

- [ ] **Step 4: 提交**

```bash
git add supabase/migrations/20260612000000_fix_decrement_stock_search_path.sql
git commit -m "fix(db): decrement_stock 补 SET search_path（SECURITY DEFINER 加固）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: 四个支付 webhook 邮件发送改 `after()` 非阻塞

**背景：** 四个 webhook 在返回响应前串行 `await sendPaymentSuccessEmail()` / `await sendRefundSuccessEmail()`。Resend 慢时支付网关可能超时重试。Next.js 15 的 `after()`（`next/server`）可把邮件推迟到响应送出之后执行，Vercel 上等价于 `waitUntil`。

**注意：** 邮件块已有自己的 try/catch（失败仅记日志），移入 `after()` 后这层 try/catch 必须保留——`after()` 回调里未捕获的异常只会打到日志，但保留原有结构化日志更好。

**Files:**
- Modify: `app/api/webhooks/wayforpay/route.ts:181-226`
- Modify: `app/api/webhooks/nowpayments/route.ts:198-226`
- Modify: `app/api/webhooks/qmmpay/route.ts:158-176`
- Modify: `app/api/webhooks/wayforpay-market/route.ts`（邮件发送段，约 295-339 行，动手前先读确认）

- [ ] **Step 1: 确认 Next 版本支持 `after()`**

```bash
grep '"next"' /Users/majiayu/waytofutureua/package.json
```

预期：`15.1.0` 及以上（`after` 在 15.1 转正）。若是 15.0.x，本任务改为升级 next 小版本后再做，或保持现状跳过。

- [ ] **Step 2: 改造 `wayforpay/route.ts`**

在文件顶部 import 区加：

```typescript
import { after } from 'next/server'
```

将原 181-202 行的支付成功邮件块改为（内部逻辑原样，仅外包一层 `after`）：

```typescript
      // Send confirmation email for successful payments (non-blocking, after response)
      if (shouldSendEmail && updatedDonations && updatedDonations.length > 0) {
        after(async () => {
          try {
            const payload = await buildPaymentSuccessPayload(
              supabase,
              updatedDonations,
              body.currency
            )
            if (payload) {
              await sendPaymentSuccessEmail(payload)
              logger.info('WEBHOOK:WAYFORPAY', 'Confirmation email sent', {
                orderReference,
                to: payload.to,
              })
            }
          } catch (emailError) {
            logger.error('WEBHOOK:WAYFORPAY', 'Email send failed', {
              orderReference,
              error: emailError instanceof Error ? emailError.message : String(emailError),
            })
          }
        })
      }
```

退款邮件块（原 204-226 行）同样处理：

```typescript
      // Send refund success email when status becomes refunded (non-blocking)
      if (newStatus === 'refunded' && updatedDonations && updatedDonations.length > 0) {
        after(async () => {
          try {
            const payload = await buildRefundSuccessPayload(
              supabase,
              updatedDonations,
              body.currency || 'USD',
              body.reason || undefined
            )
            if (payload) {
              await sendRefundSuccessEmail(payload)
              logger.info('WEBHOOK:WAYFORPAY', 'Refund email sent', {
                orderReference,
                to: payload.to,
              })
            }
          } catch (emailError) {
            logger.error('WEBHOOK:WAYFORPAY', 'Refund email send failed', {
              orderReference,
              error: emailError instanceof Error ? emailError.message : String(emailError),
            })
          }
        })
      }
```

- [ ] **Step 3: 改造 `nowpayments/route.ts`**

同样加 `import { after } from 'next/server'`，将原 199-226 行邮件块外包 `after(async () => { ... })`，内部 if/else（paid → payment 邮件、refunded → refund 邮件）与 try/catch 原样保留：

```typescript
      // Send confirmation email for successful payments / refund notifications (non-blocking)
      if (shouldSendEmail && updatedDonations && updatedDonations.length > 0) {
        after(async () => {
          try {
            if (newStatus === 'paid') {
              const payload = await buildPaymentSuccessPayload(supabase, updatedDonations, 'USD')
              if (payload) {
                await sendPaymentSuccessEmail(payload)
                logger.info('WEBHOOK:NOWPAYMENTS', 'Confirmation email sent', {
                  orderId,
                  to: payload.to,
                })
              }
            } else if (newStatus === 'refunded') {
              const payload = await buildRefundSuccessPayload(supabase, updatedDonations, 'USD')
              if (payload) {
                await sendRefundSuccessEmail(payload)
                logger.info('WEBHOOK:NOWPAYMENTS', 'Refund email sent', {
                  orderId,
                  to: payload.to,
                })
              }
            }
          } catch (emailError) {
            logger.error('WEBHOOK:NOWPAYMENTS', 'Email send failed', {
              orderId,
              error: emailError instanceof Error ? emailError.message : String(emailError),
            })
          }
        })
      }
```

- [ ] **Step 4: 改造 `qmmpay/route.ts`**

加 `import { after } from 'next/server'`，将原 159-176 行邮件块改为：

```typescript
  // Send payment confirmation email (non-blocking, after response)
  if (updatedDonations && updatedDonations.length > 0) {
    after(async () => {
      try {
        // Use 'CNY' as currency since qmmpay processes in RMB
        const payload = await buildPaymentSuccessPayload(supabase, updatedDonations, 'CNY')
        if (payload) {
          await sendPaymentSuccessEmail(payload)
          logger.info('WEBHOOK:QMMPAY', 'Confirmation email sent', {
            orderReference,
            to: payload.to,
          })
        }
      } catch (emailError) {
        logger.error('WEBHOOK:QMMPAY', 'Email send failed', {
          orderReference,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        })
      }
    })
  }
```

- [ ] **Step 5: 改造 `wayforpay-market/route.ts`**

先 Read 该文件确认邮件块的实际行号与变量名（agent 报告为 295-339 行附近），按 Step 2 完全相同的模式外包 `after()`。该文件如有多处发邮件（支付成功 / 状态通知），每处都包。

- [ ] **Step 6: 类型检查 + 构建验证**

```bash
cd /Users/majiayu/waytofutureua && npm run type-check && npm run build
```

预期：两者均无错误退出（exit 0）。

- [ ] **Step 7: 提交**

```bash
git add app/api/webhooks/wayforpay/route.ts app/api/webhooks/nowpayments/route.ts \
  app/api/webhooks/qmmpay/route.ts app/api/webhooks/wayforpay-market/route.ts
git commit -m "perf(webhook): 邮件发送改 after() 非阻塞，避免网关等待超时重试

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: `donation-result.ts` 两次 storage list 并行化

**背景：** `app/actions/donation-result.ts:38-63` 先 `list(donationPublicId)` 再 `list(donationPublicId/.thumbnails)`，两次调用互相独立却串行执行，白白多一次 RTT。

**Files:**
- Modify: `app/actions/donation-result.ts:38-63`

- [ ] **Step 1: 改为 `Promise.all`**

将原 38-63 行（两段 list + 中间的过滤逻辑）改为：

```typescript
    const [
      { data: files, error: storageError },
      { data: thumbnailFiles },
    ] = await Promise.all([
      supabase.storage.from(STORAGE_BUCKETS.donationResults).list(donationPublicId, {
        sortBy: { column: 'name', order: 'asc' },
      }),
      supabase.storage
        .from(STORAGE_BUCKETS.donationResults)
        .list(`${donationPublicId}/.thumbnails`, {
          sortBy: { column: 'name', order: 'asc' },
        }),
    ])

    if (storageError) {
      logger.error('STORAGE', 'Failed to list all donation result files', {
        donationId: donationPublicId,
        error: storageError.message,
      })
      return { error: 'storageFailed', files: [] }
    }

    if (!files || files.length === 0) {
      return { error: 'noImage', files: [] }
    }

    // 过滤掉 .thumbnails 文件夹和其他隐藏文件（如 .emptyFolderPlaceholder）
    const originalFiles = files.filter((file) => file.name && !file.name.startsWith('.'))
```

后续 `fileObjects` 映射逻辑（原 65 行起）不变。

- [ ] **Step 2: 类型检查**

```bash
cd /Users/majiayu/waytofutureua && npm run type-check
```

预期：exit 0。

- [ ] **Step 3: 提交**

```bash
git add app/actions/donation-result.ts
git commit -m "perf(donation): 捐赠成果文件与缩略图列表并行加载

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 4: `useActiveSection` 移除 `JSON.stringify` 依赖

**背景：** `lib/hooks/useActiveSection.ts:73` 用 `JSON.stringify(sectionIds)` 做 effect 依赖。功能上能去抖（字符串值相等即不重跑），但每次渲染都序列化一遍，且是非惯用写法。改用 `join('|')` 语义相同、开销更低（section id 不含 `|`，由项目命名约定 `pN-xxx` 保证）。

**Files:**
- Modify: `lib/hooks/useActiveSection.ts`

- [ ] **Step 1: 修改依赖项**

在 `useEffect` 之前（第 10 行附近，`visibleMap` 声明之后）加：

```typescript
  // Stable key: re-init the observer only when the actual id list changes.
  // Section ids never contain '|' (convention: `pN-section-name`).
  const sectionIdsKey = sectionIds.join('|')
```

并把第 73 行：

```typescript
  }, [JSON.stringify(sectionIds)]) // eslint-disable-line react-hooks/exhaustive-deps
```

改为：

```typescript
  }, [sectionIdsKey]) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 2: lint + 类型检查**

```bash
cd /Users/majiayu/waytofutureua && npm run lint && npm run type-check
```

预期：exit 0。

- [ ] **Step 3: 手动验证（可选但建议）**

```bash
npm run dev
```

打开任一项目详情页（如 `/zh/donate/3`），滚动页面确认 SectionNav 高亮跟随正常。

- [ ] **Step 4: 提交**

```bash
git add lib/hooks/useActiveSection.ts
git commit -m "refactor(hooks): useActiveSection 依赖改 join key，去掉每次渲染的 JSON.stringify

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 6: `/api/track` 限流（控制台操作，无代码改动）

**背景：** `app/api/track/route.ts` 是 anon 可写端点，已有 Zod 校验 + RLS WITH CHECK 限制字段范围，但无任何限流，恶意脚本可无限灌 `page_views`。代码层做限流需要引入 Redis/Upstash（新依赖），性价比不如平台层规则。

- [ ] **Step 1: 在 Vercel 控制台配置 Firewall 规则（用户操作）**

路径：Vercel Dashboard → 项目 → Firewall → Add Rule：

- Condition: `Request Path` equals `/api/track`
- Action: `Rate Limit` — 每 IP 60 秒 60 次（正常用户每页 1 view + 数次 CTA，远低于此）
- 超限动作: Deny

- [ ] **Step 2: 验证正常上报不受影响**

部署后访问站点任意页面，确认 Network 面板里 `/api/track` 返回 202，admin analytics 漏斗有新数据进来。

- [ ] **Step 3: 在本文档勾掉本任务并记录规则截图/配置时间**

（无代码提交；如团队有 infra 文档，把规则记录进去。）

---

## Task 7: 文档补充

**背景：** 两处文档漂移，5 分钟级修复。

**Files:**
- Modify: `docs/MARKET_DATABASE_SCHEMA.md`（索引清单章节，约 228-241 行）
- Modify: `CLAUDE.md`（`page_views` 表说明，约 73 行）

- [ ] **Step 1: MARKET_DATABASE_SCHEMA.md 索引清单补一行**

在索引清单中（`market_order_status_history` 相关位置）补：

```markdown
- `idx_market_order_history_order` — market_order_status_history(order_id)（迁移 20260331300001）
```

动手前先读该章节，按现有表格/列表格式对齐。

- [ ] **Step 2: CLAUDE.md 更新 page_views 描述**

将核心表表格中 `page_views` 一行：

```markdown
| `page_views`                  | 页面浏览 + CTA 点击事件（append-only 分析表） |
```

改为：

```markdown
| `page_views`                  | 页面浏览 + CTA 点击事件（append-only，无自动清理，长期增长见 Backlog B9） |
```

- [ ] **Step 3: 提交**

```bash
git add docs/MARKET_DATABASE_SCHEMA.md CLAUDE.md
git commit -m "docs: 补 market 索引清单遗漏项与 page_views 保留策略说明

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Backlog：大型重构（执行前需各自单独写计划）

> 以下条目改动面大或依赖产品决策，**不要直接照此实现**。启动任一项时，先用 superpowers:writing-plans 为它单独出计划文档（读完相关代码后写出完整代码级步骤）。

| 编号 | 内容 | 价值 | 预估规模 |
| --- | --- | --- | --- |
| B1 | **统一 webhook 处理管道**：四个支付 webhook 约 300 行重复（验签→查单→状态映射→CAS 更新→发邮件→响应），抽 `lib/webhooks/` 公共框架 | 高（新增支付方式成本大降） | 1-2 天 |
| B2 | **拆分 `DonationFormCard`（830 行）**：10+ useState、三套支付集成状态混在一个组件，拆 `useDonationForm` / `usePaymentState` hooks + UI 编排层 | 高（可维护性） | 1 天 |
| B3 | **多 lightbox 管理 hook + `ProjectDetailSkeleton`**：Project0/3/4/5 详情页重复"多个 useLightbox + 多段条件渲染"（Project4 有 5 个），约 300 行重复 | 中 | 半天 |
| B4 | **Server Action 错误处理统一**：admin actions 用 throw、用户侧用 `{ error }` 结构化返回，统一成 `Result<T>`；revalidation 策略同步统一（donations 用 path、market 用 tag） | 中 | 1 天 |
| B5 | **admin 列表分页**：`app/actions/admin/donations.ts`、`admin/projects.ts` 全表 `select('*')`，加 `range()` 分页 + 表格组件配合 | 中（数据量增长后变高） | 半天 |
| B6 | **`market/orders` 页 Server Component 化**：整页 'use client' + 认证→订单串行瀑布，改服务端获取 + 边界下移 | 中 | 半天 |
| B7 | **邮件 sender / broadcast 模板工厂化**：多个结构雷同的 sender 与 5 套 broadcast 模板，抽工厂函数 | 低 | 半天 |
| B8 | **支付集成公共工具**：抽 `timingSafeCompare()`（WayForPay/NOWPayments 各有一份实现）；webhook 回调数据从 `Record<string, any>` 改具体接口 | 中（类型安全） | 半天 |
| B9 | **page_views 保留策略**：当前产品决策是永久保留；表带 3 个索引，长期膨胀影响 admin 漏斗查询与存储费用。需产品先决策（180 天清理 / 按月分区 / 维持现状），再出迁移 | 待决策 | 决策后半天 |
| B10 | **Service Role 使用复核**：`donation-result.ts:14` 与 `market-order-files.ts` 在已验证身份后仍用 `getInternalClient()`。⚠️ donations 表 anon SELECT 策略已删（迁移 20260331000000），**先确认 RLS 现状再判断是否真能换 `getPublicClient()`**，不可盲改 | 低 | 2 小时 |
| B11 | **QmmPay webhook 时间戳防重放**：纵深防御项。CAS 已保证重放无害（见误报备忘 #2），仅在想消除重放日志噪音时做。`QmmPayWebhookParams.timestamp` 字段已存在，动手前先确认其格式（epoch 还是 `yyyy-MM-dd HH:mm:ss`） | 低 | 1 小时 |

---

## 验证清单（每次会话收尾时跑）

```bash
cd /Users/majiayu/waytofutureua && npm run lint && npm run type-check && npm run build
```

三项全部 exit 0 才能声称任务完成。涉及迁移的任务额外要求 `supabase db push` 成功。
