# @remqo Nuxt 模块集

Nuxt 4 模块集合,每个子目录一个独立包(`@remqo/<name>`),模块间以 `workspace:^` 互连,以源码形式挂进宿主 pnpm workspace 使用。

## 使用

```bash
git submodule add https://github.com/hmeqo/nuxt-modules.git packages/nuxt-modules
```

宿主 `pnpm-workspace.yaml` 声明模块目录,然后应用内安装并注册:

```yaml
packages:
  - packages/nuxt-modules/*
```

```bash
pnpm add @remqo/nuxt-infra
```

```ts
export default defineNuxtConfig({
  modules: [
    '@remqo/nuxt-infra', // 聚合模块
    '@remqo/alova',
    '@remqo/shadcn',
    '@remqo/tailwindcss',
  ],
})
```

`nuxt-infra` 依赖链已含 `@remqo/util`、`@remqo/nuxt-color-mode`,注册它即得大部分基础能力;其余模块按需注册,互不依赖(仅 `alova` 依赖 `util`)。

## 模块

| 包                       | 用途                                                                           |
| ------------------------ | ------------------------------------------------------------------------------ |
| `@remqo/nuxt-infra`      | 聚合基础设施与自动导入;错误插件、`meta.auth` 路由守卫。配置键 `hmeqoNuxtInfra` |
| `@remqo/util`            | 通用工具函数自动导入(`./lib` 可直引)                                           |
| `@remqo/nuxt-color-mode` | color-mode 封装,cookie 存储(key `color-mode`)                                  |
| `@remqo/alova`           | alova 请求层封装与生成插件(`./lib`、`./plugin/*`、`./adapter/*`)               |
| `@remqo/i18n`            | `@nuxtjs/i18n` 预设(`no_prefix`、类型化消息),示例 `i18n/config-example`        |
| `@remqo/naive-ui`        | naive-ui + modern 主题 + color-mode 联动,扩展组件(DataTable 等)与 `naiveApi`   |
| `@remqo/konva`           | Konva 画布组件与 hooks                                                         |
| `@remqo/varlet`          | Varlet 集成                                                                    |
| `@remqo/pwa`             | PWA(`autoUpdate` + 基础 manifest)                                              |
| `@remqo/pinia`           | Pinia + 持久化                                                                 |
| `@remqo/tailwindcss`     | Tailwind v4(Vite 插件注入),示例 `tailwindcss/config-example`                   |
| `@remqo/unocss`          | UnoCSS                                                                         |
| `@remqo/shadcn`          | shadcn-vue,示例 `shadcn/config-example`                                        |
| `@remqo/shadcn-unocss`   | shadcn-vue + UnoCSS 组合                                                       |
| `@remqo/watermark`       | 水印组件,默认 `columns: 3`、`count: 18`。配置键 `watermark`                    |
| `@remqo/page-history`    | 页面历史记录 + `NaivePageNavigator` 组件                                       |

模块给底层依赖预设的默认值可被宿主配置覆盖(`defu` 合并)。

聚合内容、鉴权适配、配置覆盖与深层引用等细节见 [`usage.md`](./usage.md)。
