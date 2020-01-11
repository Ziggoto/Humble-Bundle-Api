const puppeteer = require('puppeteer');

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

fetchHumbleBundle().then(console.log)
