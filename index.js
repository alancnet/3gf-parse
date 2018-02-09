const { SerialStreamReader } = require('serial-stream')
const fs = require('fs')
const path = require('path')
const getConfig = require('microservice-config');

const config = getConfig({raw: false});
const inputFile = config._[0];
const outputFile = config._[1];
if (!inputFile) {
  console.error(`Usage: ${path.basename(process.argv[1])} <input .3fg file> [output .csv file] [--raw]`)
} else {
  const output = outputFile
    ? fs.createWriteStream(outputFile)
    : null
  const stream = fs.createReadStream(inputFile)
  const reader = new SerialStreamReader(stream);
  const writer = output || process.stdout
  const read = () =>
    Promise.all([
      reader.readInt32BE(),
      reader.readInt16BE(),
      reader.readInt16BE(),
      reader.readInt16BE()
    ])
      .then(([dMs, a0, a1, a2]) => writer.write([]
          .concat(config.raw ? [dMs, a0, a1, a2] : [])
          .concat([(dMs * .001).toFixed(2), (a0 / 128).toFixed(3), (a1 / 128).toFixed(3), (a2 / 128).toFixed(3)])
          .join(',') + '\n'
      ))
      .then(read)

  writer.write('dMs,a0,a1,a2\n')


  stream.on('end', () => {
    if (output) {
      output.end()
      output.close()
    }
    stream.close()
  })
  read()
}
