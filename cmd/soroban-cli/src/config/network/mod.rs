use clap::Parser;

pub mod add;
pub mod rm;
pub mod default;
pub mod ls;

#[derive(Debug, Parser)]
pub enum Cmd {
    /// Add a new netowrk
    Add(add::Cmd),
    /// Remove a network
    Rm(rm::Cmd),
    /// Set a default network
    Default(default::Cmd),
    /// List networks
    Ls(ls::Cmd),
}

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error(transparent)]
    Add(#[from] add::Error),

    #[error(transparent)]
    Rm(#[from] rm::Error),

    #[error(transparent)]
    Default(#[from] default::Error),

    #[error(transparent)]
    Ls(#[from] ls::Error),
}

impl Cmd {
    pub fn run(&self) -> Result<(), Error> {
        match self {
            Cmd::Add(cmd) => cmd.run()?,
            Cmd::Rm(new) => new.run()?,
            Cmd::Default(use_cmd) => use_cmd.run()?,
            Cmd::Ls(cmd) => cmd.run()?,
        };
        Ok(())
    }
}
