#!/usr/bin/env node
require('dotenv').config()
const jsdom = require('jsdom')
const express = require('express')
const puppeteer = require('puppeteer')

const { JSDOM } = jsdom

const url = 'https://www.humblebundle.com'
const port = 3000

const RapidAPIProxySecret = process.env.RAPID_API_KEY

const fetchHumbleBundle = async() => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()
  await page.goto(url);
  await page.$('.js-bundle-dropdown').then(btn => btn.click())

  const content = await page.$('.bundle-dropdown-content')
  const result = await content.evaluate(node => node.innerHTML)

  await browser.close()
  return result
}

const parseCard = (source, href) => {
  const { document } = (new JSDOM(source)).window;

  return {
    title: document.querySelector('.name').textContent,
    timeLeft: document.querySelector('.js-days').textContent,
    description: document.querySelector('.detailed-marketing-blurb').textContent,
    highlights: [...document.querySelectorAll('.highlight')].map(h => h.textContent),
    image: document.querySelector('img').attributes['data-src'].textContent,
    url: `${url}${href}`
  }
}

const parsePage = page => {
  const { document } = (new JSDOM(page)).window;

  const humbleCards = [...document.querySelectorAll('a.simple-tile-view')]
    .map(card => parseCard(card.innerHTML, card.href))

  return humbleCards
}

const isAuthorized = (req) => req.header('X-RapidAPI-Proxy-Secret') === RapidAPIProxySecret

const run = (res) => fetchHumbleBundle()
  .then(parsePage)
  .then(data => res.status(200).send(data))

const app = express()

app.get('/', (_, res) => res.send('It\'s working'))

app.get('/get-bundles', async (req, res) => {
  if (isAuthorized(req)) {
    try {
      await run(res)
    } catch(err) {
      res.status(500).send(err.message)
    }

    return;
  }

  res.status(401).end();
})

app.listen(port, () => void (console.log(`Server running on port ${port}`)))
