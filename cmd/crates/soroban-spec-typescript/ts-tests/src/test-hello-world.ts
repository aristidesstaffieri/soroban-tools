import test from "ava";
import { root, wallet, rpcUrl } from "./util.js";
import { Address, Contract, networks } from "test-hello-world";

const contract = new Contract({ ...networks.standalone, rpcUrl, wallet });

test("hello", async (t) => {
  t.deepEqual((await contract.hello({ world: "tests" })).result, ["Hello", "tests"]);
});

// Currently must run tests in serial because nonce logic not smart enough to handle concurrent calls.
test.serial("auth", async (t) => {
  const addr = new Address(root.keypair.publicKey());
  t.deepEqual((await contract.auth({ addr, world: 'lol' })).result, addr)
});

test.serial("inc", async (t) => {
  t.is((await contract.getCount()).result, 0);
  t.is((await contract.inc({})).result, 1)
  t.is((await contract.getCount()).result, 1);
});
