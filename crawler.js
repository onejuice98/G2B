const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

/* yyyy-mm-dd 형식 return 함수 */
const dateParser = (date) => {
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6, 8);
  return [year, month, day];
};

/* 공사 목록 object */
const postListObject = (from, to) => {
  const [fYear, fMonth, fDay] = dateParser(from);
  const [tYear, tMonth, tDay] = dateParser(to);
  const object = {
    href: `https://www.g2b.go.kr:8101/ep/tbid/tbidList.do?searchType=1&bidSearchType=1&taskClCds=3&bidNm=&searchDtType=1&fromBidDt=${fYear}%2F${fMonth}%2F${fDay}&toBidDt=${tYear}%2F${tMonth}%2F${tDay}&fromOpenBidDt=&toOpenBidDt=&radOrgan=1&instNm=&instSearchRangeType=&refNo=&area=42&areaNm=&strArea=42&orgArea=42&industry=%C1%B6%B0%E6%BD%C4%C0%E7%A4%FD%BD%C3%BC%B3%B9%B0%B0%F8%BB%E7%BE%F7&industryCd=4993&upBudget=&downBudget=&budgetCompare=&detailPrdnmNo=&detailPrdnm=&procmntReqNo=&intbidYn=&regYn=Y&recordCountPerPage=100`,
    selectPath: `table > tbody > tr`,
    items: [
      { name: "공고번호", path: "td:nth-child(2) > div" },
      { name: "분류", path: "td:nth-child(3) > div" },
      { name: "공고명", path: "td.tl > div > a" },
      { name: "공고기관", path: "td:nth-child(5) > div" },
      { name: "수요기관", path: "td:nth-child(6) > div" },
      { name: "게약방법", path: "td:nth-child(7) > div" },
      { name: "입력일시", path: "td.tc > div" },
      { name: "입찰마감일시", path: "td.tc > div > span.blue" },
      { name: "마감여부", path: "td:nth-child(10) > div" },
    ],
  };
  return object;
};

/* 공사 상세 페이지 이동 */
const detailObject = (bidNo) => {
  const object = {
    href: `https://www.g2b.go.kr:8081/ep/invitation/publish/bidInfoDtl.do?bidno=${bidNo}&bidseq=00&releaseYn=Y&taskClCd=3`,
    selectPath: `#container > div.results > table > tbody > tr`,
    items: [
      { name: "업체명", path: "td:nth-child(3) > div" },
      { name: "대표자명", path: "td:nth-child(4) > div > span" },
      { name: "입찰금액(원)", path: "td:nth-child(5) > div > span" },
      { name: "투찰률(%)", path: "td:nth-child(6) > div > span" },
    ],
  };
  return object;
};

const postCrawler = async (object) => {
  /* puppeter chromium 실행 */
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(object.href);

  /* page data fetching */
  const content = await page.content();

  /* close chromium */
  await page.close();
  await browser.close();

  /* selector 이용하여 데이터 정제 */
  const $ = cheerio.load(content);
  const result = [];

  $(object.selectPath).each((index, element) => {
    const $data = cheerio.load(element);
    const returnData = {};
    object.items.forEach((item) => {
      returnData[item.name] = $data(item.path).text();
    });
    result.push(returnData);
  });

  return Promise.resolve(result);
};

const detailCrawler = async (object) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(object.href);

  /* 기초금액 파악 */
  const price = await page.content();

  /* SPA 버튼 조작 (입찰결과 버튼 클릭) */
  const resultBtn = await page.$(
    "#container > div:nth-child(26) > table > tbody > tr:nth-last-child(1) > td:nth-last-child(1) > a"
  );
  await resultBtn.click();
  await page.waitForNavigation();

  const content = await page.content();
  await page.close();
  await browser.close();

  /* 기초금액 */
  const $price = cheerio.load(price);

  /* 입찰결과 */
  const $ = cheerio.load(content);

  const result = [];
  $(object.selectPath).each((index, element) => {
    const $data = cheerio.load(element);
    const returnData = {};

    object.items.forEach((item) => {
      returnData[item.name] = $data(item.path)
        .text()
        .replace(/\t/g, "")
        .replace(/\n/g, "")
        .replace(/ /g, "");
    });

    returnData["기초금액"] = $price(
      "#container > div:nth-child(18) > table > tbody > tr > td.tr"
    )
      .text()
      .replace("원", "");

    result.push(returnData);
  });
  return Promise.resolve(result);
};

const priceCrawler = async (bidNo) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(
    `https://www.g2b.go.kr:8081/ep/invitation/publish/bidInfoDtl.do?bidno=${bidNo}&bidseq=00&releaseYn=Y&taskClCd=3`
  );

  /* 기초금액 얻기 위한 Page content */
  const content = await page.content();

  await page.close();
  await browser.close();

  const $ = cheerio.load(content);

  const price = $("#container > div:nth-child(18) > table > tbody > tr > td.tr")
    .text()
    .replace("원", "");

  return Promise.resolve(price);
};

module.exports = {
  postListObject,
  postCrawler,
  detailObject,
  detailCrawler,
  priceCrawler,
};
