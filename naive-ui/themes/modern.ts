import type { ModuleOptions as NaiveUiModuleOptions } from '@bg-dev/nuxt-naiveui'

export default <NaiveUiModuleOptions['themeConfig']>{
  shared: {
    common: {
      primaryColor: '#409EFF',
      primaryColorHover: '#66b1ff',
      primaryColorPressed: '#3a8ee6',
      primaryColorSuppl: '#66b1ff',
      borderRadius: '4px',
      fontFamily: '',
      fontFamilyMono: '',
    },
  },
  light: {
    Layout: {
      color: '#f9fafb',
    },
  },
  dark: {
    common: {
      bodyColor: '#0a0a0a',
      cardColor: '#0a0a0a',
      modalColor: '#0a0a0a',
      borderColor: '#262626',
      popoverColor: '#0a0a0a',
      dividerColor: '#262626',
      hoverColor: '#262626',
      primaryColor: '#409EFF',
      primaryColorHover: '#66b1ff',
      primaryColorPressed: '#3a8ee6',
      primaryColorSuppl: '#66b1ff',
    },
    Layout: {
      color: '#0a0a0a',
      siderColor: '#0a0a0a',
      headerColor: '#0a0a0a',
      footerColor: '#0a0a0a',
    },
    Notification: {
      color: '#0a0a0a',
    },
    Message: {
      colorSuccess: '#0a0a0a',
    },
    DataTable: {
      // borderColor: '#262626',
      // borderColorModal: '#262626',
      // borderColorPopover: '#262626',
      thColor: '#0a0a0a',
      thColorHover: '#0a0a0a',
      tdColor: '#0a0a0a',
      tdColorHover: '#171717',
      tdColorHoverModal: '#171717',
      tdColorStriped: '#171717',
      tdColorSorting: '#171717',
      tdColorSortingModal: '#171717',
      thColorHoverModal: '#171717',
      thColorSorting: '#171717',
      thColorSortingModal: '#171717',
    },
    Input: {
      color: '#111111',
      colorFocus: '#111111',
      colorHover: '#111111',
      iconColor: '#999999',
    },
    Button: {
      color: '#111111',
      colorHover: '#111111',
    },
    InternalSelection: {
      color: '#111111',
    },
    Tooltip: {
      color: '#0a0a0a',
    },
    Dropdown: {
      color: '#0a0a0a',
    },
  },
}
