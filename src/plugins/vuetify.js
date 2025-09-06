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
          primary: '#16a34a', // Verde personalizado
          secondary: '#f59e42', // Laranja, ajuste conforme preferir
          'surface-variant': '#f5f5f5', // Fundo mais neutro
          background: '#f5f5f5', // Fundo geral
          info: '#6366f1', // Azul claro, pode trocar
        },
      },
    },
  },
})
