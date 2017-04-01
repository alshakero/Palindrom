/**
 * SauceLabs Jasmine CapabilityRunner 
 * CapabilityRunner.js 0.0.0
 * (c) 2017 Omar Alshaker
 * MIT license
 */

const isCI = require("is-ci");
const colors = require("colors");
const SauceLabs = require("saucelabs");
const webdriver = require("selenium-webdriver");

function CapabilityRunner(caps, doneCallback) {
  console.log("");
  console.log(caps.name.green);

  const username = caps.username;
  const accessKey = caps.accessKey;

  const saucelabs = new SauceLabs({
    username: username,
    password: accessKey
  });

  const By = webdriver.By;

  let driver = new webdriver.Builder()
    .withCapabilities(caps)
    .usingServer(
      "http://" + username + ":" + accessKey + "@localhost:4445/wd/hub"
    )
    .build();

  driver.get("http://127.0.0.1:8000/components/Palindrom/test/SpecRunner.html");

}

module.exports = CapabilityRunner;
