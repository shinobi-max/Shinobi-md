const fs = require('fs')

global.owner = "50941050126"
global.footer = "𝚂𝙷𝙸𝙽𝙾𝙱𝙸"

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
