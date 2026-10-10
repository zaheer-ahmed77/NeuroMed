const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5175/');
  
  await page.evaluate(() => {
    localStorage.setItem('token', 'DEMO_MODE');
  });
  
  await page.reload();
  
  await new Promise(r => setTimeout(r, 2000));
  
  const tabs = await page.$$('.sidebar-link');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('Settings')) {
      await tab.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  console.log('Done testing.');
  await browser.close();
})();
