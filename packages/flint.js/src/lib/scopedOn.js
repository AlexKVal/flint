export default function scopedOn(parentScope) {
  function _on(scope, name, cb, ...args) {
    // check if they defined their own scope
    if (name && typeof name == 'string')
      return on(scope, name, cb, ...args)
    else
      return on(parentScope, scope, name, cb, ...args)
  }

  // view defaults
  const viewEvent = boundEvent.bind(null, _on, parentScope)

  _on.mount =  viewEvent('mount')
  _on.unmount = viewEvent('unmount')
  _on.change = viewEvent('change')
  _on.render = viewEvent('render')

  return _on
}

function boundEvent(viewOn, scope, name, ...pargs) {
  return (...args) => viewOn(scope, name, ...pargs, ...args)
}