const jsdom = require("jsdom")
const puppeteer = require('puppeteer')

const { JSDOM } = jsdom

const fetchHumbleBundle = async() => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.humblebundle.com/');
  await page.$('.js-bundle-dropdown').then(btn => btn.click())

  const content = await page.$('.bundle-dropdown-content')
  const result = await content.evaluate(node => node.innerHTML)

  await browser.close()
  return result
}

const parseCard = source => {
  const { document } = (new JSDOM(source)).window;

  return {
    title: document.querySelector('.name').textContent,
    timeLeft: document.querySelector('.timer-field').textContent,
    description: document.querySelector('.detailed-marketing-blurb').textContent,
    highlights: [...document.querySelectorAll('.highlight')].map(h => h.textContent),
    image: document.querySelector('img').attributes['data-src'].textContent
  }
}

const parsePage = page => {
  const { document } = (new JSDOM(page)).window;

  const humbleCards = [...document.querySelectorAll('a.simple-tile-view')]
    .map(card => parseCard(card.innerHTML))

  return humbleCards
}

fetchHumbleBundle()
  .then(parsePage)
  .then(console.log)
