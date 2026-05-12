use std::collections::HashSet;
use std::sync::Mutex;

/// Session-scoped set of unlocked private journal IDs.
/// Lives only in memory – all journals re-lock when the app restarts,
/// which matches the original sidecar behaviour and the intended UX.
#[derive(Default)]
pub struct UnlockedJournals(pub Mutex<HashSet<String>>);

impl UnlockedJournals {
    pub fn unlock(&self, id: &str) {
        self.0.lock().unwrap().insert(id.to_string());
    }

    pub fn lock(&self, id: &str) {
        self.0.lock().unwrap().remove(id);
    }

    pub fn is_unlocked(&self, id: &str) -> bool {
        self.0.lock().unwrap().contains(id)
    }
}
