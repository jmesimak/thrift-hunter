'use strict';

var cheerio = require('cheerio');
var request = require('request');
var utf8 = require('utf8');
var iconv = require('iconv');

class Crawler {
  constructor(searchParams, filters) {
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

  getHrefIfMatch(element) {
    var descElem = element.children().filter('.desc')['0'];
    var ret = {};
    if (descElem) {
      var title = descElem.children[1].children[0].data;
      ret.title = title;
      if (!ret.title) {
        return false;
      }
      var href = descElem.children[1].attribs.href;
      var priceElem = descElem.children[2].children[0];
      var priceString =  priceElem ? priceElem.data : '0 eur';
      ret.href = href;
      var price = parseInt(priceString.split(' ')[0]);
      ret.price = price;
      ret.createdAt = new Date();
      return this.filterResult(ret) ? ret : false;
    } else {
      return false;
    }
  }

  findMatchesForKeyword(kw) {
    var crawler = this;
    var url = `http://www.tori.fi/${crawler.searchParams.location}/${crawler.searchParams.category}?q=${crawler.normalizeSearch(kw)}`;
    console.log(`Beginning hunt for ${kw} from ${url}`);
    return new Promise(function(resolve, reject) {
      request({url: url, encoding: null}, function(error, response, body) {
        var buf = crawler.ic.convert(body);
        var utfbody = buf.toString('utf-8');
        var $ = cheerio.load(utfbody);
        var items = [];
        $('.item_row').each(function(i, elem) {
          items.push($(elem));
        });
        var matches = items.map(function(i) {
          return crawler.getHrefIfMatch(i);
        }).filter((i) => { return !!i});
        resolve(matches);
      });
    });
  }

  findMatches() {
    var crawler = this;
    var promises = [];
    return new Promise(function(resolve, reject) {
      crawler.filters.include.forEach(function(kw) {
        promises.push(crawler.findMatchesForKeyword(kw));
      });
      Promise.all(promises).then(function(success) {
        resolve(success.reduce((prev, cur) => {return prev.concat(cur); }, []));
      });
    });
  }
}

module.exports = Crawler;
