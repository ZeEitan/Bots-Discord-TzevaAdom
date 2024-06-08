const puppeteer = require('puppeteer');

async function takeScreenshot(id) {

  const url = `https://www.tzevaadom.co.il/alerts/${id}`;
  const outputPath = `${id}.png`;
  const cssClass = 'map';

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.addStyleTag({
        content: `
          .logo {
            display: none !important;
          }

          .gmnoprint {
            display: none !important;
          }

          button {
            display: none !important;
          }

          .gm-style-cc {
            display: none !important;
          }
          
        `,

    });

    await page.evaluate(() => {
        const image = document.querySelector('img[alt="Google"]')
        if (image) {
            image.style.display = 'none';
          }
    });

    await page.waitForSelector(`.${cssClass}`);

    const clipRect = await page.$eval(`.${cssClass}`, (element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    });

    await page.screenshot({ path: outputPath, clip: clipRect });
    console.log(`Screenshot saved to: ${outputPath}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = {
    takeScreenshot
}

