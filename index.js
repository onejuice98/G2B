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
  res.send("HELLO G2B BOT is Here! v25");
});

app.listen(port);
