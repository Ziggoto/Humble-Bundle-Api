const jsdom = require('jsdom')
const express = require('express')
const puppeteer = require('puppeteer')

const { JSDOM } = jsdom

const url = 'https://www.humblebundle.com'
const port = 3000

const fetchHumbleBundle = async() => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
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
    timeLeft: document.querySelector('.timer-field').textContent,
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

const app = express()

app.get('/get-bundles', (req, res) => fetchHumbleBundle()
  .then(parsePage)
  .then(data => res.send(data))
)

app.listen(port, () => void (console.log(`Server running on port ${port}`)))
