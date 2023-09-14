import test from "ava";
import { wallet, rpcUrl } from "./util.js";
import { Address, Contract, networks } from "token";
import fs from "node:fs";
import process from "node:child_process";

const tokenBId = fs.readFileSync(new URL("../contract-id-token-b.txt", import.meta.url), "utf8");
const rootStr = process.spawnSync("./soroban", ["config", "identity", "address"], { shell: true, encoding: "utf8" }).stdout;
const aliceStr = process.spawnSync("./soroban", ["config", "identity", "alice", "address"], { shell: true, encoding: "utf8" }).stdout;

const root = new Address(rootStr);
const alice = new Address(aliceStr);

const tokenA = new Contract({ ...networks.standalone, rpcUrl, wallet });
const tokenB = new Contract({
  contractId: tokenBId,
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
