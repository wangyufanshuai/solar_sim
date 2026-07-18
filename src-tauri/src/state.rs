use parking_lot::Mutex;
use std::{
    collections::HashMap,
    process::Child,
    sync::{atomic::AtomicBool, Arc},
};

#[derive(Default)]
pub(crate) struct DesktopState {
    pub(crate) server: Mutex<Option<Child>>,
    #[cfg(not(debug_assertions))]
    pub(crate) server_starting: AtomicBool,
    pub(crate) downloads: Mutex<HashMap<String, Arc<AtomicBool>>>,
}
