import test from "ava";
import { wallet, rpcUrl } from "./util.js";
import { Address, Contract, networks } from "token";
import fs from "node:fs";
import process from "node:child_process";

const tokenAId = fs.readFileSync(new URL("../contract-id-token-a.txt", import.meta.url), "utf8");
const tokenBId = fs.readFileSync(new URL("../contract-id-token-b.txt", import.meta.url), "utf8");
const rootStr = process.spawnSync("./soroban", ["config", "identity", "address"], { shell: true, encoding: "utf8" }).stdout;
const aliceStr = process.spawnSync("./soroban", ["config", "identity", "address", "alice"], { shell: true, encoding: "utf8" }).stdout;

const root = new Address(rootStr.trim());
const alice = new Address(aliceStr.trim());

const tokenA = new Contract({
  contractId: tokenAId.trim(),
  networkPassphrase: networks.standalone.networkPassphrase,
  rpcUrl,
  wallet,
});
const tokenB = new Contract({
  contractId: tokenBId.trim(),
  networkPassphrase: networks.standalone.networkPassphrase,
  rpcUrl,
  wallet,
});

test("balances", async (t) => {
  t.is(await tokenA.balance({ id: root }), 1000n);
  t.is(await tokenB.balance({ id: root }), 0n);

  t.is(await tokenA.balance({ id: alice }), 0n);
  t.is(await tokenB.balance({ id: alice }), 1000n);
});
