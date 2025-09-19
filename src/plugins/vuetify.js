import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'


export default createVuetify({
  components: {
    ...components,
  },
  directives,
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#1976d2',
          secondary: '#424242',
          accent: '#82b1ff',
          error: '#f44336',
          info: '#2196f3',
          success: '#4caf50',
          warning: '#ff9800',
          background: '#F5F5F7',
          surface: '#FFFFFF',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#2196f3',
          secondary: '#90a4ae',
          accent: '#D4AF37',
          error: '#f44336',
          info: '#2196f3',
          success: '#4caf50',
          warning: '#ff9800',
          background: '#1E1E1E',
          surface: '#242424',
        },
      },
    },
    variations: {
      colors: ['primary', 'secondary', 'accent'],
      lighten: 5,
      darken: 5,
    },
  },
  defaults: {
    // Configurações padrão dos componentes
    VCard: {
      variant: 'flat',
      border: 'thin',
      rounded: 'lg',
    },
    VBtn: {
      variant: 'flat',
      color: undefined,
      rounded: 'lg',
    },
    VChip: {
      variant: 'flat',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },
  },
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
})