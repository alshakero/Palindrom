var webdriver = require('selenium-webdriver'),
    username = process.env.SAUCE_USERNAME,
    accessKey = process.env.SAUCE_ACCESS_KEY,
    driver;
    
var caps = {
    'browserName': 'chrome',
    'platform': 'Windows 10',
    'version': '49.0',
    'username': username,
    'accessKey': accessKey,
    'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER
};

driver = new webdriver.Builder().
  withCapabilities(caps).
  usingServer("http://" + username + ":" + accessKey +
              "@ondemand.saucelabs.com:80/wd/hub").
  build();

driver.get("/test/")

driver.getTitle().then(function (title) {
    console.log("title is: " + title);
});

driver.quit();