const express = require("express");
const {
  postListObject,
  postCrawler,
  detailObject,
  detailCrawler,
  priceCrawler,
} = require("./crawler");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/api/posts", async (req, res) => {
  const { from, to, bidCode, areaCode } = req.body;
  const post = await postCrawler(postListObject(from, to, bidCode, areaCode));

  return res.status(200).json(post);
});

app.get("/api/post", async (req, res) => {
  const bidNo = req.query.bidNo;
  const price = await priceCrawler(bidNo);

  return res.status(200).json({ 기초금액: price });
});

app.get("/api/post/result", async (req, res) => {
  const bidNo = req.query.bidNo;
  const details = await detailCrawler(detailObject(bidNo));

  return res.status(200).json(details);
});

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

  /*
  let end = [];
  for (let i = 0; i < result.length; i++) {
    result[i].forEach((value) => {
      if (value.대표자명 === "이복균") {
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
  postListObject("20221223", "20220603");
  */
  res.send("HELLO G2B BOT is Here! v24");
});

app.listen(port);
