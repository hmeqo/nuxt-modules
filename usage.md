# 用例

各模块的典型用法。

## 安装与注册

```bash
pnpm add @remqo/nuxt-infra @remqo/alova
```

```ts
export default defineNuxtConfig({
  modules: [
    '@remqo/nuxt-infra', // 聚合基础,依赖 @remqo/util、@remqo/nuxt-color-mode
    '@remqo/alova',
    '@remqo/i18n', // 需要国际化时
    '@remqo/naive-ui', // 使用 naive-ui 时
  ],
})
```

## 页面鉴权(nuxt-infra)

路由守卫需要宿主提供会话适配器(`defineAuthAdapter` 由模块自动导入,`AuthAdapter` 类型见 `nuxt-infra/types/auth.ts`):

```ts
// app/plugins/auth-adapter.ts
export default defineNuxtPlugin(() => {
  defineAuthAdapter({
    url: { login: '/login', home: '/' }, // 守卫跳转目标
    init: async () => {}, // 客户端启动后调用一次,用于恢复会话
    isAuthenticated: () => false, // 当前是否已登录
    getPermissions: () => [], // 当前权限列表
    checkPermission: (permissions, required) => true, // 权限校验
  })
})
```

页面声明访问规则:

```ts
// 登录页:未登录可见,已登录自动跳 url.home
definePageMeta({ auth: 'anonymous' })

// 后台页:已登录可见,未登录跳 url.login
definePageMeta({ auth: 'authenticated' })

// 公开页:登录与否都可见
definePageMeta({ auth: 'public' })
```

权限与跳转定制:

```ts
// 需要特定权限;未登录先登录,权限不足进 /403
definePageMeta({
  auth: { authenticated: true, permissions: ['admin'], forbidden: '/403' },
})

// 匿名页对已登录用户的默认跳转( url.home )可覆盖
definePageMeta({
  auth: { anonymous: true, redirect: { authed: '/dashboard' } },
})
```

## 国际化(i18n)

```ts
export default defineNuxtConfig({
  modules: ['@remqo/i18n'],
  i18n: {
    locales: [
      { code: 'zh-hans', language: 'zh-hans' },
      { code: 'en', language: 'en' },
    ],
  },
})
```

消息文件与类型化配置的结构参照模块内 `i18n/config-example/i18n/`(locales/、i18n.config.ts、utils/i18n.ts)。

## naive-ui

扩展组件(DataTable、DateStringPicker)随模块注册。`useNaiveApi` 把 naive-ui 的 message/dialog/notification/loadingBar 聚合为单例句柄,组件外(工具函数、store)也能直接调:

```ts
const { message, dialog, notification, loadingBar } = useNaiveApi()

message.success('saved')
```

可用 `{ loadingBarDisabled: true }` 去掉 loadingBar,`{ refresh: true }` 重新注入。

## 请求层(alova)

`@remqo/alova/lib` 导出请求封装组件,配合 401 处理:

```ts
import { createAlovaHandlers, createEventSystem } from '@remqo/alova/lib'
import { getResponseData, toRequestInfo, toResponseInfo } from '@remqo/alova/adapter/fetch'
```

生成/转换插件的类型化配置见 `alova/config-example/alova.config.ts`。

## 覆盖模块默认配置

```ts
export default defineNuxtConfig({
  colorMode: { preference: 'dark' }, // 配合 nuxt-color-mode 使用
  hmeqoNuxtInfra: { routeAuth: { defaultRedirect: true } },
  watermark: { columns: 4, count: 12 },
  pwa: { manifest: { name: 'My App' } },
})
```
