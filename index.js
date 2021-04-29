const express = require('express')
let { bech32 } = require('bech32')
const { ApolloClient, HttpLink, InMemoryCache } = require('@apollo/client')
const fetch = require('node-fetch');
const { gql } = require('@apollo/client')

const GRAPHQL_URI = process.env.GRAPHQL_URI ?? 'http://localhost:4000/graphql'

const client = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URI, fetch }),
  cache: new InMemoryCache()
});

const app = express()
const local_port = 3000
const baseurl = process.env.BASE_URI ?? `https://lnpay.mainnet.galoy.io`

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
  value = Number(req.query.value)
  console.log({username, value}, "invoice request")

  if (!username || !value) {
    console.log({username, value}, "missing input")
    return
  }

  let invoice
  
  try {
    const mutation = gql`mutation noauthAddInvoice($username:String!, $value: Int) {
      noauthAddInvoice(username: $username, value: $value)
    }`
  
    const result = await client.mutate({mutation, variables: {username, value}})
    invoice = result.data.noauthAddInvoice
  } catch (err) {
    console.log({...err, errors: err?.networkError?.result?.errors}, "error getting invoice")
    return
  }

  const response = {
    pr: invoice, // bech32-serialized lightning invoice
    successAction: null
  }

  res.send(response)
})

const link = `${baseurl}/params/?username=123`
console.log({link})
let words = bech32.toWords(Buffer.from(link, 'utf8'))
console.log(bech32.encode('lnurl', words, 1024))

app.use('/health', require('express-healthcheck')());
app.listen(local_port, () => console.log(`app launch on http://localhost:${local_port}`))
