use dotenvy::{dotenv_override, from_filename};
use std::path::Path;
use std::{env, fs};

fn main() {
  if std::env::var("GITHUB_ACTIONS").is_err() {
    // Load env variables from ".env" file, if not exists, use ".env.template" to set default value.
    from_filename(".env.template").ok();
    dotenv_override().ok();
  }

  let out_dir = env::var("OUT_DIR").unwrap_or_else(|_| "".to_string());
  let dest_path = Path::new(&out_dir).join("secrets.rs");
  let _ = fs::remove_file(&dest_path);

  // Iterate over all env variables and print those starting with "BLOCKGATE_" for compilation
  for (key, value) in env::vars() {
    if key.starts_with("BLOCKGATE_") {
      println!("cargo:rustc-env={}={}", key, value);
    }
  }

  // Notify Cargo to auto re-run the build script if .env changes
  println!("cargo:rerun-if-changed=.env");
  println!("cargo:rerun-if-changed=.env.template");

  tauri_build::build()
}
