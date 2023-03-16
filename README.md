# G2B Crawler Bot

## 🔗 Link

deploy by heroku : https://g2b-bot.herokuapp.com

## 📒 Description

### **나라장터 데이터 크롤러**

> 나라장터 홈페이지 기능 불편함 해소와 차트 기능 도입을 위하여 만든 API
>
> express : 4.18.2, cheerio : 1.0.0-rc.12, puppeteer : 18.1.0
>
> node : v18.15.0, yarn : 1.22.19
>
> puppeteer 통해서 chromium 활용 SPA 페이지 동적 크롤링

- 업종코드, 제한구역코드 입력으로 목록 _json data_ 확인
- 공고번호를 통해서 공고 상세페이지의 기초금액, 입찰결과 확인

## 📌 Setup

### **Install**

```bash
yarn install
```

### **Start**

```bash
node index.js
```

### **GET**

**기초금액** : `/api/post?bidNo=${bidNo}` <br/>
**입찰결과** : `/api/post/result?bidNo=${bidNo}` <br/>
`query param` : bidNo (공고번호)

### **POST**

**공고목록** : `/api/posts` <br/>
`body` : `x-www-form-urlencoded`

```json
{
  "form": "yyyyMMdd",
  "to": "yyyyMMdd",
  "bidCode": "0000",
  "areaCode": "00000"
}
```

`from`, `to` : 6자리의 날짜 형식 (한달 이상 검색 자제, 일부 누락됨) <br/>
`bidCode` : 나라장터에서 소개하는 업종코드 <br/>
`areaCode` : 나라장터에서 소개하는 지역코드 <br/>
