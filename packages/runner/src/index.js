import bridge from './bridge'
import compiler from './compiler'
import handleError from './lib/handleError'
import server from './server'
import bundler from './bundler'
import opts from './opts'
import log from './lib/log'
import internal from './internal'
import gulp from './gulp'
import cache from './cache'
import openInBrowser from './lib/openInBrowser'
import watchingMessage from './lib/watchingMessage'
import build from './builder/build'
import clear from './builder/clear'
import copy from './builder/copy'
import watchDeletes from './lib/watchDeletes'
import { mkdir } from './lib/fns'
import path from 'path'



// DONT RELEASE ME!
// import memwatch from 'memwatch-next'
// import heapdump from 'heapdump'
// memwatch.on('leak', function(info) {
//  console.error(info)
//  var file = '/tmp/myapp-' + process.pid + '-' + Date.now() + '.heapsnapshot'
//  heapdump.writeSnapshot(file, function(err){
//    if (err) console.error(err)
//    else console.error('Wrote snapshot: ' + file)
//   })
// })
// DONT RELEASE ME!


// STOP

process.on('SIGINT', cleanExit)
process.on('SIGTERM', cleanExit)

let child

function cleanExit() {
  if (child) {
    child.send('EXIT') // this seems to be required
    child.exit()
  }

  process.exit(0)
  console.log('Press ctrl-c again to exit', "\n") // in case
}

export function stop() {
  cleanExit()
}

export function setChild(_child) {
  child = _child
}

// RUN

async function waitForFirstBuild() {
  await gulp.afterFirstBuild()
  await bundler.finishedInstalling()
}

export async function run(_opts = {}, isBuild) {
  try {
    console.log()
    const appDir = _opts.appDir || path.normalize(process.cwd());
    const OPTS = opts.setAll({ ..._opts, appDir, isBuild })

    log.setLogging()
    log('opts', OPTS)

    await clear.styles()
    cache.setBaseDir(OPTS.dir)
    compiler('init', OPTS)

    // internals/externals
    await bundler.init()
    await internal.init()

    // cache watching
    watchDeletes()

    if (OPTS.build) {
      await bundler.remakeInstallDir(true)
      await clear.buildDir()
      copy.assets()

      // run our pipeline once manually
      gulp.buildScripts()
      await waitForFirstBuild()
      await build()

      if (OPTS.watch)
        return gulp.watchForBuild()

      process.exit()
    }
    else {
      await clear.outDir()
      await server.run()
      bridge.start()
      gulp.buildScripts()

      // wait for build
      await waitForFirstBuild()

      // ensure we have clean packages before open
      await bundler.externals({ doInstall: true })
      await bundler.uninstall()

      console.log(`\nReady ⇢ ${server.url()}\n`.bold.green)

      watchingMessage()
      // openInBrowser()
    }

    return opts.get()
  }
  catch(e) {
    if (!e.silent)
      handleError(e)
  }
}

export default { run, stop, setChild }