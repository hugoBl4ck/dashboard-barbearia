import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          // Cores principais
          primary: '#1976d2',          // Azul padrão para agendamentos
          secondary: '#424242',        // Cinza para elementos secundários
          accent: '#82b1ff',           // Azul claro para destaques
          error: '#f44336',            // Vermelho para erros
          info: '#2196f3',             // Azul para informações
          success: '#4caf50',          // Verde para sucessos e slots livres
          warning: '#ff9800',          // Laranja para avisos
          
          // Backgrounds e superfícies
          background: '#fafafa',       // Fundo geral da aplicação
          surface: '#ffffff',          // Fundo dos cards
          'surface-variant': '#f5f5f5', // Variação da superfície
          'surface-bright': '#ffffff', // Superfície brilhante
          'surface-dim': '#eeeeee',    // Superfície escura
          
          // Textos
          'on-primary': '#ffffff',     // Texto sobre cor primária
          'on-secondary': '#ffffff',   // Texto sobre cor secundária
          'on-surface': '#1c1c1c',     // Texto sobre superfície
          'on-surface-variant': '#424242', // Texto sobre variação da superfície
          'on-background': '#1c1c1c',  // Texto sobre fundo
          'on-error': '#ffffff',       // Texto sobre erro
          'on-info': '#ffffff',        // Texto sobre info
          'on-success': '#ffffff',     // Texto sobre sucesso
          'on-warning': '#000000',     // Texto sobre warning
          
          // Cores específicas para o sistema
          'grey-lighten-1': '#e0e0e0',
          'grey-lighten-2': '#eeeeee',
          'grey-lighten-3': '#f5f5f5',
          'grey-lighten-4': '#fafafa',
          'grey-lighten-5': '#fcfcfc',
          'grey-darken-1': '#757575',
          'grey-darken-2': '#616161',
          'grey-darken-3': '#424242',
          'grey-darken-4': '#212121',
          
          // Verdes para preços
          'green-lighten-2': '#81c784',
          'green-darken-2': '#388e3c',
          
          // Cores adicionais para o sistema de barbearia
          'blue-darken-1': '#1565c0',
          'deep-purple-darken-1': '#512da8',
        },
      },
      dark: {
        colors: {
          // Cores principais para tema escuro
          primary: '#2196f3',          // Azul mais claro para o tema escuro
          secondary: '#90a4ae',        // Cinza azulado
          accent: '#ff4081',           // Rosa para destaques
          error: '#f44336',
          info: '#2196f3',
          success: '#4caf50',
          warning: '#ff9800',
          
          // Backgrounds e superfícies escuras
          background: '#121212',       // Fundo escuro
          surface: '#1e1e1e',          // Superfície escura
          'surface-variant': '#2c2c2c', // Variação da superfície escura
          'surface-bright': '#424242', // Superfície brilhante escura
          'surface-dim': '#0f0f0f',    // Superfície mais escura
          
          // Textos para tema escuro
          'on-primary': '#ffffff',
          'on-secondary': '#000000',
          'on-surface': '#ffffff',
          'on-surface-variant': '#ffffff',
          'on-background': '#ffffff',
          'on-error': '#ffffff',
          'on-info': '#ffffff',
          'on-success': '#ffffff',
          'on-warning': '#000000',
          
          // Cores específicas para tema escuro
          'grey-lighten-1': '#424242',
          'grey-lighten-2': '#616161',
          'grey-lighten-3': '#757575',
          'grey-lighten-4': '#9e9e9e',
          'grey-lighten-5': '#bdbdbd',
          'grey-darken-1': '#303030',
          'grey-darken-2': '#212121',
          'grey-darken-3': '#1a1a1a',
          'grey-darken-4': '#0f0f0f',
          
          // Verdes para preços no tema escuro
          'green-lighten-2': '#a5d6a7',
          'green-darken-2': '#2e7d32',
          
          // Cores adicionais para tema escuro
          'blue-darken-1': '#1e88e5',
          'deep-purple-darken-1': '#673ab7',
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
      variant: 'elevated',
      elevation: 2,
    },
    VBtn: {
      variant: 'flat',
      color: undefined,
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