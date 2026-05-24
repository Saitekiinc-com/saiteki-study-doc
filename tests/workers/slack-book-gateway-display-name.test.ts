import { describe, test } from "node:test";
import assert from "node:assert";
import { normalizeApplicantName, selectSlackDisplayName, selectSlackRealName } from "../../workers/slack-book-gateway/src/index.js";

describe("slack-book-gateway Slack display name helpers", () => {
  test("uses Slack profile real_name as the applicant name", () => {
    const realName = selectSlackRealName({
      real_name: "杉本光一",
      real_name_normalized: "meiguang2world",
      display_name: "meiguang2world"
    });

    assert.strictEqual(realName, "杉本光一");
  });

  test("does not use normalized or display name values for applicant real name", () => {
    const realName = selectSlackRealName({
      real_name_normalized: "meiguang2world",
      display_name: "meiguang2world"
    });

    assert.strictEqual(realName, undefined);
  });

  test("prefers Slack mention display name over email-like real name", () => {
    const displayName = selectSlackDisplayName(
      {
        id: "U123",
        name: "koichi_sugimoto",
        real_name: "koichi_sugimoto@saitekiinc.com",
        profile: {
          display_name: "杉本光一",
          display_name_normalized: "杉本光一",
          real_name: "koichi_sugimoto@saitekiinc.com",
          real_name_normalized: "koichi_sugimoto@saitekiinc.com"
        }
      },
      "koichi_sugimoto@saitekiinc.com"
    );

    assert.strictEqual(displayName, "杉本光一");
  });

  test("prefers raw Japanese profile name over normalized username-like value", () => {
    const displayName = selectSlackDisplayName(
      {
        id: "U123",
        name: "meiguang2world",
        real_name: "杉本光一",
        profile: {
          display_name: "",
          display_name_normalized: "meiguang2world",
          real_name: "杉本光一",
          real_name_normalized: "meiguang2world"
        }
      },
      "meiguang2world"
    );

    assert.strictEqual(displayName, "杉本光一");
  });

  test("skips email-like candidates when a non-email Slack username exists", () => {
    const displayName = selectSlackDisplayName(
      {
        id: "U123",
        name: "koichi_sugimoto",
        real_name: "koichi_sugimoto@saitekiinc.com",
        profile: {
          real_name: "koichi_sugimoto@saitekiinc.com",
          real_name_normalized: "koichi_sugimoto@saitekiinc.com"
        }
      },
      "koichi_sugimoto@saitekiinc.com"
    );

    assert.strictEqual(displayName, "koichi_sugimoto");
  });

  test("stores applicant name without the leading mention marker", () => {
    assert.strictEqual(normalizeApplicantName("@杉本光一"), "杉本光一");
    assert.strictEqual(normalizeApplicantName("＠杉本光一"), "杉本光一");
  });
});
