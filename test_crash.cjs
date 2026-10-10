const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => {
    console.log('\n\n=== PAGE CRASH ===');
    console.log(error.message);
    console.log(error.stack);
    console.log('==================\n\n');
  });

  try {
    console.log('Navigating...');
    await page.goto('http://localhost:5175/');
    
    // Click Access Platform
    const accessBtn = await page.$('.lp-cta-primary');
    if (accessBtn) await accessBtn.click();
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Click Try Demo Mode
    const btns = await page.$$('button');
    for (const btn of btns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Try Demo Mode')) {
        await btn.click();
        break;
      }
    }
    
    await page.waitForSelector('.sidebar-link', { timeout: 10000 });
    console.log('App loaded. Clicking on Settings tab...');
    
    const tabs = await page.$$('.sidebar-link');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.includes('Settings')) {
        await tab.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 3000));
    console.log('Done testing.');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
})();
