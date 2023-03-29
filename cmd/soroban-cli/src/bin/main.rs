use std::fmt::Write;

use clap::CommandFactory;

use soroban_cli::{
    context::{CommandContext, Context},
    Root,
};

#[tokio::main]
async fn main() {
    let root = Root::new().unwrap_or_else(|e| {
        let mut cmd = Root::command();
        e.format(&mut cmd).exit();
    });
    let context = CommandContext::default();
    if let Err(e) = root.run(&context).await {
        writeln!(context.stderr(), "error: {e}").unwrap();
    }

    let stdout = context.get_stdout();
    if !stdout.is_empty() {
        print!("{stdout}");
    }

    let stderr = context.get_stderr();
    if !stderr.is_empty() {
        eprint!("{stderr}");
    }
}
