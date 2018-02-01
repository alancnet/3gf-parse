const { SerialStreamReader } = require('serial-stream')
const fs = require('fs')
const path = require('path')

const inputFile = process.argv[2];
const outputFile = process.argv[3];
if (!inputFile) {
  console.error(`Usage: ${path.basename(process.argv[1])} <input .3fg file> [output .csv file]`)
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
      .then(([dMs, a0, a1, a2]) =>
        writer.write(`${dMs},${a0},${a1},${a2}\n`)
      )
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
