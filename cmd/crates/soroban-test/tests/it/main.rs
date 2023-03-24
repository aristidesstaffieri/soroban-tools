use std::path::Path;

mod arg_parsing;
mod config;
mod custom_types;
mod invoke_sandbox;
mod util;

#[ctor::ctor]
fn init() {
    let current_crate = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let pwd = current_crate
        .parent()
        .and_then(Path::parent)
        .and_then(Path::parent)
        .unwrap();
    std::process::Command::new("make")
        .arg("build-test-wasms")
        .current_dir(pwd)
        .spawn()
        .unwrap();
}
