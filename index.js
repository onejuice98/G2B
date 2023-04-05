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
