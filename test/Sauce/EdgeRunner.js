const isCI = require("is-ci");
const colors = require("colors");
const SauceLabs = require("saucelabs");

console.log("");
console.log("Edge: Running SauceLabs PalindromDOM tests".green);

const username = process.env.SAUCE_USERNAME;
const accessKey = process.env.SAUCE_ACCESS_KEY;

const saucelabs = new SauceLabs({
  username: username,
  password: accessKey
});

const webdriver = require("selenium-webdriver");
let driver;

const caps = {
  browserName: "MicrosoftEdge",
  platform: "Windows 10",
  version: "14.14393",
  maxDuration: 10,
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

let interval = 1;
function checkIfDone(callback) {
  if (!interval)
    return; /* interval keeps repeating a couple times after clearing */
  driver.executeScript("return window.palindromJasmineStatus;").then(callback);
}

driver.getSession().then(sessionID => {
  /* get session ID to finish it later */
  driver.sessionID = sessionID.id_;

  /* don't worry about never timing out, SauceLabs do it auto */
  interval = setInterval(
    () => {
      checkIfDone(function(palindromJasmineStatus) {
        if (palindromJasmineStatus && interval) {
          console.log(
            "Specs finished in: " + palindromJasmineStatus.executionTime + "ms"
          );
          clearInterval(interval);
          interval = 0;
          analyzeResults();
        }
      });
    },
    2000
  );
});

function analyzeResults() {
  driver.executeScript("return window.palindromResults;").then(results => {
    const resultsSummary = { passed: 0, pending: 0, failed: 0 };
    const colorMap = { passed: "green", failed: "red", pending: "yellow" };
    var hadErrored = 0;
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
          hadErrored = 1;
        });
      }
    });

    console.log("Summary: ", resultsSummary);
    console.log("Ending session: " + driver.sessionID);

    const result = {
      name: "Summary: Passed: " + resultsSummary.passed + ", pending: " + resultsSummary.pending +  ", failed: " + resultsSummary.failed,
      passed: hadErrored === 0
    };
    
    driver.quit();

    saucelabs.updateJob(driver.sessionID, result, function() {
      process.exit(hadErrored);
    });
    
  });
}
