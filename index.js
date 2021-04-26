const express = require('express')
let { bech32, bech32m } = require('bech32')
const https = require('https');
const fs = require('fs');
const privateKey  = fs.readFileSync('tls.key', 'utf8');
const certificate = fs.readFileSync('tls.cert', 'utf8');
var credentials = {key: privateKey, cert: certificate};


const app = express()
const port = 3000
const baseurl = `https://192.168.1.72:${port}`

app.get('/params/', (req, res) => {
  console.log("params request")
  username = req.query.username

  // first call
  const metadata = [
    [
      "text/plain", // must always be present
      `pay ${username}` // actual metadata content
    ]
  ]

  const params = {
    callback: `${baseurl}/invoice/${username}`, // the URL from LN SERVICE which will accept the pay request parameters
    maxSendable: 50000000000, // MilliSatoshi, // max amount LN SERVICE is willing to receive
    minSendable: 1000, // MilliSatoshi, // min amount LN SERVICE is willing to receive, can not be less than 1 or more than `maxSendable`
    metadata: JSON.stringify(metadata), // metadata json which must be presented as raw string here, this is required to pass signature verification at a later step
    tag: "payRequest" // type of LNURL
  }

  res.send(params)
})

app.get('/invoice/:username', (req, res) => {
  username = req.params.username
  amount = req.query.amount
  console.log({username, amount}, "invoice request")

  // TODO
  // sha256(utf8ByteArray(unescaped_metadata_string))

  const invoice = "lnbc1"

  const response = {
    pr: invoice, // bech32-serialized lightning invoice
    successAction: null
  }

  res.send(response)
})

const link = `${baseurl}/params/?username=123`
let words = bech32.toWords(Buffer.from(link, 'utf8'))
console.log(bech32.encode('lnurl', words))


var httpsServer = https.createServer(credentials, app);
httpsServer.listen(3000);
