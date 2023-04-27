


const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'https://www.glasgow.gov.uk/index.aspx?articleid=17024';

axios.get(url)
  .then(response => {
    const html = response.data;
    const $ = cheerio.load(html);
    const datesByMonthAndYear = new Map();

    $('li').each((index, element) => {
      const listItemText = $(element).text().trim();

      const dateRegex = /[A-Z][a-z]+(?:,)? (\d{1,2}) ([A-Z][a-z]+) (\d{4})/;

      if (dateRegex.test(listItemText)) {
        const [_, day, month, year] = dateRegex.exec(listItemText);
        const date = new Date(year, monthFromMonthName(month), day);
        const monthName = date.toLocaleString('default', { month: 'long' });

        if (datesByMonthAndYear.has(year)) {
          const yearMap = datesByMonthAndYear.get(year);
          if (yearMap.has(monthName)) {
            yearMap.get(monthName).push(listItemText);
          } else {
            yearMap.set(monthName, [listItemText]);
          }
        } else {
          const yearMap = new Map();
          yearMap.set(monthName, [listItemText]);
          datesByMonthAndYear.set(year, yearMap);
        }
      }
    });

    const result = {};
    for (const [year, yearMap] of datesByMonthAndYear) {
      result[year] = {};
      for (const [month, dates] of yearMap) {
        result[year][month] = dates;
      }
    }

    console.log(result);

    fs.writeFile('output.json', JSON.stringify(result), err => {
      if (err) {
        console.log(err);
      } else {
        console.log('File saved');
      }
    });
  })
  .catch(error => {
    console.log(error);
  });

function monthFromMonthName(name) {
  return new Date(`${name} 1, 2000`).getMonth();
}
