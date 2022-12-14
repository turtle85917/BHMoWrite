import fetch from "node-fetch";
import { Logger } from "./Logger";

let BHMoAPI = "https://farm.jjo.kr/api";
let apiKeys: string[] = JSON.parse(process.env.KEYS);

interface total { result: { [key: string]: any } | any; error: false | { code: string; }; };
export async function allFetch(endpoint: string): Promise<total> {
  let totalResult: total = { result: {}, error: false };

  const path = BHMoAPI + endpoint;
  const errorCodes: { [code: string]: any } = {};

  for (const apiKey of apiKeys) {
    if (Object.keys(errorCodes).filter(d => d !== "429").length > 0) break;

    const response = await fetch(path, {
      headers: {
        Authorization: "Bearer " + apiKey
      }
    });

    Logger.info("BHMo API Gas Usage").next("Spent Gas").put(response.headers.get("x-bhmo-gas-spent")).next("Left Gas").put(response.headers.get("x-bhmo-gas-left")).out();

    if (!errorCodes[String(response.status)]) errorCodes[String(response.status)] = { count: 0 };
    errorCodes[String(response.status)].count++;

    let result: { [key: string]: any } = {};
    const error = response.status === 200 && !result?.error ? false : true;
    let code = "200";
    if (!error) result = await (await response.json());
    if (error) code = String(response.status);

    totalResult = { result, error: error ? { code } : false };
  }

  return totalResult;
}