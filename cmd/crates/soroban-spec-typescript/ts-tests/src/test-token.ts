import test from "ava";
import { wallet, rpcUrl, root, alice } from "./util.js";
import { Address, Contract as Token, networks as tokenNetworks } from "token";
import { Contract as Swap, networks } from "test-swap";
import fs from "node:fs";
import * as SorobanClient from 'soroban-client'

const tokenAId = fs.readFileSync(new URL("../contract-id-token-a.txt", import.meta.url), "utf8").trim();
const tokenBId = fs.readFileSync(new URL("../contract-id-token-b.txt", import.meta.url), "utf8").trim();
const swapId = fs.readFileSync(new URL("../contract-id-swap.txt", import.meta.url), "utf8").trim();

const tokenAAddress = Address.fromString(tokenAId);
const tokenBAddress = Address.fromString(tokenBId);

const tokenA = new Token({
  contractId: tokenAId,
  networkPassphrase: tokenNetworks.standalone.networkPassphrase,
  rpcUrl,
  wallet,
});
const tokenB = new Token({
  contractId: tokenBId,
  networkPassphrase: tokenNetworks.standalone.networkPassphrase,
  rpcUrl,
  wallet,
});
const swap = new Swap({ ...networks.standalone, rpcUrl })

const server = new SorobanClient.Server("http://localhost:8000/soroban/rpc", {
  allowHttp: true,
});

test("root has 1000 token A", async t => {
  t.is((await tokenA.balance({ id: new Address(root.keypair.publicKey()) })).result, 1000n);
})
test("root has 0 token B", async t => {
  t.is((await tokenB.balance({ id: new Address(root.keypair.publicKey()) })).result, 0n);
})
test("alice has 0 token A", async (t) => {
  t.is((await tokenA.balance({ id: new Address(alice.keypair.publicKey()) })).result, 0n);
});
test("alice has 1000 token B", async (t) => {
  t.is((await tokenB.balance({ id: new Address(alice.keypair.publicKey()) })).result, 1000n);
});


test('swap', async t => {
  const args = {
    a: root.address,
    b: alice.address,
    token_a: tokenAAddress,
    token_b: tokenBAddress,
    amount_a: 10n,
    min_b_for_a: 1n,
    amount_b: 1n,
    min_a_for_b: 10n
  }

  const networkPassphrase = "Standalone Network ; February 2017"
  const { txUnsigned, simulation } = await swap.swap(args, { responseType: 'simulated' })

  const tx = SorobanClient.TransactionBuilder.fromXDR(
    txUnsigned,
    networkPassphrase
  )

  if ("operations" in tx) {
    const rawInvokeHostFunctionOp = tx
      .operations[0] as SorobanClient.Operation.InvokeHostFunction;

    const authEntries = rawInvokeHostFunctionOp.auth ? rawInvokeHostFunctionOp.auth : [];

    const signedAuthEntries = [];

    for (const entry of authEntries) {
      if (
        entry.credentials().switch() !==
        SorobanClient.xdr.SorobanCredentialsType.sorobanCredentialsAddress()
      ) {
        signedAuthEntries.push(entry);
      } else {
        const entryAddress = entry.credentials().address().address().accountId();

        if (
          root.keypair.publicKey() === SorobanClient.StrKey.encodeEd25519PublicKey(entryAddress.ed25519())
        ) {
          let expirationLedgerSeq = 0;

          const key = SorobanClient.xdr.LedgerKey.contractData(
            new SorobanClient.xdr.LedgerKeyContractData({
              contract: new SorobanClient.Address(swapId).toScAddress(),
              key: SorobanClient.xdr.ScVal.scvLedgerKeyContractInstance(),
              durability: SorobanClient.xdr.ContractDataDurability.persistent(),
              bodyType: SorobanClient.xdr.ContractEntryBodyType.dataEntry(),
            }),
          );

          // Fetch the current contract ledger seq
          const entryRes = await server.getLedgerEntries([key]);
          if (entryRes.entries && entryRes.entries.length) {
            const parsed = SorobanClient.xdr.LedgerEntryData.fromXDR(
              entryRes.entries[0].xdr,
              "base64",
            );

            // set auth entry to expire when contract data expires, but could any number of blocks in the future
            expirationLedgerSeq = parsed.contractData().expirationLedgerSeq();
          } else {
            throw new Error("failed to get ledger entry");
          }

          try {
            /// no-op
            if (
              entry.credentials().switch() !==
              SorobanClient.xdr.SorobanCredentialsType.sorobanCredentialsAddress()
            ) {
              return entry;
            }

            const addrAuth = entry.credentials().address();
            addrAuth.signatureExpirationLedger(expirationLedgerSeq);

            const networkId = SorobanClient.hash(Buffer.from(networkPassphrase));
            const preimage = SorobanClient.xdr.HashIdPreimage.envelopeTypeSorobanAuthorization(
              new SorobanClient.xdr.HashIdPreimageSorobanAuthorization({
                networkId,
                nonce: addrAuth.nonce(),
                invocation: entry.rootInvocation(),
                signatureExpirationLedger: addrAuth.signatureExpirationLedger(),
              }),
            );
            const payload = SorobanClient.hash(preimage.toXDR());
            const signer = new SorobanClient.Keypair({ type: 'ed25519', publicKey: root.keypair.publicKey() })
            const signature = signer.sign(payload)
            const publicKey = SorobanClient.Address.fromScAddress(addrAuth.address()).toString();

            if (!SorobanClient.Keypair.fromPublicKey(publicKey).verify(payload, signature)) {
              throw new Error(`signature doesn't match payload`);
            }

            const sigScVal = SorobanClient.nativeToScVal(
              {
                public_key: SorobanClient.StrKey.decodeEd25519PublicKey(publicKey),
                signature,
              },
              {
                // force the keys to be interpreted as symbols (expected for
                // Soroban [contracttype]s)
                // Pr open to fix this type in the gen'd xdr
                type: {
                  public_key: ["symbol", null],
                  signature: ["symbol", null],
                } as any,
              },
            );

            addrAuth.signatureArgs([sigScVal]);

            signedAuthEntries.push(entry);
          } catch (error) {
            console.log(error);
          }
        } else {
          signedAuthEntries.push(entry);
        }
      }
    }

    const builder = SorobanClient.TransactionBuilder.cloneFrom(tx);
    builder.clearOperations().addOperation(
      SorobanClient.Operation.invokeHostFunction({
        ...rawInvokeHostFunctionOp,
        auth: signedAuthEntries,
      }),
    );

    const signedTx = builder.build();
    console.log(signedTx)
  }

})
