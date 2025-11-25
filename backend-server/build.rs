use std::path::PathBuf;

fn main() 
{
    println!("cargo:rerun-if-changed=build.rs");
    // Copu the frontend files to the output directory
    let front_end_dir = PathBuf::from("..\\front-end");

    println!("cargo:rerun-if-changed={}", front_end_dir.display());

    let out_dir = PathBuf::from(std::env::var("OUT_DIR").unwrap());
    let dest_dir = out_dir.join("front-end");
    if dest_dir.exists() {
        std::fs::remove_dir_all(&dest_dir).unwrap();
    }
    std::fs::create_dir_all(&dest_dir).unwrap();
    copy_dir_all(&front_end_dir, &dest_dir).unwrap();

}

fn copy_dir_all(src: &PathBuf, dst: &PathBuf) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            // Debug print the file being copied
            let dest = dst.join(entry.file_name());
            println!("cargo:warning=Copying file: {} to {}", entry.path().display(), dest.display());
            std::fs::copy(&entry.path(), dest)?;
        }
    }
    Ok(())
}