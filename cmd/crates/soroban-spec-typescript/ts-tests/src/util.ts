import process from "node:child_process";
import { Keypair, TransactionBuilder } from "soroban-client";
import { Address } from 'test-custom-types'

const rootKeypair = Keypair.fromSecret(process.spawnSync("./soroban", ["config", "identity", "show"], { shell: true, encoding: "utf8" }).stdout.trim());
const aliceKeypair = Keypair.fromSecret(process.spawnSync("./soroban", ["config", "identity", "show", "alice"], { shell: true, encoding: "utf8" }).stdout.trim());

export const root = {
  keypair: rootKeypair,
  address: Address.fromString(rootKeypair.publicKey()),
}

export const alice = {
  keypair: aliceKeypair,
  address: Address.fromString(aliceKeypair.publicKey()),
}

export const rpcUrl = "http://localhost:8000/soroban/rpc";
const networkPassphrase = "Standalone Network ; February 2017";

export const wallet = {
  isConnected: () => Promise.resolve(true),
  isAllowed: () => Promise.resolve(true),
  getUserInfo: () => Promise.resolve({ publicKey: root.keypair.publicKey() }),
  signTransaction: async (
    tx: string,
    opts?: {
      network?: string;
      networkPassphrase?: string;
      accountToSign?: string;
    }
  ) => {
    const t = TransactionBuilder.fromXDR(tx, networkPassphrase);
    const accountToSign = opts?.accountToSign || root.keypair.secret();
    const keypair = Keypair.fromSecret(accountToSign);
    t.sign(keypair);
    return t.toXDR();
  },
};
