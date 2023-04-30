import puppeteer from 'puppeteer';

const CONFIG = {
    headless: true,
    timeout: 20000,
    ignoreHTTPSErrors: true,
    slowMo: 0,
    args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--window-size=1280,720',
    ],
    ignoreDefaultArgs: ['--disable-extensions']
}


export async function getVallibelFinanceFDRates() {

    const FD_RATES_PAGE_URL = "https://www.vallibelfinance.com/product/fixed-deposits"

    const browser = await puppeteer.launch(CONFIG);
    const page = await browser.newPage();

    await page.goto(FD_RATES_PAGE_URL);
    await page.setViewport({ width: 1080, height: 1024 });

    const normalCitizenTable = await page.waitForSelector('body > div.row.row_clr.about-middle.product-middle.content > div > div.col-xs-12.no-pad > div.col-sm-6.col-xs-12.product-right > div:nth-child(1) > table');
    const rows = await normalCitizenTable?.$$("tbody > tr");

    const formatPeriod = (period: string): string => {
        const splittedString = period.split(" ");
        return splittedString[1].startsWith("M") ? `${splittedString[0].trim()} M` : splittedString[1].startsWith("Y") ? `${splittedString[0].trim()} Y` : "INVALID"
    }

    let tableData = [];

    if (rows) {

        for (const row of rows) {
            const colPeriod = await row.$('td[data-title="Period"]');
            const colMonthly = await row.$('td[data-title="Monthly"]');
            const colMatuarity = await row.$('td[data-title="Maturity"]');

            const period = await page.evaluate((el: any) => el?.textContent, colPeriod);
            const monthlyRate = await page.evaluate((el: any) => el?.textContent, colMonthly);
            const matuarityRate = await page.evaluate((el: any) => el?.textContent, colMatuarity);

            const rowData = {
                period: formatPeriod(period ?? ""),
                monthlyRate: monthlyRate === "-" ? 0.0 : parseFloat(monthlyRate?.split("%")[0] ?? "0.0"),
                matuarityRate: matuarityRate === "-" ? 0.0 : parseFloat(matuarityRate?.split("%")[0] ?? "0.0")
            }
            tableData.push(rowData);
        }
    }

    await browser.close();
    return tableData;





}