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
      fontFamilyMono: ''
    }
  },
  light: {
    Layout: {
      color: '#f9fafb'
    }
  },
  dark: {
    common: {
      bodyColor: '#141414',
      cardColor: '#121212',
      modalColor: '#121212',
      popoverColor: '#141414',
      dividerColor: '#252525',
      hoverColor: '#252525',
      primaryColor: '#409EFF',
      primaryColorHover: '#66b1ff',
      primaryColorPressed: '#3a8ee6',
      primaryColorSuppl: '#66b1ff'
    },
    Layout: {
      color: '#141414',
      siderColor: '#121212',
      headerColor: '#121212',
      footerColor: '#141414'
    },
    Notification: {
      color: '#141414'
    },
    Message: {
      colorSuccess: '#141414'
    },
    DataTable: {
      thColor: '#121212',
      thColorHover: '#1a1a1a',
      tdColor: '#121212',
      tdColorHover: '#1a1a1a',
      tdColorHoverModal: '#1a1a1a',
      tdColorStriped: '#141414',
      tdColorSorting: '#1a1a1a',
      tdColorSortingModal: '#1a1a1a',
      thColorHoverModal: '#1a1a1a',
      thColorSorting: '#1a1a1a',
      thColorSortingModal: '#1a1a1a'
    },
    Input: {
      color: '#161616',
      colorFocus: '#1a1a1a',
      colorHover: '#1a1a1a',
      iconColor: '#999999'
    },
    Checkbox: {
      color: '#161616'
    },
    InternalSelection: {
      color: '#161616',
      colorActive: '#1a1a1a'
    },
    Tooltip: {
      color: '#1a1a1a'
    }
  }
}
