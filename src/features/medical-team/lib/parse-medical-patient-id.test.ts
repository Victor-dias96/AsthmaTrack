import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseMedicalPatientId } from "./parse-medical-patient-id";

const VALID_UUID = "8b6e6c1a-1b2c-4d3e-9f4a-5c6d7e8f9a0b";

describe("parseMedicalPatientId", () => {
  test("accepts a well-formed lowercase UUID", () => {
    assert.equal(parseMedicalPatientId(VALID_UUID), VALID_UUID);
  });

  test("accepts an uppercase UUID", () => {
    assert.equal(
      parseMedicalPatientId(VALID_UUID.toUpperCase()),
      VALID_UUID.toUpperCase()
    );
  });

  test("trims surrounding whitespace", () => {
    assert.equal(parseMedicalPatientId(`  ${VALID_UUID}  `), VALID_UUID);
  });

  test("rejects undefined", () => {
    assert.equal(parseMedicalPatientId(undefined), null);
  });

  test("rejects an empty string", () => {
    assert.equal(parseMedicalPatientId(""), null);
  });

  test("rejects a repeated route segment (array)", () => {
    assert.equal(parseMedicalPatientId([VALID_UUID, VALID_UUID]), null);
  });

  test("rejects a malformed UUID", () => {
    assert.equal(parseMedicalPatientId("not-a-uuid"), null);
  });

  test("rejects a truncated UUID", () => {
    assert.equal(parseMedicalPatientId(VALID_UUID.slice(0, -1)), null);
  });

  test("rejects a URL", () => {
    assert.equal(
      parseMedicalPatientId("https://example.com/" + VALID_UUID),
      null
    );
  });

  test("rejects a SQL fragment", () => {
    assert.equal(
      parseMedicalPatientId(`${VALID_UUID}; drop table daily_records;`),
      null
    );
  });

  test("rejects an object-shaped value", () => {
    assert.equal(
      parseMedicalPatientId({ id: VALID_UUID } as unknown as string),
      null
    );
  });
});
