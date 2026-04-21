import os

def list_machine_images():
    # Adjusted path based on your server structure
    data_dir = "/Users/arjundangle/Arjun/CR-Workshop-Management-System/server/data/machines"
    
    if not os.path.exists(data_dir):
        print(f"❌ Error: Directory not found at {data_dir}")
        return

    print(f"--- Contents of '{data_dir}' ---")
    # Filter out hidden files like .DS_Store
    files = [f for f in os.listdir(data_dir) if not f.startswith('.')]
    
    if not files:
        print("Directory is empty.")
    else:
        for i, file in enumerate(sorted(files), 1):
            print(f"{i}. {file}")
            
    print(f"---------------------------\nTotal machine images: {len(files)}")

if __name__ == "__main__":
    list_machine_images()