const express = require("express");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const postList = require("./post_list.json");
const postList2 = require("./post_list2.json");
const result = require("./result.json");
const app = express();

const post_list_object = (fYear, fMonth, fDay, tYear, tMonth, tDay) => {
  const object = {
    href: `https://www.g2b.go.kr:8101/ep/tbid/tbidList.do?searchType=1&bidSearchType=1&taskClCds=3&bidNm=&searchDtType=1&fromBidDt=${fYear}%2F${fMonth}%2F${fDay}&toBidDt=${tYear}%2F${tMonth}%2F${tDay}&fromOpenBidDt=&toOpenBidDt=&radOrgan=1&instNm=&instSearchRangeType=&refNo=&area=42&areaNm=&strArea=42&orgArea=42&industry=%C1%B6%B0%E6%BD%C4%C0%E7%A4%FD%BD%C3%BC%B3%B9%B0%B0%F8%BB%E7%BE%F7&industryCd=4993&upBudget=&downBudget=&budgetCompare=&detailPrdnmNo=&detailPrdnm=&procmntReqNo=&intbidYn=&regYn=Y&recordCountPerPage=100`,
    select_path: `table > tbody > tr`,
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
//#container > div:nth-child(26) > table > tbody > tr > td:nth-child(5) > a
const post_object = (bidno) => {
  object = {
    href: `https://www.g2b.go.kr:8081/ep/invitation/publish/bidInfoDtl.do?bidno=${bidno}&bidseq=00&releaseYn=Y&taskClCd=3`,
    select_path: `#container > div.results > table > tbody > tr`,
    items: [
      {
        name: "업체명",
        path: "td:nth-child(3) > div",
      },
      {
        name: "대표자명",
        path: "td:nth-child(4) > div > span",
      },
      {
        name: "입찰금액(원)",
        path: "td:nth-child(5) > div> span",
      },
      {
        name: "투찰률(%)",
        path: "td:nth-child(6) > div > span",
      },
    ],
  };
  return object;
};
const crawler = async (object) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(object.href);
  const content = await page.content();

  await page.close();
  await browser.close();
  const $ = cheerio.load(content);

  const result = [];

  $(object.select_path).each((idx, element) => {
    const $data = cheerio.load(element);
    const return_data = {};
    object.items.forEach((item) => {
      return_data[item.name] = $data(item.path).text();
    });
    result.push(return_data);
  });
  return Promise.resolve(result);
};

const crawlerDetail = async (object) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(object.href);

  const price = await page.content();
  const btn = await page.$(
    "#container > div:nth-child(26) > table > tbody > tr:nth-last-child(1) > td:nth-last-child(1) > a"
  );
  await btn.click();
  await page.waitForNavigation();

  const content = await page.content();
  await page.close();
  await browser.close();
  const $price = cheerio.load(price);

  const $ = cheerio.load(content);

  const result = [];
  $(object.select_path).each((idx, element) => {
    const $data = cheerio.load(element);
    const return_data = {};
    object.items.forEach((item) => {
      return_data[item.name] = $data(item.path)
        .text()
        .replace(/\t/g, "")
        .replace(/\n/g, "");
    });
    return_data["price"] = $price(
      "#container > div:nth-child(18) > table > tbody > tr > td.tr"
    ).text();
    result.push(return_data);
  });
  return result;
};
app.get("/", async (req, res) => {
  /* 연 단위로 데이터 넣는 코드
  let end = [];
  for (let i = 1; i < 12; i++) {
    const postList = await crawler(
      post_list_object("2022", i, "01", "2022", i + 1, "01")
    );
    end.push(postList);
  }*/

  /* 횡성 마감 데이터 생성 */
  /*
  let end = [];

  for (let i = 0; i < postList2.length; i++) {
    end.push(
      await crawlerDetail(post_object(postList2[i].공고번호.slice(0, 11)))
    );
  }
*/
  /* 회사별 데이터 */

  let end = [];
  for (let i = 0; i < result.length; i++) {
    result[i].forEach((value) => {
      if (value.대표자명 === "이숙") {
        let 입찰금액 = value["입찰금액(원)"].replace(/,/g, "");
        let 투찰률 = value["투찰률(%)"].replace(" ", "");
        let 기초금액 = value.price.replace(/,/g, "").replace("원", "");
        value["퍼센트(%)"] = (
          (((입찰금액 * 100) / 투찰률 - 기초금액) / 기초금액) *
          100
        ).toFixed(5);
        end.push(value);
      }
    });
  }

  res.send(end);
});

app.listen(5001);
