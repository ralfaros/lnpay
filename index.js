const express = require('express')
let { bech32 } = require('bech32')
const https = require('https');
const fs = require('fs');
const { ApolloClient, HttpLink, InMemoryCache } = require('@apollo/client')
const fetch = require('node-fetch');
const { gql } = require('@apollo/client')


// FIXME temp. use nginx instead
const privateKey  = fs.readFileSync('tls.key', 'utf8');
const certificate = fs.readFileSync('tls.cert', 'utf8');
var credentials = {key: privateKey, cert: certificate};


const uri = 'http://localhost:4000/graphql'
const client = new ApolloClient({
  link: new HttpLink({ uri, fetch }),
  cache: new InMemoryCache()
});

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


app.get('/invoice/:username', async (req, res) => {
  username = req.params.username
  amount = req.query.amount
  console.log({username, amount}, "invoice request")

  // TODO
  // sha256(utf8ByteArray(unescaped_metadata_string))

  let invoice

  try {
    const mutation = gql`mutation noauthAddInvoice($username:String!) {
      noauthAddInvoice(username: $username)
    }`
  
    const result = await client.mutate({mutation, variables: {username}})
    invoice = result.data.noauthAddInvoice
  } catch (err) {
    console.log({err}, "error getting invoice")
    return
  }

  // const invoice = "lnbc1"

  const response = {
    pr: invoice, // bech32-serialized lightning invoice
    successAction: null
  }

  res.send(response)
})

const link = `${baseurl}/params/?username=123`
let words = bech32.toWords(Buffer.from(link, 'utf8'))
console.log(bech32.encode('lnurl', words))


const httpsServer = https.createServer(credentials, app);
httpsServer.listen(3000);
