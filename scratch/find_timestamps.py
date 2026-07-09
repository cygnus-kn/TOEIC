import os
import json
import subprocess
import glob

# Ensure whisper is installed with word-level timestamps
# (We will just run whisper CLI with --word_timestamps True)

tests = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]
base_dir = "assets/pictures (speaking)/pictures & audio (Part 4)/Audio"

results = {}

for test in tests:
    file_path = f"{base_dir}/Test {test}/T{test}_Q_07.webm"
    if os.path.exists(file_path):
        cmd = [
            "/opt/homebrew/bin/whisper",
            file_path,
            "--model", "base",
            "--output_format", "json",
            "--output_dir", "scratch/",
            "--word_timestamps", "True"
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Read the generated json
        json_file = f"scratch/T{test}_Q_07.json"
        if os.path.exists(json_file):
            with open(json_file, 'r') as f:
                data = json.load(f)
                
            # Find the first word that occurs after 60 seconds (to skip the intro instructions)
            found = False
            for segment in data.get('segments', []):
                for word in segment.get('words', []):
                    if word['start'] > 65.0:
                        results[test] = word['start']
                        found = True
                        print(f"Test {test}: {word['start']}s - '{word['word']}'")
                        break
                if found:
                    break
        else:
            print(f"Failed to generate JSON for Test {test}")
    else:
        print(f"File not found: {file_path}")

print("Final Results:", results)
with open('scratch/results.json', 'w') as f:
    json.dump(results, f)
