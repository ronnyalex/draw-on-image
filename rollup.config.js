import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@wessberg/rollup-plugin-ts'
import less from 'rollup-plugin-less'
import vue from 'rollup-plugin-vue'
import alias from '@rollup/plugin-alias'
import filesize from 'rollup-plugin-filesize'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'

const aliases = require('./aliases.config')
const path = require('path')
const packageName = require('./package.json').name

export default {
  input: 'src/wrapper/index.js',
  output: {
    name: packageName,
    dir: 'dist/',
    format: 'esm',
    exports: 'named',
  },
  external: ['vue'],
  plugins: [
    alias({
      entries: aliases.rollup,
    }),
    typescript({
      tsconfig: (resolvedConfig) => ({
        ...resolvedConfig,
        declaration: true,
        allowJs: false,
      }),
    }),
    resolve(),
    commonjs(),
    vue({
      style: {
        preprocessOptions: {
          less: {
            paths: ['src/components'],
          },
        },
      },
    }),
    less(),
    getBabelOutputPlugin({
      configFile: path.resolve(__dirname, 'babel.config.js'),
    }),
    filesize(),
  ],
}
