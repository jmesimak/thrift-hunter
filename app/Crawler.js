'use strict';

var cheerio = require('cheerio');
var request = require('request');
var iconv = require('iconv');

class Crawler {
  constructor(searchParams, filters, parser) {
    this.parser = parser;
    this.filters = filters;
    this.searchParams = searchParams;
    this.ic = new iconv.Iconv('iso-8859-1', 'utf-8');
  }

  normalizeSearch(string) {
    return string.replace(' ', '+').toLowerCase();
  }

  passFilters(arr) {
    return arr.reduce((prev, cur) => {
      if (!cur) {
        return false;
      }
      return prev;
    }, true);
  }

  /*
  * result: {title (string), price (number)}
  */
  filterResult(result) {
    var pass = [];
    pass.push(result.title && result.href ? true : false);
    pass.push(this.filters.include.reduce((prev, cur) => {
      return prev ? true : result.title.toLowerCase().indexOf(cur.toLowerCase()) !== -1
    }, false));
    pass.push(!this.filters.exclude.reduce((prev, cur) => {
      return prev ? true : result.title.toLowerCase().indexOf(cur.toLowerCase()) !== -1
    }, false));
    pass.push(result.price <= this.filters.maxPrice);
    if (this.filters.hasPrice) {
      pass.push(!!result.price);
    }
    return this.passFilters(pass);
  }

  findMatches() {
    var crawler = this;
    var promises = [];
    return new Promise((resolve, reject) => {
      crawler.filters.include.forEach((kw) => {
        promises.push(crawler.parser.findMatchesForKeyword(kw));
      });
      Promise.all(promises).then((success) => {
        var matches = success
          .reduce((prev, cur) => {
            return prev.concat(cur);
          }, [])
          .filter((m) => {
            return crawler.filterResult(m);
          });
        resolve(matches);
      });
    });
  }
}

module.exports = Crawler;
