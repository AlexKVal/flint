import bridge from '../bridge'
import exec from './exec'
import { flatten } from 'lodash'

let meta = {}

bridge.on('editor', data => {
  let { type, key, el, view } = data
  console.log('type', type, 'view', view)

  // start with one of these two
  let start = type.split(':')[0]
  if (start != 'focus' && start != 'view') return

  if (view === undefined) return
  // the browser turns One.Two into One-Two
  view = view.replace(/\-/, '.')

  if (!meta[view]) return

  const viewData = { name: view, file: meta[view].data.file }

  if (type == 'focus:style') {
    bridge.message('editor:style', {
      view: viewData,
      position: meta[view].styles[el]
    }, 'focus')
  }

  if (type == 'view:state') {
    let dynamics = meta[view].dynamicStyles
    //let vars = meta[view].vars

    let getPosition = (prop, style) => {
      let vals = dynamics
        .filter(d => d.selector == prop && d.prop == style)
        .map(({ position }) => position)

      return vals.length > 0 ? vals[0] : null
    }

    // merge with info from babel
    let mergeStyles = styles =>
      flatten(styles.map(({ prop, values }) =>
        Object.keys(values).map(style =>
          ({ viewData, value: values[style], position: getPosition(prop, style) })
        )
      ))

    let mergeVars = vars => {
      []
    }

    let toEditor = () =>
      mergeStyles(dynamics).concat(mergeVars([]))

    bridge.message('editor:view:state', {
      view: view,
      styles: toEditor
    }, 'view')
  }

  if (type == 'focus:view') {
    bridge.message('editor:style', {
      view: viewData,
      styles: meta[view].dynamicStyles,
      values: [{ selector: 'h1', padding: 50 }, { selector: 'h1', fontSize: 10 }],
    }, 'focus')
  }

  if (type == 'focus:element') {
    if (!view || !key) return
    bridge.message('editor:element', {
      view: viewData,
      position: meta[view].els[key]
    }, 'focus')
  }

  //todo dont focus escape every time
  exec(`osascript -e 'activate application "Atom"'`)
})

export default data => {
  Object.keys(data.meta).map(view => {
    meta[view] = data.meta[view]
  })
}
