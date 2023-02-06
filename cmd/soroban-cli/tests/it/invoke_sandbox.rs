use crate::util::{add_test_seed, Sandbox, HELLO_WORLD, INVOKER_ACCOUNT_EXISTS};

#[test]
fn source_account_exists() {
    Sandbox::new()
        .new_cmd("contract")
        .arg("invoke")
        .arg("--id=1")
        .arg("--wasm")
        .arg(INVOKER_ACCOUNT_EXISTS.path())
        .arg("--fn=invkexists")
        .assert()
        .success()
        .stdout("true\n");
}

#[test]
fn install_wasm_then_deploy_contract() {
    let hash = HELLO_WORLD.hash();
    let sandbox = Sandbox::new();
    sandbox
        .new_cmd("contract")
        .arg("install")
        .arg("--wasm")
        .arg(HELLO_WORLD.path())
        .assert()
        .success()
        .stdout(format!("{hash}\n"));

    sandbox
        .new_cmd("contract")
        .arg("deploy")
        .arg("--wasm-hash")
        .arg(&format!("{hash}"))
        .arg("--id=1")
        .assert()
        .success()
        .stdout("0000000000000000000000000000000000000000000000000000000000000001\n");
}

#[test]
fn deploy_contract_with_wasm_file() {
    Sandbox::new()
        .new_cmd("contract")
        .arg("deploy")
        .arg("--wasm")
        .arg(HELLO_WORLD.path())
        .arg("--id=1")
        .assert()
        .success()
        .stdout("0000000000000000000000000000000000000000000000000000000000000001\n");
}

#[test]
fn invoke_hello_world_with_deploy_first() {
    let sandbox = Sandbox::new();
    let res = sandbox
        .new_cmd("contract")
        .arg("deploy")
        .arg("--wasm")
        .arg(HELLO_WORLD.path())
        .assert()
        .success();
    let stdout = String::from_utf8(res.get_output().stdout.clone()).unwrap();
    let id = stdout.trim_end();

    sandbox
        .new_cmd("contract")
        .arg("invoke")
        .arg("--identity")
        .arg("test_id")
        .arg("--id")
        .arg(id)
        .arg("--fn=hello")
        .arg("--")
        .arg("--world=world")
        .assert()
        .stdout("[\"Hello\",\"world\"]\n")
        .success();
}

#[test]
fn invoke_hello_world() {
    let sandbox = Sandbox::new();
    sandbox
        .new_cmd("contract")
        .arg("invoke")
        .arg("--id=1")
        .arg("--wasm")
        .arg(HELLO_WORLD.path())
        .arg("--fn=hello")
        .arg("--")
        .arg("--world=world")
        .assert()
        .stdout("[\"Hello\",\"world\"]\n")
        .success();
}

#[test]
fn invoke_hello_world_with_seed() {
    let sandbox = Sandbox::new();
    let identity = add_test_seed(sandbox.dir());
    sandbox
        .new_cmd("contract")
        .arg("invoke")
        .arg("--identity")
        .arg(identity)
        .arg("--id=1")
        .arg("--wasm")
        .arg(HELLO_WORLD.path())
        .arg("--fn=hello")
        .arg("--")
        .arg("--world=world")
        .assert()
        .stdout("[\"Hello\",\"world\"]\n")
        .success();
}
