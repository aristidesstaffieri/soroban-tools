use std::{cell::RefCell, fmt::Write, rc::Rc};

use async_trait::async_trait;

pub struct Writer<W>
where
    W: Write,
{
    pub writer: W,
}

impl<T> Write for Writer<T>
where
    T: Write,
{
    fn write_str(&mut self, s: &str) -> std::fmt::Result {
        self.writer.write_str(s)
    }
}

pub struct Stdout(Rc<RefCell<String>>);

impl Write for Stdout {
    fn write_str(&mut self, s: &str) -> std::fmt::Result {
        self.0.borrow_mut().write_str(s)
    }
}

pub struct Stderr(Rc<RefCell<String>>);

impl Write for Stderr {
    fn write_str(&mut self, s: &str) -> std::fmt::Result {
        self.0.borrow_mut().write_str(s)
    }
}

#[allow(clippy::module_name_repetitions)]
#[derive(Default)]
pub struct CommandContext {
    stdout: Rc<RefCell<String>>,
    stderr: Rc<RefCell<String>>,
    // env: RefCell<HashMap<String, String>>,
}

// impl CommandContext {
// pub fn new(env: HashMap<String, String>) -> Self {
//     let this = Self::default();
//     this.env.replace_with(|_| env);
//     this
// }
// }

impl Context for CommandContext {
    fn stdout(&self) -> Stdout {
        Stdout(self.stdout.clone())
    }

    fn stderr(&self) -> Stderr {
        Stderr(self.stderr.clone())
    }

    fn get_stdout(&self) -> String {
        self.stdout.borrow().clone()
    }

    fn get_stderr(&self) -> String {
        self.stderr.borrow().clone()
    }
}

pub trait Context {
    fn stdout(&self) -> Stdout;
    fn stderr(&self) -> Stderr;
    fn get_stdout(&self) -> String;
    fn get_stderr(&self) -> String;
}

#[async_trait]
pub trait Run: Sync {
    type Error;
    async fn run_cmd(&self, context: &impl Context) -> Result<(), Self::Error>;
}

// pub struct DefaultContext;

// #[allow(unused_variables)]
// impl Context for DefaultContext {
//     fn write_stdout(&self, data: &str) {
//         print!("{data}");
//     }

//     fn write_stderr(&self, data: &str) {
//         eprint!("{data}");
//     }

//     fn get_stdout(&self) -> String {
//         String::new()
//     }

//     fn get_stderr(&self) -> String {
//         String::new()
//     }
// }
