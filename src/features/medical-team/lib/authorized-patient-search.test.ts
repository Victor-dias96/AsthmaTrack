import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { AUTHORIZED_PATIENT_SEARCH_MAX_LENGTH } from "../constants/authorized-patients";
import { formatAuthorizedPatientSearchCount } from "./format-authorized-patient-search-count";
import { matchesAuthorizedPatientName } from "./matches-authorized-patient-name";
import { parseAuthorizedPatientSearch } from "./parse-authorized-patient-search";

describe("parseAuthorizedPatientSearch", () => {
  test("undefined returns empty search", () => {
    assert.equal(parseAuthorizedPatientSearch(undefined), "");
  });

  test("empty string returns empty search", () => {
    assert.equal(parseAuthorizedPatientSearch(""), "");
  });

  test("whitespace-only returns empty search", () => {
    assert.equal(parseAuthorizedPatientSearch("     "), "");
  });

  test("valid name is trimmed", () => {
    assert.equal(parseAuthorizedPatientSearch("  Victor  "), "Victor");
  });

  test("repeated internal spaces are normalized", () => {
    assert.equal(
      parseAuthorizedPatientSearch("Victor   Gabriel"),
      "Victor Gabriel"
    );
  });

  test("accented Portuguese names remain valid", () => {
    assert.equal(parseAuthorizedPatientSearch("José Antônio"), "José Antônio");
  });

  test("repeated query values are rejected", () => {
    assert.equal(parseAuthorizedPatientSearch(["Victor", "Victor"]), "");
  });

  test("oversized input is rejected rather than truncated", () => {
    const oversized = "a".repeat(AUTHORIZED_PATIENT_SEARCH_MAX_LENGTH + 1);
    assert.equal(parseAuthorizedPatientSearch(oversized), "");
  });

  test("maximum length remains valid", () => {
    const exact = "a".repeat(AUTHORIZED_PATIENT_SEARCH_MAX_LENGTH);
    assert.equal(parseAuthorizedPatientSearch(exact), exact);
  });

  test("control characters are rejected", () => {
    assert.equal(parseAuthorizedPatientSearch("Victor\u0000Gabriel"), "");
    assert.equal(parseAuthorizedPatientSearch("Victor\nGabriel"), "");
  });
});

describe("matchesAuthorizedPatientName", () => {
  test("exact-case term matches", () => {
    assert.equal(matchesAuthorizedPatientName("Victor Gabriel", "Victor"), true);
  });

  test("different case matches", () => {
    assert.equal(matchesAuthorizedPatientName("Victor Gabriel", "victor"), true);
  });

  test("partial authorized name matches", () => {
    assert.equal(matchesAuthorizedPatientName("Victor Gabriel", "Gabriel"), true);
  });

  test("nonmatching term does not match", () => {
    assert.equal(matchesAuthorizedPatientName("Victor Gabriel", "Ana"), false);
  });

  test("missing names do not match the display fallback", () => {
    assert.equal(matchesAuthorizedPatientName(null, "Nome não informado"), false);
    assert.equal(matchesAuthorizedPatientName("   ", "Nome não informado"), false);
  });

  test("SQL wildcard syntax is literal and does not match every name", () => {
    assert.equal(matchesAuthorizedPatientName("Victor Gabriel", "%"), false);
    assert.equal(matchesAuthorizedPatientName("Victor Gabriel", "Vic%"), false);
    assert.equal(matchesAuthorizedPatientName("Victor Gabriel", "_ictor"), false);
  });

  test("PostgREST-like operator text does not match by operator meaning", () => {
    assert.equal(matchesAuthorizedPatientName("Victor Gabriel", "eq.Victor"), false);
    assert.equal(matchesAuthorizedPatientName("Victor Gabriel", "ilike.*"), false);
  });

  test("matching is accent-sensitive", () => {
    assert.equal(matchesAuthorizedPatientName("José", "Jose"), false);
    assert.equal(matchesAuthorizedPatientName("José", "josé"), true);
  });

  test("preserves newest-first source order among matches", () => {
    const authorizedNames = ["Zed Newest", "Victor Gabriel", "Ana Lima"];
    const matches = authorizedNames.filter((name) =>
      matchesAuthorizedPatientName(name, "a")
    );

    assert.deepEqual(matches, ["Victor Gabriel", "Ana Lima"]);
  });
});

describe("formatAuthorizedPatientSearchCount", () => {
  test("uses singular and plural Portuguese labels", () => {
    assert.equal(formatAuthorizedPatientSearchCount(1), "1 paciente encontrado");
    assert.equal(
      formatAuthorizedPatientSearchCount(2),
      "2 pacientes encontrados"
    );
  });
});
