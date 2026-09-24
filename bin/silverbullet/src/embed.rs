//! Compile-time-embedded client bundle + `base_fs`, exposed as read-only
//! `SpacePrimitives` so the whole UI ships inside the single static binary.

use std::marker::PhantomData;
use std::sync::Arc;

use rust_embed::RustEmbed;
use silverbullet_server::state::ServerVersion;
use silverbullet_server_common::{FileMeta, SpaceError, SpacePrimitives};

/// The built client web UI (`client_bundle/client`), served at the SPA fallback.
#[derive(RustEmbed)]
#[folder = "$CARGO_MANIFEST_DIR/../../client_bundle/client"]
pub struct ClientAssets;

/// The bundled default space content (`client_bundle/base_fs`) — a read-only
/// underlay beneath the user's disk files.
#[derive(RustEmbed)]
#[folder = "$CARGO_MANIFEST_DIR/../../client_bundle/base_fs"]
pub struct BaseFsAssets;

/// The `X-Server-Version` reported at `/.ping`. Debug builds serve the client
/// bundle from disk (no `debug-embed`), so they reread `version.json` on every
/// ping to stay in step with a client-only `npm run build`; a compile-time
/// version would keep the client's "new version available" banner looping.
/// Release builds embed the bundle and report the compiled version.
pub fn current_version() -> ServerVersion {
    if cfg!(debug_assertions) {
        ServerVersion::Dynamic(Arc::new(read_version_from_disk))
    } else {
        ServerVersion::Static(crate::VERSION.to_string())
    }
}

/// Reads `version` from the workspace-root `version.json` (the file the client
/// bundles as `publicVersion`), falling back to the compiled `crate::VERSION`.
fn read_version_from_disk() -> String {
    let manifest = env!("CARGO_MANIFEST_DIR");
    let path = std::path::Path::new(manifest).join("../../version.json");
    std::fs::read_to_string(&path)
        .ok()
        .and_then(|contents| serde_json::from_str::<serde_json::Value>(&contents).ok())
        .and_then(|value| value.get("version")?.as_str().map(str::to_string))
        .unwrap_or_else(|| crate::VERSION.to_string())
}

/// A read-only `SpacePrimitives` over a `rust-embed` asset set.
///
/// `PhantomData<fn() -> E>` keeps the marker unconditionally `Send + Sync`
/// (required by `SpacePrimitives`) without imposing those bounds on `E`.
pub struct EmbeddedSpace<E: RustEmbed> {
    _marker: PhantomData<fn() -> E>,
}

impl<E: RustEmbed> EmbeddedSpace<E> {
    pub fn new() -> Self {
        Self {
            _marker: PhantomData,
        }
    }
}

impl<E: RustEmbed> Default for EmbeddedSpace<E> {
    fn default() -> Self {
        Self::new()
    }
}

fn meta_for(path: &str, data_len: usize, last_modified: Option<u64>) -> FileMeta {
    // rust-embed reports seconds; FileMeta and the client sync hash use milliseconds.
    let ts = last_modified.unwrap_or(0) as i64 * 1000;
    FileMeta {
        name: path.to_string(),
        created: ts,
        last_modified: ts,
        content_type: mime_guess::from_path(path)
            .first_or_octet_stream()
            .to_string(),
        size: data_len as i64,
        perm: "ro".to_string(),
    }
}

impl<E: RustEmbed> SpacePrimitives for EmbeddedSpace<E> {
    fn fetch_file_list(&self) -> Result<Vec<FileMeta>, SpaceError> {
        Ok(E::iter()
            .filter_map(|p| self.get_file_meta(&p).ok())
            .collect())
    }

    fn get_file_meta(&self, path: &str) -> Result<FileMeta, SpaceError> {
        let f = E::get(path).ok_or(SpaceError::NotFound)?;
        Ok(meta_for(path, f.data.len(), f.metadata.last_modified()))
    }

    fn read_file(&self, path: &str) -> Result<(Vec<u8>, FileMeta), SpaceError> {
        let f = E::get(path).ok_or(SpaceError::NotFound)?;
        let meta = meta_for(path, f.data.len(), f.metadata.last_modified());
        Ok((f.data.into_owned(), meta))
    }

    fn write_file(
        &self,
        path: &str,
        _data: &[u8],
        _meta: Option<&FileMeta>,
    ) -> Result<FileMeta, SpaceError> {
        Err(SpaceError::WriteError(format!(
            "Cannot write {path}: embedded bundle is read-only"
        )))
    }

    fn delete_file(&self, path: &str) -> Result<(), SpaceError> {
        Err(SpaceError::WriteError(format!(
            "Cannot delete {path}: embedded bundle is read-only"
        )))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn client_bundle_contains_index_html() {
        let space = EmbeddedSpace::<ClientAssets>::new();
        let (data, meta) = space.read_file(".client/index.html").unwrap();
        assert!(!data.is_empty());
        assert!(meta.content_type.contains("html"), "{}", meta.content_type);
    }

    #[test]
    fn missing_file_is_not_found() {
        let space = EmbeddedSpace::<ClientAssets>::new();
        assert!(matches!(
            space.read_file("does/not/exist.xyz"),
            Err(SpaceError::NotFound)
        ));
    }

    #[test]
    fn writes_are_rejected() {
        let space = EmbeddedSpace::<ClientAssets>::new();
        assert!(space.write_file("x", b"y", None).is_err());
    }

    #[test]
    fn file_list_is_nonempty() {
        let space = EmbeddedSpace::<ClientAssets>::new();
        assert!(!space.fetch_file_list().unwrap().is_empty());
    }

    #[test]
    fn current_version_is_dynamic_in_a_debug_build() {
        assert!(matches!(current_version(), ServerVersion::Dynamic(_)));
    }

    #[test]
    fn dynamic_version_matches_the_on_disk_version_json() {
        let ServerVersion::Dynamic(f) = current_version() else {
            panic!("expected Dynamic in a debug test build");
        };
        assert_eq!(f(), read_version_from_disk());
        assert_eq!(f(), on_disk_version_json_field());
    }

    /// Independent re-parse of `version.json`, so a bug in
    /// `read_version_from_disk` can't hide itself.
    fn on_disk_version_json_field() -> String {
        let manifest = env!("CARGO_MANIFEST_DIR");
        let path = std::path::Path::new(manifest).join("../../version.json");
        let contents = std::fs::read_to_string(&path).expect("version.json must exist");
        let value: serde_json::Value =
            serde_json::from_str(&contents).expect("version.json must be valid JSON");
        value["version"]
            .as_str()
            .expect("version.json must have a string `version` field")
            .to_string()
    }
}
