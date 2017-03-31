const isCI = require("is-ci");
const colors = require("colors");
const sauceConnectLauncher = require("sauce-connect-launcher");

console.log("Running SauceLabs PalindromDOM tests".green);

function theRunnerItself(username, accessKey, callback) {
  var webdriver = require("selenium-webdriver"), driver;

  var caps = {
    browserName: "chrome",
    platform: "Windows 10",
    version: "49.0",
    username: username,
    accessKey: accessKey,
    "tunnel-identifier": process.env.TRAVIS_JOB_NUMBER
  };
  const By = webdriver.By;

  driver = new webdriver.Builder()
    .withCapabilities(caps)
    .usingServer(
      "http://" + username + ":" + accessKey + "@localhost:4445/wd/hub"
    )
    .build();

  driver.get("http://127.0.0.1:8000/components/Palindrom/test/SpecRunner.html");
  const symbols = { passed: "√", pending: "-", failed: "x" };
  var results = driver
    .executeScript("return window.palindromResults;")
    .then(results => {
      const resultsSummary = { passed: 0, pending: 0, failed: 0 };
      const colorMap = { passed: "green", failed: "red", pending: "yellow" };

      results.forEach(spec => {
        resultsSummary[spec.status]++;
        console.log("");
        console.log(
          "   " +
            symbols[spec.status][colorMap[spec.status]] +
            " " +
            spec.fullName
        );
        if (spec.status === "failed") {
          console.log("Spec Failed");
          spec.failedExpectations.forEach(error => {
            error.stack = error.stack.split("\n");
            console.log(error);
          });          
          driver.quit();
          process.exit(1);
        }
      });      
      driver.quit();
      console.log("Summary: ", resultsSummary);
      callback && callback();
      process.exit(0);
    });
}

if (isCI) {
  /* in CI, Sauce Connect is ready without any extra work */
  theRunnerItself(process.env.SAUCE_USERNAME, process.env.SAUCE_ACCESS_KEY);
} else {
  /* local testing, launch Sauce Connect */
  /* please ask @alshakero if you need SAUCE_USERNAME and SAUCE_ACCESS_KEY */
  sauceConnectLauncher(
    {
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY
    },
    function(err, sauceConnectProcess) {
      if (err) {
        console.error(err.message);
        return;
      }
      console.log("Sauce Connect ready");

      theRunnerItself(
        process.env.SAUCE_USERNAME,
        process.env.SAUCE_ACCESS_KEY,
        function() { /* done callback */
          sauceConnectProcess.close(function() {
            console.log("Closed Sauce Connect process");
          });
        }
      );
    }
  );
}
