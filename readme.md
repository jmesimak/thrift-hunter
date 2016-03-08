# Online marketplace hunter

The purpose of the application is to periodically crawl an online marketplace
and alert the user by e-mail if items matching the user's specifications are found.
It's also possible to favorite the found items and delete those that are not of interest.
Deleted items will not be shown again unless the seller adds them to the service again.

The alert system is implemented using AWS SES but it's also quite easy to replace the module
by writing your own mailer that implements the sendMatches function.

To install the application, first configure the config.json files at the root and in app/mailer,
next:
    npm install
    node index.js

That's it. For deployment AWS Beanstalk is pretty nifty.

## Remember
If you deploy this to production, try to follow the robots.txt that the online marketplace
offers. Should you test against services that do not appreciate you crawling their websites,
it is a good idea to download a couple of their pages as html and point your crawler to those
so you do not cause unnecessary traffic.
