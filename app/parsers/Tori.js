'use strict';
var cheerio = require('cheerio');
var iconv = require('iconv');
var request = require('request');
var ic = new iconv.Iconv('iso-8859-1', 'utf-8');

class Parser {

  constructor(location, category) {
    this.location = location;
    this.category = category;
  }

  normalizeSearch(string) {
    return string.replace(' ', '+').toLowerCase();
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
      var priceString = priceElem ? priceElem.data : '0 eur';
      ret.href = href;
      var price = parseInt(priceString.split(' ')[0]);
      ret.price = price;
      ret.createdAt = new Date();
      return {
        title: ret.title,
        href: ret.href,
        price: price,
        createdAt: new Date()
      }
    } else {
      return {title: '', href: '', price: 0, createdAt: new Date()};
    }
  }

  findMatchesForKeyword(kw) {
    var parser = this;
    var url = `http://www.tori.fi/${parser.location}/${parser.category}?q=${parser.normalizeSearch(kw)}`;
    console.log(`Beginning hunt for ${kw} from ${url}`);
    return new Promise(function(resolve, reject) {
      request({url: url, encoding: null}, function(error, response, body) {
        var buf = ic.convert(body);
        var utfbody = buf.toString('utf-8');
        var $ = cheerio.load(utfbody);
        var items = [];
        $('.item_row').each(function(i, elem) {
          items.push($(elem));
        });
        var matches = items
          .map((i) => {
            return parser.getHrefIfMatch(i);
          })
          .filter((i) => {
            return !!i
          });
        resolve(matches);
      });
    });
  }
}

module.exports = Parser;
