#[cfg(test)]
use assert_cmd::Command;

#[test]
fn deploy_and_invoke_contract_against_rpc_server() {
    // This test assumes a fresh standalone network rpc server on port 8000

    let mut cmd = Command::cargo_bin("soroban").unwrap();
    // TODO: How to reuse the env variables between deploy and invoke
    let deploy = cmd
        .env("SOROBAN_RPC_URL", "http://localhost:8000/soroban/rpc")
        .env(
            "SOROBAN_SECRET_KEY",
            "SC5O7VZUXDJ6JBDSZ74DSERXL7W3Y5LTOAMRF7RQRL3TAGAPS7LUVG3L",
        )
        .env(
            "SOROBAN_NETWORK_PASSPHRASE",
            "Standalone Network ; February 2017",
        )
        .args(&[
            "deploy",
            "--wasm=tests/fixtures/soroban_hello_world_contract.wasm",
            "--salt=0",
        ]);

    deploy
        .assert()
        .stdout("1f3eb7b8dc051d6aa46db5454588a142c671a0cdcdb36a2f754d9675a64bf613\n")
        .stderr("success\n")
        .success();

    let mut cmd = Command::cargo_bin("soroban").unwrap();
    let invoke = cmd
        .env("SOROBAN_RPC_URL", "http://localhost:8000/soroban/rpc")
        .env(
            "SOROBAN_SECRET_KEY",
            "SC5O7VZUXDJ6JBDSZ74DSERXL7W3Y5LTOAMRF7RQRL3TAGAPS7LUVG3L",
        )
        .env(
            "SOROBAN_NETWORK_PASSPHRASE",
            "Standalone Network ; February 2017",
        )
        .args(&[
            "invoke",
            "--id=1f3eb7b8dc051d6aa46db5454588a142c671a0cdcdb36a2f754d9675a64bf613",
            "--fn=hello",
            "--arg=world",
        ]);

    invoke
        .assert()
        .stdout("[\"Hello\",\"world\"]\n")
        .stderr("success\n")
        .success();
}