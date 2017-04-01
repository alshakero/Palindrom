describe("PalindromDOM - Links -", () => {
  function createLinkTest(href, parent) {
    parent = parent || document.body;
    const a = document.createElement("A");
    a.innerHTML = "Link";
    a.href = href;
    parent.appendChild(a);
    parent.addEventListener("click", clickHandler);
    fireEvent(a, "click");
    parent.removeEventListener("click", clickHandler);
    parent.removeChild(a);
  }
  function createLinkTestNested(href, parent) {
    parent = parent || document.body;
    const a = document.createElement("A");
    a.innerHTML = "<strong>Link</strong>";
    a.href = href;
    parent.appendChild(a);
    parent.addEventListener("click", clickHandler);
    fireEvent(a.firstChild, "click");
    parent.removeEventListener("click", clickHandler);
    parent.removeChild(a);
  }

  function fireEvent(fireOnThis, evt) {
    if (window.MouseEvent) {
      const event = new window.MouseEvent(evt, {
        view: window,
        bubbles: true,
        cancelable: true
      });
      fireOnThis.dispatchEvent(event);
    }
  }

  function createLinkTestNestedShadowDOM(href, parent) {
    parent = parent || document.body;
    const div = document.createElement("DIV");
    parent.appendChild(div);

    const a = document.createElement("A");
    a.innerHTML = "<strong>Link</strong>";
    a.href = href;
    div.createShadowRoot().appendChild(a);
    parent.addEventListener("click", clickHandler);
    fireEvent(a.firstChild, "click");

    parent.removeEventListener("click", clickHandler);
    parent.removeChild(div);
  }

  function createLinkTestNestedShadowDOMContent() {
    const btn = document.querySelector("my-menu-button strong");
    btn && btn.click();
  }

  function clickHandler(event) {
    event.preventDefault();
  }

  describe("when attached to default node - `document.body`", () => {
    let palindrom;

    beforeEach(done => {
      moxios.install();
      moxios.stubRequest("http://localhost/testURL", {
        status: 200,
        headers: { location: "http://localhost/testURLNew" },
        responseText: '{"hello": "world"}'
      });

      palindrom = new PalindromDOM({ remoteUrl: "http://localhost/testURL" });
      setTimeout(done, 1);
    });
    afterEach(() => {
      palindrom.unobserve();
      palindrom.unlisten();
      moxios.uninstall();
    });

    it("its `.element` should point to `document.body`", () => {
      expect(palindrom.element).toEqual(document.body);
    });
    describe("should intercept links to use History API", () => {
      it("relative path", done => {
        const historySpy = spyOn(window.history, "pushState");
        const href = "test_a";

        moxios.wait(
          () => {
            createLinkTest(href);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(1);
                done();
              },
              10
            );
          },
          10
        );
      });

      it("relative path (nested)", done => {
        const historySpy = spyOn(window.history, "pushState");
        const href = "test_b";

        moxios.wait(
          () => {
            createLinkTestNested(href);
            moxios.wait(() => {
              expect(historySpy.calls.count()).toBe(1);
              done();
            });
          },
          10
        );
      });

      it("relative path (nested, Shadow DOM)", done => {
        setTimeout(
          () => {
            //wait for platform.js ready
            const historySpy = spyOn(window.history, "pushState");
            const href = "test_c";

            createLinkTestNestedShadowDOM(href);
            setTimeout(
              () => {
                expect(historySpy.calls.count()).toBe(1);
                done();
              },
              100
            );
          },
          100
        );
      });

      /* `createShadowRoot` is removed from FF and Edge */
      xit("relative path (nested, Shadow DOM content)", done => {
        //wait for platform.js ready
        const historySpy = spyOn(window.history, "pushState");

        moxios.wait(
          () => {
            createLinkTestNestedShadowDOMContent();
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(1);
                done();
              },
              10
            );
          },
          10
        );
      });

      it("absolute path", done => {
        const historySpy = spyOn(window.history, "pushState");

        const href = "/test";

        moxios.wait(
          () => {
            createLinkTest(href);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(1);
                done();
              },
              10
            );
          },
          10
        );
      });

      it("full URL in the same host, same port", done => {
        const historySpy = spyOn(window.history, "pushState");

        const href = window.location.protocol +
          "//" +
          window.location.host +
          "/test"; //http://localhost:8888/test

        moxios.wait(
          () => {
            createLinkTest(href);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(1);
                done();
              },
              10
            );
          },
          10
        );
      });
    });

    describe("should not intercept external links", () => {
      it("full URL in the same host, different port", () => {
        const historySpy = spyOn(window.history, "pushState");

        const port = window.location.port === "80" ||
          window.location.port === ""
          ? "8080"
          : "80";
        const href = window.location.protocol +
          "//" +
          window.location.hostname +
          ":" +
          port +
          "/test"; //http://localhost:88881/test
        createLinkTest(href);

        expect(historySpy.calls.count()).toBe(0);
      });

      it("full URL in the same host, different schema", () => {
        const historySpy = spyOn(window.history, "pushState");

        const protocol = window.location.protocol === "http:"
          ? "https:"
          : "http:";
        const href = protocol + "//" + window.location.host + "/test"; //https://localhost:8888/test
        createLinkTest(href);

        expect(historySpy.calls.count()).toBe(0);
      });
    });

    describe("should be accessible via API", () => {
      it("should change history state programmatically", done => {
        const historySpy = spyOn(window.history, "pushState");

        moxios.wait(
          () => {
            palindrom.morphUrl("/page2");

            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(1);
                done();
              },
              10
            );
          },
          10
        );
      });
    });

    it("should stop listening to DOM changes after `.unlisten()` was called", () => {
      const historySpy = spyOn(window.history, "pushState");

      palindrom.unlisten();
      createLinkTest("#will_not_get_caught_by_palindrom");

      expect(historySpy.calls.count()).toBe(0);
    });

    it("should start listening to DOM changes after `.listen()` was called", () => {
      const historySpy = spyOn(window.history, "pushState");

      palindrom.unlisten();
      palindrom.listen();
      createLinkTest("#will_not_get_caught_by_palindrom");

      expect(historySpy.calls.count()).toBe(1);
    });
  });

  describe("when attached to specific node", () => {
    let palindrom, palindromB, palindromNode, nodeB;

    beforeEach(done => {
      moxios.install();
      moxios.stubRequest("http://localhost/testURL", {
        status: 200,
        headers: { Location: "http://localhost/testURL" },
        responseText: '{"hello": "world"}'
      });

      palindromNode = document.createElement("DIV");
      document.body.appendChild(palindromNode);
      nodeB = document.createElement("DIV");
      document.body.appendChild(nodeB);
      palindrom = new PalindromDOM({
        remoteUrl: "http://localhost/testURL",
        listenTo: palindromNode
      });

      setTimeout(done, 1);
    });

    afterEach(() => {
      palindrom.unobserve();
      palindrom.unlisten();
    });
    describe("should intercept child links to use History API", () => {
      it("relative path", done => {
        const historySpy = spyOn(window.history, "pushState");

        const href = "test_a";

        moxios.wait(
          () => {
            createLinkTest(href, palindromNode);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(1);
                done();
              },
              1
            );
          },
          10
        );
      });

      it("relative path (nested)", done => {
        const historySpy = spyOn(window.history, "pushState");
        const href = "test_b";
        moxios.wait(
          () => {
            createLinkTestNested(href, palindromNode);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(1);
                done();
              },
              10
            );
          },
          10
        );
      });

      it("relative path (nested, Shadow DOM)", done => {
        const historySpy = spyOn(window.history, "pushState");
        const href = "test_c";
        moxios.wait(
          () => {
            createLinkTestNestedShadowDOM(href, palindromNode);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(1);
                done();
              },
              10
            );
          },
          10
        );
      });

      it("absolute path", done => {
        const historySpy = spyOn(window.history, "pushState");

        const href = "/test";
        moxios.wait(
          () => {
            createLinkTest(href, palindromNode);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(1);
                done();
              },
              10
            );
          },
          10
        );
      });

      it("full URL in the same host, same port", done => {
        const historySpy = spyOn(window.history, "pushState");

        const href = window.location.protocol +
          "//" +
          window.location.host +
          "/test"; //http://localhost:8888/test

        moxios.wait(
          () => {
            createLinkTest(href, palindromNode);

            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(1);
                done();
              },
              10
            );
          },
          10
        );
      });
    });

    describe("should not intercept links from outside of `.element` tree to use History API", () => {
      it("relative path", done => {
        const historySpy = spyOn(window.history, "pushState");

        const href = "test_a";
        moxios.wait(
          () => {
            createLinkTest(href, nodeB);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(0);
                done();
              },
              10
            );
          },
          10
        );
      });

      it("relative path (nested)", done => {
        const historySpy = spyOn(window.history, "pushState");
        const href = "test_b";
        moxios.wait(
          () => {
            createLinkTestNested(href, nodeB);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(0);
                done();
              },
              10
            );
          },
          10
        );
      });

      it("relative path (nested, Shadow DOM)", done => {
        const historySpy = spyOn(window.history, "pushState");
        const href = "test_c";
        moxios.wait(
          () => {
            createLinkTestNestedShadowDOM(href, nodeB);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(0);
                done();
              },
              10
            );
          },
          100
        );
      });

      it("absolute path", done => {
        const historySpy = spyOn(window.history, "pushState");

        const href = "/test";
        moxios.wait(
          () => {
            createLinkTest(href, nodeB);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(0);
                done();
              },
              10
            );
          },
          10
        );
      });

      it("full URL in the same host, same port", done => {
        const historySpy = spyOn(window.history, "pushState");

        const href = window.location.protocol +
          "//" +
          window.location.host +
          "/test"; //http://localhost:8888/test

        moxios.wait(
          () => {
            createLinkTest(href, nodeB);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(0);
                done();
              },
              10
            );
          },
          10
        );
      });
    });

    describe("should not intercept external links", () => {
      it("full URL in the same host, different port", done => {
        const historySpy = spyOn(window.history, "pushState");

        const port = window.location.port === "80" ||
          window.location.port === ""
          ? "8080"
          : "80";
        const href = window.location.protocol +
          "//" +
          window.location.hostname +
          ":" +
          port +
          "/test"; //http://localhost:88881/test

        moxios.wait(
          () => {
            createLinkTest(href, palindromNode);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(0);
                done();
              },
              10
            );
          },
          10
        );
      });

      it("full URL in the same host, different schema", done => {
        const historySpy = spyOn(window.history, "pushState");

        const protocol = window.location.protocol === "http:"
          ? "https:"
          : "http:";
        const href = protocol + "//" + window.location.host + "/test"; //https://localhost:8888/test

        moxios.wait(
          () => {
            createLinkTest(href, palindromNode);
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(0);
                done();
              },
              10
            );
          },
          10
        );
      });
    });

    describe("should be accessible via API", () => {
      it("should change history state programmatically", done => {
        const historySpy = spyOn(window.history, "pushState");

        moxios.wait(
          () => {
            palindrom.morphUrl("/page2");
            moxios.wait(
              () => {
                expect(historySpy.calls.count()).toBe(1);
                done();
              },
              10
            );
          },
          10
        );
      });
    });

    it("should stop listening to DOM changes after `.unlisten()` was called", done => {
      const historySpy = spyOn(window.history, "pushState");

      moxios.wait(
        () => {
          palindrom.unlisten();
          moxios.wait(
            () => {
              createLinkTest(
                "#will_not_get_caught_by_palindrom",
                palindromNode
              );
              moxios.wait(
                () => {
                  expect(historySpy.calls.count()).toBe(0);
                  done();
                },
                10
              );
            },
            10
          );
        },
        10
      );
    });

    it("should start listening to DOM changes after `.listen()` was called", done => {
      const historySpy = spyOn(window.history, "pushState");

      moxios.wait(
        () => {
          palindrom.unlisten();
          palindrom.listen();
          moxios.wait(
            () => {
              createLinkTest(
                "#will_not_get_caught_by_palindrom",
                palindromNode
              );
              moxios.wait(
                () => {
                  expect(historySpy.calls.count()).toBe(1);
                  done();
                },
                10
              );
            },
            10
          );
        },
        10
      );
    });
  });
});
