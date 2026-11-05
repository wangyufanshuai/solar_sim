mod catalog;
mod commands;
mod content_packs;
mod lifecycle;
mod openrocket;
mod resources;
mod shell;
mod state;

pub fn run() {
    commands::run();
}
