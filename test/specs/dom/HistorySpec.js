describe("History", () => {
  let wsSpy, palindrom;

  beforeEach(() => {
    moxios.install();
    moxios.stubRequest("http://localhost/testURL", {
      status: 200,
      headers: { location: "http://localhost/testURL" },
      responseText: '{"hello": "world"}'
    });

    palindrom = new PalindromDOM({ remoteUrl: "http://localhost/testURL" });
  });
  afterEach(() => {
    palindrom.unobserve();
    moxios.uninstall();
  });

  /// init
  describe("should send JSON Patch HTTP request once history state get changed", () => {
    it("by `palindrom.morphURL(url)` method", done => {
      const currLoc = window.location.href;

      palindrom.morphUrl("/newUrl");
      moxios.wait(
        () => {
          const request = moxios.requests.mostRecent();
          expect(request.url).toEqual("/newUrl");
          expect(window.location.pathname).toEqual("/newUrl");

          history.pushState(null, null, currLoc);
          done();
        },
        10
      );
    });
  });
  // init
  describe("should send JSON Patch HTTP request once history state get changed", () => {
    beforeEach(() => {
      moxios.install();
      moxios.stubRequest("http://localhost/testURL", {
        status: 200,
        headers: { location: "http://localhost/testURL" },
        responseText: '{"hello": "world"}'
      });

      palindrom = new PalindromDOM({ remoteUrl: "http://localhost/testURL" });
    });
    afterEach(() => {
      palindrom.unobserve();
      moxios.uninstall();
    });

    it("by dispatching `palindrom-redirect-pushstate` event", done => {

       console.log('omar', palindrom.element)

      const currLoc = window.location.href;
      history.pushState(null, null, "/newUrl-palindrom");

      moxios.stubRequest(/.+/, {
        status: 200,
        headers: { location: "http://localhost/testURL" },
        responseText: '[]'
      });

      document.body.dispatchEvent(
        new CustomEvent("palindrom-redirect-pushstate", {
          detail: { url: "/newUrl-palindrom" },
          bubbles: true
        })
      );

      moxios.wait(
        () => {
          const request = moxios.requests.mostRecent();
         
          expect(new URL(request.url).pathname).toEqual("/newUrl-palindrom");
          expect(window.location.pathname).toEqual("/newUrl-palindrom");

          //to restore the original working URL
          history.pushState(null, null, currLoc);
          done();
        },
        10
      );
    });
  });
});
