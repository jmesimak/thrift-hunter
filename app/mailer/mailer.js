var aws = require('aws-sdk');
var config = require('./config.json');
aws.config.update({accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey, region: config.region});
var ses = new aws.SES({apiVersion: '2010-12-01'});

function formatMatches(matches) {
  var str = "Here are the items: \n";
  matches.forEach((m) => {
    str += `\t- ${m.title}, ${m.price}€\n`
  });
  return str;
}

function sendMatches(hunt, matches) {
  ses.sendEmail({
    Source: config.sender,
    Destination: {
      ToAddresses: config.recipients
    },
    Message: {
      Subject: {
        Data: `I found ${matches.length} new items matching your hunt for ${hunt.title}`,
        Charset: 'utf-8'
      },
      Body: {
        Text: {
          Data: formatMatches(matches),
          Charset: 'utf-8'
        }
      }
    }
  }, function(err, data) {
    console.log(err);
    console.log(data);
  });
}

module.exports = {
  sendMatches: sendMatches
}
