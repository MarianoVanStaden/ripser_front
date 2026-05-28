const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5178/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    console.log('=== Page Content Debug ===\n');

    // Get all form inputs
    const inputs = await page.$$('input');
    console.log(`Found ${inputs.length} input elements:`);

    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const placeholder = await inputs[i].getAttribute('placeholder');
      const dataTestId = await inputs[i].getAttribute('data-testid');
      const name = await inputs[i].getAttribute('name');
      console.log(`  ${i}. type="${type}" placeholder="${placeholder}" data-testid="${dataTestId}" name="${name}"`);
    }

    // Get all buttons
    const buttons = await page.$$('button');
    console.log(`\nFound ${buttons.length} button elements:`);

    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const type = await buttons[i].getAttribute('type');
      console.log(`  ${i}. text="${text.trim()}" type="${type}"`);
    }

    // Check page title
    const title = await page.title();
    console.log(`\nPage title: ${title}`);

    // Get the HTML
    const html = await page.content();
    if (html.includes('Usuario o Correo')) {
      console.log('\n✅ Page contains "Usuario o Correo" field');
    }
    if (html.includes('Contraseña')) {
      console.log('✅ Page contains "Contraseña" field');
    }
    if (html.includes('Ingresar')) {
      console.log('✅ Page contains "Ingresar" button');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
