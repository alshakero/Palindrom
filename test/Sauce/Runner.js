const CapabilityRunner = require("./CapabilityRunner");

const username = process.env.SAUCE_USERNAME;
const accessKey = process.env.SAUCE_ACCESS_KEY;

const allCaps = [
  {
    browserName: "chrome",
    platform: "Windows 10",
    version: "57.0",
    maxDuration: 15,
    username: username,
    accessKey: accessKey,
    name: "Chrome: PalindromDOM tests",
    "tunnel-identifier": process.env.TRAVIS_JOB_NUMBER
  },
  {
    browserName: "firefox",
    platform: "Windows 10",
    version: "51.0",
    maxDuration: 15,
    username: username,
    accessKey: accessKey,
    name: "Firefox: PalindromDOM tests",
    "tunnel-identifier": process.env.TRAVIS_JOB_NUMBER
  }و  
  {
    browserName: "MicrosoftEdge",
    platform: "Windows 10",
    version: "14.14393",
    maxDuration: 20,
    username: username,
    accessKey: accessKey,
    name: "MicrosoftEdge: PalindromDOM tests",
    "tunnel-identifier": process.env.TRAVIS_JOB_NUMBER
  }
];

CapabilityRunner(allCaps[0], function(passed) {
  if (passed) {
    CapabilityRunner(allCaps[1], function(passed) {
      if (passed) {
        CapabilityRunner(allCaps[2], function(passed) {
          if (passed) {
            console.log("Done!");
            process.exit(0);
          } else {
            process.exit(1);
          }
        });
      } else {
        process.exit(1);
      }
    });
  } else {
    process.exit(1);
  }
});
