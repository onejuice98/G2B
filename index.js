/* chat gpt api import*/
require("dotenv").config();
const OpenAI = require("openai");
const { Configuration, OpenAIApi } = OpenAI;
const bodyParser = require("body-parser");

/* G2B crawler import */
const express = require("express");
const {
  postListObject,
  postCrawler,
  detailObject,
  detailCrawler,
  priceCrawler,
} = require("./crawler");
const fs = require("fs");
const postJSON = require("./post.json");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(bodyParser.json());

/* chat gpt api */
const configuration = new Configuration({
  organization: "org-zoXxBc2eGsKN96aoFsy14meF",
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `${message}`,
    max_tokens: 4010,
    temperature: 0,
  });
  console.log(response.data);
  if (response.data) {
    if (response.data.choices) {
      res.json({
        message: response.data.choices[0].text,
      });
    }
  }
});

/* G2B crawler */
/* 공고 검색 api 2개 */
app.get("/api/posts", async (req, res) => {
  const post = JSON.parse(fs.readFileSync("post.json"));
  return res.status(200).json(post);
});

app.post("/api/posts", async (req, res) => {
  const { from, to, bidCode, areaCode } = req.body;
  const post = await postCrawler(postListObject(from, to, bidCode, areaCode));
  fs.writeFileSync("post.json", JSON.stringify(post));
  return res.status(200).json(post);
});

/* 최근 공고 1개 찾는 api 2023.04.06 update */
app.get("/api/recent", (req, res) => {
  const recentData = JSON.parse(fs.readFileSync("post.json"));
  return res.status(200).json(recentData[0]);
});

/* 마감된 공고에서 결과를 뽑아내보자 ceo 이름 별로 defaultArea에서 뽑은 다음 저장이미 json이 있으면 다시 생성 X  2023.04.06 update */
app.get("/api/post/result/detail", async (req, res) => {
  const ceo = req.query.ceo;
  /* defaultArea.json은 22.01.01 ~ 23.04.06 까지의 데이터임 */
  const post = JSON.parse(fs.readFileSync("defaultArea.json"));
  const result = [];
  try {
    await fs.promises.access(`${ceo}.json`);
    result.push(JSON.parse(await fs.promises.readFile(`${ceo}.json`)));
  } catch (err) {
    for (let i = 0; i < post.length; i++) {
      const details = await detailCrawler(
        detailObject(post[i]["공고번호"].slice(0, 11))
      );
      details.map(
        (value, index) => value["대표자명"] === ceo && result.push(value)
      );
    }
    await fs.promises.writeFile(`${ceo}.json`, JSON.stringify(result));
  }

  return res.status(200).json(result);
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
  res.send("HELLO G2B BOT is Here! v31, with chat gpt v2.0.2");
});

app.listen(port);
